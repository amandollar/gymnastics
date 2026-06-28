"use client";

import React, { useState, useRef, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { sendWhatsAppMessageAction } from "@/lib/actions/whatsapp";

interface WhatsAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  contactNumber: string;
  defaultMessageText: string;
  title?: string;
  variables?: { label: string; value: string }[];
  studentId?: string;
  enquiryId?: string;
  templateName?: string;
}

export default function WhatsAppModal({
  isOpen,
  onClose,
  contactNumber,
  defaultMessageText,
  title = "Follow up with WhatsApp",
  variables = [],
  studentId,
  enquiryId,
  templateName,
}: WhatsAppModalProps) {
  const [messageText, setMessageText] = useState(defaultMessageText);
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Sync messageText state whenever defaultMessageText changes
  useEffect(() => {
    setMessageText(defaultMessageText);
  }, [defaultMessageText]);

  const insertText = (str: string) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      setMessageText((prev) => prev + str);
      return;
    }
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const before = text.substring(0, start);
    const after = text.substring(end, text.length);
    setMessageText(before + str + after);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + str.length, start + str.length);
    }, 0);
  };

  const handleSend = async () => {
    setSending(true);
    
    try {
      let cleanNumber = contactNumber.replace(/\D/g, "");
      if (cleanNumber.length === 10) {
        cleanNumber = "91" + cleanNumber;
      }

      const res = await sendWhatsAppMessageAction({
        to: cleanNumber,
        type: "text",
        text: messageText,
        studentId,
        enquiryId,
        templateName,
        isAutomated: false,
      });

      if (!res.success) {
        throw new Error(res.message || "Failed to send WhatsApp message");
      }

      onClose();
      setToast({ type: "success", message: "Message sent successfully!" });
      setTimeout(() => {
        setToast(null);
      }, 4000);
    } catch (error) {
      setToast({ type: "error", message: error instanceof Error ? error.message : "Error sending message" });
      setTimeout(() => setToast(null), 4000);
    } finally {
      setSending(false);
    }
  };

  return (
    <>
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs transition-all duration-300 ease-in-out ${
        isOpen ? "opacity-100 pointer-events-auto visible" : "opacity-0 pointer-events-none invisible"
      }`}
    >
      <div className="absolute inset-0" onClick={onClose} />
      <div
        className={`relative z-10 w-full max-w-2xl bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-800/80 overflow-hidden flex flex-col transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          isOpen ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 translate-y-4"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-2 shrink-0">
          <div>
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-50">
              {title}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-8 w-8 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 dark:text-zinc-505 hover:text-zinc-650 dark:hover:text-zinc-300 transition-colors flex items-center justify-center cursor-pointer border-0 bg-transparent"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-3 space-y-4">
          {/* Variables Bar */}
          {variables && variables.length > 0 && (
            <div className="space-y-1.5">
              <span className="block text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                Click to Insert Variable:
              </span>
              <div className="flex flex-wrap gap-2">
                {variables.map((v) => (
                  <button
                    key={v.label}
                    type="button"
                    onClick={() => insertText(v.value)}
                    className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-brand-orange-50 hover:bg-brand-orange-100 dark:bg-brand-orange-955/20 dark:hover:bg-brand-orange-950/40 dark:text-brand-orange-400 text-brand-orange-600 border border-brand-orange-150/10 cursor-pointer transition-colors"
                  >
                    {v.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <textarea
              ref={textareaRef}
              rows={12}
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              className="w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-955 p-4 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-450 dark:placeholder-zinc-650 focus:outline-none focus:ring-1 focus:ring-brand-orange-500/50 focus:border-brand-orange-500 transition-all resize-none"
              placeholder="Type your WhatsApp message..."
            />
          </div>

          {/* Emoji Bar */}
          <div className="flex flex-wrap gap-3 py-1">
            {[
              "🤸",
              "🤸‍♀️",
              "🤸‍♂️",
              "🏆",
              "📞",
              "👍",
              "😊",
              "📝",
              "👋",
              "🌟",
              "✨",
              "❤️",
            ].map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => insertText(emoji)}
                className="text-xl hover:scale-125 transition-transform duration-200 cursor-pointer focus:outline-none border-0 bg-transparent"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-6 pb-6 pt-3 bg-transparent shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 text-sm font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-855 cursor-pointer transition-colors bg-transparent"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={sending}
            onClick={handleSend}
            className="inline-flex items-center gap-2 rounded-xl bg-brand-orange-500 hover:bg-brand-orange-600 disabled:opacity-50 disabled:cursor-not-allowed px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer border-0"
          >
            {sending ? (
              <Loader2 className="w-4 h-4 shrink-0 animate-spin" />
            ) : (
              <svg
                className="w-4 h-4 shrink-0"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12.016 2a10 10 0 0 0-8.77 14.77l-1.45 5.31 5.43-1.42A10 10 0 1 0 12.016 2zm0 18.18a8.18 8.18 0 0 1-4.23-1.16l-.3-.18-3.1.81.82-3.01-.19-.31a8.18 8.18 0 1 1 7 3.85zm4.49-5.96c-.25-.12-1.46-.72-1.69-.8-.22-.08-.39-.12-.55.12-.16.24-.62.8-.76.96-.14.16-.28.18-.53.06-.25-.12-1.07-.39-2.03-1.25-.75-.67-1.25-1.5-1.4-1.74-.15-.24-.01-.37.11-.49.11-.11.25-.28.37-.42.12-.14.16-.24.24-.4.08-.16.04-.31-.02-.44-.06-.13-.55-1.32-.75-1.81-.2-.48-.4-.41-.55-.42-.14-.01-.3-.01-.46-.01s-.42.06-.64.29c-.22.23-.85.83-.85 2.03s.87 2.35 1 2.51c.12.16 1.7 2.6 4.12 3.64.57.24 1.02.39 1.37.5.58.18 1.11.16 1.53.1.47-.07 1.45-.59 1.65-1.16.2-.57.2-1.06.14-1.16-.06-.1-.23-.16-.48-.28z" />
              </svg>
            )}
            {sending ? "Sending..." : "Send via WhatsApp"}
          </button>
        </div>
      </div>
    </div>
    {toast && (
      <div
        className={`fixed bottom-4 right-4 z-[9999] rounded-2xl border px-4 py-3.5 text-xs font-semibold shadow-lg max-w-sm transition-all duration-300 animate-fade-in ${
          toast.type === "success"
            ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200/60 dark:border-emerald-900/30"
            : "bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border-rose-200/60 dark:border-rose-900/30"
        }`}
      >
        {toast.message}
      </div>
    )}
    </>
  );
}
