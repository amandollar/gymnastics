/**
 * Resolves a WhatsApp message template by substituting {{variable}} tokens
 * with the provided values.
 *
 * Supported variables (all optional — unknown tokens are left as-is):
 *   {{studentName}}   — student's full name
 *   {{parentName}}    — parent's name
 *   {{phone}}         — contact number
 *   {{planType}}      — "Personal training" | "Group class"
 *   {{graceDeadline}} — formatted grace-period deadline date
 *   {{daysLeft}}      — days remaining in grace / plan
 *   {{fee}}           — total plan fee (₹ formatted)
 *   {{outstanding}}   — outstanding balance (₹ formatted)
 *   {{portalLink}}    — parent portal URL
 */
export type TemplateVars = Partial<{
  studentName: string;
  parentName: string;
  phone: string;
  planType: string;
  graceDeadline: string;
  daysLeft: string;
  fee: string;
  outstanding: string;
  portalLink: string;
}>;

export const ALL_VARIABLES: { key: keyof TemplateVars; label: string; example: string }[] = [
  { key: "studentName",   label: "Student Name",    example: "Arjun Mehta" },
  { key: "parentName",    label: "Parent Name",     example: "Sunita Mehta" },
  { key: "phone",         label: "Phone",           example: "9876543210" },
  { key: "planType",      label: "Plan Type",       example: "Personal training" },
  { key: "graceDeadline", label: "Grace Deadline",  example: "14 Jul 2026" },
  { key: "daysLeft",      label: "Days Left",       example: "7" },
  { key: "fee",           label: "Total Fee",       example: "₹12,000" },
  { key: "outstanding",   label: "Outstanding",     example: "₹6,000" },
  { key: "portalLink",    label: "Portal Link",     example: "https://tag.app/portal/login" },
];

/** Default template strings shipped as fallbacks before admin customises them. */
export const DEFAULT_TEMPLATES = {
  templateGrace: `Hi {{parentName}}, 🙏\n\n{{studentName}}'s gymnastics plan ({{planType}}) has ended.\n\nYou have a grace period until {{graceDeadline}} ({{daysLeft}} days left). Please renew the plan soon to avoid a break in sessions.\n\nThank you! 🤸`,
  templateFeeReminder: `Hi {{parentName}}, 🙏\n\nThis is a gentle reminder that a fee of {{outstanding}} is pending for {{studentName}}'s gymnastics plan.\n\nKindly arrange the payment at your earliest convenience. Thank you! 🤸`,
  templateInactive: `Hi {{parentName}}, 🙏\n\nWe miss {{studentName}} at TAG! 🤸\n\nWe'd love to have them back on the gymnastics floor. If you'd like to re-enrol or have any questions, please feel free to reach out.\n\nHope to see you soon! 💛`,
};

/**
 * Substitutes all {{key}} tokens in `template` with the corresponding value
 * from `vars`. Tokens with no matching key are left unchanged.
 */
export function resolveTemplate(template: string, vars: TemplateVars): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    const value = vars[key as keyof TemplateVars];
    return value !== undefined ? value : match;
  });
}

/** Returns the effective template: saved value → default fallback. */
export function getEffectiveTemplate(
  saved: string | null | undefined,
  key: keyof typeof DEFAULT_TEMPLATES,
): string {
  return saved?.trim() || DEFAULT_TEMPLATES[key];
}
