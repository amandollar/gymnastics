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
  Calendar,
  Info,
  Dumbbell,
  GraduationCap,
  User,
  Bell,
  BellOff,
  X
} from "lucide-react";
import { getPaymentByIdAction } from "@/lib/actions/payments";
import { FeeReceipt } from "@/app/admin/_components/students/studentProfile/FeeReceipt";
import { changePortalPasswordAction } from "@/lib/actions/students";
import { LevelProgress } from "@/app/admin/_components/students/studentProfile/LevelProgress";
import { PaymentHistory } from "@/app/admin/_components/students/studentProfile/PaymentHistory";
import StudentAvatar from "@/app/admin/_components/students/StudentAvatar";
import { formatAge } from "@/lib/utils/student";
import { markNotificationsAsReadAction } from "@/lib/actions/notifications";

interface PortalDashboardClientProps {
  student: any;
  academyProfile: any;
  initialNotifications?: any[];
}

export default function PortalDashboardClient({
  student,
  academyProfile,
  initialNotifications = [],
}: PortalDashboardClientProps) {
  const [printData, setPrintData] = useState<any | null>(null);
  const [isChangingPassword, setIsChangingPassword] = useState(student.isTempPassword);
  const [showLogs, setShowLogs] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "attendance" | "billing">("overview");
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);
  const [notifications, setNotifications] = useState(initialNotifications);
  const [showNotifications, setShowNotifications] = useState(false);

  const handleOpenNotifications = async () => {
    setShowNotifications(true);
    if (notifications.some((n: any) => !n.isRead)) {
      setNotifications(prev => prev.map((n: any) => ({ ...n, isRead: true })));
      await markNotificationsAsReadAction(student.id);
    }
  };

  const unreadCount = useMemo(() => notifications.filter((n: any) => !n.isRead).length, [notifications]);

  useEffect(() => {
    const collapsed = localStorage.getItem("portal-sidebar-collapsed") === "true";
    if (collapsed) {
      setTimeout(() => {
        setIsCollapsed(true);
      }, 0);
    }
  }, []);

  const toggleCollapse = () => {
    const nextState = !isCollapsed;
    setIsCollapsed(nextState);
    localStorage.setItem("portal-sidebar-collapsed", String(nextState));
  };

  const portalInitials = useMemo(() => {
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
      const res = await changePortalPasswordAction(student.id, currentPassword, newPassword);
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
    signOut({ callbackUrl: "/portal/login" });
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

  const remainingSessions = activePlan
    ? Math.max(0, activePlan.totalSessions - activePlan.sessionsCompleted)
    : 0;
  const progressPercentage = activePlan
    ? Math.min(
        100,
        Math.round((activePlan.sessionsCompleted / Math.max(activePlan.totalSessions, 1)) * 100)
      )
    : 0;
  const scheduleDays = Array.isArray(activePlan?.selectedDays) ? activePlan.selectedDays : [];
  const schedulePreview = scheduleDays.length ? scheduleDays.slice(0, 2).join(" • ") : "No schedule";
  const fullSchedule = scheduleDays.length ? scheduleDays.join(", ") : "No schedule set";
  const planEndLabel = activePlan
    ? new Date(activePlan.endDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })
    : "—";

  const toggleTooltip = (key: string) => {
    setActiveTooltip((prev) => (prev === key ? null : key));
  };

  return (
    <div className="dark min-h-[100dvh] bg-[#0c0c0e] text-zinc-100 flex flex-col md:flex-row gap-0 font-sans antialiased">
      
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
                  Welcome to the Portal! Because this is your first time logging in, please replace the temporary password with a secure, custom one of your choice.
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
                  <p className="truncate text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Portal</p>
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


        {/* Bottom User Card */}
        <div className="p-3 bg-zinc-50/50 dark:bg-zinc-900/10 flex items-center justify-between">
          <div className={`flex items-center gap-3 min-w-0 flex-1 ${isCollapsed ? "justify-center" : ""}`}>
            <div
              onClick={isCollapsed ? handleOpenNotifications : undefined}
              className={`relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-orange-500 text-xs font-bold text-white shadow-2xs ${
                isCollapsed ? "cursor-pointer select-none" : ""
              }`}
            >
              {portalInitials}
              {isCollapsed && unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5 rounded-full bg-brand-orange-500 ring-2 ring-white dark:ring-zinc-950" />
              )}
            </div>
            {!isCollapsed && (
              <div className="min-w-0 flex-1 flex items-center justify-between gap-1">
                <div className="min-w-0 flex-1 flex flex-col">
                  <p className="truncate text-xs font-bold text-zinc-900 dark:text-zinc-100">{student.parentName}</p>
                  <span className="self-start inline-flex items-center rounded-md bg-zinc-150 dark:bg-zinc-800 px-1.5 py-0.5 text-[9px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mt-0.5">
                    Parent
                  </span>
                </div>
                <button
                  onClick={handleOpenNotifications}
                  className="relative flex h-7 w-7 items-center justify-center rounded-lg text-zinc-500 dark:text-zinc-400 hover:text-brand-orange-500 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 transition-all cursor-pointer shrink-0"
                  title="Notifications"
                >
                  <Bell className="h-4.5 w-4.5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-0.5 right-0.5 flex h-2 w-2 rounded-full bg-brand-orange-500 ring-2 ring-white dark:ring-zinc-900" />
                  )}
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
              TAG Portal
            </p>
            <p className="truncate text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
              Academy of Gymnastics
            </p>
          </div>
        </div>

        <button
          onClick={handleOpenNotifications}
          className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:text-brand-orange-500 hover:bg-zinc-55 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          aria-label="Notifications"
        >
          <Bell className="h-4.5 w-4.5" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5 rounded-full bg-brand-orange-500 ring-2 ring-white dark:ring-zinc-950" />
          )}
        </button>
      </header>

      {/* 4. MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 p-4 sm:p-6 lg:p-8 pt-6 sm:pt-6 lg:pt-8 pb-24 md:pb-8 min-w-0 text-zinc-900 dark:text-zinc-100">
          
          {/* Tab Contents */}
          <div className="transition-all duration-300">            {/* TAB 1: OVERVIEW */}
            {activeTab === "overview" && (
              <div className="space-y-6 animate-fade-in max-w-2xl mx-auto">
                
                {/* Mockup Card */}
                <section className="relative overflow-hidden w-full bg-[#121212] border border-zinc-800/60 rounded-[2rem] p-4 sm:p-6 md:p-8 shadow-2xl">
                  {/* Spotlight glow in top-left */}
                  <div className="absolute -top-24 -left-24 w-80 h-80 bg-brand-orange-500/10 rounded-full blur-3xl pointer-events-none" />
                  
                  {/* Logout Button */}
                  <button
                    onClick={handleLogout}
                    className="absolute top-4 right-4 sm:top-5 sm:right-5 text-zinc-500 hover:text-rose-500 hover:bg-rose-950/20 p-2.5 rounded-full transition-all cursor-pointer z-10"
                    title="Logout"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                      {/* Top Profile Header */}
                  <div className="relative flex flex-row items-center gap-4 sm:gap-5 mb-5">
                    {/* Double border avatar */}
                    <div className="relative shrink-0 flex items-center justify-center">
                      <div className="absolute inset-0 rounded-full bg-brand-orange-500/10 blur-md" />
                      {/* Outer orange ring */}
                      <div className="w-[100px] h-[100px] rounded-full border border-brand-orange-500/80 flex items-center justify-center p-1 bg-transparent">
                        {/* Inner gap and avatar */}
                        <div className="w-full h-full rounded-full overflow-hidden border border-zinc-900 bg-[#121212] flex items-center justify-center">
                          <StudentAvatar student={student} size={82} />
                        </div>
                      </div>
                    </div>

                    <div className="text-left">
                      <p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-zinc-500">
                        STUDENT PROFILE
                      </p>
                      <h3 className="mt-1 text-2xl font-bold text-white tracking-tight leading-none">
                        {student.name}
                      </h3>
                      <div className="mt-2.5 flex items-center gap-2">
                        <span className="text-xs font-medium text-zinc-400">
                          TAG{student.studentNumber}
                        </span>
                        <span className="px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider text-brand-orange-500 border border-brand-orange-500 bg-transparent rounded-full">
                          {student.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* SESSIONS USED block */}
                  <div className="mb-4 bg-[#18181a] border border-zinc-800/40 rounded-2xl p-5 flex items-center justify-between shadow-inner">
                    <div>
                      <span className="text-[10px] font-semibold text-zinc-555 dark:text-zinc-500 uppercase tracking-widest block mb-1.5">
                        SESSIONS USED
                      </span>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-4xl font-bold text-white leading-none">
                          {activePlan?.sessionsCompleted ?? 0}
                        </span>
                        <span className="text-zinc-555 dark:text-zinc-500 font-semibold text-lg leading-none">
                          / {activePlan?.totalSessions ?? 0}
                        </span>
                      </div>
                    </div>
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-950/20 border border-zinc-800/40 text-zinc-450 dark:text-zinc-400">
                      <Calendar className="h-6 w-6" strokeWidth={1.5} />
                    </div>
                  </div>

                  {/* PLAN PROGRESS block */}
                  <div className="mb-4 bg-[#18181a] border border-zinc-800/40 rounded-2xl p-5 shadow-inner">
                    <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-widest mb-3">
                      <span className="text-zinc-500">Plan Progress</span>
                      <span className="text-brand-orange-500 font-bold">{progressPercentage}%</span>
                    </div>
                    <div className="h-2.5 w-full bg-[#242426] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-brand-orange-500 transition-all duration-500"
                        style={{ width: `${progressPercentage}%` }}
                      />
                    </div>
                  </div>

                  {/* Info Cards Grid (Age, Batch, Class Time) */}
                  <div className="grid grid-cols-2 gap-3 mb-6">
                    {/* Age card */}
                    <div className="col-span-1 bg-[#18181a] border border-zinc-800/40 rounded-2xl p-3 sm:p-4 flex items-center gap-2.5 shadow-inner">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-zinc-950/20 border border-zinc-800/40 text-brand-orange-500">
                        <User className="h-4.5 w-4.5" strokeWidth={1.5} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-[9px] font-semibold text-zinc-555 dark:text-zinc-500 uppercase tracking-widest block mb-0.5">
                          Age
                        </span>
                        <span className="text-xs sm:text-sm font-semibold text-white block">
                          {formatAge(student.dateOfBirth)}
                        </span>
                      </div>
                    </div>

                    {/* Batch card */}
                    <div className="col-span-1 bg-[#18181a] border border-zinc-800/40 rounded-2xl p-3 sm:p-4 flex items-center gap-2.5 shadow-inner">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-zinc-950/20 border border-zinc-800/40 text-brand-orange-500">
                        <GraduationCap className="h-4.5 w-4.5" strokeWidth={1.5} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-[9px] font-semibold text-zinc-555 dark:text-zinc-500 uppercase tracking-widest block mb-0.5">
                          Batch
                        </span>
                        <span className="text-xs sm:text-sm font-semibold text-white block leading-tight" title={activePlan?.batch?.name || "Not assigned"}>
                          {activePlan?.batch?.name || "Not assigned"}
                        </span>
                      </div>
                    </div>

                    {/* Class Time card */}
                    <div className="col-span-1 bg-[#18181a] border border-zinc-800/40 rounded-2xl p-3 sm:p-4 flex items-center gap-2.5 shadow-inner">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-zinc-950/20 border border-zinc-800/40 text-brand-orange-500">
                        <Clock className="h-4.5 w-4.5" strokeWidth={1.5} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-[9px] font-semibold text-zinc-555 dark:text-zinc-500 uppercase tracking-widest block mb-0.5">
                          Class Time
                        </span>
                        <span className="text-xs sm:text-sm font-semibold text-white block leading-tight" title={activePlan?.batch?.timing || "Contact office"}>
                          {activePlan?.batch?.timing || "Contact office"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Dumbbell Footer divider */}
                  <div className="relative flex items-center justify-center my-7">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-zinc-800/50" />
                    </div>
                    <div className="relative bg-[#121212] px-4 text-[#f16d28]">
                      <Dumbbell className="w-5 h-5 shrink-0" strokeWidth={1.5} />
                    </div>
                  </div>
                  
                  <p className="text-center text-[10px] font-semibold text-zinc-555 dark:text-zinc-500 tracking-[0.25em] uppercase">
                    Stay consistent, see results.
                  </p>
                </section>

                {/* Training Focus & Emphasis Section */}
                {student.trainingFocus && (
                  <div className="rounded-3xl border border-brand-orange-500/20 bg-[#121212] p-6 shadow-sm relative overflow-hidden group">
                    <div className="absolute right-0 top-0 h-24 w-24 translate-x-4 -translate-y-4 rounded-full bg-[#f16d28]/5 blur-xl pointer-events-none" />
                    <div className="flex items-center gap-3">
                      <span className="p-2 rounded-xl bg-[#f16d28]/10 text-[#f16d28] shrink-0">
                        <Dumbbell className="h-5 w-5" />
                      </span>
                      <div>
                        <h3 className="text-sm font-bold text-white uppercase tracking-wider text-[11px]">
                          Academy Training Focus &amp; Emphasis
                        </h3>
                        <p className="text-[9px] text-zinc-500 uppercase tracking-widest mt-0.5 font-semibold">
                          Current Emphasis for {student.name}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 border-t border-zinc-800/60 pt-3.5">
                      <p className="text-zinc-300 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap">
                        {student.trainingFocus}
                      </p>
                    </div>
                  </div>
                )}

                {/* Level Progress & Important Details */}
                <div className="grid gap-6 md:grid-cols-[1.1fr_0.9fr]">
                  <LevelProgress
                    studentId={student.id}
                    studentName={student.name}
                    currentLevel={student.level}
                    canManage={false}
                  />

                  <section className="relative rounded-3xl border border-zinc-800/40 bg-[#121212] p-5 shadow-sm">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-sm font-semibold text-white">Important details</h3>
                      <button
                        type="button"
                        onClick={() => toggleTooltip("contact")}
                        className="rounded-full p-1 text-zinc-400 hover:text-zinc-200"
                        aria-label="More about contact details"
                      >
                        <Info className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    {activeTooltip === "contact" && (
                      <div className="absolute right-4 top-12 z-20 w-56 rounded-2xl border border-zinc-800 bg-zinc-950 p-3 shadow-xl">
                        <p className="text-xs text-zinc-300">Use the phone number to quickly contact the office or parent support team.</p>
                      </div>
                    )}
                    <dl className="mt-4 space-y-3.5 text-sm">
                      <div className="flex items-center justify-between gap-3 border-b border-zinc-800/60 pb-2.5">
                        <dt className="text-zinc-500 font-medium">Gender</dt>
                        <dd className="font-semibold text-zinc-200 capitalize">{student.gender}</dd>
                      </div>
                      <div className="flex items-center justify-between gap-3 border-b border-zinc-800/60 pb-2.5">
                        <dt className="text-[#6c6c70] font-medium">DOB</dt>
                        <dd className="font-semibold text-zinc-200">
                          {new Date(student.dateOfBirth).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        </dd>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <dt className="text-zinc-500 font-medium">Parent contact</dt>
                        <dd className="font-semibold text-right">
                          <a href={`tel:${student.contactNumber}`} className="text-brand-orange-500 hover:underline">{student.contactNumber}</a>
                        </dd>
                      </div>
                    </dl>
                  </section>
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
            <div className="space-y-6 animate-fade-in max-w-2xl mx-auto">
              {/* Admission Receipt */}
              {student.registrationFee && student.registrationFee > 0 && (
                <div className="relative overflow-hidden w-full bg-[#121212] border border-zinc-800/60 rounded-[2rem] p-5 shadow-2xl">
                  <div className="absolute -top-24 -left-24 w-80 h-80 bg-brand-orange-500/5 rounded-full blur-3xl pointer-events-none" />
                  <div className="relative flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
                        One-Time Admission Fee
                      </p>
                      <h3 className="mt-1 text-base font-bold text-white">
                        Registration Receipt
                      </h3>
                    </div>
                    <a
                      href="/portal/admission-receipt"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-850 bg-[#18181a] px-3.5 py-2 text-xs font-semibold text-zinc-300 hover:text-white hover:border-brand-orange-500/50 transition-colors shadow-sm cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5 text-zinc-400" />
                      View Receipt
                    </a>
                  </div>
                  <div className="relative mt-4 flex items-center justify-between text-xs bg-[#18181a] border border-zinc-800/40 rounded-xl p-3 shadow-inner">
                    <span className="text-zinc-400 font-medium">Amount Paid</span>
                    <span className="font-bold text-white">{INR(student.registrationFee)}</span>
                  </div>
                </div>
              )}

              {/* Current plan card */}
              {activePlan ? (
                <div className="relative overflow-hidden w-full bg-[#121212] border border-zinc-800/60 rounded-[2rem] p-5 sm:p-6 shadow-2xl">
                  {/* Spotlight glow */}
                  <div className="absolute -top-24 -left-24 w-80 h-80 bg-brand-orange-500/10 rounded-full blur-3xl pointer-events-none" />
                  
                  <div className="relative flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
                        Billing overview
                      </p>
                      <h3 className="mt-1 text-base font-bold text-white">
                        Current Plan
                      </h3>
                    </div>
                    {activePlan.discountPercent > 0 && (
                      <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 text-[10px] font-semibold text-emerald-400 shrink-0">
                        {activePlan.discountPercent}% off
                      </span>
                    )}
                  </div>

                  <div className="relative mt-5 grid grid-cols-3 gap-2.5 sm:gap-4">
                    <div className="rounded-2xl bg-[#18181a] border border-zinc-800/40 p-3 sm:p-4 shadow-inner flex flex-col justify-between">
                      <p className="text-[9px] uppercase tracking-wider text-zinc-500 font-semibold">Total Fee</p>
                      <p className="mt-1 text-lg xs:text-xl sm:text-2xl font-bold text-white">{INR(activePlan.fee)}</p>
                      <p className={`mt-1.5 text-[9px] font-bold uppercase tracking-wider ${
                        (typeof activePlan.outstanding === "number" ? activePlan.outstanding : activePlan.fee) <= 0
                          ? "text-emerald-400"
                          : "text-rose-400"
                      }`}>
                        {(typeof activePlan.outstanding === "number" ? activePlan.outstanding : activePlan.fee) <= 0
                          ? "Paid"
                          : `${INR(typeof activePlan.outstanding === "number" ? activePlan.outstanding : activePlan.fee)} due`}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-[#18181a] border border-zinc-800/40 p-3 sm:p-4 shadow-inner flex flex-col justify-between">
                      <p className="text-[9px] uppercase tracking-wider text-zinc-500 font-semibold">Per Session</p>
                      <p className="mt-1 text-lg xs:text-xl sm:text-2xl font-bold text-white">
                        {activePlan.totalSessions > 0 ? INR(Math.round(activePlan.fee / activePlan.totalSessions)) : "—"}
                      </p>
                      <span className="mt-1.5 text-[9px] text-zinc-500 font-semibold uppercase tracking-wider">Avg. Rate</span>
                    </div>
                    <div className="rounded-2xl bg-[#18181a] border border-zinc-800/40 p-3 sm:p-4 shadow-inner flex flex-col justify-between">
                      <p className="text-[9px] uppercase tracking-wider text-zinc-500 font-semibold">Discount</p>
                      <p className="mt-1 text-lg xs:text-xl sm:text-2xl font-bold text-emerald-400">
                        {activePlan.discountPercent > 0 ? `${activePlan.discountPercent}%` : "—"}
                      </p>
                      <span className="mt-1.5 text-[9px] text-zinc-500 font-semibold uppercase tracking-wider">Saved</span>
                    </div>
                  </div>

                  <div className="relative mt-4 grid gap-4 sm:grid-cols-2">
                    <section className="rounded-2xl bg-[#18181a] border border-zinc-800/40 p-4 shadow-inner">
                      <h4 className="text-[9px] font-semibold uppercase tracking-[0.2em] text-zinc-500">Plan details</h4>
                      <dl className="mt-3.5 space-y-3 text-xs">
                        <div className="flex items-center justify-between gap-3 border-b border-zinc-800/50 pb-2">
                          <dt className="text-zinc-400 font-medium">Batch</dt>
                          <dd className="font-bold text-white text-right">{activePlan.batch?.name || "—"}</dd>
                        </div>
                        <div className="flex items-center justify-between gap-3 border-b border-zinc-800/50 pb-2">
                          <dt className="text-zinc-400 font-medium">Timing</dt>
                          <dd className="font-bold text-white text-right">{activePlan.batch?.timing || "—"}</dd>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <dt className="text-zinc-400 font-medium">Type</dt>
                          <dd className="font-bold text-white text-right">{activePlan.planType === "ONE_TO_ONE" ? "Personal" : "Grouped"}</dd>
                        </div>
                      </dl>
                    </section>

                    <section className="rounded-2xl bg-[#18181a] border border-zinc-800/40 p-4 shadow-inner">
                      <h4 className="text-[9px] font-semibold uppercase tracking-[0.2em] text-zinc-500">Schedule</h4>
                      <div className="mt-3 space-y-3.5">
                        <div className="flex flex-wrap gap-1.5">
                          {Array.isArray(activePlan.selectedDays) && activePlan.selectedDays.length > 0 ? (
                            activePlan.selectedDays.map((day: string) => (
                              <span
                                key={day}
                                className="rounded-full bg-brand-orange-500/10 border border-brand-orange-500/20 px-2 py-0.5 text-[9px] font-bold text-brand-orange-400"
                              >
                                {day.substring(0, 3)}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-zinc-500">No schedule set</span>
                          )}
                        </div>
                        <div className="flex items-center justify-between gap-3 text-xs border-b border-zinc-800/50 pb-2">
                          <span className="text-zinc-400 font-medium">Start</span>
                          <span className="font-bold text-white">
                            {new Date(activePlan.startDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-3 text-xs">
                          <span className="text-zinc-400 font-medium">Ends</span>
                          <span className="font-bold text-white">
                            {new Date(activePlan.endDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                          </span>
                        </div>
                      </div>
                    </section>
                  </div>

                  <section className="relative mt-4 rounded-2xl bg-[#18181a] border border-zinc-800/40 p-4 shadow-inner">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-[9px] font-semibold uppercase tracking-wider text-zinc-500">Progress</p>
                        <p className="mt-1 text-xs font-bold text-white">
                          {activePlan.sessionsCompleted} / {activePlan.totalSessions} sessions
                        </p>
                      </div>
                      <span className="text-xs font-bold text-brand-orange-500">
                        {activePlan.totalSessions - activePlan.sessionsCompleted} left
                      </span>
                    </div>
                    <div className="mt-3 h-2.5 rounded-full bg-[#242426] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-brand-orange-500 transition-all duration-500"
                        style={{ width: `${Math.min(100, Math.round((activePlan.sessionsCompleted / Math.max(activePlan.totalSessions, 1)) * 100))}%` }}
                      />
                    </div>
                  </section>
                </div>
              ) : (
                <div className="relative overflow-hidden w-full bg-[#121212] border border-zinc-800/60 rounded-[2rem] flex flex-col items-center justify-center text-center gap-5 py-16 px-8 shadow-2xl">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#18181a] border border-zinc-800/50 text-[#f16d28]">
                    <Dumbbell className="w-7 h-7" strokeWidth={1.5} />
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="text-base font-bold text-white">
                      No active membership plan
                    </h3>
                    <p className="text-xs text-zinc-400 max-w-[240px]">
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
                  registrationFee={student.registrationFee}
                  admissionReceiptUrl="/portal/admission-receipt"
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
              #portal-print-receipt-container,
              #portal-print-receipt-container * {
                visibility: visible !important;
              }
              #portal-print-receipt-container {
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
            id="portal-print-receipt-container"
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

      {/* 7. NOTIFICATIONS POPUP MODAL */}
      {showNotifications && (
        <div className="fixed inset-0 z-55 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in animate-duration-200">
          <div
            className="w-full max-w-md bg-[#121212] border border-zinc-800 rounded-[2rem] p-5 shadow-2xl relative overflow-hidden flex flex-col max-h-[85vh] animate-scale-in animate-duration-200"
            style={{ boxShadow: "0 32px 64px -12px rgba(0,0,0,0.5)" }}
          >
            {/* Background Glow */}
            <div className="absolute -top-24 -left-24 w-80 h-80 bg-brand-orange-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Header */}
            <div className="relative flex items-center justify-between pb-4 border-b border-zinc-800/60 mb-4">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-brand-orange-500" />
                <h3 className="text-base font-bold text-white leading-tight">Notifications</h3>
              </div>
              <button
                onClick={() => setShowNotifications(false)}
                className="flex items-center justify-center w-8 h-8 rounded-xl bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-400 hover:text-white transition-all cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Notification items */}
            <div className="relative overflow-y-auto pr-1 flex-1 scrollbar-thin">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center gap-4 py-16 px-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#18181a] border border-zinc-850 text-zinc-500">
                    <BellOff className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-zinc-300">No notifications yet</h4>
                    <p className="text-xs text-zinc-500 max-w-[220px]">
                      Alerts and announcements from the academy will appear here.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {notifications.map((n: any) => (
                    <div
                      key={n.id}
                      className="bg-[#18181a] border border-zinc-850 p-4 rounded-2xl shadow-inner relative flex flex-col"
                    >
                      <div className="text-xs text-zinc-200 leading-relaxed font-semibold">
                        {n.message}
                      </div>
                      <span className="text-[9px] text-zinc-550 font-medium uppercase mt-2.5 block tracking-wider">
                        {new Date(n.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}


