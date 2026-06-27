/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import {
  UserPlus,
  UserCheck,
  IndianRupee,
  ChevronRight,
  X,
  Check,
  Bell,
  Trash2,
  ExternalLink,
} from "lucide-react";
import { getPortalBaseUrl } from "@/lib/utils/portal-url";
import { resolveTemplate, DEFAULT_TEMPLATES } from "@/lib/utils/whatsapp-templates";
import WhatsAppModal from "@/app/admin/_components/common/WhatsAppModal";
import { useMediaQuery } from "@/app/_components/useMediaQuery";
import {
  PieChart,
  Pie,
  Cell,
} from "recharts";
import type { DashboardData } from "@/lib/services/dashboard";
import { FeeReceipt } from "@/app/admin/_components/students/studentProfile/FeeReceipt";
import type { AcademyProfile } from "@prisma/client";
import {
  getPaymentByIdAction,
} from "@/lib/actions/payments";
import StudentAvatar from "@/app/admin/_components/students/StudentAvatar";
import { clearStudentReminderAction } from "@/lib/actions/students";
import AttendanceModal from "./AttendanceModal";
import CollectFeeModal from "./CollectFeeModal";
import StudentLists from "./StudentLists";
import AddEnquiryModal from "@/app/admin/_components/enquiries/AddEnquiryModal";
import AdmissionsChart from "./AdmissionsChart";
import RenewalsChart from "./RenewalsChart";
import RevenueChart from "./RevenueChart";
import AttendanceChart from "./AttendanceChart";

const CHART_H = 260;
const CHART_H_SM = 224;

const formatShortRevenue = (value: number): string => {
  if (value >= 100_000) {
    const lVal = value / 100_000;
    return lVal % 1 === 0 ? `${lVal}L` : `${Number(lVal.toFixed(2))}L`;
  }
  if (value >= 1000) {
    const kVal = value / 1000;
    return kVal % 1 === 0 ? `${kVal}k` : `${Number(kVal.toFixed(2))}k`;
  }
  return value.toString();
};

const formatRelativeTime = (date: Date | string): string => {
  const now = new Date();
  const diffMs = now.getTime() - new Date(date).getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return new Date(date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
};

const chartTooltipStyle = {
  backgroundColor: "var(--chart-tooltip-bg)",
  border: "1px solid var(--chart-tooltip-border)",
  color: "var(--chart-tooltip-text)",
  borderRadius: "8px",
  fontSize: "12px",
  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.08)",
};

interface DashboardOverviewProps {
  firstName: string;
  dashboardData: DashboardData;
  academyProfile: AcademyProfile;
  canManage?: boolean;
  reminders?: any[];
}

export default function DashboardOverview({
  firstName,
  dashboardData,
  academyProfile,
  canManage = false,
  reminders = [],
}: DashboardOverviewProps) {
  const isMobile = useMediaQuery("(max-width: 639px)");
  const chartH = isMobile ? CHART_H_SM : CHART_H;

  const [reminderList, setReminderList] = useState<any[]>(reminders);
  const [remindersOpen, setRemindersOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setReminderList(reminders);
  }, [reminders]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setRemindersOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const todayRemindersCount = useMemo(() => {
    const todayStr = new Date().toLocaleDateString("en-CA");
    return reminderList.filter((r) => {
      if (!r.reminderDate) return false;
      return new Date(r.reminderDate).toLocaleDateString("en-CA") === todayStr;
    }).length;
  }, [reminderList]);

  const handleDeleteReminder = async (studentId: string) => {
    setReminderList((prev) => prev.filter((r) => r.id !== studentId));
    const res = await clearStudentReminderAction(studentId);
    if (!res.success) {
      alert(res.message || "Failed to clear reminder.");
    }
  };

  const handleMessageReminder = (student: any) => {
    const rawNumber = student.contactNumber || "";
    let cleanNumber = rawNumber.replace(/\D/g, "");
    if (cleanNumber.length === 10) {
      cleanNumber = "91" + cleanNumber;
    }
    const message = `Hello ${student.name}, this is a reminder regarding your gymnastics class.`;
    const url = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
  };

  const currentMonthLabel = useMemo(() => {
    return new Date().toLocaleString("en-US", { month: "short" }).toUpperCase();
  }, []);

  const currentYear = useMemo(() => {
    return new Date().getFullYear();
  }, []);

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === "class") {
          setIsDark(document.documentElement.classList.contains("dark"));
        }
      });
    });
    observer.observe(document.documentElement, { attributes: true });
    return () => observer.disconnect();
  }, []);

  const chartMargin = isMobile
    ? { top: 8, right: 4, left: -16, bottom: 0 }
    : { top: 8, right: 8, left: -8, bottom: 0 };

  // Modals visibility state
  const [qrOpen, setQrOpen] = useState(false);
  const [feeOpen, setFeeOpen] = useState(false);
  const [addEnquiryOpen, setAddEnquiryOpen] = useState(false);

  // Print Notification states
  const [attendanceNotification, setAttendanceNotification] = useState<{
    name: string;
    studentNumber: number;
    activePlan: string;
    sessionsCompleted: number;
    totalSessions: number;
  } | null>(null);

  // Printing state
  const [printData, setPrintData] = useState<Awaited<ReturnType<typeof getPaymentByIdAction>> | null>(null);

  const handlePrint = async (paymentId: string) => {
    try {
      const data = await getPaymentByIdAction(paymentId);
      if (data) {
        const student = data.student;
        const firstNameClean =
          student.name.trim().split(/\s+/)[0]?.toLowerCase() || "student";
        const newTitle = `TAG${student.studentNumber}-${firstNameClean}-fee-reciept`;
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

  useEffect(() => {
    if (printData) {
      const timer = setTimeout(() => {
        window.print();
        const standardTitle = "TAG CRM · Academy of Gymnastics";
        document.title = standardTitle;
        const titleEl = document.querySelector("title");
        if (titleEl) {
          titleEl.textContent = standardTitle;
        }
        setPrintData(null);
      }, 600);
      return () => {
        clearTimeout(timer);
        const standardTitle = "TAG CRM · Academy of Gymnastics";
        document.title = standardTitle;
        const titleEl = document.querySelector("title");
        if (titleEl) {
          titleEl.textContent = standardTitle;
        }
      };
    }
  }, [printData]);

  // WhatsApp Message Modal State
  const [whatsappModalOpen, setWhatsappModalOpen] = useState(false);
  const [selectedStudentForWhatsapp, setSelectedStudentForWhatsapp] = useState<any | null>(null);
  const [whatsappMessageText, setWhatsappMessageText] = useState("");
  const [whatsappModalTitle, setWhatsappModalTitle] = useState("Send WhatsApp Message");
  const [whatsappVariables, setWhatsappVariables] = useState<{ label: string; value: string }[]>([]);

  const resolveLocalTemplate = (template: string, student: any) => {
    const portalBaseUrl = getPortalBaseUrl((academyProfile as any).parentPortalUrl, academyProfile.website);
    const remainingSessions = Math.max(0, student.totalSessions - student.sessionsCompleted);

    // Calculate days left and deadline formatting for grace templates
    const deadlineDate = new Date(student.statusEntryDate);
    const graceDeadlineStr = deadlineDate.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
    const diffMs = deadlineDate.getTime() - Date.now();
    const daysLeftStr = String(Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24))));

    const vars = {
      studentName: student.name,
      parentName: student.parentName || "",
      planType: student.planType || "gymnastics plan",
      portalLink: portalBaseUrl,
      graceDeadline: graceDeadlineStr,
      daysLeft: daysLeftStr,
      remainingSessions: String(remainingSessions),
    };

    let text = resolveTemplate(template, vars);

    text = text
      .replace(/\[Parent Name\]/gi, student.parentName || "")
      .replace(/\[Student Name\]/gi, student.name || "")
      .replace(/\[Remaining Sessions\]/gi, String(remainingSessions))
      .replace(/\[Portal URL\]/gi, portalBaseUrl || "")
      .replace(/\[Portal Link\]/gi, portalBaseUrl || "")
      .replace(/\[Plan Type\]/gi, student.planType || "")
      .replace(/\[Program\]/gi, student.planType || "")
      .replace(/\[Grace Deadline\]/gi, graceDeadlineStr)
      .replace(/\[Days Left\]/gi, daysLeftStr);

    return text;
  };

  const openWhatsappModal = (student: any, e: React.MouseEvent, isGrace: boolean = false) => {
    e.stopPropagation();
    e.preventDefault();
    setSelectedStudentForWhatsapp(student);
    setWhatsappModalTitle(isGrace ? "Grace Period Message" : "Inactive Student Message");

    const templateRaw = isGrace
      ? (academyProfile.templateGrace || DEFAULT_TEMPLATES.templateGrace)
      : (student.sessionsCompleted >= student.totalSessions
          ? ((academyProfile as any).templateInactiveSessionComplete || DEFAULT_TEMPLATES.templateInactiveSessionComplete)
          : (academyProfile.templateInactive || DEFAULT_TEMPLATES.templateInactive));

    const resolved = resolveLocalTemplate(templateRaw, student);
    setWhatsappMessageText(resolved);

    const vars = [
      { label: `Student Name (${student.name})`, value: student.name },
      { label: `Parent Name (${student.parentName || "N/A"})`, value: student.parentName || "" },
      { label: `TAG ID (TAG${String(student.studentNumber).padStart(3, "0")})`, value: `TAG${String(student.studentNumber).padStart(3, "0")}` }
    ];
    setWhatsappVariables(vars);
    setWhatsappModalOpen(true);
  };

  const handleOpenReminderWhatsapp = (rem: any) => {
    setSelectedStudentForWhatsapp(rem);
    setWhatsappModalTitle("Reminder Message");

    const message = `Hello ${rem.parentName || rem.name}, this is a reminder regarding gymnastics class. Notes: ${rem.notes || ""}`;
    setWhatsappMessageText(message);

    const vars = [
      { label: `Student Name (${rem.name})`, value: rem.name },
      { label: `Parent Name (${rem.parentName || "N/A"})`, value: rem.parentName || "" },
      { label: `TAG ID (TAG${String(rem.studentNumber).padStart(3, "0")})`, value: `TAG${String(rem.studentNumber).padStart(3, "0")}` },
      ...(rem.notes ? [{ label: "Notes", value: rem.notes }] : [])
    ];
    setWhatsappVariables(vars);
    setWhatsappModalOpen(true);
  };

  const activeCount = dashboardData.kpis.activeStudents;
  const graceCount = dashboardData.kpis.gracePeriodStudents;
  const freezeCount = dashboardData.kpis.freezeStudents;
  const inactiveCount = dashboardData.kpis.inactiveStudents;
  const totalStudents = activeCount + graceCount + freezeCount + inactiveCount;
  
  const activePercent =
    totalStudents > 0 ? Math.round((activeCount / totalStudents) * 100) : 0;
  const gracePercent =
    totalStudents > 0 ? Math.round((graceCount / totalStudents) * 100) : 0;
  const freezePercent =
    totalStudents > 0 ? Math.round((freezeCount / totalStudents) * 100) : 0;
  const inactivePercent =
    totalStudents > 0 ? Math.round((inactiveCount / totalStudents) * 100) : 0;

  const activeColor = isDark ? "#ffffff" : "#202023";
  const graceColor = isDark ? "#a855f7" : "#9333ea";
  const freezeColor = isDark ? "#38bdf8" : "#0ea5e9";
  const inactiveColor = "#f16d28";

  const pieData = useMemo(() => {
    return [
      { name: "Active", value: activeCount, color: activeColor },
      { name: "Grace", value: graceCount, color: graceColor },
      { name: "Freeze", value: freezeCount, color: freezeColor },
      { name: "Inactive", value: inactiveCount, color: inactiveColor },
    ].filter((d) => d.value > 0);
  }, [activeCount, graceCount, freezeCount, inactiveCount, activeColor, graceColor, freezeColor, inactiveColor]);

  return (
    <div className="space-y-2.5 min-w-0 w-full pb-6">
      {/* Premium Dashboard Header */}
      <div className="relative z-40 flex flex-col gap-4 pt-1 pb-3">
        {/* Header Row 1 */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-5xl font-light tracking-tight text-zinc-955 dark:text-zinc-50">
              <span className="hidden sm:inline">Welcome back, </span>
              <span className="inline sm:hidden">Hi, </span>
              <span className="font-semibold text-brand-orange-500 dark:text-brand-orange-500">
                {firstName}
              </span>
            </h1>
          </div>

          {/* Reminders Indicator & Dropdown */}
          <div ref={popoverRef} className="relative">
            {todayRemindersCount > 0 ? (
              <button
                type="button"
                onClick={() => setRemindersOpen(!remindersOpen)}
                className="flex items-center gap-2 bg-brand-orange-500 hover:bg-brand-orange-600 text-white rounded-full px-4 py-2 text-xs font-semibold shadow-md transition-all cursor-pointer"
              >
                <Bell className="w-4 h-4 shrink-0" />
                <span>{todayRemindersCount} {todayRemindersCount === 1 ? "reminder" : "reminders"}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setRemindersOpen(!remindersOpen)}
                className="flex items-center justify-center bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 rounded-full w-10 h-10 transition-all cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800"
              >
                <Bell className="w-5 h-5 shrink-0" />
              </button>
            )}

            {/* Reminders Dropdown Popover */}
            {remindersOpen && (
               <div className="absolute right-0 mt-2 w-[340px] sm:w-[410px] max-w-[calc(100vw-32px)] rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl py-1 z-50 animate-menu-show overflow-hidden">

                <div className="max-h-72 overflow-y-auto divide-y divide-zinc-50 dark:divide-zinc-800/50">
                  {reminderList.length === 0 ? (
                    <div className="p-8 text-center text-xs text-zinc-400 dark:text-zinc-500 italic">
                      No scheduled reminders
                    </div>
                  ) : (
                    reminderList.map((rem: any) => {
                      const remDate = new Date(rem.reminderDate);
                      const todayStr = new Date().toLocaleDateString("en-CA");
                      const remDateStr = remDate.toLocaleDateString("en-CA");
                      const isToday = remDateStr === todayStr;
                      const isPast = remDateStr < todayStr;

                      const dateBadgeClass = isPast
                        ? "bg-rose-50 dark:bg-rose-955/20 text-rose-600 dark:text-rose-455 text-[9px] font-bold px-1.5 py-0.5 rounded-md inline-flex items-center gap-1 mt-1"
                        : isToday
                        ? "bg-brand-orange-50 dark:bg-brand-orange-955/20 text-brand-orange-600 dark:text-brand-orange-400 text-[9px] font-bold px-1.5 py-0.5 rounded-md inline-flex items-center gap-1 mt-1"
                        : "bg-zinc-100 dark:bg-zinc-800/50 text-zinc-550 dark:text-zinc-400 text-[9px] font-semibold px-1.5 py-0.5 rounded-md inline-flex items-center gap-1 mt-1";                      return (
                        <div key={rem.id} className="py-3 px-3 sm:px-4 flex items-start gap-3 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                          <Link href={`/admin/students/${rem.id}`} className="shrink-0">
                            <StudentAvatar student={rem} size={36} />
                          </Link>
                          <div className="flex-1 min-w-0">
                            {/* Header row containing Name & Roll (Left) and Date & Actions (Right) */}
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-baseline gap-1.5 min-w-0">
                                <Link href={`/admin/students/${rem.id}`} className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 hover:text-brand-orange-500 dark:hover:text-brand-orange-400 transition-colors truncate">
                                  {rem.name}
                                </Link>
                                <span className="text-[9px] text-zinc-400 dark:text-zinc-500 font-mono shrink-0">
                                  TAG{String(rem.studentNumber).padStart(3, "0")}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <span className={dateBadgeClass}>
                                  {isToday ? "Today" : remDate.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                                </span>
                                <div className="flex items-center gap-1">
                                  {/* Message Button */}
                                  <button
                                    type="button"
                                    onClick={() => handleOpenReminderWhatsapp(rem)}
                                    className="w-8 h-8 rounded-full flex items-center justify-center bg-zinc-50 hover:bg-emerald-50 text-zinc-500 hover:text-emerald-600 dark:bg-zinc-850 dark:hover:bg-emerald-950/20 dark:hover:text-emerald-450 transition-colors cursor-pointer"
                                    title="Send WhatsApp Message"
                                  >
                                    <svg
                                      className="w-4.5 h-4.5 fill-current text-emerald-600 dark:text-emerald-500"
                                      viewBox="0 0 24 24"
                                    >
                                      <path d="M12.016 2a10 10 0 0 0-8.77 14.77l-1.45 5.31 5.43-1.42A10 10 0 1 0 12.016 2zm0 18.18a8.18 8.18 0 0 1-4.23-1.16l-.3-.18-3.1.81.82-3.01-.19-.31a8.18 8.18 0 1 1 7 3.85zm4.49-5.96c-.25-.12-1.46-.72-1.69-.8-.22-.08-.39-.12-.55.12-.16.24-.62.8-.76.96-.14.16-.28.18-.53.06-.25-.12-1.07-.39-2.03-1.25-.75-.67-1.25-1.5-1.4-1.74-.15-.24-.01-.37.11-.49.11-.11.25-.28.37-.42.12-.14.16-.24.24-.4.08-.16.04-.31-.02-.44-.06-.13-.55-1.32-.75-1.81-.2-.48-.4-.41-.55-.42-.14-.01-.3-.01-.46-.01s-.42.06-.64.29c-.22.23-.85.83-.85 2.03s.87 2.35 1 2.51c.12.16 1.7 2.6 4.12 3.64.57.24 1.02.39 1.37.5.58.18 1.11.16 1.53.1.47-.07 1.45-.59 1.65-1.16.2-.57.2-1.06.14-1.16-.06-.1-.23-.16-.48-.28z" />
                                    </svg>
                                  </button>

                                  {/* Delete Button */}
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteReminder(rem.id)}
                                    className="w-8 h-8 rounded-full flex items-center justify-center bg-zinc-50 hover:bg-rose-50 text-zinc-500 hover:text-rose-600 dark:bg-zinc-850 dark:hover:bg-rose-955/20 dark:hover:text-rose-455 transition-colors cursor-pointer"
                                    title="Delete Reminder"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            </div>

                            {/* Notes below Name/Roll */}
                            {rem.notes && (
                              <p className="text-xs text-zinc-700 dark:text-zinc-300 mt-1.5 whitespace-pre-line border-l-2 border-brand-orange-500/30 pl-2 leading-relaxed font-medium">
                                {rem.notes}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Header Row 2: Pill Bar and Stats */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between pt-3 pb-2 sm:pt-6 sm:pb-3">
          {/* Left Part: Premium standalone pills side-by-side with extra gap, scaled proportionally */}
          <div className="flex xs-hide flex-col gap-2.5 w-full max-w-sm lg:max-w-[220px] xl:max-w-sm pt-2 shrink-0">
            {totalStudents === 0 ? (
              <div className="h-[30px] sm:h-10 w-full bg-zinc-200 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-505 flex items-center justify-center text-[10px] sm:text-xs font-semibold rounded-full">
                No active students
              </div>
            ) : (
              <div className="relative h-[30px] sm:h-10 w-full rounded-full flex bg-zinc-200/50 dark:bg-zinc-800/50 p-0.5 gap-0.5">
                {activeCount > 0 && (
                  <div
                    className="group relative h-full bg-zinc-800 dark:bg-white text-white dark:text-black flex items-center justify-center text-[10px] sm:text-xs font-semibold transition-all duration-300 first:rounded-l-full last:rounded-r-full cursor-help"
                    style={{ width: `${activePercent}%` }}
                  >
                    {activePercent >= 10 ? `${activePercent}%` : ""}
                    {/* Premium Custom Tooltip */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2.5 hidden group-hover:block bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-100 text-[11px] p-2.5 rounded-xl shadow-xl border border-zinc-200 dark:border-zinc-800 w-56 text-center z-50 pointer-events-none normal-case leading-normal font-normal">
                      <span className="font-bold block mb-1 text-brand-orange-500">
                        Active
                      </span>
                      Plan is within the validity duration and has remaining
                      sessions.
                      <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-white dark:border-t-zinc-900" />
                    </div>
                  </div>
                )}

                {graceCount > 0 && (
                  <div
                    className="group relative h-full bg-purple-600 dark:bg-purple-500 text-white flex items-center justify-center text-[10px] sm:text-xs font-bold transition-all duration-300 first:rounded-l-full last:rounded-r-full cursor-help"
                    style={{ width: `${gracePercent}%` }}
                  >
                    {gracePercent >= 10 ? `${gracePercent}%` : ""}
                    {/* Premium Custom Tooltip */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2.5 hidden group-hover:block bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-100 text-[11px] p-2.5 rounded-xl shadow-xl border border-zinc-200 dark:border-zinc-800 w-56 text-center z-50 pointer-events-none normal-case leading-normal font-normal">
                      <span className="font-bold block mb-1 text-purple-655 dark:text-purple-400">
                        Grace
                      </span>
                      Plan duration has ended, but student is provided extra
                      days to complete remaining sessions.
                      <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-white dark:border-t-zinc-900" />
                    </div>
                  </div>
                )}

                {freezeCount > 0 && (
                  <div
                    className="group relative h-full bg-sky-500 dark:bg-sky-400 text-white dark:text-zinc-950 flex items-center justify-center text-[10px] sm:text-xs font-semibold transition-all duration-300 first:rounded-l-full last:rounded-r-full cursor-help"
                    style={{ width: `${freezePercent}%` }}
                  >
                    {freezePercent >= 10 ? `${freezePercent}%` : ""}
                    {/* Premium Custom Tooltip */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2.5 hidden group-hover:block bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-100 text-[11px] p-2.5 rounded-xl shadow-xl border border-zinc-200 dark:border-zinc-800 w-56 text-center z-50 pointer-events-none normal-case leading-normal font-normal">
                      <span className="font-bold block mb-1 text-sky-500 dark:text-sky-455">
                        Freeze
                      </span>
                      Plan temporarily freezed by admin if student is on
                      vaccation.
                      <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-white dark:border-t-zinc-900" />
                    </div>
                  </div>
                )}

                {inactiveCount > 0 && (
                  <div
                    className="group relative h-full bg-brand-orange-500 text-white flex items-center justify-center text-[10px] sm:text-xs font-semibold transition-all duration-300 first:rounded-l-full last:rounded-r-full cursor-help"
                    style={{ width: `${inactivePercent}%` }}
                  >
                    {inactivePercent >= 10 ? `${inactivePercent}%` : ""}
                    {/* Premium Custom Tooltip */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2.5 hidden group-hover:block bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-100 text-[11px] p-2.5 rounded-xl shadow-xl border border-zinc-200 dark:border-zinc-800 w-56 text-center z-50 pointer-events-none normal-case leading-normal font-normal">
                      <span className="font-bold block mb-1 text-brand-orange-500">
                        Inactive
                      </span>
                      after active plan & grace period ends, user gets inactive
                      for 30d.
                      <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-white dark:border-t-zinc-900" />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Labels Row */}
            <div className="flex flex-wrap items-center justify-start gap-x-5 gap-y-1.5 px-1 text-[10px] font-bold text-zinc-400 dark:text-zinc-550 uppercase tracking-wider">
              <div className="group relative flex items-center gap-1.5 cursor-help">
                <span className="w-2 h-2 rounded-full bg-zinc-850 dark:bg-white" />
                <span>active ({activeCount})</span>
                {/* Premium Custom Tooltip */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2.5 hidden group-hover:block bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-100 text-[11px] p-2.5 rounded-xl shadow-xl border border-zinc-200 dark:border-zinc-800 w-56 text-center z-50 pointer-events-none normal-case leading-normal font-normal">
                  <span className="font-bold block mb-1 text-brand-orange-500">
                    Active
                  </span>
                  Plan is within the validity duration and has remaining
                  sessions.
                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-white dark:border-t-zinc-900" />
                </div>
              </div>
              <div className="group relative flex items-center gap-1.5 cursor-help">
                <span className="w-2 h-2 rounded-full bg-purple-600 dark:bg-purple-500" />
                <span>grace ({graceCount})</span>
                {/* Premium Custom Tooltip */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2.5 hidden group-hover:block bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-100 text-[11px] p-2.5 rounded-xl shadow-xl border border-zinc-200 dark:border-zinc-800 w-56 text-center z-50 pointer-events-none normal-case leading-normal font-normal">
                  <span className="font-bold block mb-1 text-purple-655 dark:text-purple-400">
                    Grace
                  </span>
                  Plan duration has ended, but student is provided extra days to
                  complete remaining sessions.
                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-white dark:border-t-zinc-900" />
                </div>
              </div>
              <div className="group relative flex items-center gap-1.5 cursor-help">
                <span className="w-2 h-2 rounded-full bg-sky-500 dark:bg-sky-400" />
                <span>freeze ({freezeCount})</span>
                {/* Premium Custom Tooltip */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2.5 hidden group-hover:block bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-100 text-[11px] p-2.5 rounded-xl shadow-xl border border-zinc-200 dark:border-zinc-800 w-56 text-center z-50 pointer-events-none normal-case leading-normal font-normal">
                  <span className="font-bold block mb-1 text-sky-500 dark:text-sky-455">
                    Freeze
                  </span>
                  Plan temporarily freezed by admin if student is on vaccation.
                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-white dark:border-t-zinc-900" />
                </div>
              </div>
              <div className="group relative flex items-center gap-1.5 cursor-help">
                <span className="w-2 h-2 rounded-full bg-brand-orange-500" />
                <span>inactive ({inactiveCount})</span>
                {/* Premium Custom Tooltip */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2.5 hidden group-hover:block bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-100 text-[11px] p-2.5 rounded-xl shadow-xl border border-zinc-200 dark:border-zinc-800 w-56 text-center z-50 pointer-events-none normal-case leading-normal font-normal">
                  <span className="font-bold block mb-1 text-brand-orange-500">
                    Inactive
                  </span>
                  after active plan & grace period ends, user gets inactive for
                  30d.
                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-white dark:border-t-zinc-900" />
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Pie Chart view (xs-only-flex) */}
          {totalStudents === 0 ? (
            <div className="hidden xs-only-flex h-[30px] sm:h-10 w-full bg-zinc-200 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-550 items-center justify-center text-[10px] sm:text-xs font-semibold rounded-full">
              No active students
            </div>
          ) : (
            <div className="hidden xs-only-flex items-center justify-center gap-8 py-2 w-full">
              {/* Pie Chart */}
              <div className="w-[100px] h-[100px] shrink-0 flex items-center justify-center">
                <PieChart width={100} height={100}>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={24}
                    outerRadius={46}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </div>

              {/* Labels list on the right (Single column) */}
              <div className="flex flex-col justify-center gap-2 text-[9px] font-bold uppercase tracking-wider text-zinc-450 dark:text-zinc-550">
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: activeColor }} />
                  <span>active ({activeCount})</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: graceColor }} />
                  <span>grace ({graceCount})</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: freezeColor }} />
                  <span>freeze ({freezeCount})</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: inactiveColor }} />
                  <span>inactive ({inactiveCount})</span>
                </div>
              </div>
            </div>
          )}

          {/* Right Part: Three Primary Stats */}
          <div className="grid grid-cols-3 gap-1 sm:flex sm:flex-wrap sm:items-center sm:gap-x-6 lg:gap-x-4 xl:gap-x-6 sm:justify-end shrink-0 w-full sm:w-auto">
            {/* Stat 1: Admissions This Month */}
            <div className="flex flex-col items-center text-center sm:items-start sm:text-left">
              <div className="flex items-center gap-1.5 sm:justify-start">
                <span className="hidden sm:inline-flex items-center justify-center p-1 rounded-md bg-zinc-100 dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 border border-zinc-200/40 dark:border-zinc-800/40">
                  <UserPlus className="h-4 w-4" />
                </span>
                <span className="text-3xl sm:text-4xl font-extralight text-zinc-955 dark:text-zinc-50 tracking-tight">
                  {dashboardData.kpis.admissionsThisMonth}
                </span>
              </div>
              <p className="text-[9px] sm:text-[10px] font-bold text-zinc-400 dark:text-zinc-550 uppercase tracking-wider text-center sm:text-left sm:pl-7 mt-0.5">
                Joined This Mo.
              </p>
            </div>

            {/* Stat 2: Today's Attendance (Counts, no percentage) */}
            <div className="flex flex-col items-center text-center sm:items-start sm:text-left">
              <div className="flex items-center gap-1.5 sm:justify-start">
                <span className="hidden sm:inline-flex items-center justify-center p-1 rounded-md bg-zinc-100 dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 border border-zinc-200/40 dark:border-zinc-800/40">
                  <UserCheck className="h-4 w-4" />
                </span>
                <span className="text-3xl sm:text-4xl font-extralight text-zinc-955 dark:text-zinc-50 tracking-tight">
                  {dashboardData.kpis.todayAttendanceCount}
                </span>
              </div>
              <p className="text-[9px] sm:text-[10px] font-bold text-zinc-400 dark:text-zinc-550 uppercase tracking-wider text-center sm:text-left sm:pl-7 mt-0.5">
                Attended Today
              </p>
            </div>

            {/* Stat 3: Monthly Revenue */}
            <div className="flex flex-col items-center text-center sm:items-start sm:text-left">
              <div className="flex items-center gap-1.5 sm:justify-start">
                <span className="hidden sm:inline-flex items-center justify-center p-1 rounded-md bg-zinc-100 dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 border border-zinc-200/40 dark:border-zinc-800/40">
                  <IndianRupee className="h-4 w-4" />
                </span>
                <span className="text-3xl sm:text-4xl font-extralight text-zinc-955 dark:text-zinc-50 tracking-tight">
                  {formatShortRevenue(dashboardData.kpis.monthlyRevenue)}
                </span>
              </div>
              <p className="text-[9px] sm:text-[10px] font-bold text-zinc-400 dark:text-zinc-550 uppercase tracking-wider text-center sm:text-left sm:pl-7 mt-0.5">
                Revenue This Mo.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Premium Quick Actions Row - Shades representing Terracotta, Emerald Green, Charcoal grey, and Sky Blue */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
        {/* Action 1: Take Attendance (Terracotta / Warm Coral-Orange) */}
        <button
          onClick={() => {
            setQrOpen(true);
          }}
          className="group flex flex-col xl:flex-row items-center gap-2.5 xl:gap-4.5 py-3 px-3 xl:py-4 xl:px-4.5 rounded-3xl border-0 bg-orange-200/90 dark:bg-orange-950/60 hover:bg-orange-300/80 dark:hover:bg-orange-900/60 active:scale-[0.98] transition-all duration-200 cursor-pointer text-center xl:text-left w-full"
        >
          <img
            src="/icons/attendance.webp"
            alt="Attendance"
            className="h-16 w-16 xl:h-18 xl:w-18 object-cover rounded-xl shrink-0 shadow-3xs"
          />
          <div className="flex flex-col justify-center min-w-0">
            <span className="font-bold text-xs xl:text-[14px] text-orange-955 dark:text-orange-100 leading-tight">
              Take Attendance
            </span>
          </div>
          <ChevronRight
            className="hidden xl:block h-5 w-5 ml-auto text-orange-955 dark:text-orange-200 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all duration-200 shrink-0"
            strokeWidth={2.5}
          />
        </button>

        {/* Action 2: New Enquiry (Sky Blue) */}
        {canManage ? (
          <button
            onClick={() => setAddEnquiryOpen(true)}
            className="group flex flex-col xl:flex-row items-center gap-2.5 xl:gap-4.5 py-3 px-3 xl:py-4 xl:px-4.5 rounded-3xl border-0 bg-sky-200/90 dark:bg-sky-950/60 hover:bg-sky-300/80 dark:hover:bg-sky-900/60 active:scale-[0.98] transition-all duration-200 cursor-pointer text-center xl:text-left w-full"
          >
            <img
              src="/icons/enquiry.webp"
              alt="New Enquiry"
              className="h-16 w-16 xl:h-18 xl:w-18 object-cover rounded-xl shrink-0 shadow-3xs"
            />
            <div className="flex flex-col justify-center min-w-0">
              <span className="font-bold text-xs xl:text-[14px] text-sky-955 dark:text-sky-100 leading-tight">
                New Enquiry
              </span>
            </div>
            <ChevronRight
              className="hidden xl:block h-5 w-5 ml-auto text-sky-955 dark:text-sky-200 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all duration-200 shrink-0"
              strokeWidth={2.5}
            />
          </button>
        ) : (
          <button
            disabled
            title="Only administrators and managers can add enquiries"
            className="flex flex-col xl:flex-row items-center gap-2.5 xl:gap-4.5 py-3 px-3 xl:py-4 xl:px-4.5 rounded-3xl border-0 bg-zinc-100 dark:bg-zinc-900/50 text-zinc-400 dark:text-zinc-650 opacity-40 cursor-not-allowed text-center xl:text-left w-full"
          >
            <img
              src="/icons/enquiry.webp"
              alt="New Enquiry"
              className="h-16 w-16 xl:h-18 xl:w-18 object-cover rounded-xl shrink-0 shadow-3xs grayscale"
            />
            <div className="flex flex-col justify-center min-w-0">
              <span className="font-bold text-xs xl:text-[14px] leading-tight">
                New Enquiry
              </span>
            </div>
            <ChevronRight
              className="hidden xl:block h-5 w-5 ml-auto opacity-20 shrink-0"
              strokeWidth={2.5}
            />
          </button>
        )}

        {/* Action 3: New Admission (Emerald Green) */}
        <Link
          href="/admin/students/new"
          className="group flex flex-col xl:flex-row items-center gap-2.5 xl:gap-4.5 py-3 px-3 xl:py-4 xl:px-4.5 rounded-3xl border-0 bg-emerald-200/90 dark:bg-emerald-950/60 hover:bg-emerald-300/80 dark:hover:bg-emerald-900/60 active:scale-[0.98] transition-all duration-200 cursor-pointer text-center xl:text-left w-full"
        >
          <img
            src="/icons/newAdmission.webp"
            alt="New Admission"
            className="h-16 w-16 xl:h-18 xl:w-18 object-cover rounded-xl shrink-0 shadow-3xs"
          />
          <div className="flex flex-col justify-center min-w-0">
            <span className="font-bold text-xs xl:text-[14px] text-emerald-955 dark:text-emerald-100 leading-tight">
              New Admission
            </span>
          </div>
          <ChevronRight
            className="hidden xl:block h-5 w-5 ml-auto text-emerald-955 dark:text-emerald-200 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all duration-200 shrink-0"
            strokeWidth={2.5}
          />
        </Link>

        {/* Action 4: Collect Fee (Charcoal / Zinc grey) */}
        <button
          onClick={() => {
            setFeeOpen(true);
          }}
          className="group flex flex-col xl:flex-row items-center gap-2.5 xl:gap-4.5 py-3 px-3 xl:py-4 xl:px-4.5 rounded-3xl border-0 bg-zinc-300/95 dark:bg-zinc-800/80 hover:bg-zinc-400/85 dark:hover:bg-zinc-700/80 active:scale-[0.98] transition-all duration-200 cursor-pointer text-center xl:text-left w-full"
        >
          <img
            src="/icons/fee.webp"
            alt="Collect Fee"
            className="h-16 w-16 xl:h-18 xl:w-18 object-cover rounded-xl shrink-0 shadow-3xs"
          />
          <div className="flex flex-col justify-center min-w-0">
            <span className="font-bold text-xs xl:text-[14px] text-zinc-955 dark:text-zinc-100 leading-tight">
              Collect Fee
            </span>
          </div>
          <ChevronRight
            className="hidden xl:block h-5 w-5 ml-auto text-zinc-955 dark:text-zinc-200 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all duration-200 shrink-0"
            strokeWidth={2.5}
          />
        </button>
      </div>

      {/* Grace Period & Inactive Period Student Lists */}
      <StudentLists
        graceStudents={dashboardData.graceStudents || []}
        inactiveStudents={dashboardData.inactiveStudents || []}
        openWhatsappModal={openWhatsappModal}
      />

      {/* Modern Two-Column Charts Grid */}
      <div className="grid gap-2.5 lg:grid-cols-2 min-w-0">
        <AdmissionsChart
          dashboardData={dashboardData}
          chartH={chartH}
          chartMargin={chartMargin}
          chartTooltipStyle={chartTooltipStyle}
          currentMonthLabel={currentMonthLabel}
          currentYear={currentYear}
          isMobile={isMobile}
        />

        <RenewalsChart
          dashboardData={dashboardData}
          chartH={chartH}
          chartMargin={chartMargin}
          chartTooltipStyle={chartTooltipStyle}
          currentMonthLabel={currentMonthLabel}
          currentYear={currentYear}
          isMobile={isMobile}
        />

        <RevenueChart
          dashboardData={dashboardData}
          chartH={chartH}
          chartMargin={chartMargin}
          chartTooltipStyle={chartTooltipStyle}
          isMobile={isMobile}
          formatShortRevenue={formatShortRevenue}
        />

        <AttendanceChart
          dashboardData={dashboardData}
          chartH={chartH}
          chartMargin={chartMargin}
          chartTooltipStyle={chartTooltipStyle}
          currentMonthLabel={currentMonthLabel}
          currentYear={currentYear}
          isMobile={isMobile}
        />
      </div>

      {/* Recent Activity Section */}
      <div className="rounded-3xl border-0 bg-white dark:bg-zinc-900 p-5 shadow-xs min-w-0 transition-colors">
        <h3 className="text-sm font-bold text-zinc-955 dark:text-zinc-100 uppercase tracking-wider">
          Recent activity
        </h3>
        <p className="mt-0.5 text-xs text-zinc-400 dark:text-zinc-500">
          Latest updates across the academy
        </p>
        <ul className="mt-4 divide-y divide-zinc-100 dark:divide-zinc-800">
          {dashboardData.recentActivity.map((item) => (
            <li
              key={item.id}
              className="flex flex-col gap-0.5 py-3.5 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between hover:bg-zinc-50/30 dark:hover:bg-zinc-800/10 px-2 rounded-lg transition-colors"
            >
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                {item.text}
              </span>
              <span className="text-xs text-zinc-400 dark:text-zinc-505 font-semibold shrink-0 sm:pl-4">
                {mounted ? formatRelativeTime(item.timestamp) : "—"}
              </span>
            </li>
          ))}
          {dashboardData.recentActivity.length === 0 && (
            <li className="py-6 text-center text-sm text-zinc-400 dark:text-zinc-500">
              No recent updates
            </li>
          )}
        </ul>
      </div>

      {/* Attendance Scanner Modal */}
      {qrOpen && (
        <AttendanceModal
          isOpen={qrOpen}
          onClose={() => setQrOpen(false)}
          onAttendanceRecorded={(student) => {
            setAttendanceNotification(student);
            // Hide notification after 2.5s
            setTimeout(() => setAttendanceNotification(null), 2500);
          }}
        />
      )}

      {/* Collect Student Fee Modal */}
      {feeOpen && (
        <CollectFeeModal
          isOpen={feeOpen}
          onClose={() => setFeeOpen(false)}
          handlePrint={handlePrint}
        />
      )}

      {/* Add Enquiry Popup Modal */}
      {addEnquiryOpen && (
        <AddEnquiryModal
          isOpen={addEnquiryOpen}
          onClose={() => setAddEnquiryOpen(false)}
        />
      )}

      {/* WhatsApp Message Preview Modal */}
      <WhatsAppModal
        isOpen={whatsappModalOpen}
        onClose={() => {
          setWhatsappModalOpen(false);
          setSelectedStudentForWhatsapp(null);
          setWhatsappVariables([]);
        }}
        contactNumber={selectedStudentForWhatsapp?.contactNumber || ""}
        defaultMessageText={whatsappMessageText}
        title={whatsappModalTitle}
        variables={whatsappVariables}
      />

      {/* Bottom-Right Toast Notification */}
      {attendanceNotification && (
        <div
          className="fixed bottom-6 right-6 z-[200] max-w-[280px] w-full bg-emerald-50/95 dark:bg-emerald-950/90 backdrop-blur-md border border-emerald-200/50 dark:border-emerald-800/30 p-3.5 rounded-2xl shadow-xl flex items-center gap-3"
          style={{
            animation:
              "slide-in-right 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards",
          }}
        >
          <style
            dangerouslySetInnerHTML={{
              __html: `
            @keyframes slide-in-right {
              from { transform: translateX(100%); opacity: 0; }
              to { transform: translateX(0); opacity: 1; }
            }
          `,
            }}
          />
          <div className="h-8 w-8 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-sm">
            <Check className="h-4.5 w-4.5" strokeWidth={3.5} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              Attendance Recorded!
            </p>
            <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-550 mt-1 truncate">
              {attendanceNotification.name} (TAG
              {String(attendanceNotification.studentNumber).padStart(3, "0")})
            </h4>
            <p className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
              Session count:{" "}
              {Math.max(
                0,
                attendanceNotification.totalSessions -
                  attendanceNotification.sessionsCompleted,
              )}
            </p>
          </div>
          <button
            onClick={() => setAttendanceNotification(null)}
            className="text-zinc-400 hover:text-zinc-655 dark:hover:text-zinc-200 cursor-pointer self-start -mt-1 -mr-1"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Print styles and hidden receipt container */}
      {printData && (
        <>
          <style
            dangerouslySetInnerHTML={{
              __html: `
            @page {
              size: A4;
              margin: 0 !important;
              }
            @media print {
              html, body {
                margin: 0 !important;
                padding: 0 !important;
                width: 210mm !important;
                height: 297mm !important;
                overflow: hidden !important;
                background: white !important;
              }
              body * {
                visibility: hidden !important;
              }
              #print-receipt-container,
              #print-receipt-container * {
                visibility: visible !important;
              }
              #print-receipt-container {
                display: block !important;
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: 210mm !important;
                height: 297mm !important;
                margin: 0 !important;
                padding: 0 !important;
                box-shadow: none !important;
                background: white !important;
                border: none !important;
              }
            }
          `,
            }}
          />
          <div
            id="print-receipt-container"
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              zIndex: 99999,
              backgroundColor: "white",
              display: "none",
            }}
          >
            <FeeReceipt data={printData} academyProfile={academyProfile} />
          </div>
        </>
      )}
    </div>
  );
}
