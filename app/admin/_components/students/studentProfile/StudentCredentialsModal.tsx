"use client";

import { useState } from "react";
import { X, Copy, Check, ShieldAlert, Key, RefreshCw, MessageCircle, Sparkles, Lock } from "lucide-react";
import { generateStudentCredentialsAction } from "@/lib/actions/students";

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
  const [isGenerating, setIsGenerating] = useState(false);
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [hasPassword, setHasPassword] = useState(initialHasPassword);
  const [isTemp, setIsTemp] = useState(initialIsTemp);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const formattedRollNumber = `TAG${String(studentNumber).padStart(3, "0")}`;
  const loginUrl =
    typeof window === "undefined" ? "/portal/login" : `${window.location.origin}/portal/login`;
  const cleanParentPhoneNumber = (parentPhoneNumber ?? "").replace(/\D/g, "");
  const whatsappNumber =
    cleanParentPhoneNumber.length === 10
      ? `91${cleanParentPhoneNumber}`
      : cleanParentPhoneNumber;

  const whatsappMessage = tempPassword
    ? [
        "Hello,",
        "",
        `Here are the parent portal login credentials for ${studentName}:`,
        `Login ID: ${formattedRollNumber}`,
        `Password: ${tempPassword}`,
        "",
        `Website: ${loginUrl}`,
      ].join("\n")
    : "";

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
    if (!whatsappMessage || !whatsappNumber) return;
    const encodedMessage = encodeURIComponent(whatsappMessage);
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
        {/* ── Header gradient band ── */}
        <div className="relative px-6 pt-6 pb-5 bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 overflow-hidden">
          {/* Decorative glow */}
          <div className="absolute -top-6 -right-6 w-32 h-32 rounded-full bg-brand-orange-500/10 blur-2xl pointer-events-none" />
          <div className="absolute -bottom-4 -left-4 w-24 h-24 rounded-full bg-brand-orange-500/8 blur-2xl pointer-events-none" />

          <div className="relative flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-brand-orange-500/15 border border-brand-orange-500/25 text-brand-orange-400">
                <Key className="w-4.5 h-4.5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white leading-tight">
                  Parent Portal Access
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">{studentName}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="flex items-center justify-center w-8 h-8 rounded-xl bg-white/8 hover:bg-white/14 border border-white/10 text-zinc-400 hover:text-white transition-all cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Status pill */}
          <div className={`mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold ${statusConfig.bg} ${statusConfig.border} ${statusConfig.color}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot} ${hasPassword && isTemp ? "animate-pulse" : ""}`} />
            {statusConfig.label}
          </div>
        </div>

        {/* ── Body ── */}
        <div className="px-6 py-5 space-y-4">

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
                  className="flex items-center justify-center w-7 h-7 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all cursor-pointer"
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
                      className="flex items-center justify-center w-7 h-7 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all cursor-pointer"
                      title="Copy Password"
                    >
                      {copiedPass
                        ? <Check className="w-3.5 h-3.5 text-emerald-500" />
                        : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  )}
                </div>

                {tempPassword && (
                  <div className="mt-2 flex items-center gap-1.5 text-[11px] text-amber-600 dark:text-amber-400/90 font-semibold ml-1">
                    <Lock className="w-3 h-3 shrink-0" />
                    Copy now — this password won&apos;t be shown again
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="px-6 pb-6 flex items-center gap-2.5">
          {/* WhatsApp */}
          <button
            type="button"
            onClick={handleWhatsAppShare}
            disabled={!tempPassword || !whatsappNumber}
            title={
              tempPassword
                ? whatsappNumber
                  ? "Share credentials on WhatsApp"
                  : "Parent phone number is required"
                : "Generate credentials first"
            }
            className="flex items-center gap-2 rounded-2xl bg-emerald-500 hover:bg-emerald-600 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-emerald-500 disabled:active:scale-100 px-4 py-2.5 text-sm font-semibold text-white transition-all shadow-sm shadow-emerald-500/20 cursor-pointer"
          >
            <MessageCircle className="w-4 h-4" />
            WhatsApp
          </button>

          {/* Spacer */}
          <div className="flex-1" />

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
      </div>
    </div>
  );
}
