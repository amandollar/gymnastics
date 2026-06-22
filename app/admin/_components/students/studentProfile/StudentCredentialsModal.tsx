"use client";

import { useState } from "react";
import { X, Copy, Check, ShieldAlert, Key, RefreshCw } from "lucide-react";
import { generateStudentCredentialsAction } from "@/lib/actions/students";

interface StudentCredentialsModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentId: string;
  studentNumber: number;
  studentName: string;
  hasPasswordSet: boolean;
  isTempPassword: boolean;
}

export default function StudentCredentialsModal({
  isOpen,
  onClose,
  studentId,
  studentNumber,
  studentName,
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
    } catch (err) {
      setError("An unexpected error occurred.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/40 dark:bg-black/60 backdrop-blur-sm animate-fade-in animate-duration-200">
      <div className="w-full max-w-md rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl p-6 relative overflow-hidden animate-scale-in animate-duration-200">
        {/* Header */}
        <div className="flex justify-between items-start mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-brand-orange-50 dark:bg-brand-orange-950/20 text-brand-orange-500">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-55">
                Parent Login Credentials
              </h3>
              <p className="text-xs text-zinc-400 dark:text-zinc-500">
                Manage portal access for {studentName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl border border-zinc-150 dark:border-zinc-800 text-zinc-400 dark:text-zinc-500 hover:text-zinc-650 dark:hover:text-zinc-200 bg-white dark:bg-zinc-900 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4">
          {/* Status info */}
          <div className="text-sm p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-105 dark:border-zinc-850/50">
            <span className="block font-semibold text-zinc-850 dark:text-zinc-300 mb-1">Status:</span>
            {!hasPassword ? (
              <span className="text-zinc-550 dark:text-zinc-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-zinc-300 dark:bg-zinc-650 animate-pulse"></span>
                No credentials generated yet.
              </span>
            ) : isTemp ? (
              <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1.5 font-medium">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                Temporary credentials active.
              </span>
            ) : (
              <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Custom password set by parent.
              </span>
            )}
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-2xl bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 text-red-650 dark:text-red-400 text-xs animate-shake">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Credentials Display */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-400 dark:text-zinc-500 mb-1">
                LOGIN ID (Roll Number)
              </label>
              <div className="flex items-center gap-2 bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-150 dark:border-zinc-800 rounded-2xl px-3.5 py-3">
                <span className="text-zinc-850 dark:text-zinc-200 font-mono text-sm tracking-wider flex-1">
                  {formattedRollNumber}
                </span>
                <button
                  onClick={() => copyToClipboard(formattedRollNumber, "login")}
                  className="p-1.5 text-zinc-400 hover:text-zinc-650 dark:text-zinc-500 dark:hover:text-zinc-300 rounded-lg hover:bg-zinc-150 dark:hover:bg-zinc-850 transition-colors cursor-pointer"
                  title="Copy Login ID"
                >
                  {copiedLogin ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {hasPassword && (
              <div>
                <label className="block text-xs font-semibold text-zinc-400 dark:text-zinc-500 mb-1">
                  PASSWORD
                </label>
                <div className="flex items-center gap-2 bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-150 dark:border-zinc-800 rounded-2xl px-3.5 py-3">
                  <span className="text-zinc-850 dark:text-zinc-200 font-mono text-sm tracking-wider flex-1">
                    {tempPassword ? (
                      <span className="text-brand-orange-500 font-bold">{tempPassword}</span>
                    ) : isTemp ? (
                      <span className="text-zinc-400 italic text-xs font-sans">Temp password exists (copy unavailable)</span>
                    ) : (
                      <span className="text-zinc-400 italic text-xs font-sans">•••••••• (custom password set)</span>
                    )}
                  </span>
                  {tempPassword && (
                    <button
                      onClick={() => copyToClipboard(tempPassword, "pass")}
                      className="p-1.5 text-zinc-400 hover:text-zinc-650 dark:text-zinc-500 dark:hover:text-zinc-300 rounded-lg hover:bg-zinc-150 dark:hover:bg-zinc-850 transition-colors cursor-pointer"
                      title="Copy Password"
                    >
                      {copiedPass ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                    </button>
                  )}
                </div>
                {tempPassword && (
                  <p className="text-[10px] text-amber-600 dark:text-amber-400/80 font-medium mt-1">
                    Please copy this password now. It will not be shown again!
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 flex items-center justify-end gap-2 border-t border-zinc-100 dark:border-zinc-800/85 pt-4">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-2xl text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-850/50 transition-colors cursor-pointer"
          >
            Close
          </button>
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="inline-flex items-center gap-2 bg-brand-orange-500 hover:bg-brand-orange-600 disabled:bg-zinc-100 dark:disabled:bg-zinc-800 disabled:text-zinc-400 dark:disabled:text-zinc-550 text-white px-4 py-2.5 rounded-2xl text-sm font-semibold transition-colors cursor-pointer shadow-sm"
          >
            {isGenerating ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Key className="w-4 h-4" />
            )}
            {hasPassword ? "Reset Credentials" : "Generate Credentials"}
          </button>
        </div>
      </div>
    </div>
  );
}
