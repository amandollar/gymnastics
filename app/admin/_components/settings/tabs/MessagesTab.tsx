"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import {
  MessageCircle,
  Check,
  Save,
  AlertCircle,
  RotateCcw,
  Pencil,
  X,
} from "lucide-react";
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
  planType: "Plan Type / Program",
  graceDeadline: "Grace Deadline",
  daysLeft: "Days Left",
  fee: "Total Fee",
  outstanding: "Pending Amount",
  portalLink: "Portal Link",
  loginId: "Login ID",
  password: "Password",
  remainingSessions: "Remaining Sessions",
};

const SAMPLE_VALUES: Required<TemplateVars> = {
  studentName: "Arjun",
  parentName: "Sunita",
  phone: "9876543210",
  planType: "Personal training",
  graceDeadline: "14 Jul 2026",
  daysLeft: "7",
  fee: "₹12,000",
  amountPaid: "₹6,000",
  paymentMethod: "UPI",
  transactionDate: "28/6/2026",
  outstanding: "₹6,000",
  portalLink: "tag.app/portal",
  loginId: "TAG001",
  password: "password123",
  remainingSessions: "3",
};

const VARS_BY_TEMPLATE: Record<string, (keyof TemplateVars)[]> = {
  templateGrace: [
    "studentName",
    "parentName",
    "planType",
    "graceDeadline",
    "daysLeft",
    "portalLink",
    "remainingSessions",
  ],
  templateFeeReminder: [
    "studentName",
    "parentName",
    "fee",
    "outstanding",
    "portalLink",
  ],
  templateInactive: ["studentName", "parentName", "planType", "portalLink"],
  templateInactiveSessionComplete: ["studentName", "parentName", "portalLink"],
  templateLoginCredentials: [
    "studentName",
    "parentName",
    "loginId",
    "password",
    "portalLink",
  ],
  templateEnquiryFollowUp: ["studentName", "parentName", "planType"],
  templateAdmissionWelcome: [
    "studentName",
    "parentName",
    "loginId",
    "password",
    "portalLink",
  ],
  templatePaymentReceived: [
    "studentName",
    "parentName",
    "amountPaid",
    "paymentMethod",
    "transactionDate",
    "outstanding",
  ],
};

// ── Render message with highlighted variables ─────────────────────────────────

function HighlightedPreview({ text }: { text: string }) {
  // Split on {{variable}} tokens and render them as colored pills
  const parts = text.split(/(\{\{\w+\}\})/g);
  return (
    <div className="text-xs text-zinc-500 dark:text-zinc-400 leading-snug whitespace-pre-wrap line-clamp-5 overflow-hidden text-ellipsis">
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
  title,
  value,
  defaultValue,
  onClick,
}: {
  title: string;
  value: string;
  defaultValue: string;
  onClick: () => void;
}) {
  const effective = value.trim() || defaultValue;

  return (
    <div
      onClick={onClick}
      className="rounded-2xl border-0 bg-zinc-100 dark:bg-zinc-900 p-4 pt-3 flex flex-col justify-between cursor-pointer hover:bg-zinc-150 dark:hover:bg-zinc-850/80 transition-all duration-150 group min-h-[120px]"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
          {title}
        </h3>
        <div className="rounded-full p-1.5 border border-zinc-300 dark:border-zinc-700/80 text-zinc-500 dark:text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex items-center justify-center bg-transparent shrink-0">
          <Pencil className="w-3.5 h-3.5" />
        </div>
      </div>

      {/* Preview */}
      <div className="flex-1">
        <HighlightedPreview text={effective} />
      </div>
    </div>
  );
}

// ── Edit Modal ────────────────────────────────────────────────────────────────

interface EditTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  value: string;
  defaultValue: string;
  availableVarKeys: (keyof TemplateVars)[];
  onSave: (val: string) => Promise<void>;
  isSaving: boolean;
}

function EditTemplateModal({
  isOpen,
  onClose,
  title,
  value,
  defaultValue,
  availableVarKeys,
  onSave,
  isSaving,
}: EditTemplateModalProps) {
  const [localValue, setLocalValue] = useState(value.trim() || defaultValue);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Sync state if template changes or when initialized
  useEffect(() => {
    if (isOpen) {
      setLocalValue(value.trim() || defaultValue);
    }
  }, [isOpen, value, defaultValue]);

  const insertVariable = useCallback(
    (varKey: string) => {
      const el = textareaRef.current;
      if (!el) return;
      const start = el.selectionStart;
      const end = el.selectionEnd;
      const token = `{{${varKey}}}`;
      const newVal = localValue.slice(0, start) + token + localValue.slice(end);
      setLocalValue(newVal);
      requestAnimationFrame(() => {
        el.focus();
        el.setSelectionRange(start + token.length, start + token.length);
      });
    },
    [localValue],
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      {/* Backdrop click close */}
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative bg-white dark:bg-zinc-900 rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl border border-zinc-100 dark:border-zinc-800/80 flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 pb-3">
          <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
            {title}
          </h3>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 pb-4 space-y-3 flex-1 flex flex-col min-h-0">
          <textarea
            ref={textareaRef}
            value={localValue}
            onChange={(e) => setLocalValue(e.target.value)}
            rows={12}
            className="w-full flex-1 text-sm rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950/60 text-zinc-850 dark:text-zinc-150 px-4 py-3.5 resize-y focus:outline-none focus:ring-2 focus:ring-brand-orange-500/30 focus:border-brand-orange-400 transition-colors leading-relaxed min-h-[300px]"
            placeholder="Write your template here..."
            autoFocus
          />

          {availableVarKeys.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {availableVarKeys.map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => insertVariable(key)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-brand-orange-50 dark:bg-brand-orange-950/30 hover:bg-brand-orange-100 dark:hover:bg-brand-orange-950/50 text-xs font-semibold text-brand-orange-600 dark:text-brand-orange-400 transition-colors cursor-pointer border border-brand-orange-200/50 dark:border-brand-orange-800/40"
                >
                  + {FRIENDLY_LABELS[key] ?? key}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 px-6 py-4 bg-zinc-50 dark:bg-zinc-900/50">
          <div>
            <button
              type="button"
              onClick={() => setLocalValue(defaultValue)}
              className="flex items-center gap-1 text-xs font-medium text-zinc-500 hover:text-brand-orange-600 dark:text-zinc-400 dark:hover:text-brand-orange-400 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset to Default
            </button>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4.5 py-2 rounded-xl text-sm font-semibold text-zinc-500 hover:text-zinc-750 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isSaving}
              onClick={() => onSave(localValue)}
              className="flex items-center gap-2 bg-brand-orange-500 hover:bg-brand-orange-600 disabled:opacity-60 text-white px-5 py-2.5 rounded-2xl text-sm font-semibold transition-all cursor-pointer shadow-sm shadow-brand-orange-500/20"
            >
              {isSaving ? (
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Save Template
            </button>
          </div>
        </div>
      </div>
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
  const [feeReminder, setFeeReminder] = useState(
    initialProfile.templateFeeReminder ?? "",
  );
  const [inactive, setInactive] = useState(
    initialProfile.templateInactive ?? "",
  );
  const [inactiveSessionComplete, setInactiveSessionComplete] = useState(
    (initialProfile as any).templateAllSessionsCompleted ?? "",
  );
  const [loginCredentials, setLoginCredentials] = useState(
    (initialProfile as any).templateLoginCredentials ?? "",
  );
  const [enquiryFollowUp, setEnquiryFollowUp] = useState(
    (initialProfile as any).templateEnquiryFollowUp ?? "",
  );
  const [admissionWelcome, setAdmissionWelcome] = useState(
    (initialProfile as any).templateAdmissionWelcome ?? "",
  );
  const [paymentReceived, setPaymentReceived] = useState(
    (initialProfile as any).templatePaymentReceived ?? "",
  );

  const [editingTemplate, setEditingTemplate] = useState<{
    id: string;
    title: string;
    value: string;
    defaultValue: string;
    availableVarKeys: (keyof TemplateVars)[];
  } | null>(null);

  const [savingId, setSavingId] = useState<string | null>(null);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const handleSaveCard = async (
    cardId: string,
    updatedValue: string,
  ): Promise<boolean> => {
    setSavingId(cardId);
    setResult(null);

    const payload = {
      templateGrace: cardId === "templateGrace" ? updatedValue : grace,
      templateFeeReminder:
        cardId === "templateFeeReminder" ? updatedValue : feeReminder,
      templateInactive: cardId === "templateInactive" ? updatedValue : inactive,
      templateAllSessionsCompleted:
        cardId === "templateAllSessionsCompleted"
          ? updatedValue
          : inactiveSessionComplete,
      templateLoginCredentials:
        cardId === "templateLoginCredentials" ? updatedValue : loginCredentials,
      templateEnquiryFollowUp:
        cardId === "templateEnquiryFollowUp" ? updatedValue : enquiryFollowUp,
      templateAdmissionWelcome:
        cardId === "templateAdmissionWelcome" ? updatedValue : admissionWelcome,
      templatePaymentReceived:
        cardId === "templatePaymentReceived" ? updatedValue : paymentReceived,
    };

    const res = await saveMessageTemplatesAction(payload);
    if (res.success) {
      if (cardId === "templateGrace") setGrace(updatedValue);
      else if (cardId === "templateFeeReminder") setFeeReminder(updatedValue);
      else if (cardId === "templateInactive") {
        setInactive(updatedValue);
      }
      else if (cardId === "templateAllSessionsCompleted")
        setInactiveSessionComplete(updatedValue);
      else if (cardId === "templateLoginCredentials")
        setLoginCredentials(updatedValue);
      else if (cardId === "templateEnquiryFollowUp")
        setEnquiryFollowUp(updatedValue);
      else if (cardId === "templateAdmissionWelcome")
        setAdmissionWelcome(updatedValue);
      else if (cardId === "templatePaymentReceived")
        setPaymentReceived(updatedValue);

      setResult({ success: true, message: "Template updated successfully!" });
      setSavingId(null);
      setTimeout(() => setResult(null), 3000);
      return true;
    } else {
      setResult({
        success: false,
        message: res.message ?? "Failed to save template.",
      });
      setSavingId(null);
      return false;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
          Message Templates
        </h2>
      </div>

      {/* Result toast */}
      {result && (
        <div
          className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl text-sm font-medium border transition-all ${
            result.success
              ? "bg-emerald-50 dark:bg-emerald-950/25 border-emerald-200 dark:border-emerald-800/40 text-emerald-700 dark:text-emerald-400"
              : "bg-red-50 dark:bg-red-950/25 border-red-100 dark:border-red-900/30 text-red-650 dark:text-red-400"
          }`}
        >
          {result.success ? (
            <Check className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          {result.message}
        </div>
      )}

      {/* Template cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <TemplateCard
          title="Enquiry Follow-up"
          value={enquiryFollowUp}
          defaultValue={DEFAULT_TEMPLATES.templateEnquiryFollowUp}
          onClick={() =>
            setEditingTemplate({
              id: "templateEnquiryFollowUp",
              title: "Enquiry Follow-up",
              value: enquiryFollowUp,
              defaultValue: DEFAULT_TEMPLATES.templateEnquiryFollowUp,
              availableVarKeys: VARS_BY_TEMPLATE.templateEnquiryFollowUp,
            })
          }
        />
        <TemplateCard
          title="Admission welcome message"
          value={admissionWelcome}
          defaultValue={DEFAULT_TEMPLATES.templateAdmissionWelcome}
          onClick={() =>
            setEditingTemplate({
              id: "templateAdmissionWelcome",
              title: "Admission welcome message",
              value: admissionWelcome,
              defaultValue: DEFAULT_TEMPLATES.templateAdmissionWelcome,
              availableVarKeys: VARS_BY_TEMPLATE.templateAdmissionWelcome,
            })
          }
        />
        <TemplateCard
          title="Login credential sharing"
          value={loginCredentials}
          defaultValue={DEFAULT_TEMPLATES.templateLoginCredentials}
          onClick={() =>
            setEditingTemplate({
              id: "templateLoginCredentials",
              title: "Login credential sharing",
              value: loginCredentials,
              defaultValue: DEFAULT_TEMPLATES.templateLoginCredentials,
              availableVarKeys: VARS_BY_TEMPLATE.templateLoginCredentials,
            })
          }
        />
        <TemplateCard
          title="Fee Reminder"
          value={feeReminder}
          defaultValue={DEFAULT_TEMPLATES.templateFeeReminder}
          onClick={() =>
            setEditingTemplate({
              id: "templateFeeReminder",
              title: "Fee Reminder",
              value: feeReminder,
              defaultValue: DEFAULT_TEMPLATES.templateFeeReminder,
              availableVarKeys: VARS_BY_TEMPLATE.templateFeeReminder,
            })
          }
        />
        <TemplateCard
          title="Payment Received"
          value={paymentReceived}
          defaultValue={(DEFAULT_TEMPLATES as any).templatePaymentReceived}
          onClick={() =>
            setEditingTemplate({
              id: "templatePaymentReceived",
              title: "Payment Received",
              value: paymentReceived,
              defaultValue: (DEFAULT_TEMPLATES as any).templatePaymentReceived,
              availableVarKeys: VARS_BY_TEMPLATE.templatePaymentReceived,
            })
          }
        />
        <TemplateCard
          title="All Session Completed"
          value={inactiveSessionComplete}
          defaultValue={DEFAULT_TEMPLATES.templateAllSessionsCompleted}
          onClick={() =>
            setEditingTemplate({
              id: "templateAllSessionsCompleted",
              title: "All Session Completed",
              value: inactiveSessionComplete,
              defaultValue: DEFAULT_TEMPLATES.templateAllSessionsCompleted,
              availableVarKeys:
                VARS_BY_TEMPLATE.templateAllSessionsCompleted,
            })
          }
        />
        <TemplateCard
          title="Grace Period Reminder"
          value={grace}
          defaultValue={DEFAULT_TEMPLATES.templateGrace}
          onClick={() =>
            setEditingTemplate({
              id: "templateGrace",
              title: "Grace Period Reminder",
              value: grace,
              defaultValue: DEFAULT_TEMPLATES.templateGrace,
              availableVarKeys: VARS_BY_TEMPLATE.templateGrace,
            })
          }
        />
        <TemplateCard
          title="Inactive"
          value={inactive}
          defaultValue={DEFAULT_TEMPLATES.templateInactive}
          onClick={() =>
            setEditingTemplate({
              id: "templateInactive",
              title: "Inactive",
              value: inactive,
              defaultValue: DEFAULT_TEMPLATES.templateInactive,
              availableVarKeys: VARS_BY_TEMPLATE.templateInactive,
            })
          }
        />
      </div>

      {/* Edit Template Modal */}
      {editingTemplate && (
        <EditTemplateModal
          isOpen={!!editingTemplate}
          onClose={() => setEditingTemplate(null)}
          title={editingTemplate.title}
          value={editingTemplate.value}
          defaultValue={editingTemplate.defaultValue}
          availableVarKeys={editingTemplate.availableVarKeys}
          onSave={async (newVal) => {
            const success = await handleSaveCard(editingTemplate.id, newVal);
            if (success) {
              setEditingTemplate(null);
            }
          }}
          isSaving={savingId === editingTemplate.id}
        />
      )}
    </div>
  );
}
