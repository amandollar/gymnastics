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
  loginId: string;
  password: string;
  remainingSessions: string;
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
  { key: "loginId",       label: "Login ID",        example: "TAG001" },
  { key: "password",      label: "Password",        example: "123456" },
  { key: "remainingSessions", label: "Remaining Sessions", example: "3" },
];

/** Default template strings shipped as fallbacks before admin customises them. */
export const DEFAULT_TEMPLATES = {
  templateGrace: `Hello {{parentName}},\n\n{{studentName}}’s training plan has reached its validity date, with {{remainingSessions}} session(s) still remaining.\n\nAs a courtesy, the academy has provided a grace period to allow completion of these remaining sessions. We kindly request you to utilize them within this period.\n\nTo view their details and progress, please visit the parent portal at:\n{{portalLink}}\n\nThank you for being part of our gymnastics family.\n\nTeam \nThe Academy Of Gymnastics`,
  templateFeeReminder: `Hello {{parentName}},\n\nThis is a gentle reminder that an outstanding fee of {{outstanding}} is due for {{studentName}}'s training plan.\n\nWe kindly request you to arrange the payment at your earliest convenience to ensure uninterrupted access to the sessions.\n\nThank you for being part of our gymnastics family.\n\nTeam\nThe Academy Of Gymnastics`,
  templateInactive: `Hello {{parentName}},\n\n{{studentName}}’s membership plan is no longer active.\n\nTo maintain continuity in training and continued skill development, we encourage you to renew the membership plan at your convenience.\n\nOur team will be happy to assist you with the renewal process.\n\nThank you for being part of our gymnastic family.\n\nTeam\nThe Academy Of Gymnastics\nTeam [Academy Name]`,
  templateLoginCredentials: `Hello {{parentName}},\n\nHere are the parent portal login credentials for {{studentName}}:\nLogin ID: {{loginId}}\nPassword: {{password}}\n\nWebsite: {{portalLink}}`,
  templateAdmissionWelcome: `Hello {{parentName}},\n\nWelcome to The Academy of Gymnastics! 🤸\n\nWe are excited to have {{studentName}} join our gymnastics family.\n\nHere are your Parent Portal login credentials to view progress, attendance, and fees:\nLogin ID: {{loginId}}\nTemporary Password: {{password}}\n\nParent Portal: {{portalLink}}\n\nPlease log in and change your temporary password to secure your account.\n\nBest regards,\nTeam TAG Academy`,
  templateEnquiryFollowUp: `Hi {{parentName}},\n\nHope you're doing well! This is Team TAG Academy 🤸.\n\nWe wanted to follow up on your interest in our {{planType}} program for {{studentName}}. We would love to welcome them for a trial class!\n\nWould you like to schedule a free trial session this week? Let us know if you have any questions!\n\nBest regards,\nTAG Academy`,
  templateAllSessionsCompleted: `Hello {{parentName}},\n\nWe are pleased to inform you that {{studentName}} has successfully completed all sessions under the current training plan.\n\nTo ensure uninterrupted progress and continued development, kindly renew the membership at your convenience.\n\nThank you for being part of our gymnastics family.\n\nTeam\nThe Academy Of Gymnastics`,
};

/**
 * Substitutes all {{key}} tokens in `template` with the corresponding value
 * from `vars`. Tokens with no matching key are left unchanged.
 */
export function resolveTemplate(template: string, vars: TemplateVars): string {
  let text = template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    const value = vars[key as keyof TemplateVars];
    return value !== undefined ? value : match;
  });
  text = text
    .replace(/\[Parent Name\]/gi, vars.parentName || "")
    .replace(/\[Student Name\]/gi, vars.studentName || "")
    .replace(/\[Academy Name\]/gi, "The Academy of Gymnastics")
    .replace(/\{\{academyName\}\}/gi, "The Academy of Gymnastics");
  return text;
}

/** Returns the effective template: saved value → default fallback. */
export function getEffectiveTemplate(
  saved: string | null | undefined,
  key: keyof typeof DEFAULT_TEMPLATES,
): string {
  return saved?.trim() || DEFAULT_TEMPLATES[key];
}

export function buildFeeReminderMessage({
  student,
  plan,
  template,
}: {
  student: { name: string; parentName: string; contactNumber: string };
  plan: { fee: number; outstanding: number; planType: string };
  template?: string | null;
}): string {
  const effectiveTemplate = getEffectiveTemplate(template, "templateFeeReminder");
  const outstanding = typeof plan.outstanding === "number" ? plan.outstanding : plan.fee;
  
  const formatINR = (val: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(val);
  };

  return resolveTemplate(effectiveTemplate, {
    studentName: student.name,
    parentName: student.parentName,
    phone: student.contactNumber,
    fee: formatINR(plan.fee),
    outstanding: formatINR(outstanding),
    planType: plan.planType === "ONE_TO_ONE" ? "Personal training" : "Group class",
    portalLink: typeof window !== "undefined" ? `${window.location.origin}/portal/login` : "",
  });
}
