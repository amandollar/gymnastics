"use client";

import { useState } from "react";
import { X, Send, RefreshCw, Bell, ShieldAlert } from "lucide-react";
import { createNotificationAction } from "@/lib/actions/notifications";

interface PushNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentId: string;
  studentName: string;
}

export default function PushNotificationModal({
  isOpen,
  onClose,
  studentId,
  studentName,
}: PushNotificationModalProps) {
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setIsSending(true);
    setError(null);
    try {
      const res = await createNotificationAction(studentId, message);
      if (res.success) {
        setSuccess(true);
        setMessage("");
        setTimeout(() => {
          setSuccess(false);
          onClose();
        }, 1500);
      } else {
        setError(res.message || "Failed to send notification.");
      }
    } catch {
      setError("An unexpected error occurred.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-55 flex items-center justify-center p-4 bg-black/50 backdrop-blur-md animate-fade-in animate-duration-200">
      <div
        className="w-full max-w-[420px] rounded-[28px] bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-700/60 shadow-2xl shadow-black/20 dark:shadow-black/60 overflow-hidden animate-scale-in animate-duration-200"
        style={{ boxShadow: "0 32px 64px -12px rgba(0,0,0,0.25), 0 0 0 1px rgba(255,255,255,0.05)" }}
      >
        {/* Header */}
        <div className="relative px-6 pt-6 pb-5 bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 overflow-hidden">
          <div className="absolute -top-6 -right-6 w-32 h-32 rounded-full bg-brand-orange-500/10 blur-2xl pointer-events-none" />
          
          <div className="relative flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-brand-orange-500/15 border border-brand-orange-500/25 text-brand-orange-400">
                <Bell className="w-4.5 h-4.5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white leading-tight">
                  Push Notification Alert
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
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {error && (
            <div className="flex items-center gap-2.5 p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/25 border border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-400 text-xs font-medium">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success ? (
            <div className="p-8 text-center space-y-3">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500">
                <Bell className="w-6 h-6 animate-bounce" />
              </div>
              <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Notification Sent!</h4>
              <p className="text-xs text-zinc-400">Successfully pushed to parent portal app.</p>
            </div>
          ) : (
            <div className="space-y-2">
              <label className="block text-[10px] font-bold tracking-widest text-zinc-400 dark:text-zinc-500 uppercase mb-1.5 ml-1">
                Message Content
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                rows={4}
                placeholder="Enter alert message to send to the parent..."
                className="w-full rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 px-4 py-3 text-sm font-medium text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 outline-none focus:border-brand-orange-500 focus:ring-4 focus:ring-brand-orange-500/10 transition-all resize-none"
              />
            </div>
          )}

          {!success && (
            <div className="flex items-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-zinc-700 dark:text-zinc-350 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors shadow-sm cursor-pointer text-center"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSending || !message.trim()}
                className="flex-1 flex justify-center items-center gap-2 bg-brand-orange-500 hover:bg-brand-orange-600 disabled:opacity-40 text-white px-4 py-2.5 rounded-2xl text-sm font-semibold transition-all cursor-pointer shadow-sm shadow-brand-orange-500/25"
              >
                {isSending ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                Send Push
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
