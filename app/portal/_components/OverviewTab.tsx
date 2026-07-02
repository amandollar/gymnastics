"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Info, Download, ChevronRight } from "lucide-react";
import StudentAvatar from "@/app/admin/_components/students/StudentAvatar";
import { PortalLevelCard } from "./PortalLevelCard";
import { getPaymentByIdAction } from "@/lib/actions/payments";
import { FeeReceipt } from "@/app/admin/_components/students/studentProfile/FeeReceipt";

interface OverviewTabProps {
  student: any;
  academyProfile: any;
}

export default function OverviewTab({ student, academyProfile }: OverviewTabProps) {
  const [printData, setPrintData] = useState<any | null>(null);
  const profileUrl = "/parents/profile";

  const activePlan = student.plans?.find((p: any) => p.isActive) || null;

  const INR = (amount: number) => {
    return `₹${amount.toLocaleString("en-IN")}`;
  };

  const handlePrint = async (paymentId: string) => {
    try {
      const data = await getPaymentByIdAction(paymentId);
      if (data) {
        const studentObj = data.student;
        const firstName = studentObj.name.trim().split(/\s+/)[0]?.toLowerCase() || "student";
        const newTitle = `TAG${studentObj.studentNumber}-${firstName}-fee-reciept`;
        document.title = newTitle;
        const titleEl = document.querySelector("title");
        if (titleEl) {
          titleEl.textContent = newTitle;
        }
        setPrintData(data);
      } else {
        alert("Failed to load receipt data for printing");
      }
    } catch {
      alert("Error fetching receipt details");
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl mx-auto">
      {/* Top Profile Header (Outside card) */}
      <Link
        href={profileUrl}
        className="relative flex flex-row items-center justify-between gap-4 sm:gap-5 mb-3 px-4 py-4 rounded-[2rem] border border-transparent hover:bg-zinc-500/5 dark:hover:bg-zinc-100/5 transition-all group cursor-pointer w-full"
      >
        <div className="flex flex-row items-center gap-4 sm:gap-5 min-w-0">
          {/* Circle Avatar (Left) */}
          <StudentAvatar
            student={student}
            size={80}
            className="border border-zinc-200 dark:border-zinc-800 shadow-xs"
          />

          <div className="text-left min-w-0">
            <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-55 tracking-tight truncate">
              {student.name}
            </h2>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-zinc-550 dark:text-zinc-400">
                Roll: TAG{student.studentNumber}
              </span>
              <span className="px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider text-brand-orange-500 border border-brand-orange-500/30 bg-brand-orange-500/5 dark:bg-brand-orange-500/10 rounded-md">
                {student.status}
              </span>
            </div>
          </div>
        </div>

        {/* Thinner ChevronRight inside a circular background button */}
        <div className="flex h-9 w-9 items-center justify-center rounded-full border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-450 dark:text-zinc-500 group-hover:text-brand-orange-500 group-hover:border-brand-orange-500/30 group-hover:bg-brand-orange-50/50 dark:group-hover:bg-brand-orange-950/20 transition-all self-end mb-1 shrink-0 shadow-3xs">
          <ChevronRight className="w-5 h-5" strokeWidth={1.5} />
        </div>
      </Link>

      <PortalLevelCard
        studentId={student.id}
        studentName={student.name}
        currentLevel={student.level}
        trainingFocus={student.trainingFocus}
      />

      {/* Reminders / Alerts Card */}
      {(() => {
        if (!activePlan) return null;

        const paidAmount = activePlan.payments?.reduce((sum: number, p: any) => sum + p.amount, 0) ?? 0;
        const outstanding = Math.max(0, activePlan.fee - paidAmount);
        const hasDues = outstanding > 0;

        const today = new Date();
        const endDate = new Date(activePlan.endDate);
        const expiryDate = new Date(activePlan.expiryDate);

        const msEndDiff = endDate.getTime() - today.getTime();
        const daysLeft = Math.ceil(msEndDiff / (1000 * 60 * 60 * 24));
        const isExpiringSoon = daysLeft >= 0 && daysLeft <= 5;

        const msExpiryDiff = expiryDate.getTime() - today.getTime();
        const graceDaysLeft = Math.ceil(msExpiryDiff / (1000 * 60 * 60 * 24));
        const isInGrace = today > endDate && today <= expiryDate && activePlan.sessionsCompleted < activePlan.totalSessions;
        const hasRemainingSessions = activePlan.sessionsCompleted < activePlan.totalSessions;

        const alerts = [];

        if (hasDues) {
          alerts.push({
            type: "dues",
            title: "Outstanding Dues",
            message: `Please clear the outstanding balance of ${INR(outstanding)} for your current plan.`,
          });
        }

        if (isInGrace) {
          alerts.push({
            type: "grace",
            title: "Grace Period Active",
            message: `Your plan's standard duration has ended, but you have ${activePlan.totalSessions - activePlan.sessionsCompleted} sessions remaining. You have ${graceDaysLeft} days left (until ${expiryDate.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}) to complete them.`,
          });
        } else if (isExpiringSoon) {
          if (hasRemainingSessions) {
            alerts.push({
              type: "expiry_sessions",
              title: "Sessions Expiring Soon",
              message: `You have ${activePlan.totalSessions - activePlan.sessionsCompleted} sessions left and your plan ends in ${daysLeft} days. Don't worry, you will get a grace period until ${expiryDate.toLocaleDateString("en-IN", { day: "numeric", month: "short" })} to complete them.`,
            });
          } else {
            alerts.push({
              type: "expiry",
              title: "Plan Expiring Soon",
              message: `Your active plan is expiring in ${daysLeft === 0 ? "today" : `${daysLeft} days`} (${endDate.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}). Please contact the office to renew.`,
            });
          }
        }

        if (alerts.length === 0) return null;

        return (
          <div className="bg-amber-500/5 border border-amber-500/20 rounded-[2rem] p-5 shadow-xs space-y-4 animate-fade-in">
            <div className="flex items-center gap-2">
              <Info className="w-5 h-5 text-brand-orange-500 shrink-0" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-brand-orange-600 dark:text-brand-orange-400">
                Important Reminders
              </h4>
            </div>
            <div className="space-y-3">
              {alerts.map((alert, idx) => (
                <div key={idx} className="flex gap-2.5 items-start text-xs leading-relaxed text-zinc-700 dark:text-zinc-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-orange-500 mt-1.5 shrink-0" />
                  <div>
                    <strong className="font-semibold text-zinc-900 dark:text-white mr-1">
                      {alert.title}:
                    </strong>
                    {alert.message}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* Sessions Card */}
      {activePlan && student.status !== "INACTIVE" && student.status !== "EXPIRED" && (
        <section className="relative overflow-hidden w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/60 rounded-[2rem] p-6 sm:p-8 shadow-sm space-y-6">
          <div className="absolute -top-24 -left-24 w-80 h-80 bg-brand-orange-50/5 rounded-full blur-3xl pointer-events-none" />

          {/* Sessions Completed */}
          <div className="flex flex-col gap-3 relative z-10">
            <div>
              <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-555 uppercase tracking-widest leading-none block mb-2">
                Sessions Completed
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-4xl font-extrabold text-[#f16d28] leading-none">
                  {activePlan.sessionsCompleted}
                </span>
                <span className="text-zinc-300 dark:text-zinc-700 font-bold text-2xl leading-none mx-1.5">
                  /
                </span>
                <span className="text-2xl font-bold text-zinc-800 dark:text-zinc-200 leading-none">
                  {activePlan.totalSessions}
                </span>
              </div>
            </div>

            {/* Progress Bar inside Sessions Completed */}
            <div className="w-full h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-brand-orange-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, (activePlan.sessionsCompleted / activePlan.totalSessions) * 100)}%` }}
              />
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-x-8 gap-y-5 pt-5 border-t border-zinc-100 dark:border-zinc-800/60 relative z-10">
            <div className="flex flex-col gap-1">
              <span className="text-[9px] font-bold text-zinc-400 dark:text-zinc-555 uppercase tracking-widest leading-none">
                Batch Name
              </span>
              <span className="text-xs sm:text-sm font-semibold text-zinc-800 dark:text-zinc-200 leading-tight">
                {activePlan.batch?.name || "Not assigned"}
              </span>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-[9px] font-bold text-zinc-400 dark:text-zinc-555 uppercase tracking-widest leading-none">
                Class Timing
              </span>
              <span className="text-xs sm:text-sm font-semibold text-zinc-800 dark:text-zinc-200 leading-tight">
                {activePlan.batch?.timing || "Contact office"}
              </span>
            </div>

            <div className="flex flex-col gap-1 col-span-2">
              <span className="text-[9px] font-bold text-zinc-400 dark:text-zinc-550 uppercase tracking-widest leading-none">
                Scheduled Days
              </span>
              <span className="text-xs sm:text-sm font-semibold text-zinc-800 dark:text-zinc-200 leading-tight">
                {Array.isArray(activePlan.selectedDays) && activePlan.selectedDays.length > 0
                  ? activePlan.selectedDays.join(" • ")
                  : "No schedule set"}
              </span>
            </div>
          </div>

          {/* Coach Details (only if personal coach is set) */}
          {activePlan.coach && (
            <div className="flex items-center gap-3 pt-5 border-t border-zinc-100 dark:border-zinc-800/60 relative z-10">
              {activePlan.coach.avatarUrl ? (
                <img
                  src={activePlan.coach.avatarUrl}
                  alt={activePlan.coach.name}
                  className="w-10 h-10 rounded-full object-cover border border-zinc-200 dark:border-zinc-800 shadow-sm"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-[#f16d28]/10 text-[#f16d28] flex items-center justify-center font-bold text-xs shrink-0">
                  {activePlan.coach.name.charAt(0)}
                </div>
              )}
              <div>
                <p className="text-[9px] font-bold text-zinc-400 dark:text-zinc-550 uppercase tracking-widest leading-none mb-1">
                  Personal Coach
                </p>
                <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                  {activePlan.coach.name}
                </p>
              </div>
            </div>
          )}
        </section>
      )}

      {/* Plan History */}
      {student.plans && student.plans.length > 0 && (
        <div className="pt-1 space-y-2">
          <h3 className="text-[10px] font-extrabold text-zinc-600 dark:text-zinc-400 uppercase tracking-widest pl-3">
            {student.plans.length === 1 ? "Current Plan" : "Plan History"}
          </h3>
          <div className="flex gap-4 overflow-x-auto pb-3 snap-x scrollbar-none">
            {student.plans.map((plan: any) => {
              const duration = `${new Date(plan.startDate).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })} - ${new Date(plan.endDate).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}`;
              const paidAmount = plan.payments?.reduce((sum: number, p: any) => sum + p.amount, 0) ?? 0;
              const outstanding = Math.max(0, plan.fee - paidAmount);
              const widthClass = student.plans.length === 1
                ? "w-full max-w-2xl"
                : "w-[82%] sm:w-[320px] shrink-0";

              return (
                <div
                  key={plan.id}
                  className={`snap-start ${widthClass} bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/60 rounded-[2rem] p-6 relative overflow-hidden shadow-sm`}
                >
                  {plan.isActive && (
                    <span className="absolute top-4 right-5 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[8px] font-bold text-emerald-500 uppercase tracking-wider">
                      Active Plan
                    </span>
                  )}
                  <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-255 uppercase tracking-wider mb-3">
                    {plan.planType === "ONE_TO_ONE" ? "Personal Coach Plan" : "Group Class Plan"}
                  </h4>
                  <div className="space-y-2.5 text-xs pt-1">
                    <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800/40 pb-2">
                      <span className="text-zinc-450 dark:text-zinc-400 font-medium">Duration</span>
                      <span className="font-semibold text-zinc-700 dark:text-zinc-300 text-right text-[10px]">
                        {duration}
                      </span>
                    </div>
                    <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800/40 pb-2">
                      <span className="text-zinc-450 dark:text-zinc-400 font-medium">Plan Fee</span>
                      <span className="font-extrabold text-zinc-800 dark:text-zinc-200">
                        {INR(plan.fee)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800/40 pb-2">
                      <span className="text-zinc-450 dark:text-zinc-400 font-medium">Amount Paid</span>
                      <span className="font-extrabold text-emerald-500">
                        {INR(paidAmount)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-450 dark:text-zinc-400 font-medium">Due Remaining</span>
                      <span className={`font-extrabold ${outstanding > 0 ? "text-rose-500" : "text-emerald-500"}`}>
                        {INR(outstanding)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Payment History */}
      <div className="space-y-2">
        <h3 className="text-[10px] font-extrabold text-zinc-650 dark:text-zinc-400 uppercase tracking-widest pl-3">
          Payment History
        </h3>

        {student.payments && student.payments.length > 0 ? (
          <div className="space-y-3">
            {student.payments.map((p: any) => (
              <div
                key={p.id}
                className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/60 rounded-[2rem] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm"
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-zinc-800 dark:text-white">
                      Invoice #{String(p.invoiceNumber).padStart(3, "0")}
                    </span>
                    <span className="text-[9px] text-zinc-450 dark:text-zinc-500 font-semibold uppercase tracking-wider">
                      via {p.method === "BANK_TRANSFER" ? "Bank Transfer" : p.method.toLowerCase()}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-500">
                    <span>
                      {new Date(p.paidAt).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                    <span className="hidden sm:inline text-zinc-300">•</span>
                    <span className="truncate">
                      {p.studentPlan.planType === "ONE_TO_ONE" ? "Personal" : "Group"}
                      {p.studentPlan.planMonths ? ` (${p.studentPlan.planMonths} Months)` : ""}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 border-zinc-100 dark:border-zinc-800/60 pt-3 sm:pt-0 shrink-0">
                  <span className="font-extrabold text-zinc-800 dark:text-white text-sm">
                    {INR(p.amount)}
                  </span>
                  <button
                    onClick={() => handlePrint(p.id)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-brand-orange-500/50 hover:text-brand-orange-500 dark:hover:text-brand-orange-400 text-zinc-700 dark:text-zinc-300 transition-colors shadow-3xs cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download Receipt
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/60 rounded-[2rem] p-6 text-center text-xs text-zinc-450 dark:text-zinc-550 shadow-sm">
            No payment history found.
          </div>
        )}

        {/* Admission / Registration Receipt if paid */}
        {student.registrationFee && student.registrationFee > 0 && (
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/60 rounded-[2rem] p-5 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-[9px] font-bold text-brand-orange-500 uppercase tracking-widest leading-none block">
                  Admission Registration
                </span>
                <span className="text-xs font-bold text-zinc-850 dark:text-zinc-200">
                  Paid registration fee for admission
                </span>
              </div>
              <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 border-zinc-150 dark:border-zinc-800/60 pt-3 sm:pt-0 shrink-0">
                <span className="font-extrabold text-zinc-800 dark:text-white text-sm">
                  {INR(student.registrationFee)}
                </span>
                <a
                  href="/parents/admission-receipt"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-brand-orange-500/50 hover:text-brand-orange-500 dark:hover:text-brand-orange-400 text-zinc-700 dark:text-zinc-300 transition-colors shadow-3xs cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download Receipt
                </a>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Printing / Receipt Modals */}
      {printData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-white rounded-3xl p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-4 print:hidden">
              <h3 className="font-bold text-lg text-zinc-900">Receipt Preview</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => window.print()}
                  className="bg-brand-orange-500 hover:bg-brand-orange-600 text-white font-semibold text-xs px-4 py-2 rounded-xl shadow-xs cursor-pointer"
                >
                  Print
                </button>
                <button
                  onClick={() => {
                    setPrintData(null);
                    // restore title
                    const firstName = student.name.trim().split(/\s+/)[0]?.toLowerCase() || "student";
                    document.title = `TAG${student.studentNumber}-${firstName}-parents`;
                  }}
                  className="bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-semibold text-xs px-4 py-2 rounded-xl cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
            <FeeReceipt data={printData} academyProfile={academyProfile} />
          </div>
        </div>
      )}
    </div>
  );
}
