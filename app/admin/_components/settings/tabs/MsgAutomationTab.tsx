"use client";

import React, { useState, useTransition } from "react";
import { saveAutomationSettingsAction } from "@/lib/actions/academy";
import type { AcademyProfile } from "@prisma/client";
import { Loader2, AlertCircle } from "lucide-react";

interface MsgAutomationTabProps {
  initialProfile: AcademyProfile;
}

export default function MsgAutomationTab({
  initialProfile,
}: MsgAutomationTabProps) {
  const [isPending, startTransition] = useTransition();
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<{
    type: "error";
    msg: string;
  } | null>(null);

  const [autoSendGrace, setAutoSendGrace] = useState(
    initialProfile.autoSendGrace ?? true,
  );
  const [autoSendInactive, setAutoSendInactive] = useState(
    initialProfile.autoSendInactive ?? true,
  );
  const [autoSendAllSessionsCompleted, setAutoSendAllSessionsCompleted] =
    useState(initialProfile.autoSendAllSessionsCompleted ?? true);

  const handleToggle = (
    key: "autoSendGrace" | "autoSendInactive" | "autoSendAllSessionsCompleted",
    newValue: boolean,
  ) => {
    setPendingKey(key);
    // Optimistic update
    if (key === "autoSendGrace") setAutoSendGrace(newValue);
    if (key === "autoSendInactive") setAutoSendInactive(newValue);
    if (key === "autoSendAllSessionsCompleted")
      setAutoSendAllSessionsCompleted(newValue);

    startTransition(async () => {
      setSaveStatus(null);
      const res = await saveAutomationSettingsAction({
        autoSendGrace: key === "autoSendGrace" ? newValue : autoSendGrace,
        autoSendInactive:
          key === "autoSendInactive" ? newValue : autoSendInactive,
        autoSendAllSessionsCompleted:
          key === "autoSendAllSessionsCompleted"
            ? newValue
            : autoSendAllSessionsCompleted,
      });

      if (!res.success) {
        // Revert on failure
        if (key === "autoSendGrace") setAutoSendGrace(!newValue);
        if (key === "autoSendInactive") setAutoSendInactive(!newValue);
        if (key === "autoSendAllSessionsCompleted")
          setAutoSendAllSessionsCompleted(!newValue);
        setSaveStatus({
          type: "error",
          msg: res.message || "Error saving settings",
        });
        setTimeout(() => setSaveStatus(null), 3000);
      }
      setPendingKey(null);
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center gap-4">
        <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
          Message Automation
        </h2>
      </div>

      {saveStatus && (
        <div className="flex items-center gap-2.5 px-4 py-3 rounded-2xl text-sm font-medium border bg-red-50 dark:bg-red-950/25 border-red-100 dark:border-red-900/30 text-red-650 dark:text-red-400">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {saveStatus.msg}
        </div>
      )}

      <div className="grid gap-4">
        <div className="flex items-start justify-between gap-4 p-5 rounded-2xl border-0 bg-zinc-100 dark:bg-zinc-900 transition-colors">
          <div>
            <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              All Sessions Completed
            </div>
            <div className="text-sm text-zinc-500 mt-1">
              Automatically send a reminder when a student completes all
              sessions in their plan.
            </div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={autoSendAllSessionsCompleted}
            disabled={isPending}
            onClick={() =>
              handleToggle(
                "autoSendAllSessionsCompleted",
                !autoSendAllSessionsCompleted,
              )
            }
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-brand-orange-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${autoSendAllSessionsCompleted ? "bg-brand-orange-500" : "bg-zinc-300 dark:bg-zinc-700"}`}
          >
            <span
              className={`flex items-center justify-center h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${autoSendAllSessionsCompleted ? "translate-x-5" : "translate-x-0"}`}
            >
              {isPending && pendingKey === "autoSendAllSessionsCompleted" && (
                <Loader2 className={`w-3 h-3 animate-spin ${autoSendAllSessionsCompleted ? "text-brand-orange-500" : "text-zinc-400"}`} />
              )}
            </span>
          </button>
        </div>

        <div className="flex items-start justify-between gap-4 p-5 rounded-2xl border-0 bg-zinc-100 dark:bg-zinc-900 transition-colors">
          <div>
            <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              Grace Period
            </div>
            <div className="text-sm text-zinc-500 mt-1">
              Automatically send a reminder when a student's plan expires and
              they enter the grace period.
            </div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={autoSendGrace}
            disabled={isPending}
            onClick={() => handleToggle("autoSendGrace", !autoSendGrace)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-brand-orange-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${autoSendGrace ? "bg-brand-orange-500" : "bg-zinc-300 dark:bg-zinc-700"}`}
          >
            <span
              className={`flex items-center justify-center h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${autoSendGrace ? "translate-x-5" : "translate-x-0"}`}
            >
              {isPending && pendingKey === "autoSendGrace" && (
                <Loader2 className={`w-3 h-3 animate-spin ${autoSendGrace ? "text-brand-orange-500" : "text-zinc-400"}`} />
              )}
            </span>
          </button>
        </div>

        <div className="flex items-start justify-between gap-4 p-5 rounded-2xl border-0 bg-zinc-100 dark:bg-zinc-900 transition-colors">
          <div>
            <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              Inactive Phase
            </div>
            <div className="text-sm text-zinc-500 mt-1">
              Automatically send a message when a student becomes inactive
              (exhausted all sessions or grace period).
            </div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={autoSendInactive}
            disabled={isPending}
            onClick={() => handleToggle("autoSendInactive", !autoSendInactive)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-brand-orange-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${autoSendInactive ? "bg-brand-orange-500" : "bg-zinc-300 dark:bg-zinc-700"}`}
          >
            <span
              className={`flex items-center justify-center h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${autoSendInactive ? "translate-x-5" : "translate-x-0"}`}
            >
              {isPending && pendingKey === "autoSendInactive" && (
                <Loader2 className={`w-3 h-3 animate-spin ${autoSendInactive ? "text-brand-orange-500" : "text-zinc-400"}`} />
              )}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
