"use client";

import React, { useState } from "react";
import { Download, Users, Dumbbell, CreditCard, Loader2 } from "lucide-react";

export default function ExportTab() {
  const [studentStatus, setStudentStatus] = useState<string>("ALL");

  // Default dates: 30 days ago to today
  const todayStr = new Date().toISOString().split("T")[0];
  const thirtyDaysAgoStr = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  const [financeFrom, setFinanceFrom] = useState<string>(thirtyDaysAgoStr);
  const [financeTo, setFinanceTo] = useState<string>(todayStr);

  const [exporting, setExporting] = useState<Record<string, boolean>>({});

  const triggerDownload = async (url: string, filename: string, key: string) => {
    setExporting((prev) => ({ ...prev, [key]: true }));
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to download");
      const blob = await res.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);
      
      // Save last exported timestamp in localstorage
      localStorage.setItem(`last_export_${key}`, new Date().toLocaleString("en-IN"));
    } catch (err) {
      console.error(err);
      alert("Failed to export data. Please try again.");
    } finally {
      setExporting((prev) => ({ ...prev, [key]: false }));
    }
  };

  const handleStudentsExport = () => {
    const filename = `students_export_${studentStatus.toLowerCase()}_${todayStr}.csv`;
    triggerDownload(`/api/export/students?status=${studentStatus}`, filename, "students");
  };

  const handleCoachesExport = () => {
    const filename = `coaches_export_${todayStr}.csv`;
    triggerDownload(`/api/export/coaches`, filename, "coaches");
  };

  const handleFinanceExport = () => {
    const filename = `finance_ledger_export_${financeFrom}_to_${financeTo}.csv`;
    triggerDownload(
      `/api/export/finance?from=${financeFrom}&to=${financeTo}`,
      filename,
      "finance"
    );
  };

  const getLastExport = (key: string) => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(`last_export_${key}`);
  };

  const inputClass =
    "w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-3 py-2 text-base md:text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-brand-orange-500/20 focus:border-brand-orange-500 transition-colors [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-60 hover:[&::-webkit-calendar-picker-indicator]:opacity-100";

  return (
    <div className="relative">
      <div className="rounded-2xl border border-zinc-100 dark:border-zinc-800/60 bg-white dark:bg-zinc-950 p-4 lg:p-6 shadow-xs md:border-0 md:bg-transparent md:p-0 md:shadow-none">
        {/* Header inside card */}
        <div className="mb-5">
          <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
            Data Export
          </h2>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Students Card */}
          <div className="rounded-2xl border border-zinc-100 dark:border-zinc-800/60 bg-white dark:bg-zinc-950 p-5 shadow-xs flex flex-col justify-between">
            <div>
              <div className="h-10 w-10 rounded-xl bg-brand-orange-50 dark:bg-brand-orange-950/20 flex items-center justify-center mb-4 text-brand-orange-600 dark:text-brand-orange-400">
                <Users className="h-5 w-5" strokeWidth={2} />
              </div>
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Students Sheet
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1.5 leading-relaxed">
                Export consolidated student details, active plans (fee, dates, discount), and attendance session summaries.
              </p>

              {/* Filter */}
              <div className="mt-4 space-y-1.5">
                <label className="block text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                  Filter by Status
                </label>
                <select
                  value={studentStatus}
                  onChange={(e) => setStudentStatus(e.target.value)}
                  className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-3 py-1.5 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-brand-orange-500/20 focus:border-brand-orange-500 transition-colors"
                >
                  <option value="ALL">All Students</option>
                  <option value="ACTIVE">Active Plan Only</option>
                  <option value="GRACE">Grace Period Only</option>
                  <option value="INACTIVE">Inactive Plans Only</option>
                </select>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-zinc-100 dark:border-zinc-800 flex flex-col gap-3">
              <span className="text-[10px] text-zinc-400 dark:text-zinc-500">
                Last export: {getLastExport("students") || "Never"}
              </span>
              <button
                type="button"
                onClick={handleStudentsExport}
                disabled={exporting["students"]}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-zinc-250 px-4 py-2 text-xs font-semibold text-white dark:text-zinc-900 disabled:opacity-55 cursor-pointer transition-colors shadow-xs"
              >
                {exporting["students"] ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Download className="h-3.5 w-3.5" />
                )}
                Export Students CSV
              </button>
            </div>
          </div>

          {/* Coaches Card */}
          <div className="rounded-2xl border border-zinc-100 dark:border-zinc-800/60 bg-white dark:bg-zinc-950 p-5 shadow-xs flex flex-col justify-between">
            <div>
              <div className="h-10 w-10 rounded-xl bg-brand-orange-50 dark:bg-brand-orange-950/20 flex items-center justify-center mb-4 text-brand-orange-600 dark:text-brand-orange-400">
                <Dumbbell className="h-5 w-5" strokeWidth={2} />
              </div>
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Coach & Staff
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1.5 leading-relaxed">
                Export employees and coaches details including specialization, status, timings, fixed salaries, and contact info.
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-zinc-100 dark:border-zinc-800 flex flex-col gap-3">
              <span className="text-[10px] text-zinc-400 dark:text-zinc-500">
                Last export: {getLastExport("coaches") || "Never"}
              </span>
              <button
                type="button"
                onClick={handleCoachesExport}
                disabled={exporting["coaches"]}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-zinc-250 px-4 py-2 text-xs font-semibold text-white dark:text-zinc-900 disabled:opacity-55 cursor-pointer transition-colors shadow-xs"
              >
                {exporting["coaches"] ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Download className="h-3.5 w-3.5" />
                )}
                Export Coaches CSV
              </button>
            </div>
          </div>

          {/* Finance Card */}
          <div className="rounded-2xl border border-zinc-100 dark:border-zinc-800/60 bg-white dark:bg-zinc-950 p-5 shadow-xs flex flex-col justify-between">
            <div>
              <div className="h-10 w-10 rounded-xl bg-brand-orange-50 dark:bg-brand-orange-950/20 flex items-center justify-center mb-4 text-brand-orange-600 dark:text-brand-orange-400">
                <CreditCard className="h-5 w-5" strokeWidth={2} />
              </div>
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Finance Ledger
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1.5 leading-relaxed">
                Export chronological cash-flow transactions ledger combining student fee payments (revenue) and coach salary payouts (expenses).
              </p>

              {/* Date Range */}
              <div className="mt-4 grid grid-cols-1 gap-3">
                <div className="space-y-1">
                  <label className="block text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                    From
                  </label>
                  <input
                    type="date"
                    value={financeFrom}
                    onChange={(e) => setFinanceFrom(e.target.value)}
                    className={inputClass + " w-full"}
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                    To
                  </label>
                  <input
                    type="date"
                    value={financeTo}
                    onChange={(e) => setFinanceTo(e.target.value)}
                    className={inputClass + " w-full"}
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-zinc-100 dark:border-zinc-800 flex flex-col gap-3">
              <span className="text-[10px] text-zinc-400 dark:text-zinc-500">
                Last export: {getLastExport("finance") || "Never"}
              </span>
              <button
                type="button"
                onClick={handleFinanceExport}
                disabled={exporting["finance"]}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-zinc-250 px-4 py-2 text-xs font-semibold text-white dark:text-zinc-900 disabled:opacity-55 cursor-pointer transition-colors shadow-xs"
              >
                {exporting["finance"] ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Download className="h-3.5 w-3.5" />
                )}
                Export Finance CSV
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
