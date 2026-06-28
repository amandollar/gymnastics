"use client";

import React, { useEffect, useState } from "react";
import { getMessageLogsAction } from "@/lib/actions/academy";
import { Loader2, Bot, User, CheckCircle2 } from "lucide-react";
import Image from "next/image";
import { format } from "date-fns";

type MessageLog = {
  id: string;
  templateName: string;
  isAutomated: boolean;
  sentAt: Date;
  student: {
    name: string;
    studentNumber: number;
    avatarUrl: string | null;
  };
};

export default function MsgLogsTab() {
  const [logs, setLogs] = useState<MessageLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function fetchLogs() {
      setIsLoading(true);
      setError(null);
      const res = await getMessageLogsAction();
      if (!mounted) return;

      if (res.success && res.logs) {
        setLogs(res.logs);
      } else {
        setError(res.message || "Failed to load logs");
      }
      setIsLoading(false);
    }
    fetchLogs();
    return () => {
      mounted = false;
    };
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-brand-orange-500 animate-spin" />
        <p className="mt-4 text-sm text-zinc-500 font-medium">Loading logs...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="bg-red-50 text-red-800 px-6 py-4 rounded-xl border border-red-200">
          <p className="font-semibold">{error}</p>
        </div>
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-800 rounded-2xl flex items-center justify-center mb-4">
          <CheckCircle2 className="w-8 h-8 text-zinc-400" />
        </div>
        <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50 mb-1">No Messages Sent Yet</h3>
        <p className="text-sm text-zinc-500 max-w-sm">
          Once WhatsApp messages are sent manually or automatically, they will appear here. Logs are kept for 90 days.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-300">
      <div>
        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 mb-1">Message Logs</h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          History of automated and manual WhatsApp messages (last 90 days)
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800">
              <tr>
                <th className="px-6 py-4 font-semibold text-zinc-600 dark:text-zinc-300">Student</th>
                <th className="px-6 py-4 font-semibold text-zinc-600 dark:text-zinc-300">Template</th>
                <th className="px-6 py-4 font-semibold text-zinc-600 dark:text-zinc-300">Sent Via</th>
                <th className="px-6 py-4 font-semibold text-zinc-600 dark:text-zinc-300 text-right">Date & Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {log.student.avatarUrl ? (
                        <div className="relative w-8 h-8 rounded-full overflow-hidden shrink-0 border border-zinc-200 dark:border-zinc-700">
                          <Image src={log.student.avatarUrl} alt={log.student.name} fill className="object-cover" />
                        </div>
                      ) : (
                        <div className="relative w-8 h-8 rounded-full overflow-hidden shrink-0 border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800">
                          <Image 
                            src={(log.student as any).gender === "FEMALE" ? "/icons/women.webp" : "/icons/man.webp"} 
                            alt={log.student.name} 
                            fill 
                            className="object-cover opacity-80" 
                          />
                        </div>
                      )}
                      <div>
                        <div className="font-semibold text-zinc-900 dark:text-zinc-100">{log.student.name}</div>
                        <div className="text-xs text-zinc-500">Roll: {log.student.studentNumber}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center rounded-full bg-blue-50 dark:bg-blue-950/40 px-2.5 py-1 text-[11px] font-semibold text-blue-700 dark:text-blue-300 ring-1 ring-blue-200/80 dark:ring-blue-900/30">
                      {log.templateName}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {log.isAutomated ? (
                      <div className="flex items-center gap-1.5 text-brand-orange-600 dark:text-brand-orange-400 font-medium">
                        <Bot className="w-4 h-4" />
                        <span>Automated</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
                        <User className="w-4 h-4" />
                        <span>Manual</span>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right text-zinc-500 dark:text-zinc-400">
                    <div className="font-medium text-zinc-700 dark:text-zinc-300">{format(new Date(log.sentAt), "dd MMM yyyy")}</div>
                    <div className="text-xs mt-0.5">{format(new Date(log.sentAt), "h:mm a")}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
