"use client";

import { useState, useRef, useCallback } from "react";
import { MessageCircle, Check, Save, AlertCircle, RotateCcw, Clock, CreditCard, UserPlus } from "lucide-react";
import { saveMessageTemplatesAction } from "@/lib/actions/academy";
import {
  ALL_VARIABLES,
  DEFAULT_TEMPLATES,
  resolveTemplate,
  type TemplateVars,
} from "@/lib/utils/whatsapp-templates";
import type { AcademyProfile } from "@prisma/client";

// ── Friendly labels for variables (no code jargon) ────────────────────────────

const FRIENDLY_LABELS: Record<string, string> = {
  studentName: "Student Name",
  parentName: "Parent Name",
  phone: "Phone",
  planType: "Plan Type",
  graceDeadline: "Grace Deadline",
  daysLeft: "Days Left",
  fee: "Total Fee",
  outstanding: "Pending Amount",
  portalLink: "Portal Link",
};

const SAMPLE_VALUES: Required<TemplateVars> = {
  studentName: "Arjun",
  parentName: "Sunita",
  phone: "9876543210",
  planType: "Personal training",
  graceDeadline: "14 Jul 2026",
  daysLeft: "7",
  fee: "₹12,000",
  outstanding: "₹6,000",
  portalLink: "tag.app/portal",
};

const VARS_BY_TEMPLATE: Record<string, (keyof TemplateVars)[]> = {
  templateGrace: ["studentName", "parentName", "planType", "graceDeadline", "daysLeft", "portalLink"],
  templateFeeReminder: ["studentName", "parentName", "fee", "outstanding", "portalLink"],
  templateInactive: ["studentName", "parentName", "planType", "portalLink"],
};

// ── Render message with highlighted variables ─────────────────────────────────

function HighlightedPreview({ text }: { text: string }) {
  // Split on {{variable}} tokens and render them as colored pills
  const parts = text.split(/(\{\{\w+\}\})/g);
  return (
    <div className="text-sm text-zinc-800 dark:text-zinc-200 leading-relaxed whitespace-pre-wrap">
      {parts.map((part, i) => {
        const match = part.match(/^\{\{(\w+)\}\}$/);
        if (match) {
          const key = match[1];
          const sample = SAMPLE_VALUES[key as keyof TemplateVars] ?? key;
          return (
            <span
              key={i}
              className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-brand-orange-100 dark:bg-brand-orange-950/40 text-brand-orange-600 dark:text-brand-orange-400 text-xs font-semibold mx-0.5 align-baseline"
              title={`Will be replaced with actual ${FRIENDLY_LABELS[key] ?? key}`}
            >
              {sample}
            </span>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </div>
  );
}

// ── Single template card ──────────────────────────────────────────────────────

function TemplateCard({
  id,
  title,
  icon: Icon,
  value,
  onChange,
  defaultValue,
  availableVarKeys,
}: {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  value: string;
  onChange: (val: string) => void;
  defaultValue: string;
  availableVarKeys: (keyof TemplateVars)[];
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [editing, setEditing] = useState(false);
  const effective = value.trim() || defaultValue;

  const insertVariable = useCallback((varKey: string) => {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const current = value || defaultValue;
    const token = `{{${varKey}}}`;
    const newVal = current.slice(0, start) + token + current.slice(end);
    onChange(newVal);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + token.length, start + token.length);
    });
  }, [value, defaultValue, onChange]);

  return (
    <div className="rounded-2xl border border-zinc-200 dark:border-zinc-700/60 bg-white dark:bg-zinc-900 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-100 dark:border-zinc-800/80">
        <div className="flex items-center gap-2.5">
          <Icon className="w-4.5 h-4.5 text-brand-orange-500" />
          <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{title}</h3>
        </div>
        <div className="flex items-center gap-2">
          {(value.trim() && value.trim() !== defaultValue) && (
            <button
              type="button"
              onClick={() => { onChange(""); setEditing(false); }}
              className="flex items-center gap-1 text-[11px] font-medium text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 cursor-pointer transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              Reset
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              if (!editing && !value.trim()) {
                onChange(defaultValue);
              }
              setEditing((e) => !e);
            }}
            className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              editing
                ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300"
                : "bg-brand-orange-50 dark:bg-brand-orange-950/30 text-brand-orange-600 dark:text-brand-orange-400 hover:bg-brand-orange-100 dark:hover:bg-brand-orange-950/50"
            }`}
          >
            {editing ? "Done" : "Edit"}
          </button>
        </div>
      </div>

      {/* Preview (always visible when not editing) */}
      {!editing && (
        <div className="px-5 py-4">
          <HighlightedPreview text={effective} />
          <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-3 italic">
            Colored words are auto-replaced with actual student data when sending.
          </p>
        </div>
      )}

      {/* Editor (when editing) */}
      {editing && (
        <div className="px-5 py-4 space-y-3">
          <textarea
            ref={textareaRef}
            value={value || defaultValue}
            onChange={(e) => onChange(e.target.value)}
            rows={6}
            className="w-full text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950/60 text-zinc-800 dark:text-zinc-200 px-4 py-3 resize-y focus:outline-none focus:ring-2 focus:ring-brand-orange-500/30 focus:border-brand-orange-400 transition-colors leading-relaxed"
          />

          <div>
            <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mb-2">
              Tap to insert at cursor:
            </p>
            <div className="flex flex-wrap gap-1.5">
              {availableVarKeys.map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => insertVariable(key)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-brand-orange-50 dark:bg-brand-orange-950/30 hover:bg-brand-orange-100 dark:hover:bg-brand-orange-950/50 text-xs font-semibold text-brand-orange-600 dark:text-brand-orange-400 transition-colors cursor-pointer border border-brand-orange-200 dark:border-brand-orange-800/40"
                >
                  + {FRIENDLY_LABELS[key] ?? key}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main tab ───────────────────────────────────────────────────────────────────

export default function MessagesTab({
  initialProfile,
}: {
  initialProfile: AcademyProfile;
}) {
  const [grace, setGrace] = useState(initialProfile.templateGrace ?? "");
  const [feeReminder, setFeeReminder] = useState(initialProfile.templateFeeReminder ?? "");
  const [inactive, setInactive] = useState(initialProfile.templateInactive ?? "");
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleSave = async () => {
    setSaving(true);
    setResult(null);
    const res = await saveMessageTemplatesAction({
      templateGrace: grace,
      templateFeeReminder: feeReminder,
      templateInactive: inactive,
    });
    setResult({ success: res.success, message: res.message ?? "Saved!" });
    setSaving(false);
    if (res.success) {
      setTimeout(() => setResult(null), 3000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <MessageCircle className="w-5 h-5 text-emerald-500" />
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
              WhatsApp Messages
            </h2>
          </div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-md">
            These messages are pre-filled when you tap WhatsApp on a student&apos;s profile. Edit them to match your tone.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-brand-orange-500 hover:bg-brand-orange-600 active:scale-95 disabled:opacity-60 text-white px-5 py-2.5 rounded-2xl text-sm font-semibold transition-all cursor-pointer shadow-sm shadow-brand-orange-500/20 shrink-0"
        >
          {saving ? (
            <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          Save
        </button>
      </div>

      {/* Result toast */}
      {result && (
        <div
          className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl text-sm font-medium border transition-all ${
            result.success
              ? "bg-emerald-50 dark:bg-emerald-950/25 border-emerald-200 dark:border-emerald-800/40 text-emerald-700 dark:text-emerald-400"
              : "bg-red-50 dark:bg-red-950/25 border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-400"
          }`}
        >
          {result.success ? <Check className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
          {result.message}
        </div>
      )}

      {/* Template cards */}
      <div className="space-y-4">
        <TemplateCard
          id="templateGrace"
          title="Grace Period Reminder"
          icon={Clock}
          value={grace}
          onChange={setGrace}
          defaultValue={DEFAULT_TEMPLATES.templateGrace}
          availableVarKeys={VARS_BY_TEMPLATE.templateGrace}
        />
        <TemplateCard
          id="templateFeeReminder"
          title="Fee Reminder"
          icon={CreditCard}
          value={feeReminder}
          onChange={setFeeReminder}
          defaultValue={DEFAULT_TEMPLATES.templateFeeReminder}
          availableVarKeys={VARS_BY_TEMPLATE.templateFeeReminder}
        />
        <TemplateCard
          id="templateInactive"
          title="Bring Back Inactive Student"
          icon={UserPlus}
          value={inactive}
          onChange={setInactive}
          defaultValue={DEFAULT_TEMPLATES.templateInactive}
          availableVarKeys={VARS_BY_TEMPLATE.templateInactive}
        />
      </div>
    </div>
  );
}
