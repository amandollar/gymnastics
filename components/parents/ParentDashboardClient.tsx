"use client";

import { useState, useEffect, useMemo } from "react";
import { signOut } from "next-auth/react";
import { 
  LogOut, 
  Lock,
  Eye,
  EyeOff,
  Snowflake,
  RefreshCw,
  CheckCircle2,
  Home,
  FileText,
  PanelLeftClose,
  PanelLeftOpen,
  Clock,
  Calendar
} from "lucide-react";
import { getPaymentByIdAction } from "@/lib/actions/payments";
import { FeeReceipt } from "@/components/students/studentProfile/FeeReceipt";
import { changeParentPasswordAction } from "@/lib/actions/students";
import { LevelProgress } from "@/components/students/studentProfile/LevelProgress";
import { PaymentHistory } from "@/components/students/studentProfile/PaymentHistory";
import StudentAvatar from "@/components/students/StudentAvatar";
import { formatAge } from "@/lib/utils/student";
import ThemeSelector from "@/components/layout/ThemeSelector";

interface ParentDashboardClientProps {
  student: any;
  academyProfile: any;
}

export default function ParentDashboardClient({
  student,
  academyProfile,
}: ParentDashboardClientProps) {
  const [printData, setPrintData] = useState<any | null>(null);
  const [isChangingPassword, setIsChangingPassword] = useState(student.isTempPassword);
  const [showLogs, setShowLogs] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "attendance" | "billing">("overview");
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    const collapsed = localStorage.getItem("parent-sidebar-collapsed") === "true";
    setIsCollapsed(collapsed);
  }, []);

  const toggleCollapse = () => {
    const nextState = !isCollapsed;
    setIsCollapsed(nextState);
    localStorage.setItem("parent-sidebar-collapsed", String(nextState));
  };

  const parentInitials = useMemo(() => {
    if (!student.parentName) return "P";
    return student.parentName
      .split(" ")
      .map((n: string) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }, [student.parentName]);
  
  // Password change form states
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwSuccess, setPwSuccess] = useState(false);
  const [isSubmittingPw, setIsSubmittingPw] = useState(false);

  // Printing receipts handler
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

  // Handle password submission
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError(null);

    if (!student.isTempPassword && !currentPassword) {
      setPwError("Current password is required");
      return;
    }
    if (newPassword.length < 6) {
      setPwError("New password must be at least 6 characters long");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwError("Confirm password does not match new password");
      return;
    }

    setIsSubmittingPw(true);
    try {
      const res = await changeParentPasswordAction(student.id, currentPassword, newPassword);
      if (res.success) {
        setPwSuccess(true);
        setTimeout(() => {
          setIsChangingPassword(false);
        }, 1500);
      } else {
        setPwError(res.message || "Failed to update password. Check your current password.");
      }
    } catch (err) {
      setPwError("An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmittingPw(false);
    }
  };

  const handleLogout = () => {
    signOut({ callbackUrl: "/parents/login" });
  };

  const INR = (amount: number) => {
    return `₹${amount.toLocaleString("en-IN")}`;
  };

  // Convert Date to YYYY-MM-DD
  const toYMD = (d: Date | string) => {
    const date = new Date(d);
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  const activePlan = student.activePlan;
  const attendances = student.attendances;

  const attendanceDatesSet = useMemo(() => {
    const set = new Set<string>();
    attendances.forEach((a: any) => {
      set.add(toYMD(a.date));
    });
    return set;
  }, [attendances]);

  // Find if date falls in a freeze period
  const isFrozenDate = (year: number, month: number, day: number): boolean => {
    if (!activePlan) return false;
    const current = new Date(year, month, day).getTime();
    
    // Check main plan freeze dates
    if (activePlan.freezeStartDate && activePlan.freezeEndDate) {
      const start = new Date(activePlan.freezeStartDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(activePlan.freezeEndDate);
      end.setHours(23, 59, 59, 999);
      if (current >= start.getTime() && current <= end.getTime()) return true;
    }

    // Check specific freeze periods list
    if (activePlan.freezePeriods && activePlan.freezePeriods.length > 0) {
      for (const fp of activePlan.freezePeriods) {
        const start = new Date(fp.startDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(fp.endDate);
        end.setHours(23, 59, 59, 999);
        if (current >= start.getTime() && current <= end.getTime()) return true;
      }
    }
    return false;
  };

  // Check if date is a scheduled class day
  const isClassDay = (year: number, month: number, day: number): boolean => {
    if (!activePlan || !Array.isArray(activePlan.selectedDays)) return false;
    const d = new Date(year, month, day);
    
    // Make sure it falls within the plan duration
    const pStart = new Date(activePlan.startDate);
    pStart.setHours(0, 0, 0, 0);
    const pEnd = new Date(activePlan.endDate);
    pEnd.setHours(23, 59, 59, 999);
    const current = d.getTime();
    if (current < pStart.getTime() || current > pEnd.getTime()) return false;

    const dayName = d.toLocaleDateString("en-US", { weekday: "long" });
    return activePlan.selectedDays.includes(dayName);
  };

  // Generate calendar months for the active plan (current month and plan end month)
  const calendarMonths = useMemo(() => {
    const list: { year: number; month: number }[] = [];
    const today = new Date();
    let start = new Date(today.getFullYear(), today.getMonth(), 1);
    
    // If active plan has start date, begin from that plan start month
    if (activePlan) {
      const planStart = new Date(activePlan.startDate);
      start = new Date(planStart.getFullYear(), planStart.getMonth(), 1);
    }

    let end = new Date(today.getFullYear(), today.getMonth() + 2, 1);
    if (activePlan) {
      const planEnd = new Date(activePlan.endDate);
      end = new Date(planEnd.getFullYear(), planEnd.getMonth(), 1);
    }

    const curr = new Date(start);
    let safety = 0;
    while (curr <= end && safety < 12) {
      list.push({ year: curr.getFullYear(), month: curr.getMonth() });
      curr.setMonth(curr.getMonth() + 1);
      safety++;
    }

    if (list.length === 0) {
      list.push({ year: today.getFullYear(), month: today.getMonth() });
    }
    return list;
  }, [activePlan]);

  const todayYMD = toYMD(new Date());

  return (
    <div className="min-h-[100dvh] bg-[var(--background)] dark:bg-zinc-950 flex flex-col md:flex-row gap-0 transition-colors duration-200 font-sans antialiased text-zinc-900 dark:text-zinc-100">
      
      {/* 1. FORCED PASSWORD CHANGE OVERLAY */}
      {isChangingPassword && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/70 backdrop-blur-md animate-fade-in animate-duration-200">
          <div
            className="w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl p-6 relative overflow-hidden animate-scale-in animate-duration-200"
            style={{ borderRadius: "1.5rem" }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-2xl bg-brand-orange-50 dark:bg-brand-orange-950/20 text-brand-orange-500">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-200">
                  Secure Your Account
                </h3>
                <p className="text-xs text-zinc-400 dark:text-zinc-500">
                  Update your temporary password to continue
                </p>
              </div>
            </div>

            {pwSuccess ? (
              <div className="space-y-4 py-8 text-center animate-fade-in">
                <div className="inline-flex items-center justify-center p-3 rounded-full bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500 mb-2">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h4 className="text-md font-bold text-zinc-900 dark:text-zinc-50">
                  Password Updated!
                </h4>
                <p className="text-xs text-zinc-400 dark:text-zinc-500">
                  Unlocking your portal...
                </p>
              </div>
            ) : (
              <form onSubmit={handlePasswordChange} className="space-y-4">
                <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed bg-zinc-50 dark:bg-zinc-950/50 p-3.5 rounded-2xl border border-zinc-100 dark:border-zinc-850">
                  Welcome to the Parent Portal! Because this is your first time logging in, please replace the temporary password with a secure, custom one of your choice.
                </p>

                {pwError && (
                  <div className="p-3 rounded-2xl bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 text-red-655 dark:text-red-400 text-xs font-semibold animate-shake">
                    {pwError}
                  </div>
                )}

                {!student.isTempPassword && (
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-zinc-400 dark:text-zinc-550">
                      Temporary Password
                    </label>
                    <div className="relative flex items-center">
                      <input
                        type={showCurrent ? "text" : "password"}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        required={!student.isTempPassword}
                        placeholder="Enter the password generated by staff"
                        className="block w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-4 py-2.5 text-sm font-medium text-zinc-900 dark:text-zinc-100 outline-none focus:border-brand-orange-500 focus:ring-4 focus:ring-brand-orange-500/10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrent(!showCurrent)}
                        className="absolute right-3.5 text-zinc-400 dark:text-zinc-500 hover:text-zinc-650 cursor-pointer"
                      >
                        {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-zinc-400 dark:text-zinc-550">
                    New Password
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type={showNew ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      placeholder="At least 6 characters"
                      className="block w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-4 py-2.5 text-sm font-medium text-zinc-900 dark:text-zinc-100 outline-none focus:border-brand-orange-500 focus:ring-4 focus:ring-brand-orange-500/10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNew(!showNew)}
                      className="absolute right-3.5 text-zinc-400 dark:text-zinc-500 hover:text-zinc-650 cursor-pointer"
                    >
                      {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-zinc-400 dark:text-zinc-550">
                    Confirm New Password
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type={showConfirm ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      placeholder="Confirm your new password"
                      className="block w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-4 py-2.5 text-sm font-medium text-zinc-900 dark:text-zinc-100 outline-none focus:border-brand-orange-500 focus:ring-4 focus:ring-brand-orange-500/10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3.5 text-zinc-400 dark:text-zinc-500 hover:text-zinc-650 cursor-pointer"
                    >
                      {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingPw}
                  className="w-full mt-4 flex justify-center items-center gap-2 bg-brand-orange-500 hover:bg-brand-orange-600 disabled:opacity-50 text-white px-4 py-3 rounded-2xl text-sm font-bold shadow-md cursor-pointer transition-colors"
                >
                  {isSubmittingPw ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    "Set Password & Enter"
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* 2. DESKTOP SIDEBAR */}
      <aside
        className={`hidden md:flex flex-col shrink-0 h-[calc(100vh-24px)] my-3 ml-3 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-950 shadow-xs transition-all duration-300 overflow-hidden sticky top-3 z-20 ${
          isCollapsed ? "w-16" : "w-60"
        }`}
      >
        {/* Top Header Row */}
        <div className={`flex h-14 items-center px-4 ${
          isCollapsed ? "justify-center" : "justify-between gap-2.5"
        }`}>
          {!isCollapsed ? (
            <>
              <div className="flex items-center gap-2.5 min-w-0">
                <img
                  src="/logo.webp"
                  alt="TAG"
                  className="h-8 w-8 rounded-full border border-zinc-200 dark:border-zinc-800 object-cover shrink-0"
                />
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-zinc-900 dark:text-zinc-100">TAG Portal</p>
                  <p className="truncate text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Parent Portal</p>
                </div>
              </div>

              {/* Collapse Button */}
              <button
                onClick={toggleCollapse}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all cursor-pointer"
                title="Collapse sidebar"
              >
                <PanelLeftClose className="h-4.5 w-4.5" strokeWidth={2} />
              </button>
            </>
          ) : (
            /* Expand Button when collapsed */
            <button
              onClick={toggleCollapse}
              className="flex h-11 w-11 items-center justify-center rounded-xl text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all cursor-pointer"
              title="Expand sidebar"
            >
              <PanelLeftOpen className="h-5 w-5" strokeWidth={2} />
            </button>
          )}
        </div>

        {/* Centered Logo below top header when collapsed */}
        {isCollapsed && (
          <div className="flex justify-center pt-4 pb-2">
            <button
              onClick={() => setActiveTab("overview")}
              className="transition-transform hover:scale-105 active:scale-95 shrink-0 block cursor-pointer"
              title="Overview"
            >
              <img
                src="/logo.webp"
                alt="TAG"
                className="h-8 w-8 rounded-full border border-zinc-200 dark:border-zinc-800 object-cover shrink-0"
              />
            </button>
          </div>
        )}

        {/* Nav List */}
        <div className="flex-1 overflow-y-auto pt-2">
          <nav className={`transition-all ${isCollapsed ? "space-y-2 p-1.5" : "space-y-0.5 p-3"}`}>
            <button
              onClick={() => setActiveTab("overview")}
              className={`w-full flex items-center ${isCollapsed ? "justify-center" : "gap-2.5"} rounded-lg ${isCollapsed ? "px-2" : "px-3"} ${
                isCollapsed ? "py-3.5" : "py-2.5"
              } text-sm font-medium transition-all cursor-pointer ${
                activeTab === "overview"
                  ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 font-semibold"
                  : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 hover:text-zinc-900 dark:hover:text-zinc-50"
              }`}
              title={isCollapsed ? "Overview" : undefined}
            >
              <Home className={`shrink-0 transition-all ${isCollapsed ? "h-5 w-5" : "h-4 w-4"}`} strokeWidth={2} />
              {!isCollapsed && "Overview"}
            </button>

            <button
              onClick={() => setActiveTab("attendance")}
              className={`w-full flex items-center ${isCollapsed ? "justify-center" : "gap-2.5"} rounded-lg ${isCollapsed ? "px-2" : "px-3"} ${
                isCollapsed ? "py-3.5" : "py-2.5"
              } text-sm font-medium transition-all cursor-pointer ${
                activeTab === "attendance"
                  ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 font-semibold"
                  : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 hover:text-zinc-900 dark:hover:text-zinc-50"
              }`}
              title={isCollapsed ? "Attendance" : undefined}
            >
              <CheckCircle2 className={`shrink-0 transition-all ${isCollapsed ? "h-5 w-5" : "h-4 w-4"}`} strokeWidth={2} />
              {!isCollapsed && "Attendance"}
            </button>

            <button
              onClick={() => setActiveTab("billing")}
              className={`w-full flex items-center ${isCollapsed ? "justify-center" : "gap-2.5"} rounded-lg ${isCollapsed ? "px-2" : "px-3"} ${
                isCollapsed ? "py-3.5" : "py-2.5"
              } text-sm font-medium transition-all cursor-pointer ${
                activeTab === "billing"
                  ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 font-semibold"
                  : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 hover:text-zinc-900 dark:hover:text-zinc-50"
              }`}
              title={isCollapsed ? "Billing" : undefined}
            >
              <FileText className={`shrink-0 transition-all ${isCollapsed ? "h-5 w-5" : "h-4 w-4"}`} strokeWidth={2} />
              {!isCollapsed && "Billing"}
            </button>
          </nav>
        </div>

        {/* Theme Selector */}
        <ThemeSelector isCollapsed={isCollapsed} />

        {/* Bottom User Card */}
        <div className={`p-3 bg-zinc-50/50 dark:bg-zinc-900/10 flex items-center justify-between ${
          isCollapsed ? "justify-center" : "gap-3"
        }`}>
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-orange-500 text-xs font-bold text-white shadow-2xs cursor-pointer"
              title={isCollapsed ? `${student.parentName} (Parent) - Click to Logout` : undefined}
              onClick={isCollapsed ? handleLogout : undefined}
            >
              {parentInitials}
            </div>
            {!isCollapsed && (
              <div className="min-w-0 flex-1 flex items-center justify-between gap-1">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-bold text-zinc-900 dark:text-zinc-100">{student.parentName}</p>
                  <span className="inline-flex items-center rounded-md bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 text-[9px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mt-0.5">
                    Parent
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-500 dark:text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 transition-all cursor-pointer shrink-0"
                  title="Logout"
                >
                  <LogOut className="h-4 w-4" strokeWidth={2} />
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      <header className="flex md:hidden sticky top-0 z-30 min-h-14 items-center justify-between gap-2 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3 sm:px-6 pt-[env(safe-area-inset-top)] shrink-0 w-full">
        <div className="flex items-center gap-2.5 min-w-0">
          <img
            src="/logo.webp"
            alt="TAG"
            className="h-8 w-8 shrink-0 rounded-full border border-zinc-200 dark:border-zinc-800 object-cover"
          />
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-zinc-900 dark:text-zinc-100">
              TAG Parent Portal
            </p>
            <p className="truncate text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
              Academy of Gymnastics
            </p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-2.5 py-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer flex items-center gap-1.5"
          aria-label="Sign out"
        >
          <span className="hidden sm:inline">Logout</span>
          <LogOut className="h-4 w-4" strokeWidth={2} />
        </button>
      </header>

      {/* 4. MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 p-4 sm:p-6 lg:p-8 pt-6 sm:pt-6 lg:pt-8 pb-24 md:pb-8 min-w-0 text-zinc-900 dark:text-zinc-100">
          
          {/* Welcome Section */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-2 border-b border-zinc-200/40 dark:border-zinc-800/30 mb-6">
            <div className="flex flex-col gap-1">
              <h1 className="text-2xl sm:text-3xl md:text-5xl font-light tracking-tight text-zinc-900 dark:text-zinc-200">
                Welcome back,{" "}
                <span className="font-semibold text-brand-orange-500">
                  {student.parentName}
                </span>
              </h1>
              <p className="text-xs sm:text-sm text-zinc-400 dark:text-zinc-500">
                Tracking progress for gymnast <span className="font-semibold text-zinc-700 dark:text-zinc-400">{student.name}</span> · Roll No: <span className="font-semibold text-zinc-700 dark:text-zinc-400">TAG{String(student.studentNumber).padStart(3, "0")}</span>
              </p>
            </div>
          </div>

          {/* Tab Contents */}
          <div className="transition-all duration-300">
            
            {/* TAB 1: OVERVIEW */}
            {activeTab === "overview" && (
              <div className="space-y-8 animate-fade-in">
              {/* KPI Cards Grid */}
              <section className="grid gap-5 sm:grid-cols-3">
                {/* Remaining Classes */}
                <div 
                  className="bg-white dark:bg-zinc-900 p-5 sm:p-6 shadow-sm border border-zinc-200/60 dark:border-zinc-800/80 flex flex-col justify-between min-h-[140px]"
                  style={{ borderRadius: "1.5rem" }}
                >
                  <div className="flex items-center justify-between text-zinc-400 dark:text-zinc-500">
                    <span className="text-[10px] font-bold uppercase tracking-wider">Remaining Classes</span>
                    <CheckCircle2 className="w-4.5 h-4.5 text-brand-orange-500" />
                  </div>
                  <div>
                    <p className="text-3xl sm:text-4xl font-extralight tracking-tight text-zinc-900 dark:text-zinc-100">
                      <span className="font-semibold text-brand-orange-500">
                        {activePlan ? Math.max(0, activePlan.totalSessions - activePlan.sessionsCompleted) : 0}
                      </span>
                      <span className="text-sm font-semibold text-zinc-400 dark:text-zinc-500 mx-1">/</span>
                      <span className="text-sm font-bold text-zinc-500 dark:text-zinc-400">
                        {activePlan ? activePlan.totalSessions : 0} total
                      </span>
                    </p>
                  </div>
                  {activePlan && (
                    <div className="w-full bg-zinc-200 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden mt-2">
                      <div 
                        className="bg-brand-orange-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${(activePlan.sessionsCompleted / activePlan.totalSessions) * 100}%` }}
                      />
                    </div>
                  )}
                </div>

                {/* Class Timings */}
                <div 
                  className="bg-white dark:bg-zinc-900 p-5 sm:p-6 shadow-sm border border-zinc-200/60 dark:border-zinc-800/80 flex flex-col justify-between min-h-[140px]"
                  style={{ borderRadius: "1.5rem" }}
                >
                  <div className="flex items-center justify-between text-zinc-400 dark:text-zinc-500">
                    <span className="text-[10px] font-bold uppercase tracking-wider">Class Timings</span>
                    <Clock className="w-4.5 h-4.5 text-brand-orange-500" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200 truncate">
                      {activePlan?.batch?.name || "Assigned Batch"}
                    </p>
                    <p className="text-lg sm:text-xl font-extralight text-zinc-900 dark:text-zinc-200 tracking-tight mt-0.5">
                      {activePlan?.batch?.timing || "Contact office"}
                    </p>
                  </div>
                  <div className="text-[10px] text-zinc-400 dark:text-zinc-500 border-t border-zinc-100 dark:border-zinc-800/80 pt-2">
                    Schedule: <span className="font-semibold text-zinc-700 dark:text-zinc-400">{activePlan?.selectedDays?.join(", ") || "None"}</span>
                  </div>
                </div>

                {/* Expiry / Renewal Date */}
                <div 
                  className="bg-white dark:bg-zinc-900 p-5 sm:p-6 shadow-sm border border-zinc-200/60 dark:border-zinc-800/80 flex flex-col justify-between min-h-[140px]"
                  style={{ borderRadius: "1.5rem" }}
                >
                  <div className="flex items-center justify-between text-zinc-400 dark:text-zinc-500">
                    <span className="text-[10px] font-bold uppercase tracking-wider">Plan Expiry Date</span>
                    <Calendar className="w-4.5 h-4.5 text-brand-orange-500" />
                  </div>
                  <div>
                    {activePlan ? (
                      <>
                        <p className="text-2xl sm:text-3xl font-extralight text-zinc-900 dark:text-zinc-100 tracking-tight">
                          {new Date(activePlan.endDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        </p>
                      </>
                    ) : (
                      <p className="text-sm font-semibold text-zinc-400 dark:text-zinc-500">No active expiry date</p>
                    )}
                  </div>
                  <div className="text-[10px] text-zinc-400 dark:text-zinc-500 border-t border-zinc-100 dark:border-zinc-800/80 pt-2">
                    Status: <span className="font-bold uppercase text-brand-orange-500">{student.status}</span>
                  </div>
                </div>
              </section>

              {/* Profiles Row */}
              <div className="grid gap-5 md:grid-cols-[300px_1fr] items-start">
                
                {/* Gymnast Identity */}
                <div className="flex flex-col gap-5">
                  <div 
                    className="bg-white dark:bg-zinc-900 p-6 shadow-sm flex flex-col items-center text-center gap-4 border border-zinc-200/60 dark:border-zinc-800/80"
                    style={{ borderRadius: "1.5rem" }}
                  >
                    <StudentAvatar student={student} size={128} />
                    <div>
                      <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-200">
                        {student.name}
                      </h2>
                      <p className="text-sm font-semibold text-zinc-400 dark:text-zinc-500 mt-0.5">
                        TAG{student.studentNumber}
                      </p>
                    </div>
                  </div>
                  <LevelProgress
                    studentId={student.id}
                    studentName={student.name}
                    currentLevel={student.level}
                    canManage={false}
                  />
                </div>

                {/* Gymnast Metadata details card */}
                <div 
                  className="bg-white dark:bg-zinc-900 p-6 shadow-sm space-y-4 border border-zinc-200/60 dark:border-zinc-800/80"
                  style={{ borderRadius: "1.5rem" }}
                >
                  <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-200">
                    Gymnast Details
                  </h3>
                  <dl className="space-y-3.5 text-sm">
                    <div className="flex justify-between gap-2 border-b border-zinc-100 dark:border-zinc-800/50 pb-2.5">
                      <dt className="text-zinc-400 dark:text-zinc-500 shrink-0">Age</dt>
                      <dd className="font-medium text-zinc-900 dark:text-zinc-100 text-right">
                        {formatAge(student.dateOfBirth)}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-2 border-b border-zinc-100 dark:border-zinc-800/50 pb-2.5">
                      <dt className="text-zinc-400 dark:text-zinc-500 shrink-0">Gender</dt>
                      <dd className="font-medium text-zinc-900 dark:text-zinc-100 text-right capitalize">
                        {student.gender}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-2 border-b border-zinc-100 dark:border-zinc-800/50 pb-2.5">
                      <dt className="text-zinc-400 dark:text-zinc-500 shrink-0">DOB</dt>
                      <dd className="font-medium text-zinc-900 dark:text-zinc-100 text-right">
                        {new Date(student.dateOfBirth).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-2 border-b border-zinc-100 dark:border-zinc-800/50 pb-2.5">
                      <dt className="text-zinc-400 dark:text-zinc-500 shrink-0">Parent Name</dt>
                      <dd className="font-medium text-zinc-900 dark:text-zinc-100 text-right">
                        {student.parentName}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-2 border-b border-zinc-100 dark:border-zinc-800/50 pb-2.5">
                      <dt className="text-zinc-400 dark:text-zinc-500 shrink-0">Parent Contact</dt>
                      <dd className="font-medium text-zinc-900 dark:text-zinc-100 text-right">
                        {student.contactNumber}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt className="text-zinc-400 dark:text-zinc-500 shrink-0">Joined Academy</dt>
                      <dd className="font-medium text-zinc-900 dark:text-zinc-100 text-right">
                        {new Date(student.admissionDate).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </dd>
                    </div>
                  </dl>
                </div>

              </div>
            </div>
          )}

          {/* TAB 2: ATTENDANCE */}
          {activeTab === "attendance" && (
            <div className="animate-fade-in">
              <div 
                className="bg-white dark:bg-zinc-900 p-5 shadow-sm space-y-4 border border-zinc-200/60 dark:border-zinc-800/80"
                style={{ borderRadius: "1.5rem" }}
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-[11px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                    Attendance &amp; Schedule
                  </h2>
                  <div className="flex items-center gap-3.5">
                    {activePlan && (
                      <span className="text-xs text-zinc-400 dark:text-zinc-500 hidden sm:inline">
                        Plan period: {new Date(activePlan.startDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })} to {new Date(activePlan.endDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </span>
                    )}
                    {attendances.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setShowLogs(!showLogs)}
                        className="text-xs font-semibold text-brand-orange-500 hover:text-brand-orange-600 transition-colors cursor-pointer"
                      >
                        {showLogs ? "Hide logs" : "Show logs"}
                      </button>
                    )}
                  </div>
                </div>

                <div className={showLogs ? "grid gap-6 lg:grid-cols-[1fr_260px]" : "w-full"}>
                  
                  {/* Calendar months grid */}
                  <div className="flex flex-col min-w-0 justify-between">
                    <div className="flex gap-6 overflow-x-auto px-2 pb-4 scrollbar-thin snap-x">
                      {calendarMonths.map(({ year, month }) => {
                        const monthName = new Date(year, month, 1).toLocaleDateString("en-IN", {
                          month: "long",
                          year: "numeric",
                        });
                        const firstDay = new Date(year, month, 1).getDay();
                        const daysInMonth = new Date(year, month + 1, 0).getDate();
                        const cells = [
                          ...Array(firstDay).fill(null),
                          ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
                        ];

                        return (
                          <div key={`${year}-${month}`} className="w-[260px] shrink-0 snap-start">
                            <div className="text-center pb-2 border-b border-zinc-100 dark:border-zinc-850 mb-2">
                              <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                                {monthName}
                              </span>
                            </div>

                            <div className="grid grid-cols-7 text-center text-[9px] font-bold text-zinc-400 dark:text-zinc-550 uppercase pb-1">
                              {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
                                <span key={d}>{d}</span>
                              ))}
                            </div>

                            <div className="grid grid-cols-7 gap-1">
                              {cells.map((day, idx) => {
                                if (!day) return <div key={`empty-${idx}`} />;
                                const dateKey = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                                const isPresent = attendanceDatesSet.has(dateKey);
                                const isFrozen = isFrozenDate(year, month, day);
                                const isClass = isClassDay(year, month, day);
                                const isToday = dateKey === todayYMD;

                                // Find session index for session numbering
                                const sessionIdx = attendances.findIndex((a: any) => toYMD(a.date) === dateKey);
                                const sessionNum = sessionIdx !== -1 ? sessionIdx + 1 : null;

                                let cellStyle = "text-zinc-400 dark:text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800/40";
                                if (isPresent) {
                                  cellStyle = "bg-brand-orange-500 text-white font-bold shadow-xs";
                                } else if (isFrozen) {
                                  cellStyle = "bg-sky-50/60 dark:bg-sky-950/20 text-sky-700 dark:text-sky-400 font-semibold border border-sky-500/10";
                                } else if (isClass) {
                                  cellStyle = "bg-brand-orange-50/60 dark:bg-brand-orange-950/20 text-brand-orange-700 dark:text-brand-orange-400 font-semibold border border-brand-orange-500/10";
                                }

                                return (
                                  <div
                                    key={dateKey}
                                    className={`flex flex-col items-center justify-center h-8 rounded-lg text-[10px] transition-colors relative cursor-default ${cellStyle} ${
                                      isToday ? "ring-2 ring-zinc-950 dark:ring-zinc-100 ring-offset-1 dark:ring-offset-zinc-900" : ""
                                    }`}
                                  >
                                    {isPresent && sessionNum !== null ? (
                                      <div className="flex flex-col items-center justify-center leading-none">
                                        <span className="text-[11px] font-bold">S{sessionNum}</span>
                                        <span className="text-[7px] opacity-80 font-normal mt-0.5">{day}</span>
                                      </div>
                                    ) : isFrozen ? (
                                      <div className="flex flex-col items-center justify-center leading-none">
                                        <Snowflake className="w-3 h-3 text-sky-400" />
                                        <span className="text-[7px] opacity-80 font-normal mt-0.5">{day}</span>
                                      </div>
                                    ) : (
                                      <span className="leading-none">{day}</span>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Legend */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-zinc-100 dark:border-zinc-800 mt-2 pt-3 text-[10px] text-zinc-400 dark:text-zinc-550">
                      <div className="flex items-center gap-1.5">
                        <span className="inline-block w-2.5 h-2.5 rounded bg-brand-orange-500" />
                        <span>Attended Class</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="inline-block w-2.5 h-2.5 rounded bg-brand-orange-200 dark:bg-brand-orange-850" />
                        <span>Scheduled Class Days</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="inline-block w-2.5 h-2.5 rounded bg-sky-400 dark:bg-sky-600" />
                        <span>Frozen/Holiday</span>
                      </div>
                    </div>
                  </div>

                  {/* Logs list panels */}
                  {showLogs && (
                    <div className="flex flex-col min-w-0 lg:border-l lg:border-zinc-100 lg:dark:border-zinc-800 lg:pl-6">
                      <div className="space-y-1 overflow-y-auto max-h-[300px] pr-1">
                        {attendances.length === 0 ? (
                          <p className="text-sm text-zinc-400 dark:text-zinc-550 py-10 text-center">
                            No sessions attended yet.
                          </p>
                        ) : (
                          attendances
                            .slice()
                            .reverse()
                            .map((a: any, idx: number) => {
                              const sessionIndex = attendances.length - idx;
                              return (
                                <div
                                  key={a.id}
                                  className="flex items-center gap-3 rounded-2xl px-3 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors"
                                >
                                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-orange-50 dark:bg-brand-orange-950/40 text-brand-orange-600 dark:text-brand-orange-400 text-[11px] font-bold shrink-0">
                                    {sessionIndex}
                                  </span>
                                  <div className="min-w-0">
                                    <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wide">
                                      Session {sessionIndex}
                                    </p>
                                    <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 truncate">
                                      {new Date(a.date).toLocaleDateString("en-IN", {
                                        day: "numeric",
                                        month: "long",
                                        year: "numeric",
                                      })}
                                    </p>
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
            </div>
          )}

          {/* TAB 3: BILLING */}
          {activeTab === "billing" && (
            <div className="space-y-8 animate-fade-in">
              {/* Current plan card */}
              {activePlan ? (
                <div 
                  className="bg-white dark:bg-zinc-900 p-6 shadow-sm space-y-6 transition-colors border border-zinc-200/60 dark:border-zinc-800/80"
                  style={{ borderRadius: "1.5rem" }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                        Current plan
                      </h3>
                    </div>
                    {activePlan.discountPercent > 0 && (
                      <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 px-2.5 py-1 rounded-lg">
                        {activePlan.discountPercent}% off
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 min-[1200px]:grid-cols-2 gap-8">
                    
                    {/* Column 1: Batch Details */}
                    <div className="space-y-2 min-w-0 flex flex-col h-full">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 block">
                        Batch Details
                      </span>
                      <div className="rounded-2xl bg-zinc-100 dark:bg-zinc-950/60 p-6 text-sm flex flex-col gap-8 flex-1 min-h-[240px]">
                        <div className="grid grid-cols-2 gap-x-8 gap-y-8">
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 block mb-1.5">
                              Class Type
                            </span>
                            <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                              {activePlan.planType === "ONE_TO_ONE" ? "Personal" : "Grouped"}
                            </p>
                          </div>

                          {activePlan.batch && (
                            <>
                              <div>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 block mb-1.5">
                                  Batch
                                </span>
                                <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                                  {activePlan.batch.name}
                                </p>
                              </div>
                              <div className="col-span-2">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 block mb-1.5">
                                  Timing
                                </span>
                                <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                                  {activePlan.batch.timing}
                                </p>
                              </div>
                            </>
                          )}
                        </div>

                        {Array.isArray(activePlan.selectedDays) && activePlan.selectedDays.length > 0 && (
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 block">
                              Schedule
                            </span>
                            <div className="flex flex-wrap gap-1 mt-0.5">
                              {activePlan.selectedDays.map((day: string) => (
                                <span
                                  key={day}
                                  className="text-xs font-bold rounded-lg px-2.5 py-1 bg-brand-orange-50/60 dark:bg-brand-orange-950/25 text-brand-orange-600 dark:text-brand-orange-400"
                                >
                                  {day.substring(0, 3)}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Column 2: Plan Duration & Progress */}
                    <div className="space-y-2 min-w-0 flex flex-col h-full">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 block">
                        Plan Duration &amp; Progress
                      </span>
                      <div className="rounded-2xl bg-zinc-100 dark:bg-zinc-950/60 p-6 text-sm flex flex-col gap-8 flex-1 min-h-[240px]">
                        <div className="grid grid-cols-2 gap-x-8 gap-y-8">
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 block mb-1.5">
                              Start Date
                            </span>
                            <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                              {new Date(activePlan.startDate).toLocaleDateString("en-IN", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })}
                            </p>
                          </div>

                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 block mb-1.5">
                              End Date
                            </span>
                            <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                              {new Date(activePlan.endDate).toLocaleDateString("en-IN", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })}
                            </p>
                          </div>

                          <div className="col-span-2">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 block mb-1.5">
                              Expiry Date
                            </span>
                            <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200 mt-0.5">
                              {new Date(activePlan.expiryDate).toLocaleDateString("en-IN", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })}
                            </p>
                          </div>
                        </div>

                        {/* Progress bar */}
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 block mb-1.5">
                            Sessions Completion
                          </span>
                          <div className="flex items-center justify-between text-xs font-semibold text-zinc-900 dark:text-zinc-200 max-w-xs">
                            <span>
                              {activePlan.sessionsCompleted} / {activePlan.totalSessions} completed
                            </span>
                            <span className="font-bold text-brand-orange-500">
                              {activePlan.totalSessions - activePlan.sessionsCompleted} left
                            </span>
                          </div>
                          <div className="relative h-6 w-full max-w-xs rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden mt-1.5">
                            <div
                              className="h-full rounded-full bg-brand-orange-500 transition-all duration-550 flex items-center justify-center text-[10px] font-bold text-white px-2"
                              style={{ width: `${Math.min(100, Math.round((activePlan.sessionsCompleted / activePlan.totalSessions) * 100))}%` }}
                            >
                              {Math.round((activePlan.sessionsCompleted / activePlan.totalSessions) * 100) > 15 && 
                                `${Math.round((activePlan.sessionsCompleted / activePlan.totalSessions) * 100)}%`}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Pricing Details Row */}
                    <div className="space-y-2 min-[1200px]:col-span-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 block">
                        Pricing Details
                      </span>
                      <div className="rounded-2xl bg-zinc-100 dark:bg-zinc-950/60 p-6">
                        <div className="grid grid-cols-3 gap-8">
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 block mb-1.5">
                              Total Fee
                            </span>
                            <p className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mt-0.5">
                              {INR(activePlan.fee)}
                            </p>
                            <div className="mt-1">
                              {(typeof activePlan.outstanding === "number" ? activePlan.outstanding : activePlan.fee) <= 0 ? (
                                <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                                  Paid
                                </span>
                              ) : (
                                <span className="text-xs font-bold text-rose-500 dark:text-rose-400">
                                  {INR(typeof activePlan.outstanding === "number" ? activePlan.outstanding : activePlan.fee)} due
                                </span>
                              )}
                            </div>
                          </div>
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 block mb-1.5">
                              Per Session
                            </span>
                            <p className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mt-0.5">
                              {activePlan.totalSessions > 0
                                ? INR(Math.round(activePlan.fee / activePlan.totalSessions))
                                : "—"}
                            </p>
                          </div>
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 block mb-1.5">
                              Discount Applied
                            </span>
                            <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                              {activePlan.discountPercent > 0
                                ? `${activePlan.discountPercent}% off`
                                : "—"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              ) : (
                <div 
                  className="bg-white dark:bg-zinc-900 shadow-sm flex flex-col items-center justify-center text-center gap-5 py-16 px-8 animate-fade-in border border-zinc-200/60 dark:border-zinc-800/80"
                  style={{ borderRadius: "1.5rem" }}
                >
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
                    <span className="text-zinc-400 dark:text-zinc-550 text-xl font-bold">Plan</span>
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                      No active membership plan
                    </h3>
                    <p className="text-sm text-zinc-400 dark:text-zinc-500 max-w-[240px]">
                      Gymnast does not have an active membership plan. Contact the office.
                    </p>
                  </div>
                </div>
              )}

              {/* Payment history list */}
              <div className="animate-fade-in">
                <PaymentHistory
                  payments={student.payments}
                  studentId={student.id}
                  onPrint={handlePrint}
                />
              </div>
            </div>
          )}
        </div>
      </main>
    </div>

    {/* 5. MOBILE BOTTOM NAVIGATION */}
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-sm pb-[env(safe-area-inset-bottom)]"
      aria-label="Main navigation"
    >
      <div className="flex h-14 items-center px-2 gap-1 justify-around">
        <button
          onClick={() => setActiveTab("overview")}
          className={`flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium flex-1 cursor-pointer py-1 ${
            activeTab === "overview" ? "text-brand-orange-500 font-bold" : "text-zinc-550 dark:text-zinc-400"
          }`}
        >
          <Home className="h-4.5 w-4.5 shrink-0" />
          Overview
        </button>
        <button
          onClick={() => setActiveTab("attendance")}
          className={`flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium flex-1 cursor-pointer py-1 ${
            activeTab === "attendance" ? "text-brand-orange-500 font-bold" : "text-zinc-550 dark:text-zinc-400"
          }`}
        >
          <CheckCircle2 className="h-4.5 w-4.5 shrink-0" />
          Attendance
        </button>
        <button
          onClick={() => setActiveTab("billing")}
          className={`flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium flex-1 cursor-pointer py-1 ${
            activeTab === "billing" ? "text-brand-orange-500 font-bold" : "text-zinc-550 dark:text-zinc-400"
          }`}
        >
          <FileText className="h-4.5 w-4.5 shrink-0" />
          Billing
        </button>
      </div>
    </nav>

    {/* 6. PRINT PREVIEW CONTAINER */}
      {printData && (
        <>
          <style dangerouslySetInnerHTML={{__html: `
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
              #parent-print-receipt-container,
              #parent-print-receipt-container * {
                visibility: visible !important;
              }
              #parent-print-receipt-container {
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
          `}} />
          <div
            id="parent-print-receipt-container"
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
