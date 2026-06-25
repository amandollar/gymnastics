"use client";

import { useState, useEffect } from "react";
import { X, Copy, Check, ShieldAlert, Key, RefreshCw, MessageCircle, Sparkles, Lock, User } from "lucide-react";
import { generateStudentCredentialsAction } from "@/lib/actions/students";
import { getAcademyTemplatesAction } from "@/lib/actions/academy";
import { resolveTemplate, getEffectiveTemplate } from "@/lib/utils/whatsapp-templates";
import { getPortalBaseUrl } from "@/lib/utils/portal-url";

interface StudentCredentialsModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentId: string;
  studentNumber: number;
  studentName: string;
  parentPhoneNumber?: string | null;
  hasPasswordSet: boolean;
  isTempPassword: boolean;
}

export default function StudentCredentialsModal({
  isOpen,
  onClose,
  studentId,
  studentNumber,
  studentName,
  parentPhoneNumber,
  hasPasswordSet: initialHasPassword,
  isTempPassword: initialIsTemp,
}: StudentCredentialsModalProps) {
  const [copiedLogin, setCopiedLogin] = useState(false);
  const [copiedPass, setCopiedPass] = useState(false);
  const [copiedBoth, setCopiedBoth] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [hasPassword, setHasPassword] = useState(initialHasPassword);
  const [isTemp, setIsTemp] = useState(initialIsTemp);
  const [error, setError] = useState<string | null>(null);
  const [customTemplate, setCustomTemplate] = useState<string | null>(null);
  const [academyWebsite, setAcademyWebsite] = useState<string | null>(null);
  const [customPortalUrl, setCustomPortalUrl] = useState<string | null>(null);
  const [whatsappMessageText, setWhatsappMessageText] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    const fetchTemplate = async () => {
      try {
        const res = await getAcademyTemplatesAction();
        if (res.success) {
          if (res.templates?.templateLoginCredentials) {
            setCustomTemplate(res.templates.templateLoginCredentials);
          }
          if (res.website) {
            setAcademyWebsite(res.website);
          }
          if (res.parentPortalUrl) {
            setCustomPortalUrl(res.parentPortalUrl);
          }
        }
      } catch (err) {
        console.error("Failed to load credentials template", err);
      }
    };
    fetchTemplate();
  }, [isOpen]);

  if (!isOpen) return null;

  const formattedRollNumber = `TAG${String(studentNumber).padStart(3, "0")}`;

  const loginUrl = `${getPortalBaseUrl(customPortalUrl, academyWebsite)}/portal/login`;
  const cleanParentPhoneNumber = (parentPhoneNumber ?? "").replace(/\D/g, "");
  const whatsappNumber =
    cleanParentPhoneNumber.length === 10
      ? `91${cleanParentPhoneNumber}`
      : cleanParentPhoneNumber;

  useEffect(() => {
    if (tempPassword) {
      const template = getEffectiveTemplate(customTemplate, "templateLoginCredentials");
      const resolved = resolveTemplate(template, {
        parentName: "Parent",
        studentName: studentName,
        loginId: formattedRollNumber,
        password: tempPassword,
        portalLink: loginUrl,
      });
      setWhatsappMessageText(resolved);
    } else {
      setWhatsappMessageText("");
    }
  }, [tempPassword, customTemplate, studentName, formattedRollNumber, loginUrl]);

  const copyToClipboard = (text: string, type: "login" | "pass") => {
    navigator.clipboard.writeText(text);
    if (type === "login") {
      setCopiedLogin(true);
      setTimeout(() => setCopiedLogin(false), 2000);
    } else {
      setCopiedPass(true);
      setTimeout(() => setCopiedPass(false), 2000);
    }
  };

  const handleCopyCredentials = () => {
    if (!tempPassword) return;
    const credentialsText = `Login ID: ${formattedRollNumber}\nPassword: ${tempPassword}`;
    navigator.clipboard.writeText(credentialsText);
    setCopiedBoth(true);
    setTimeout(() => setCopiedBoth(false), 2000);
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);
    try {
      const res = await generateStudentCredentialsAction(studentId);
      if (res.success && res.tempPassword) {
        setTempPassword(res.tempPassword);
        setHasPassword(true);
        setIsTemp(true);
      } else {
        setError(res.message || "Failed to generate credentials.");
      }
    } catch {
      setError("An unexpected error occurred.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleWhatsAppShare = () => {
    if (!whatsappMessageText || !whatsappNumber) return;
    const encodedMessage = encodeURIComponent(whatsappMessageText);
    window.open(`https://wa.me/${whatsappNumber}?text=${encodedMessage}`, "_blank", "noopener,noreferrer");
  };

  const statusConfig = !hasPassword
    ? { label: "No credentials generated", color: "text-zinc-400 dark:text-zinc-500", dot: "bg-zinc-300 dark:bg-zinc-600", bg: "bg-zinc-50 dark:bg-zinc-800/60", border: "border-zinc-200 dark:border-zinc-700/60" }
    : isTemp
    ? { label: "Temporary credentials active", color: "text-amber-600 dark:text-amber-400", dot: "bg-amber-500", bg: "bg-amber-50 dark:bg-amber-950/30", border: "border-amber-200 dark:border-amber-800/40" }
    : { label: "Custom password set by parent", color: "text-emerald-600 dark:text-emerald-400", dot: "bg-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-950/30", border: "border-emerald-200 dark:border-emerald-800/40" };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-md animate-fade-in animate-duration-200">
      <div
        className="w-full max-w-[420px] rounded-[28px] bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-700/60 shadow-2xl shadow-black/20 dark:shadow-black/60 overflow-hidden animate-scale-in animate-duration-200"
        style={{ boxShadow: "0 32px 64px -12px rgba(0,0,0,0.25), 0 0 0 1px rgba(255,255,255,0.05)" }}
      >
        {/* Header */}
        <div className="relative px-6 pt-6 pb-2 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-brand-orange-50 dark:bg-brand-orange-950/30 text-brand-orange-600 dark:text-brand-orange-400">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 leading-tight">
                {studentName}
              </h3>
              <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">Reset credentials</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex items-center justify-center w-8 h-8 rounded-full text-zinc-400 hover:text-zinc-655 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── Body ── */}
        <div className={`px-6 py-5 space-y-4 ${tempPassword ? "pb-6" : ""}`}>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2.5 p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/25 border border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-400 text-xs font-medium animate-shake">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Credentials fields */}
          <div className="space-y-3">
            {/* Login ID */}
            <div className="group">
              <label className="block text-[10px] font-bold tracking-widest text-zinc-400 dark:text-zinc-500 uppercase mb-1.5 ml-1">
                Login ID
              </label>
              <div className="flex items-center gap-2 bg-zinc-50 dark:bg-zinc-800/70 border border-zinc-200 dark:border-zinc-700/80 rounded-2xl px-4 py-3 transition-colors group-hover:border-zinc-300 dark:group-hover:border-zinc-600">
                <span className="flex-1 font-mono text-sm font-semibold text-zinc-800 dark:text-zinc-100 tracking-widest">
                  {formattedRollNumber}
                </span>
                <button
                  onClick={() => copyToClipboard(formattedRollNumber, "login")}
                  className="flex items-center justify-center w-7 h-7 rounded-lg text-zinc-400 hover:text-zinc-750 dark:hover:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all cursor-pointer"
                  title="Copy Login ID"
                >
                  {copiedLogin
                    ? <Check className="w-3.5 h-3.5 text-emerald-500" />
                    : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Password */}
            {hasPassword && (
              <div className="group">
                <label className="block text-[10px] font-bold tracking-widest text-zinc-400 dark:text-zinc-500 uppercase mb-1.5 ml-1">
                  Password
                </label>
                <div className="flex items-center gap-2 bg-zinc-50 dark:bg-zinc-800/70 border border-zinc-200 dark:border-zinc-700/80 rounded-2xl px-4 py-3 transition-colors group-hover:border-zinc-300 dark:group-hover:border-zinc-600">
                  <span className="flex-1 font-mono text-sm font-semibold tracking-widest">
                    {tempPassword ? (
                      <span className="text-brand-orange-500">{tempPassword}</span>
                    ) : isTemp ? (
                      <span className="text-zinc-400 dark:text-zinc-500 text-xs italic font-sans tracking-normal">Temp password set — copy unavailable</span>
                    ) : (
                      <span className="text-zinc-400 dark:text-zinc-500 text-xs italic font-sans tracking-normal">Hidden after parent changed it</span>
                    )}
                  </span>
                  {tempPassword && (
                    <button
                      onClick={() => copyToClipboard(tempPassword, "pass")}
                      className="flex items-center justify-center w-7 h-7 rounded-lg text-zinc-400 hover:text-zinc-750 dark:hover:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all cursor-pointer"
                      title="Copy Password"
                    >
                      {copiedPass
                        ? <Check className="w-3.5 h-3.5 text-emerald-500" />
                        : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* WhatsApp message template preview */}
          {tempPassword && (
            <div className="space-y-2 animate-fade-in pt-2">
              <label className="block text-[10px] font-bold tracking-widest text-zinc-400 dark:text-zinc-500 uppercase ml-1">
                WhatsApp Message Preview
              </label>
              <textarea
                rows={6}
                value={whatsappMessageText}
                onChange={(e) => setWhatsappMessageText(e.target.value)}
                className="w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 p-4 text-xs text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-brand-orange-500/50 focus:border-brand-orange-500 transition-all resize-none leading-relaxed"
                placeholder="Message to send..."
              />
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={handleCopyCredentials}
                  className="w-full flex items-center justify-center gap-2 rounded-2xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-850 text-xs font-semibold text-zinc-700 dark:text-zinc-300 py-2.5 transition-all cursor-pointer"
                >
                  {copiedBoth ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-500" />
                      Credentials Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy Credentials
                    </>
                  )}
                </button>

                {whatsappNumber ? (
                  <button
                    type="button"
                    onClick={handleWhatsAppShare}
                    className="w-full flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-xs font-semibold text-white py-2.5 transition-all shadow-sm shadow-emerald-500/20 cursor-pointer"
                  >
                    <MessageCircle className="w-4 h-4" />
                    Send on WhatsApp
                  </button>
                ) : (
                  <p className="text-[10px] text-red-500 font-semibold ml-1">
                    Parent phone number is missing or invalid. Message cannot be sent.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        {!tempPassword && (
          <div className="px-6 pb-6 flex items-center justify-between">
            {/* Cancel/Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-2xl border border-zinc-200 dark:border-zinc-855 text-sm font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-850 cursor-pointer transition-colors"
            >
              Close
            </button>

            {/* Generate / Reset */}
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="flex items-center gap-2 bg-brand-orange-500 hover:bg-brand-orange-600 active:scale-95 disabled:opacity-60 disabled:active:scale-100 text-white px-4 py-2.5 rounded-2xl text-sm font-semibold transition-all cursor-pointer shadow-sm shadow-brand-orange-500/25"
            >
              {isGenerating ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : hasPassword ? (
                <RefreshCw className="w-4 h-4" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              {hasPassword ? "Reset" : "Generate"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
