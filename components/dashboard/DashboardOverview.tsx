/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  UserPlus,
  UserCheck,
  IndianRupee,
  ChevronLeft,
  ChevronRight,
  X,
  Check,
  Copy,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useMediaQuery } from "@/components/hooks/useMediaQuery";
import ChartBox from "@/components/charts/ChartBox";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  Tooltip,
  XAxis,
  YAxis,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import type { DashboardData } from "@/lib/services/dashboard";
import { useRouter } from "next/navigation";
import { FeeReceipt } from "@/components/students/studentProfile/FeeReceipt";
import type { AcademyProfile } from "@prisma/client";
import {
  getPaymentByIdAction,
  getRevenueChartDataAction,
} from "@/lib/actions/payments";
import AttendanceModal from "./AttendanceModal";
import CollectFeeModal from "./CollectFeeModal";
import StudentAvatar from "@/components/students/StudentAvatar";
import AddEnquiryModal from "@/components/enquiries/AddEnquiryModal";

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
}

export default function DashboardOverview({
  firstName,
  dashboardData,
  academyProfile,
  canManage = false,
}: DashboardOverviewProps) {
  const isMobile = useMediaQuery("(max-width: 639px)");
  const chartH = isMobile ? CHART_H_SM : CHART_H;

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

  // View States for daily/weekly vs monthly toggles
  const [attendanceView, setAttendanceView] = useState<"daily" | "monthly">(
    "daily",
  );
  const [admissionsView, setAdmissionsView] = useState<"daily" | "monthly">(
    "monthly",
  );
  const [renewalsView, setRenewalsView] = useState<"daily" | "monthly">(
    "monthly",
  );
  const [revenueView, setRevenueView] = useState<"daily" | "monthly">(
    "monthly",
  );

  const [revenueDate, setRevenueDate] = useState<Date>(() => new Date());
  const [revenueData, setRevenueData] = useState<
    { label: string; revenue: number }[]
  >(() => dashboardData.revenueMonthly);

  const revenueChartTitle = useMemo(() => {
    if (revenueView === "daily") {
      const monthLabel = revenueDate
        .toLocaleString("en-US", { month: "short" })
        .toUpperCase();
      return `REVENUE ${monthLabel}`;
    } else {
      return `REVENUE ${revenueDate.getFullYear()}`;
    }
  }, [revenueView, revenueDate]);

  useEffect(() => {
    const now = new Date();
    const isCurrentMonth =
      revenueDate.getMonth() === now.getMonth() &&
      revenueDate.getFullYear() === now.getFullYear();
    const isCurrentYear = revenueDate.getFullYear() === now.getFullYear();

    if (revenueView === "daily" && isCurrentMonth) {
      setRevenueData(dashboardData.revenueDaily);
      return;
    }
    if (revenueView === "monthly" && isCurrentYear) {
      setRevenueData(dashboardData.revenueMonthly);
      return;
    }

    let active = true;
    const fetchRevenue = async () => {
      const res = await getRevenueChartDataAction(
        revenueView,
        revenueDate.getFullYear(),
        revenueView === "daily" ? revenueDate.getMonth() : undefined,
      );
      if (active && res.success && res.data) {
        setRevenueData(res.data);
      }
    };
    fetchRevenue();
    return () => {
      active = false;
    };
  }, [revenueView, revenueDate, dashboardData]);

  // Sliding Window States for daily views (pages of 10 days)
  const [attendanceStartIndex, setAttendanceStartIndex] = useState(20);
  const [admissionsStartIndex, setAdmissionsStartIndex] = useState(20);
  const [renewalsStartIndex, setRenewalsStartIndex] = useState(20);

  // Derive chart datasets dynamically from database props
  const attendanceChartData = useMemo(() => {
    if (attendanceView === "daily") {
      return dashboardData.attendanceDaily.map((d) => ({
        label: d.day.replace(/^0/, ""), // "05" -> "5" (makes labels shorter)
        present: d.present,
      }));
    } else {
      return dashboardData.attendanceMonthly.map((d) => ({
        label: d.month,
        present: d.present,
      }));
    }
  }, [attendanceView, dashboardData]);

  const visibleAttendanceData = useMemo(() => {
    if (attendanceView === "daily") {
      return attendanceChartData.slice(
        attendanceStartIndex,
        attendanceStartIndex + 10,
      );
    }
    return attendanceChartData;
  }, [attendanceChartData, attendanceView, attendanceStartIndex]);

  const admissionsChartData = useMemo(() => {
    if (admissionsView === "daily") {
      return dashboardData.admissionsDaily.map((d) => ({
        label: d.day.replace(/^0/, ""), // "05" -> "5" (makes labels shorter)
        admissions: d.admissions,
      }));
    } else {
      return dashboardData.admissionsMonthly.map((d) => ({
        label: d.month,
        admissions: d.admissions,
      }));
    }
  }, [admissionsView, dashboardData]);

  const visibleAdmissionsData = useMemo(() => {
    if (admissionsView === "daily") {
      return admissionsChartData.slice(
        admissionsStartIndex,
        admissionsStartIndex + 10,
      );
    }
    return admissionsChartData;
  }, [admissionsChartData, admissionsView, admissionsStartIndex]);

  const renewalsChartData = useMemo(() => {
    if (renewalsView === "daily") {
      return dashboardData.renewalsDaily.map((d) => ({
        label: d.day.replace(/^0/, ""), // "05" -> "5" (makes labels shorter)
        renewals: d.renewals,
      }));
    } else {
      return dashboardData.renewalsMonthly.map((d) => ({
        label: d.month,
        renewals: d.renewals,
      }));
    }
  }, [renewalsView, dashboardData]);

  const visibleRenewalsData = useMemo(() => {
    if (renewalsView === "daily") {
      return renewalsChartData.slice(
        renewalsStartIndex,
        renewalsStartIndex + 10,
      );
    }
    return renewalsChartData;
  }, [renewalsChartData, renewalsView, renewalsStartIndex]);

  // We use revenueData state directly

  const chartMargin = isMobile
    ? { top: 8, right: 4, left: -16, bottom: 0 }
    : { top: 8, right: 8, left: -8, bottom: 0 };

  // Modals visibility state
  const [qrOpen, setQrOpen] = useState(false);
  const [feeOpen, setFeeOpen] = useState(false);
  const [addEnquiryOpen, setAddEnquiryOpen] = useState(false);

  const router = useRouter();

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
        const firstName =
          student.name.trim().split(/\s+/)[0]?.toLowerCase() || "student";
        const newTitle = `TAG${student.studentNumber}-${firstName}-fee-reciept`;
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

  const [graceSortOrder, setGraceSortOrder] = useState<"latest" | "oldest">("latest");
  const [inactiveSortOrder, setInactiveSortOrder] = useState<"latest" | "oldest">("latest");
  const [copiedStudentId, setCopiedStudentId] = useState<string | null>(null);

  const handleCopy = async (id: string, contactNumber: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    try {
      await navigator.clipboard.writeText(contactNumber);
      setCopiedStudentId(id);
      setTimeout(() => setCopiedStudentId(null), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  const sortedGraceStudents = useMemo(() => {
    const list = [...(dashboardData.graceStudents || [])];
    return list.sort((a, b) => {
      const dateA = new Date(a.statusEntryDate).getTime();
      const dateB = new Date(b.statusEntryDate).getTime();
      return graceSortOrder === "latest" ? dateB - dateA : dateA - dateB;
    });
  }, [dashboardData.graceStudents, graceSortOrder]);

  const sortedInactiveStudents = useMemo(() => {
    const list = [...(dashboardData.inactiveStudents || [])];
    return list.sort((a, b) => {
      const dateA = new Date(a.statusEntryDate).getTime();
      const dateB = new Date(b.statusEntryDate).getTime();
      return inactiveSortOrder === "latest" ? dateB - dateA : dateA - dateB;
    });
  }, [dashboardData.inactiveStudents, inactiveSortOrder]);

  const activeCount = dashboardData.kpis.activeStudents;
  const graceCount = dashboardData.kpis.gracePeriodStudents;
  const freezeCount = dashboardData.kpis.freezeStudents;
  const inactiveCount = dashboardData.kpis.inactiveStudents;
  const totalStudents = activeCount + graceCount + freezeCount + inactiveCount;  const activePercent =
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
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-5xl font-light tracking-tight text-zinc-955 dark:text-zinc-50">
            Welcome back,{" "}
            <span className="font-semibold text-brand-orange-500 dark:text-brand-orange-500">
              {firstName}
            </span>
          </h1>
        </div>

        {/* Header Row 2: Pill Bar and Stats */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between pt-3 pb-2 sm:pt-6 sm:pb-3">
          {/* Left Part: Premium standalone pills side-by-side with extra gap, scaled proportionally */}
          <div className="flex xs-hide flex-col gap-2.5 w-full max-w-sm lg:max-w-[220px] xl:max-w-sm pt-2 shrink-0">
            {totalStudents === 0 ? (
              <div className="h-[30px] sm:h-10 w-full bg-zinc-200 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 flex items-center justify-center text-[10px] sm:text-xs font-semibold rounded-full">
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
            <div className="flex flex-wrap items-center justify-start gap-x-5 gap-y-1.5 px-1 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
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
            <div className="hidden xs-only-flex h-[30px] sm:h-10 w-full bg-zinc-200 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 items-center justify-center text-[10px] sm:text-xs font-semibold rounded-full">
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
              <div className="flex flex-col justify-center gap-2 text-[9px] font-bold uppercase tracking-wider text-zinc-450 dark:text-zinc-500">
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
              <p className="text-[9px] sm:text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider text-center sm:text-left sm:pl-7 mt-0.5">
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
              <p className="text-[9px] sm:text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider text-center sm:text-left sm:pl-7 mt-0.5">
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
              <p className="text-[9px] sm:text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider text-center sm:text-left sm:pl-7 mt-0.5">
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
            src="/attendance.webp"
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
              src="/enquiry.webp"
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
              src="/enquiry.webp"
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
          href="/students/new"
          className="group flex flex-col xl:flex-row items-center gap-2.5 xl:gap-4.5 py-3 px-3 xl:py-4 xl:px-4.5 rounded-3xl border-0 bg-emerald-200/90 dark:bg-emerald-950/60 hover:bg-emerald-300/80 dark:hover:bg-emerald-900/60 active:scale-[0.98] transition-all duration-200 cursor-pointer text-center xl:text-left w-full"
        >
          <img
            src="/newAdmission.webp"
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
            src="/fee.webp"
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

      {/* Modern Two-Column Charts Grid (Clean, side-by-side, same gap-3.5 and rounded-2xl border-0 shadow-xs as before) */}
      <div className="grid gap-2.5 lg:grid-cols-2 min-w-0">
        {/* Chart 1: Revenue (Line Chart with Daily/Monthly toggles and Chevrons) */}
        <div className="rounded-3xl border-0 bg-white dark:bg-zinc-900 p-5 shadow-xs min-w-0 overflow-hidden transition-all duration-300">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-bold text-zinc-955 dark:text-zinc-50 uppercase tracking-wider truncate">
                {revenueChartTitle}
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-0.5">
                <button
                  onClick={() => {
                    setRevenueDate((prev) => {
                      const next = new Date(prev);
                      if (revenueView === "daily") {
                        next.setMonth(next.getMonth() - 1);
                      } else {
                        next.setFullYear(next.getFullYear() - 1);
                      }
                      return next;
                    });
                  }}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                >
                  <ChevronLeft className="h-5 w-5" strokeWidth={2.5} />
                </button>
                <button
                  onClick={() => {
                    setRevenueDate((prev) => {
                      const next = new Date(prev);
                      if (revenueView === "daily") {
                        next.setMonth(next.getMonth() + 1);
                      } else {
                        next.setFullYear(next.getFullYear() + 1);
                      }
                      return next;
                    });
                  }}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                >
                  <ChevronRight className="h-5 w-5" strokeWidth={2.5} />
                </button>
              </div>
              <select
                value={revenueView}
                onChange={(e) => {
                  const val = e.target.value as "daily" | "monthly";
                  setRevenueView(val);
                }}
                className="shrink-0 text-xs bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-brand-orange-500/50 font-bold tracking-tight cursor-pointer transition-colors"
              >
                <option value="daily">Daily View</option>
                <option value="monthly">Monthly View</option>
              </select>
            </div>
          </div>
          <div className="mt-4">
            <ChartBox height={chartH}>
              <LineChart data={revenueData} margin={chartMargin}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--chart-grid)"
                  vertical={false}
                />
                <XAxis
                  dataKey="label"
                  tick={{
                    fontSize: isMobile ? 10 : 11,
                    fill: "var(--tick-color)",
                    fontWeight: 500,
                  }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  width={isMobile ? 36 : 48}
                  tick={{
                    fontSize: isMobile ? 10 : 11,
                    fill: "var(--tick-color)",
                    fontWeight: 500,
                  }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `₹${formatShortRevenue(v)}`}
                />
                <Tooltip
                  contentStyle={chartTooltipStyle}
                  formatter={(value) => [
                    `₹${Number(value).toLocaleString("en-IN")}`,
                    "Revenue",
                  ]}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#f16d28"
                  strokeWidth={3}
                  dot={false}
                  activeDot={{
                    fill: "#f16d28",
                    r: 6,
                    stroke: "var(--background)",
                    strokeWidth: 2,
                  }}
                />
              </LineChart>
            </ChartBox>
          </div>
        </div>

        {/* Chart 2: Attendance (Bar Chart) */}
        <div className="rounded-3xl border-0 bg-white dark:bg-zinc-900 p-5 shadow-xs min-w-0 overflow-hidden transition-all duration-300">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-bold text-zinc-955 dark:text-zinc-50 uppercase tracking-wider truncate">
                {attendanceView === "daily"
                  ? `Attendance ${currentMonthLabel}`
                  : `Attendance ${currentYear}`}
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-0.5">
                <button
                  onClick={() =>
                    setAttendanceStartIndex(
                      Math.max(0, attendanceStartIndex - 10),
                    )
                  }
                  disabled={
                    attendanceView === "monthly" || attendanceStartIndex === 0
                  }
                  className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors disabled:opacity-25 disabled:cursor-not-allowed disabled:hover:bg-transparent cursor-pointer"
                >
                  <ChevronLeft className="h-5 w-5" strokeWidth={2.5} />
                </button>
                <button
                  onClick={() =>
                    setAttendanceStartIndex(
                      Math.min(20, attendanceStartIndex + 10),
                    )
                  }
                  disabled={
                    attendanceView === "monthly" || attendanceStartIndex === 20
                  }
                  className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors disabled:opacity-25 disabled:cursor-not-allowed disabled:hover:bg-transparent cursor-pointer"
                >
                  <ChevronRight className="h-5 w-5" strokeWidth={2.5} />
                </button>
              </div>
              <select
                value={attendanceView}
                onChange={(e) => {
                  const val = e.target.value as "daily" | "monthly";
                  setAttendanceView(val);
                  if (val === "daily") {
                    setAttendanceStartIndex(20);
                  }
                }}
                className="shrink-0 text-xs bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-brand-orange-500/50 font-bold tracking-tight cursor-pointer transition-colors"
              >
                <option value="daily">Daily View</option>
                <option value="monthly">Monthly View</option>
              </select>
            </div>
          </div>
          <div className="mt-4">
            <ChartBox height={chartH}>
              <BarChart
                data={visibleAttendanceData}
                margin={chartMargin}
                barCategoryGap={6}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--chart-grid)"
                  vertical={false}
                />
                <XAxis
                  dataKey="label"
                  tick={{
                    fontSize: isMobile ? 10 : 11,
                    fill: "var(--tick-color)",
                    fontWeight: 500,
                  }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  width={isMobile ? 36 : 48}
                  domain={["auto", "auto"]}
                  tick={{
                    fontSize: isMobile ? 10 : 11,
                    fill: "var(--tick-color)",
                    fontWeight: 500,
                  }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `${v}`}
                />
                <Tooltip
                  contentStyle={chartTooltipStyle}
                  cursor={{ fill: "var(--chart-cursor-bg)" }}
                  separator=""
                  formatter={(value) => [`${value} present`, ""]}
                />
                <Bar
                  dataKey="present"
                  fill="#f16d28"
                  radius={[9999, 9999, 8, 8]}
                  maxBarSize={isMobile ? 28 : 42}
                />
              </BarChart>
            </ChartBox>
          </div>
        </div>

        {/* Chart 3: Admissions (Line Chart) */}
        <div className="rounded-3xl border-0 bg-white dark:bg-zinc-900 p-5 shadow-xs min-w-0 overflow-hidden transition-all duration-300">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-bold text-zinc-955 dark:text-zinc-50 uppercase tracking-wider truncate">
                {admissionsView === "daily"
                  ? `Admissions ${currentMonthLabel}`
                  : `Admissions ${currentYear}`}
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-0.5">
                <button
                  onClick={() =>
                    setAdmissionsStartIndex(
                      Math.max(0, admissionsStartIndex - 10),
                    )
                  }
                  disabled={
                    admissionsView === "monthly" || admissionsStartIndex === 0
                  }
                  className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors disabled:opacity-25 disabled:cursor-not-allowed disabled:hover:bg-transparent cursor-pointer"
                >
                  <ChevronLeft className="h-5 w-5" strokeWidth={2.5} />
                </button>
                <button
                  onClick={() =>
                    setAdmissionsStartIndex(
                      Math.min(20, admissionsStartIndex + 10),
                    )
                  }
                  disabled={
                    admissionsView === "monthly" || admissionsStartIndex === 20
                  }
                  className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors disabled:opacity-25 disabled:cursor-not-allowed disabled:hover:bg-transparent cursor-pointer"
                >
                  <ChevronRight className="h-5 w-5" strokeWidth={2.5} />
                </button>
              </div>
              <select
                value={admissionsView}
                onChange={(e) => {
                  const val = e.target.value as "daily" | "monthly";
                  setAdmissionsView(val);
                  if (val === "daily") {
                    setAdmissionsStartIndex(20);
                  }
                }}
                className="shrink-0 text-xs bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-brand-orange-500/50 font-bold tracking-tight cursor-pointer transition-colors"
              >
                <option value="daily">Daily View</option>
                <option value="monthly">Monthly View</option>
              </select>
            </div>
          </div>
          <div className="mt-4">
            <ChartBox height={chartH}>
              <LineChart data={visibleAdmissionsData} margin={chartMargin}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--chart-grid)"
                  vertical={false}
                />
                <XAxis
                  dataKey="label"
                  tick={{
                    fontSize: isMobile ? 10 : 11,
                    fill: "var(--tick-color)",
                    fontWeight: 500,
                  }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  width={isMobile ? 36 : 48}
                  tick={{
                    fontSize: isMobile ? 10 : 11,
                    fill: "var(--tick-color)",
                    fontWeight: 500,
                  }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `${v}`}
                />
                <Tooltip
                  contentStyle={chartTooltipStyle}
                  separator=""
                  formatter={(value) => [`${value} admissions`, ""]}
                />
                <Line
                  type="monotone"
                  dataKey="admissions"
                  stroke="#f16d28"
                  strokeWidth={3}
                  dot={false}
                  activeDot={{
                    fill: "#f16d28",
                    r: 6,
                    stroke: "var(--background)",
                    strokeWidth: 2,
                  }}
                />
              </LineChart>
            </ChartBox>
          </div>
        </div>

        {/* Chart 4: Renewals (Line Chart) */}
        <div className="rounded-3xl border-0 bg-white dark:bg-zinc-900 p-5 shadow-xs min-w-0 overflow-hidden transition-all duration-300">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-bold text-zinc-955 dark:text-zinc-50 uppercase tracking-wider truncate">
                {renewalsView === "daily"
                  ? `Renewals ${currentMonthLabel}`
                  : `Renewals ${currentYear}`}
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-0.5">
                <button
                  onClick={() =>
                    setRenewalsStartIndex(Math.max(0, renewalsStartIndex - 10))
                  }
                  disabled={
                    renewalsView === "monthly" || renewalsStartIndex === 0
                  }
                  className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors disabled:opacity-25 disabled:cursor-not-allowed disabled:hover:bg-transparent cursor-pointer"
                >
                  <ChevronLeft className="h-5 w-5" strokeWidth={2.5} />
                </button>
                <button
                  onClick={() =>
                    setRenewalsStartIndex(Math.min(20, renewalsStartIndex + 10))
                  }
                  disabled={
                    renewalsView === "monthly" || renewalsStartIndex === 20
                  }
                  className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors disabled:opacity-25 disabled:cursor-not-allowed disabled:hover:bg-transparent cursor-pointer"
                >
                  <ChevronRight className="h-5 w-5" strokeWidth={2.5} />
                </button>
              </div>
              <select
                value={renewalsView}
                onChange={(e) => {
                  const val = e.target.value as "daily" | "monthly";
                  setRenewalsView(val);
                  if (val === "daily") {
                    setRenewalsStartIndex(20);
                  }
                }}
                className="shrink-0 text-xs bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-brand-orange-500/50 font-bold tracking-tight cursor-pointer transition-colors"
              >
                <option value="daily">Daily View</option>
                <option value="monthly">Monthly View</option>
              </select>
            </div>
          </div>
          <div className="mt-4">
            <ChartBox height={chartH}>
              <LineChart data={visibleRenewalsData} margin={chartMargin}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--chart-grid)"
                  vertical={false}
                />
                <XAxis
                  dataKey="label"
                  tick={{
                    fontSize: isMobile ? 10 : 11,
                    fill: "var(--tick-color)",
                    fontWeight: 500,
                  }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  width={isMobile ? 36 : 48}
                  tick={{
                    fontSize: isMobile ? 10 : 11,
                    fill: "var(--tick-color)",
                    fontWeight: 500,
                  }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `${v}`}
                />
                <Tooltip
                  contentStyle={chartTooltipStyle}
                  separator=""
                  formatter={(value) => [`${value} renewals`, ""]}
                />
                <Line
                  type="monotone"
                  dataKey="renewals"
                  stroke="#f16d28"
                  strokeWidth={3}
                  dot={false}
                  activeDot={{
                    fill: "#f16d28",
                    r: 6,
                    stroke: "var(--background)",
                    strokeWidth: 2,
                  }}
                />
              </LineChart>
            </ChartBox>
          </div>
        </div>
      </div>

      {/* Grace Period & Inactive Period Student Lists */}
      <div className="grid gap-3 lg:grid-cols-2 min-w-0">
        {/* Grace Period Students Card */}
        <div className="rounded-3xl border border-zinc-100/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 p-5 shadow-xs flex flex-col h-[380px] transition-all duration-300">
          <div className="flex items-center justify-between mb-4 shrink-0">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-zinc-955 dark:text-zinc-50 uppercase tracking-wider">
                Grace Period
              </h3>
              <span className="bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400 text-xs font-bold px-2 py-0.5 rounded-full">
                {sortedGraceStudents.length}
              </span>
            </div>
            
            <button
              onClick={() => setGraceSortOrder(prev => prev === "latest" ? "oldest" : "latest")}
              className="flex items-center gap-1.5 text-xs font-bold text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-800 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700 px-2.5 py-1.5 rounded-xl transition-all duration-200 cursor-pointer"
            >
              {graceSortOrder === "latest" ? (
                <>
                  <span>Latest</span>
                  <ChevronDown className="h-3.5 w-3.5" strokeWidth={2.5} />
                </>
              ) : (
                <>
                  <span>Oldest</span>
                  <ChevronUp className="h-3.5 w-3.5" strokeWidth={2.5} />
                </>
              )}
            </button>
          </div>

          <div className="flex-1 overflow-y-auto pr-1 space-y-2.5 scrollbar-thin scrollbar-thumb-zinc-200 dark:scrollbar-thumb-zinc-800">
            {sortedGraceStudents.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-zinc-400 dark:text-zinc-500">
                No students in grace period
              </div>
            ) : (
              sortedGraceStudents.map((student) => {
                return (
                  <div
                  key={student.id}
                  onClick={() => router.push(`/students/${student.id}`)}
                  className="flex items-center justify-between p-3 rounded-2xl bg-zinc-50/50 hover:bg-zinc-50 dark:bg-zinc-800/10 dark:hover:bg-zinc-800/30 border border-zinc-100/30 dark:border-zinc-800/30 transition-all duration-200 cursor-pointer group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <StudentAvatar student={student} size={40} />

                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-zinc-800 dark:text-zinc-200 truncate group-hover:text-brand-orange-500 dark:group-hover:text-brand-orange-500 transition-colors">
                          {student.name}
                        </h4>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium mt-0.5 truncate">
                          TAG{String(student.studentNumber).padStart(3, "0")} · {student.sessionsCompleted}/{student.totalSessions} sessions done
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="hidden sm:inline text-xs text-zinc-500 dark:text-zinc-400 font-semibold">
                        {student.contactNumber}
                      </span>
                      <button
                        onClick={(e) => handleCopy(student.id, student.contactNumber, e)}
                        className="h-8 w-8 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 flex items-center justify-center text-zinc-500 hover:text-zinc-855 dark:hover:text-zinc-200 transition-all active:scale-95 cursor-pointer"
                        title="Copy phone number"
                      >
                        {copiedStudentId === student.id ? (
                          <Check className="h-3.5 w-3.5 text-emerald-500" strokeWidth={3} />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Inactive Students Card */}
        <div className="rounded-3xl border border-zinc-100/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 p-5 shadow-xs flex flex-col h-[380px] transition-all duration-300">
          <div className="flex items-center justify-between mb-4 shrink-0">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-zinc-955 dark:text-zinc-50 uppercase tracking-wider">
                Inactive Students
              </h3>
              <span className="bg-orange-100 dark:bg-orange-950/40 text-orange-700 dark:text-orange-400 text-xs font-bold px-2 py-0.5 rounded-full">
                {sortedInactiveStudents.length}
              </span>
            </div>
            
            <button
              onClick={() => setInactiveSortOrder(prev => prev === "latest" ? "oldest" : "latest")}
              className="flex items-center gap-1.5 text-xs font-bold text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-800 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700 px-2.5 py-1.5 rounded-xl transition-all duration-200 cursor-pointer"
            >
              {inactiveSortOrder === "latest" ? (
                <>
                  <span>Latest</span>
                  <ChevronDown className="h-3.5 w-3.5" strokeWidth={2.5} />
                </>
              ) : (
                <>
                  <span>Oldest</span>
                  <ChevronUp className="h-3.5 w-3.5" strokeWidth={2.5} />
                </>
              )}
            </button>
          </div>

          <div className="flex-1 overflow-y-auto pr-1 space-y-2.5 scrollbar-thin scrollbar-thumb-zinc-200 dark:scrollbar-thumb-zinc-800">
            {sortedInactiveStudents.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-zinc-400 dark:text-zinc-500">
                No inactive students
              </div>
            ) : (
              sortedInactiveStudents.map((student) => {
                return (
                  <div
                  key={student.id}
                  onClick={() => router.push(`/students/${student.id}`)}
                  className="flex items-center justify-between p-3 rounded-2xl bg-zinc-50/50 hover:bg-zinc-50 dark:bg-zinc-800/10 dark:hover:bg-zinc-800/30 border border-zinc-100/30 dark:border-zinc-800/30 transition-all duration-200 cursor-pointer group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <StudentAvatar student={student} size={40} />

                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-zinc-800 dark:text-zinc-200 truncate group-hover:text-brand-orange-500 dark:group-hover:text-brand-orange-500 transition-colors">
                          {student.name}
                        </h4>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium mt-0.5 truncate">
                          TAG{String(student.studentNumber).padStart(3, "0")} · {student.sessionsCompleted}/{student.totalSessions} sessions done
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="hidden sm:inline text-xs text-zinc-500 dark:text-zinc-400 font-semibold">
                        {student.contactNumber}
                      </span>
                      <button
                        onClick={(e) => handleCopy(student.id, student.contactNumber, e)}
                        className="h-8 w-8 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 flex items-center justify-center text-zinc-500 hover:text-zinc-855 dark:hover:text-zinc-200 transition-all active:scale-95 cursor-pointer"
                        title="Copy phone number"
                      >
                        {copiedStudentId === student.id ? (
                          <Check className="h-3.5 w-3.5 text-emerald-500" strokeWidth={3} />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
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
              <span className="text-xs text-zinc-400 dark:text-zinc-500 font-semibold shrink-0 sm:pl-4">
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

      {/* 8. Bottom-Right Toast Notification */}
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
            className="text-zinc-400 hover:text-zinc-650 dark:hover:text-zinc-200 cursor-pointer self-start -mt-1 -mr-1"
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
