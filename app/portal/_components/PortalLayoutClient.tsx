"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { STUDENT_LEVELS, getLevelConfig } from "@/lib/utils/level";
import QRCode from "qrcode";
import {
  Home,
  CheckCircle2,
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
  Bell,
  Info,
  X,
  BellOff,
  ChevronRight,
  IdCard,
  LogOut,
  Snowflake
} from "lucide-react";
import StudentAvatar from "@/app/admin/_components/students/StudentAvatar";
import ThemeSelector from "@/app/admin/_components/layout/ThemeSelector";
import { markNotificationsAsReadAction } from "@/lib/actions/notifications";

interface PortalLayoutClientProps {
  student: any;
  siblings: any[];
  academyProfile: any;
  initialNotifications: any[];
  children: React.ReactNode;
}

export default function PortalLayoutClient({
  student,
  siblings,
  academyProfile,
  initialNotifications = [],
  children,
}: PortalLayoutClientProps) {
  const pathname = usePathname();
  const router = useRouter();

  const [isSubdomain, setIsSubdomain] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const host = window.location.hostname;
      if (host === "portal.localhost" || host.startsWith("portal.")) {
        setIsSubdomain(true);
      }
    }
  }, []);

  const getLinkHref = (path: string) => {
    if (isSubdomain) {
      return path.replace(/^\/portal/, "") || "/";
    }
    return path;
  };

  const activeTab = useMemo(() => {
    if (!pathname) return "overview";
    if (
      pathname === "/portal/attendance" ||
      pathname.startsWith("/portal/attendance/") ||
      pathname === "/attendance" ||
      pathname.startsWith("/attendance/")
    ) {
      return "attendance";
    }
    if (
      pathname === "/portal/settings" ||
      pathname.startsWith("/portal/settings/") ||
      pathname === "/settings" ||
      pathname.startsWith("/settings/")
    ) {
      return "settings";
    }
    return "overview";
  }, [pathname]);

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [notifications, setNotifications] = useState(initialNotifications);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showIDCardModal, setShowIDCardModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  const [frontQr, setFrontQr] = useState<string>("");
  const [backQr, setBackQr] = useState<string>("");

  const [showLevelUp, setShowLevelUp] = useState(false);
  const [prevLevel, setPrevLevel] = useState<string | null>(null);
  const confettiRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number | null>(null);

  const BADGE_IMAGES = [
    "/badges/B0.webp", // BEGINNER
    "/badges/F1.webp", // FOUNDATION_1
    "/badges/F2.webp", // FOUNDATION_2
    "/badges/F3.webp", // FOUNDATION_3
    "/badges/F4.webp", // NATIONAL_4
    "/badges/F5.webp", // NATIONAL_5
    "/badges/F6.webp", // NATIONAL_6
    "/badges/F7.webp", // NATIONAL_7
  ];

  const LEVEL_QUOTES: Record<string, string> = {
    BEGINNER: "Every champion was once a beginner.",
    FOUNDATION_1: "Building the foundation of greatness.",
    FOUNDATION_2: "Stronger every single day.",
    FOUNDATION_3: "The roots are growing deep.",
    NATIONAL_4: "Rising to national standards.",
    NATIONAL_5: "Excellence is becoming a habit.",
    NATIONAL_6: "Among the elite. Keep pushing.",
    NATIONAL_7: "You've reached the peak. Stay legendary.",
  };

  const currentIndex = STUDENT_LEVELS.findIndex((l) => l.value === student.level);
  const currentCfg = getLevelConfig(student.level);
  const quote = LEVEL_QUOTES[student.level] ?? "Keep training hard!";

  const getBadgeImage = (idx: number): string => {
    return BADGE_IMAGES[idx] ?? "/icons/logo.webp";
  };

  const levelAccentHex = (activeBg: string): string => {
    const map: Record<string, string> = {
      "bg-zinc-500": "#71717a",
      "bg-sky-500": "#0ea5e9",
      "bg-blue-500": "#3b82f6",
      "bg-indigo-500": "#6366f1",
      "bg-purple-500": "#a855f7",
      "bg-pink-500": "#ec4899",
      "bg-rose-500": "#f43f5e",
      "bg-amber-500": "#f59e0b",
    };
    return map[activeBg] ?? "#f16d28";
  };

  useEffect(() => {
    const key = `portal_level_${student.id}`;
    const stored = localStorage.getItem(key);

    if (stored && stored !== student.level) {
      const storedIndex = STUDENT_LEVELS.findIndex((l) => l.value === stored);
      if (currentIndex > storedIndex) {
        setPrevLevel(stored);
        setShowLevelUp(true);
      }
    }
    localStorage.setItem(key, student.level);
  }, [student.id, student.level, currentIndex]);

  useEffect(() => {
    if (!showLevelUp) return;

    const canvas = confettiRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const COLORS = ["#f16d28", "#ffd700", "#ff6b6b", "#4ecdc4", "#a8edea", "#fff"];
    const particles: {
      x: number; y: number;
      vx: number; vy: number;
      r: number; color: string; alpha: number;
    }[] = Array.from({ length: 180 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height * 0.4,
      vx: (Math.random() - 0.5) * 5,
      vy: Math.random() * 4 + 2,
      r: Math.random() * 6 + 3,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      alpha: 1,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        ctx.globalAlpha = p.alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.08;
        p.alpha -= 0.008;
      });
      if (particles.some((p) => p.alpha > 0)) {
        animFrameRef.current = requestAnimationFrame(draw);
      }
    };
    animFrameRef.current = requestAnimationFrame(draw);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [showLevelUp]);

  const dismissLevelUp = () => setShowLevelUp(false);

  useEffect(() => {
    if (!showIDCardModal) return;

    const attendanceUrl = typeof window !== "undefined"
      ? `${window.location.origin}/admin/students/${student.id}`
      : `/admin/students/${student.id}`;

    QRCode.toDataURL(attendanceUrl, {
      margin: 1,
      width: 220,
      errorCorrectionLevel: "M",
      color: { dark: "#000000", light: "#ffffff" },
    })
      .then((url) => setFrontQr(url))
      .catch((err) => console.error("Front QR generation error:", err));

    QRCode.toDataURL(attendanceUrl, {
      margin: 1,
      width: 300,
      errorCorrectionLevel: "M",
      color: { dark: "#000000", light: "#ffffff" },
    })
      .then((url) => setBackQr(url))
      .catch((err) => console.error("Back QR generation error:", err));
  }, [showIDCardModal, student.id]);

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

  const handleLogout = () => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    signOut({ callbackUrl: `${origin}/login` });
  };

  return (
    <div className="flex min-h-screen bg-[var(--background)] dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 transition-colors duration-300">
      {/* DESKTOP SIDEBAR */}
      <aside
        className={`hidden md:flex flex-col shrink-0 h-[calc(100vh-24px)] my-3 ml-3 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-950 shadow-xs transition-all duration-300 sticky top-3 z-20 ${
          isCollapsed ? "w-16 overflow-visible" : "w-60 overflow-hidden"
        }`}
      >
        {/* Top Header Row */}
        <div className={`flex h-14 items-center px-4 ${
          isCollapsed ? "justify-center" : "justify-between gap-2.5"
        }`}>
          {!isCollapsed ? (
            <>
              <div className="flex items-center gap-1.5 min-w-0">
                <img
                  src="/icons/TAG-preloader-icon.webp"
                  alt="TAG"
                  className="h-[34px] w-auto shrink-0 dark:hidden -mb-[3px]"
                />
                <img
                  src="/icons/TAG-min-dark-icon.webp"
                  alt="TAG"
                  className="h-[34px] w-auto shrink-0 hidden dark:block -mb-[3px]"
                />
                <p className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100 capitalize">portal</p>
              </div>

              <button
                onClick={toggleCollapse}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all cursor-pointer"
                title="Collapse sidebar"
              >
                <PanelLeftClose className="h-4.5 w-4.5" strokeWidth={2} />
              </button>
            </>
          ) : (
            <button
              onClick={toggleCollapse}
              className="flex h-11 w-11 items-center justify-center rounded-xl text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all cursor-pointer"
              title="Expand sidebar"
            >
              <PanelLeftOpen className="h-5 w-5" strokeWidth={2} />
            </button>
          )}
        </div>

        {/* Centered Logo when collapsed */}
        {isCollapsed && (
          <div className="flex justify-center pt-4 pb-2 relative group overflow-visible">
            <Link
              href={getLinkHref("/portal")}
              className="transition-transform hover:scale-105 active:scale-95 shrink-0 block cursor-pointer"
            >
              <img
                src="/icons/TAG-preloader-icon.webp"
                alt="TAG"
                className="h-[34px] w-auto shrink-0 dark:hidden -mb-[3px]"
              />
              <img
                src="/icons/TAG-min-dark-icon.webp"
                alt="TAG"
                className="h-[34px] w-auto shrink-0 hidden dark:block -mb-[3px]"
              />
            </Link>
          </div>
        )}

        {/* Nav List */}
        <div className={`flex-1 pt-2 ${isCollapsed ? "overflow-visible" : "overflow-y-auto"}`}>
          <nav className={`transition-all ${isCollapsed ? "space-y-2 p-1.5" : "space-y-0.5 p-3"}`}>
            {!student.isTempPassword ? (
              <>
                <Link
                  href={getLinkHref("/portal")}
                  prefetch
                  className={`w-full flex items-center ${isCollapsed ? "justify-center" : "gap-2.5"} rounded-lg ${isCollapsed ? "px-2" : "px-3"} ${
                    isCollapsed ? "py-3.5" : "py-2.5"
                  } text-sm font-medium transition-all cursor-pointer relative group ${
                    activeTab === "overview"
                      ? "bg-brand-orange-500/15 dark:bg-brand-orange-500/25 text-brand-orange-600 dark:text-brand-orange-400 font-semibold"
                      : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 hover:text-zinc-900 dark:hover:text-zinc-50"
                  }`}
                >
                  <Home className={`shrink-0 transition-all ${isCollapsed ? "h-5 w-5" : "h-4 w-4"}`} strokeWidth={2} />
                  {!isCollapsed && "Overview"}
                  {isCollapsed && (
                    <span className="pointer-events-none absolute left-full ml-4 z-50 rounded-xl bg-zinc-900 dark:bg-zinc-800 border border-zinc-800 dark:border-zinc-700 px-3 py-1.5 text-xs font-semibold text-white dark:text-zinc-100 opacity-0 group-hover:opacity-100 transition-all duration-200 whitespace-nowrap shadow-md translate-x-1 group-hover:translate-x-0">
                      Overview
                    </span>
                  )}
                </Link>

                <Link
                  href={getLinkHref("/portal/attendance")}
                  prefetch
                  className={`w-full flex items-center ${isCollapsed ? "justify-center" : "gap-2.5"} rounded-lg ${isCollapsed ? "px-2" : "px-3"} ${
                    isCollapsed ? "py-3.5" : "py-2.5"
                  } text-sm font-medium transition-all cursor-pointer relative group ${
                    activeTab === "attendance"
                      ? "bg-brand-orange-500/15 dark:bg-brand-orange-500/25 text-brand-orange-600 dark:text-brand-orange-400 font-semibold"
                      : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 hover:text-zinc-900 dark:hover:text-zinc-50"
                  }`}
                >
                  <CheckCircle2 className={`shrink-0 transition-all ${isCollapsed ? "h-5 w-5" : "h-4 w-4"}`} strokeWidth={2} />
                  {!isCollapsed && "Attendance"}
                  {isCollapsed && (
                    <span className="pointer-events-none absolute left-full ml-4 z-50 rounded-xl bg-zinc-900 dark:bg-zinc-800 border border-zinc-800 dark:border-zinc-700 px-3 py-1.5 text-xs font-semibold text-white dark:text-zinc-100 opacity-0 group-hover:opacity-100 transition-all duration-200 whitespace-nowrap shadow-md translate-x-1 group-hover:translate-x-0">
                      Attendance
                    </span>
                  )}
                </Link>

                <Link
                  href={getLinkHref("/portal/settings")}
                  prefetch
                  className={`w-full flex items-center ${isCollapsed ? "justify-center" : "gap-2.5"} rounded-lg ${isCollapsed ? "px-2" : "px-3"} ${
                    isCollapsed ? "py-3.5" : "py-2.5"
                  } text-sm font-medium transition-all cursor-pointer relative group ${
                    activeTab === "settings"
                      ? "bg-brand-orange-500/15 dark:bg-brand-orange-500/25 text-brand-orange-600 dark:text-brand-orange-400 font-semibold"
                      : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 hover:text-zinc-900 dark:hover:text-zinc-50"
                  }`}
                >
                  <Settings className={`shrink-0 transition-all ${isCollapsed ? "h-5 w-5" : "h-4 w-4"}`} strokeWidth={2} />
                  {!isCollapsed && "Settings"}
                  {isCollapsed && (
                    <span className="pointer-events-none absolute left-full ml-4 z-50 rounded-xl bg-zinc-900 dark:bg-zinc-800 border border-zinc-800 dark:border-zinc-700 px-3 py-1.5 text-xs font-semibold text-white dark:text-zinc-100 opacity-0 group-hover:opacity-100 transition-all duration-200 whitespace-nowrap shadow-md translate-x-1 group-hover:translate-x-0">
                      Settings
                    </span>
                  )}
                </Link>
              </>
            ) : (
              <div className="px-3 py-3 border border-amber-500/20 bg-amber-500/5 dark:bg-amber-500/10 rounded-xl leading-relaxed text-amber-600 dark:text-amber-400 flex flex-col items-center justify-center text-center gap-1">
                <span className="text-[14px]">🔒</span>
                {!isCollapsed && (
                  <span className="text-[10px] font-bold uppercase tracking-wider">
                    Reset Required
                  </span>
                )}
              </div>
            )}
          </nav>
        </div>

        {/* Theme Selector */}
        <ThemeSelector isCollapsed={isCollapsed} />

        {/* Bottom User Card */}
        <div className="p-3 bg-zinc-50/50 dark:bg-zinc-900/10 flex items-center justify-between">
          <div className={`flex items-center gap-3 min-w-0 flex-1 relative group ${isCollapsed ? "justify-center" : ""}`}>
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
            {isCollapsed && (
              <span className="pointer-events-none absolute left-full ml-4 z-50 rounded-xl bg-zinc-900 dark:bg-zinc-800 border border-zinc-800 dark:border-zinc-700 px-3 py-1.5 text-xs font-semibold text-white dark:text-zinc-100 opacity-0 group-hover:opacity-100 transition-all duration-200 whitespace-nowrap shadow-md translate-x-1 group-hover:translate-x-0">
                {student.parentName} (Parent)
              </span>
            )}
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

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 p-4 sm:p-6 lg:p-8 pt-6 sm:pt-6 lg:pt-8 pb-24 md:pb-8 min-w-0 text-zinc-900 dark:text-zinc-100">
          {/* MOBILE HEADER */}
          <header className="flex md:hidden items-center justify-between gap-2 pb-0 mb-6 w-full bg-transparent">
            <div className="flex items-center gap-1.5 min-w-0">
              {activeTab === "overview" ? (
                <>
                  <img
                    src="/icons/TAG-preloader-icon.webp"
                    alt="TAG"
                    className="h-[34px] w-auto shrink-0 dark:hidden -mb-[3px]"
                  />
                  <img
                    src="/icons/TAG-min-dark-icon.webp"
                    alt="TAG"
                    className="h-[34px] w-auto shrink-0 hidden dark:block -mb-[3px]"
                  />
                  <p className="truncate text-lg font-bold text-zinc-900 dark:text-zinc-100 tracking-tight capitalize">
                    portal
                  </p>
                </>
              ) : (
                <p className="truncate text-lg font-bold text-zinc-900 dark:text-zinc-100 tracking-tight capitalize">
                  {activeTab}
                </p>
              )}
            </div>

            {activeTab !== "settings" && (
              <div className="flex items-center gap-2">
                {activeTab === "attendance" ? (
                  <button
                    type="button"
                    onClick={() => setShowTermsModal(true)}
                    className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-655 dark:text-zinc-400 hover:text-brand-orange-500 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                    aria-label="View Terms"
                  >
                    <Info className="h-4.5 w-4.5" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowIDCardModal(true)}
                    className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-655 dark:text-zinc-400 hover:text-brand-orange-500 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                    aria-label="View ID Card"
                  >
                    <IdCard className="h-4.5 w-4.5" />
                  </button>
                )}

                <button
                  onClick={handleOpenNotifications}
                  className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:text-brand-orange-500 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                  aria-label="Notifications"
                >
                  <Bell className="h-4.5 w-4.5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5 rounded-full bg-brand-orange-500 ring-2 ring-white dark:ring-zinc-900" />
                  )}
                </button>
              </div>
            )}
          </header>

          {/* Children views */}
          <div className="transition-all duration-300">
            {children}
          </div>
        </main>
      </div>

      {/* MOBILE BOTTOM NAVIGATION */}
      {!student.isTempPassword && (
        <nav
          className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-sm pb-[env(safe-area-inset-bottom)]"
          aria-label="Main navigation"
        >
          <div className="flex h-14 items-center px-2 gap-1 justify-around">
            <Link
              href={getLinkHref("/portal")}
              prefetch
              className={`flex flex-col items-center justify-center w-16 h-full gap-1 text-[10px] font-bold transition-colors ${
                activeTab === "overview"
                  ? "text-brand-orange-500"
                  : "text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-400"
              }`}
            >
              <Home className="w-5 h-5" />
              <span>Overview</span>
            </Link>

            <Link
              href={getLinkHref("/portal/attendance")}
              prefetch
              className={`flex flex-col items-center justify-center w-16 h-full gap-1 text-[10px] font-bold transition-colors ${
                activeTab === "attendance"
                  ? "text-brand-orange-500"
                  : "text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-400"
              }`}
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>Attendance</span>
            </Link>

            <Link
              href={getLinkHref("/portal/settings")}
              prefetch
              className={`flex flex-col items-center justify-center w-16 h-full gap-1 text-[10px] font-bold transition-colors ${
                activeTab === "settings"
                  ? "text-brand-orange-500"
                  : "text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-400"
              }`}
            >
              <Settings className="w-5 h-5" />
              <span>Settings</span>
            </Link>
          </div>
        </nav>
      )}

      {/* NOTIFICATIONS SLIDEOVER */}
      {showNotifications && (
        <div className="fixed inset-0 z-50 flex justify-end no-print">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
            onClick={() => setShowNotifications(false)}
          />
          <div className="relative w-full max-w-md bg-white dark:bg-zinc-900 h-full shadow-2xl p-6 flex flex-col gap-6 animate-in slide-in-from-right duration-250">
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800/80 pb-4">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-brand-orange-500" />
                <h3 className="text-base font-bold text-zinc-900 dark:text-white leading-tight">Notifications</h3>
              </div>
              <button
                onClick={() => setShowNotifications(false)}
                className="flex items-center justify-center w-8 h-8 rounded-xl bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-900 dark:hover:bg-zinc-850 border border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-all cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="relative overflow-y-auto pr-1 flex-1 scrollbar-thin">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center gap-4 py-16 px-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-200 dark:border-zinc-800/60 text-zinc-400 dark:text-zinc-500">
                    <BellOff className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-zinc-800 dark:text-zinc-300">No notifications yet</h4>
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
                      className="bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-200 dark:border-zinc-850 p-4 rounded-2xl shadow-inner relative flex flex-col"
                    >
                      <div className="text-xs text-zinc-700 dark:text-zinc-200 leading-relaxed font-semibold">
                        {n.message}
                      </div>
                      <span className="text-[9px] text-zinc-450 dark:text-zinc-500 font-medium uppercase mt-2.5 block tracking-wider">
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

      {/* TERMS / LEGEND MODAL */}
      {showTermsModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => setShowTermsModal(false)}
          />
          <div className="relative w-full max-w-sm rounded-[2rem] bg-white dark:bg-zinc-900 shadow-2xl p-6 md:p-8 animate-in fade-in zoom-in duration-200">
            <button
              onClick={() => setShowTermsModal(false)}
              className="absolute right-4 top-4 p-2 text-zinc-400 hover:text-zinc-650 dark:hover:text-zinc-300 transition-colors rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-orange-500/10 text-brand-orange-500">
                <Info className="h-5 w-5" />
              </div>
              <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">
                Status Glossary
              </h3>
            </div>

            <div className="space-y-5">
              <div className="flex gap-3">
                <span className="shrink-0 flex h-6 w-6 items-center justify-center rounded-full bg-brand-orange-500/20 text-brand-orange-600 dark:text-brand-orange-400 text-xs font-bold">
                  Ac
                </span>
                <div>
                  <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Active</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Currently enrolled and regularly attending classes.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <span className="shrink-0 flex h-6 w-6 items-center justify-center rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 text-xs font-bold">
                  In
                </span>
                <div>
                  <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Inactive</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Not currently attending classes.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <span className="shrink-0 flex h-6 w-6 items-center justify-center rounded-full bg-sky-100 dark:bg-sky-900/40 text-sky-600 dark:text-sky-400 text-xs font-bold">
                  Fr
                </span>
                <div>
                  <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Freeze</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Membership is temporarily paused or on hold.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <span className="shrink-0 flex h-6 w-6 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 text-xs font-bold">
                  Gr
                </span>
                <div>
                  <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Grace</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Extra time provided to renew a plan before expiry.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <span className="shrink-0 flex h-6 w-6 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 text-xs font-bold">
                  Ex
                </span>
                <div>
                  <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Expired</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Membership or plan validity has ended.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ID CARD POPUP MODAL */}
      {showIDCardModal && (
        <div
          onClick={() => {
            setShowIDCardModal(false);
            setIsFlipped(false);
          }}
          className="fixed inset-0 z-55 flex flex-col items-center justify-center p-4 bg-zinc-950/75 backdrop-blur-md animate-fade-in no-print cursor-default"
        >
          <button
            onClick={() => {
              setShowIDCardModal(false);
              setIsFlipped(false);
            }}
            className="absolute top-4 right-4 text-zinc-450 hover:text-white hover:bg-zinc-800/50 p-2.5 rounded-full transition-all cursor-pointer z-50"
            title="Close"
          >
            <X className="w-6 h-6" />
          </button>

          <div
            onClick={(e) => e.stopPropagation()}
            className="relative flex flex-col items-center gap-6"
          >
            {/* flip card */}
            <div className="flip-card w-[18.75em] h-[29.734em] cursor-pointer" onClick={() => setIsFlipped(!isFlipped)}>
              <div className={`flip-card-inner relative w-full h-full transform-style-3d ${isFlipped ? "flipped" : ""}`}>
                {/* front */}
                <div className="flip-card-front backface-hidden absolute inset-0 rounded-[1.5em] overflow-hidden shadow-2xl bg-white select-none">
                  <div className="absolute inset-0 z-0">
                    <img
                      src="/Id-card/front-graphic.webp"
                      alt="Front Background"
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="absolute top-[1.4em] left-[1.6em] z-10 w-[3.2em] h-[3.2em]">
                    <img
                      src="/icons/logo.webp"
                      alt="TAG Logo"
                      className="w-full h-full object-contain"
                    />
                  </div>

                  <div className="absolute top-[6.8em] right-[3.2em] z-10 w-[7.4em] h-[7.4em]">
                    <div className="w-full h-full rounded-full p-[0.18em] bg-[#f05a22] shadow-lg">
                      <div className="w-full h-full rounded-full overflow-hidden bg-zinc-100 relative flex items-center justify-center">
                        <StudentAvatar student={student} size={118} />
                      </div>
                    </div>
                  </div>

                  <div className="absolute top-[13.4em] left-[1.6em] right-[1.6em] z-10 flex flex-col gap-[0.7em] text-left">
                    <div className="flex flex-col leading-tight">
                      <span className="text-[1.25em] font-black text-zinc-950 uppercase tracking-wide break-words">
                        {student.name.trim().split(/\s+/)[0] || ""}
                      </span>
                      {student.name.trim().split(/\s+/).slice(1).join(" ") && (
                        <span className="text-[1.25em] font-black text-[#f05a22] uppercase tracking-wide break-words">
                          {student.name.trim().split(/\s+/).slice(1).join(" ")}
                        </span>
                      )}
                      <span className="text-[0.55em] font-bold tracking-[0.2em] text-zinc-500 mt-[0.3em] uppercase">
                        Student
                      </span>
                    </div>

                    <div className="flex flex-col gap-[0.3em]">
                      <div className="flex items-center text-[0.58em] font-bold text-zinc-800">
                        <span className="w-[6.2em] text-zinc-500 uppercase tracking-wider shrink-0 font-extrabold">ID No.</span>
                        <span className="text-zinc-400 mr-[0.5em] font-medium">:</span>
                        <span className="text-zinc-955 font-black truncate">TAG{String(student.studentNumber).padStart(3, "0")}</span>
                      </div>
                      <div className="flex items-center text-[0.58em] font-bold text-zinc-800">
                        <span className="w-[6.2em] text-zinc-500 uppercase tracking-wider shrink-0 font-extrabold">Parent</span>
                        <span className="text-zinc-400 mr-[0.5em] font-medium">:</span>
                        <span className="text-zinc-955 font-black truncate">{student.parentName}</span>
                      </div>
                      <div className="flex items-center text-[0.58em] font-bold text-zinc-800">
                        <span className="w-[6.2em] text-zinc-500 uppercase tracking-wider shrink-0 font-extrabold">Contact</span>
                        <span className="text-zinc-400 mr-[0.5em] font-medium">:</span>
                        <span className="text-zinc-955 font-black truncate">{student.contactNumber}</span>
                      </div>
                      <div className="flex items-center text-[0.58em] font-bold text-zinc-800">
                        <span className="w-[6.2em] text-zinc-500 uppercase tracking-wider shrink-0 font-extrabold">DOB</span>
                        <span className="text-zinc-400 mr-[0.5em] font-medium">:</span>
                        <span className="text-zinc-955 font-black truncate">
                          {new Date(student.dateOfBirth).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="absolute bottom-[1.8em] left-[1.6em] border-l-[0.15em] border-[#f05a22] pl-[0.5em] text-left leading-[1.1] z-10">
                    <p className="text-[0.52em] font-black text-zinc-500 uppercase tracking-wider">Focus.</p>
                    <p className="text-[0.52em] font-black text-zinc-500 uppercase tracking-wider">Practice.</p>
                    <p className="text-[0.52em] font-black text-[#f05a22] uppercase tracking-wider">Achieve.</p>
                  </div>

                  <div className="absolute bottom-[1.5em] right-[1.6em] z-10">
                    <div className="w-[4.7em] h-[4.7em]">
                      {frontQr ? (
                        <img
                          src={frontQr}
                          alt="Front QR Code"
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <div className="w-full h-full bg-zinc-200 animate-pulse rounded" />
                      )}
                    </div>
                  </div>
                </div>

                {/* back */}
                <div className="flip-card-back backface-hidden absolute inset-0 rounded-[1.5em] overflow-hidden shadow-2xl bg-zinc-950 select-none">
                  <div className="absolute inset-0 z-0">
                    <img
                      src="/Id-card/back-graphic.webp"
                      alt="Back Background"
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="absolute top-[2.5em] left-1/2 -translate-x-1/2 z-10 w-[5.9em] h-[3.5em]">
                    <img
                      src="/Id-card/dark-logo.webp"
                      alt="TAG Dark Logo"
                      className="w-full h-full object-contain"
                    />
                  </div>

                  <div className="absolute top-[6.0em] left-0 right-0 text-center w-full z-10 uppercase tracking-wider font-black leading-tight">
                    <p className="text-[0.60em] text-white">Empowering Athletes.</p>
                    <p className="text-[0.60em] text-[#f05a22]">Building Champions.</p>
                  </div>

                  <div className="absolute top-[8.8em] left-1/2 -translate-x-1/2 z-10 flex flex-col items-center justify-center">
                    <div className="relative w-[8.0em] h-[8.0em]">
                      {backQr ? (
                        <img
                          src={backQr}
                          alt="Back QR Code"
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <div className="w-full h-full bg-zinc-805 animate-pulse" />
                      )}
                    </div>
                  </div>

                  {/* contact info */}
                  <div className="absolute bottom-[2.5em] left-[1.6em] right-[1.6em] text-center z-10 text-white space-y-[0.4em]">
                    <p className="text-[0.52em] font-black uppercase tracking-wider text-[#f05a22]">The Academy of Gymnastics</p>
                    <p className="text-[0.45em] font-semibold text-zinc-400 leading-normal whitespace-pre-line max-w-[90%] mx-auto">
                      {academyProfile.address}
                    </p>
                    <div className="pt-[0.2em] flex justify-center gap-[1.2em] text-[0.45em] font-bold text-zinc-300">
                      <span>{academyProfile.phone}</span>
                      <span>{academyProfile.website}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-semibold tracking-wider uppercase text-center max-w-[280px] leading-relaxed">
              Click card to flip
            </p>
          </div>
        </div>
      )}
      {/* ── Level-Up Celebration Modal (Theme adaptive) ──────────────────── */}
      {showLevelUp && (
        <div
          className="fixed inset-0 z-[99999] flex flex-col items-center justify-center p-6 bg-black/90 backdrop-blur-xl animate-fade-in"
        >
          <style>{`
            @keyframes coin-spin {
              0% { transform: rotateY(0deg); }
              12% { transform: rotateY(360deg); }
              100% { transform: rotateY(360deg); }
            }
            .animate-coin-spin {
              animation: coin-spin 6s ease-in-out infinite;
              transform-style: preserve-3d;
            }
          `}</style>

          <canvas
            ref={confettiRef}
            className="absolute inset-0 pointer-events-none"
            style={{ zIndex: 1 }}
          />

          <div
            className="relative z-10 flex flex-col items-center text-center max-w-2xl w-full mx-auto space-y-8 animate-scale-in"
          >
            {/* Level Up Subheader */}
            <span className="text-xs sm:text-sm font-black uppercase tracking-[0.4em] text-brand-orange-500 animate-pulse">
              Level Up
            </span>

            {/* Giant Badge Coin Block with White Glow */}
            <div className="relative flex items-center justify-center w-64 h-64 sm:w-80 sm:h-80 my-2">
              <div
                className="absolute inset-0 rounded-full blur-3xl opacity-40 bg-white animate-pulse"
              />
              <Image
                src={getBadgeImage(currentIndex)}
                alt="New level badge"
                width={220}
                height={220}
                className="relative w-48 h-48 sm:w-60 sm:h-60 object-contain animate-coin-spin drop-shadow-[0_15px_30px_rgba(255,255,255,0.15)]"
                unoptimized
              />
            </div>

            {/* Typography Details */}
            <div className="space-y-3">
              <h2 className="text-4xl sm:text-6xl font-black text-white tracking-tight uppercase leading-none">
                {student.name}
              </h2>
              
              <p className="text-base sm:text-lg font-bold text-zinc-400 tracking-wide">
                Advanced to <span className="text-white font-extrabold border-b-2 border-brand-orange-500 pb-0.5 ml-1">{currentCfg.label}</span>
              </p>
            </div>

            {/* Inspirational Quote */}
            <p className="text-sm sm:text-base text-zinc-300 italic font-light max-w-md leading-relaxed">
              &ldquo;{quote}&rdquo;
            </p>

            {/* Pill Continue CTA */}
            <div className="pt-4">
              <button
                onClick={dismissLevelUp}
                className="px-16 py-4 rounded-full font-black text-white text-xs sm:text-sm uppercase tracking-widest bg-brand-orange-500 hover:bg-brand-orange-600 transition-all hover:scale-105 active:scale-[0.98] cursor-pointer shadow-lg shadow-brand-orange-500/25"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
