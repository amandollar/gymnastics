"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import Link from "next/link";
import { UserPlus, UserCheck, IndianRupee, ChevronLeft, ChevronRight, X, Check, Maximize2, Minimize2, Camera, RefreshCw } from "lucide-react";
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
} from "recharts";
import {
  recentActivity,
  formatINR,
} from "@/lib/sample/dashboard";
import type { DashboardData } from "@/lib/services/dashboard";
import { useRouter } from "next/navigation";
import jsQR from "jsqr";
import { searchStudentsForAttendanceAction, markAttendanceAction, getAttendanceSessionDataAction } from "@/lib/actions/attendance";

const CHART_H = 260;
const CHART_H_SM = 224;

const chartTooltipStyle = {
  backgroundColor: "var(--chart-tooltip-bg)",
  border: "1px solid var(--chart-tooltip-border)",
  color: "var(--chart-tooltip-text)",
  borderRadius: "8px",
  fontSize: "12px",
  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.08)",
};

const dummyStudents = [
  { id: "1", studentNumber: 101, name: "Rohan Patel", parentName: "Deepak Patel", contactNumber: "9876543210", activePlan: "Intermediate Gymnastics", outstanding: 0 },
  { id: "2", studentNumber: 102, name: "Ananya Sharma", parentName: "Vijay Sharma", contactNumber: "9812345678", activePlan: "Beginner Gymnastics", outstanding: 4500 },
  { id: "3", studentNumber: 103, name: "Kabir Mehta", parentName: "Rajesh Mehta", contactNumber: "9988776655", activePlan: "Advanced Trampoline", outstanding: 8000 },
  { id: "4", studentNumber: 104, name: "Siddharth Rao", parentName: "Prakash Rao", contactNumber: "9765432109", activePlan: "Elite Artistic Plan", outstanding: 0 },
  { id: "5", studentNumber: 105, name: "Meera Nair", parentName: "Suresh Nair", contactNumber: "9543210987", activePlan: "Beginner Gymnastics", outstanding: 1200 },
];

interface DashboardOverviewProps {
  firstName: string;
  dashboardData: DashboardData;
}

export default function DashboardOverview({
  firstName,
  dashboardData,
}: DashboardOverviewProps) {
  const isMobile = useMediaQuery("(max-width: 639px)");
  const chartH = isMobile ? CHART_H_SM : CHART_H;

  const currentMonthLabel = useMemo(() => {
    return new Date().toLocaleString("en-US", { month: "short" }).toUpperCase();
  }, []);

  const currentYear = useMemo(() => {
    return new Date().getFullYear();
  }, []);

  // View States for daily/weekly vs monthly toggles
  const [attendanceView, setAttendanceView] = useState<"daily" | "monthly">("daily");
  const [admissionsView, setAdmissionsView] = useState<"daily" | "monthly">("monthly");
  const [renewalsView, setRenewalsView] = useState<"daily" | "monthly">("monthly");

  // Sliding Window States for daily views (pages of 10 days)
  const [attendanceStartIndex, setAttendanceStartIndex] = useState(20);
  const [admissionsStartIndex, setAdmissionsStartIndex] = useState(20);
  const [renewalsStartIndex, setRenewalsStartIndex] = useState(20);

  // Derive chart datasets dynamically from database props
  const attendanceChartData = useMemo(() => {
    if (attendanceView === "daily") {
      return dashboardData.attendanceDaily.map((d) => ({
        label: d.day.replace(/^0/, ""), // "05" -> "5" (makes labels shorter)
        present: d.present
      }));
    } else {
      return dashboardData.attendanceMonthly.map((d) => ({ label: d.month, present: d.present }));
    }
  }, [attendanceView, dashboardData]);

  const visibleAttendanceData = useMemo(() => {
    if (attendanceView === "daily") {
      return attendanceChartData.slice(attendanceStartIndex, attendanceStartIndex + 10);
    }
    return attendanceChartData;
  }, [attendanceChartData, attendanceView, attendanceStartIndex]);

  const admissionsChartData = useMemo(() => {
    if (admissionsView === "daily") {
      return dashboardData.admissionsDaily.map((d) => ({
        label: d.day.replace(/^0/, ""), // "05" -> "5" (makes labels shorter)
        admissions: d.admissions
      }));
    } else {
      return dashboardData.admissionsMonthly.map((d) => ({ label: d.month, admissions: d.admissions }));
    }
  }, [admissionsView, dashboardData]);

  const visibleAdmissionsData = useMemo(() => {
    if (admissionsView === "daily") {
      return admissionsChartData.slice(admissionsStartIndex, admissionsStartIndex + 10);
    }
    return admissionsChartData;
  }, [admissionsChartData, admissionsView, admissionsStartIndex]);

  const renewalsChartData = useMemo(() => {
    if (renewalsView === "daily") {
      return dashboardData.renewalsDaily.map((d) => ({
        label: d.day.replace(/^0/, ""), // "05" -> "5" (makes labels shorter)
        renewals: d.renewals
      }));
    } else {
      return dashboardData.renewalsMonthly.map((d) => ({ label: d.month, renewals: d.renewals }));
    }
  }, [renewalsView, dashboardData]);

  const visibleRenewalsData = useMemo(() => {
    if (renewalsView === "daily") {
      return renewalsChartData.slice(renewalsStartIndex, renewalsStartIndex + 10);
    }
    return renewalsChartData;
  }, [renewalsChartData, renewalsView, renewalsStartIndex]);

  const revenueChartData = useMemo(() => {
    return dashboardData.revenueMonthly;
  }, [dashboardData]);

  const chartMargin = isMobile
    ? { top: 8, right: 4, left: -16, bottom: 0 }
    : { top: 8, right: 8, left: -8, bottom: 0 };

  // Modals visibility state
  const [qrOpen, setQrOpen] = useState(false);
  const [feeOpen, setFeeOpen] = useState(false);

  const router = useRouter();

  // Fullscreen & Camera Scanner states
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);
  const [isPhone, setIsPhone] = useState(false);
  const [isScanning, setIsScanning] = useState(true);
  const [scanMessage, setScanMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [manualSearchQuery, setManualSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);

  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [scannedStudent, setScannedStudent] = useState<{
    id: string;
    studentNumber: number;
    name: string;
    parentName: string;
    contactNumber: string;
    activePlan: string | null;
    outstanding: number;
    sessionsCompleted?: number;
    totalSessions?: number;
  } | null>(null);

  const [attendanceNotification, setAttendanceNotification] = useState<{
    name: string;
    studentNumber: number;
    activePlan: string;
    sessionsCompleted: number;
    totalSessions: number;
  } | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const modalRef = useRef<HTMLDivElement | null>(null);
  const notificationTimerRef = useRef<NodeJS.Timeout | null>(null);

  // ── Session cache refs (populated once on modal open, not per-scan) ──────────
  // Using refs (not state) so updates never trigger a re-render.
  type CachedStudent = {
    id: string;
    studentNumber: number;
    name: string;
    activePlan: { planType: string; sessionsCompleted: number; totalSessions: number } | null;
  };
  /** Map<studentId, CachedStudent> — all active-plan students */
  const studentsCacheRef = useRef<Map<string, CachedStudent>>(new Map());
  /** Set<studentId> — students already marked present today (updated optimistically) */
  const attendedTodayRef = useRef<Set<string>>(new Set());
  /** Set<studentId> — in-flight mark calls (prevents duplicate frame reads) */
  const processingRef = useRef<Set<string>>(new Set());

  // Collect Fee states
  const [feeSearchQuery, setFeeSearchQuery] = useState("");
  const [feeSelectedStudent, setFeeSelectedStudent] = useState<typeof dummyStudents[0] | null>(null);
  const [feeAmount, setFeeAmount] = useState("");
  const [feeMethod, setFeeMethod] = useState("UPI");
  const [feeNotes, setFeeNotes] = useState("");
  const [feeSuccess, setFeeSuccess] = useState(false);

  // Clean up camera stream on close
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
    setCameraError(null);
  };

  const startCamera = async (currentMode: "user" | "environment" = facingMode) => {
    setCameraError(null);
    setScannedStudent(null);
    setScanMessage(null);

    // Stop existing tracks if any
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    try {
      const constraints = {
        video: { facingMode: currentMode },
        audio: false,
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch((err) => console.error("Video play failed:", err));
      }
      setCameraActive(true);
    } catch (err: any) {
      console.error("Camera error:", err);
      // Fallback
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch((playErr) => console.error("Video play failed:", playErr));
        }
        setCameraActive(true);
      } catch (fallbackErr: any) {
        console.error("Camera fallback error:", fallbackErr);
        setCameraError(
          "Could not access the camera. Please ensure camera permissions are granted."
        );
      }
    }
  };

  const toggleFacingMode = () => {
    const nextMode = facingMode === "user" ? "environment" : "user";
    setFacingMode(nextMode);
    startCamera(nextMode);
  };

  const toggleFullscreen = async () => {
    if (!modalRef.current) return;
    try {
      if (!document.fullscreenElement) {
        await modalRef.current.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (err) {
      console.error("Fullscreen error:", err);
      // CSS fallback
      setIsFullscreen(!isFullscreen);
    }
  };

  // Sync isFullscreen with escape key or other exit methods
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      if (notificationTimerRef.current) {
        clearTimeout(notificationTimerRef.current);
      }
    };
  }, []);

  // Detect phone and camera device support when opening the QR modal.
  // Also kicks off the session-cache preload in parallel with camera init.
  useEffect(() => {
    if (qrOpen && typeof window !== "undefined") {
      const checkDevice = async () => {
        const mobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
        setIsPhone(mobile);

        try {
          const devices = await navigator.mediaDevices.enumerateDevices();
          const cameras = devices.filter((d) => d.kind === "videoinput");
          setHasMultipleCameras(cameras.length > 1);
        } catch (e) {
          console.error("Enumerate devices error:", e);
        }

        const initialMode = mobile ? "environment" : "user";
        setFacingMode(initialMode);
        startCamera(initialMode);
      };

      // Run camera setup and session-cache preload in parallel
      checkDevice();
      getAttendanceSessionDataAction().then((data) => {
        studentsCacheRef.current = new Map(data.students.map((s) => [s.id, s]));
        attendedTodayRef.current = new Set(data.attendedStudentIds);
        // processingRef is intentionally reset each session so stale in-flight IDs don't persist
        processingRef.current = new Set();
      }).catch((err) => {
        console.warn("Session cache preload failed — scanner will use per-scan DB calls:", err);
      });
    } else {
      stopCamera();
      // Clear caches when modal closes
      studentsCacheRef.current = new Map();
      attendedTodayRef.current = new Set();
      processingRef.current = new Set();
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
      setIsFullscreen(false);
    }
    return () => stopCamera();
  }, [qrOpen]);

  // ── Attendance marking — cache-first, optimistic write ───────────────────────
  const markAttendance = async (studentId: string, fallbackStudent?: any) => {
    // ① Dedup guard — ignore if a mark is already in-flight for this student
    //   (prevents the QR frame-loop from firing duplicate calls on the same scan)
    if (processingRef.current.has(studentId)) return;

    // ② Client-side already-present check — zero network round-trip
    if (attendedTodayRef.current.has(studentId)) {
      const cached = studentsCacheRef.current.get(studentId);
      setIsScanning(false);
      setScanMessage({
        type: "error",
        text: `${cached?.name ?? "Student"} is already marked present today.`,
      });
      setTimeout(() => { setIsScanning(true); setScanMessage(null); }, 2500);
      return;
    }

    // ③ Mark as in-flight and optimistically add to attended set
    processingRef.current.add(studentId);
    attendedTodayRef.current.add(studentId);
    setIsScanning(false);

    // Build today's date string (YYYY-MM-DD) for the server action
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

    const triggerSuccessUI = (studentData: any) => {
      setScanMessage({
        type: "success",
        text: `Attendance marked successfully for ${studentData.name}`,
      });

      const sessionCount =
        (studentData.activePlan?.sessionsCompleted ?? studentData.sessionsCompleted ?? 0) + 1;
      const totalCount =
        studentData.activePlan?.totalSessions ?? studentData.totalSessions ?? 0;
      const planName =
        typeof studentData.activePlan === "string"
          ? studentData.activePlan
          : studentData.activePlan?.planType === "ONE_TO_ONE"
          ? "Personal training"
          : "Group class";

      setScannedStudent({
        id: studentData.id,
        studentNumber: studentData.studentNumber,
        name: studentData.name,
        parentName: "",
        contactNumber: "",
        activePlan: planName,
        outstanding: 0,
        sessionsCompleted: sessionCount,
        totalSessions: totalCount,
      });

      setAttendanceNotification({
        name: studentData.name,
        studentNumber: studentData.studentNumber,
        activePlan: planName,
        sessionsCompleted: sessionCount,
        totalSessions: totalCount,
      });

      if (notificationTimerRef.current) clearTimeout(notificationTimerRef.current);
      notificationTimerRef.current = setTimeout(() => setAttendanceNotification(null), 2500);

      try {
        const audio = new Audio("/audio/atttendance-success.mp3");
        audio.volume = 1.0;
        audio.play().catch((err) => console.log("Audio play deferred/failed:", err));
      } catch (e) {
        console.log("Audio not supported or allowed:", e);
      }
    };

    // ④ Instant optimistic UI — use cached student data, no server wait
    const cachedStudent = studentsCacheRef.current.get(studentId) ?? fallbackStudent;
    if (cachedStudent) {
      triggerSuccessUI(cachedStudent);
    }

    // ⑤ Persist to DB in the background (non-blocking)
    try {
      const res = await markAttendanceAction(studentId, todayStr);
      if (res.success) {
        // If we had no cached data, show success UI now that server confirmed
        if (!cachedStudent && res.student) triggerSuccessUI(res.student);
        router.refresh();
      } else {
        // ⑥ Rollback optimistic update on server error
        attendedTodayRef.current.delete(studentId);
        setScanMessage({ type: "error", text: res.message || "Failed to mark attendance" });
        setAttendanceNotification(null);
        setScannedStudent(null);
      }
    } catch (err: any) {
      console.error("Background mark error:", err);
      attendedTodayRef.current.delete(studentId);
      if (!cachedStudent) {
        setScanMessage({ type: "error", text: err.message || "Failed to mark attendance" });
      }
    } finally {
      // Always release the dedup lock
      processingRef.current.delete(studentId);
    }

    // Resume scanning after 2.5s (gives admin time to see the result)
    setTimeout(() => {
      setIsScanning(true);
      setScanMessage(null);
      setScannedStudent(null);
    }, 2500);
  };

  const handleSelectStudentManual = async (studentId: string) => {
    const optStudent = searchResults.find((s) => s.id === studentId);
    setManualSearchQuery("");
    setSearchResults([]);
    await markAttendance(studentId, optStudent);
  };

  const handleScanSuccess = async (qrValue: string) => {
    // Handles QR codes from student ID cards.
    // ID card QR encodes: https://<origin>/students/<cuid>
    // The scanner extracts the student CUID for a direct markAttendance() call
    // with no additional database lookup needed — fastest possible path.
    let studentId: string | null = null;
    let studentNumber: number | null = null;

    // Check if it's a URL containing /students/<id>
    if (qrValue.includes("/students/")) {
      const parts = qrValue.split("/students/");
      // Strip any trailing slash, query params (?...) or hash (#...) from the id
      const rawId = parts[parts.length - 1];
      studentId = rawId.split(/[?#\/]/)[0].trim() || null;
    } else {
      const tagMatch = qrValue.match(/^tag\s*(\d+)/i);
      if (tagMatch) {
        studentNumber = parseInt(tagMatch[1], 10);
      } else if (/^\d+$/.test(qrValue.trim())) {
        studentNumber = parseInt(qrValue.trim(), 10);
      }
    }

    if (studentId) {
      await markAttendance(studentId);
    } else if (studentNumber !== null) {
      // Find the student ID from search action
      const res = await searchStudentsForAttendanceAction(String(studentNumber));
      if (res && res.length > 0) {
        await markAttendance(res[0].id, res[0]); // Pass res[0] as optimistic student!
      } else {
        setIsScanning(false);
        setScanMessage({ type: "error", text: `No student found with ID TAG${studentNumber}` });
        setTimeout(() => {
          setIsScanning(true);
          setScanMessage(null);
        }, 2500);
      }
    } else {
      setIsScanning(false);
      setScanMessage({ type: "error", text: `Invalid QR code scanned: "${qrValue}"` });
      setTimeout(() => {
        setIsScanning(true);
        setScanMessage(null);
      }, 2500);
    }
  };

  // Real-time camera QR scanning frame loop
  useEffect(() => {
    let animationFrameId: number;
    let isActive = true;

    const scanFrame = () => {
      if (!isActive) return;
      if (
        videoRef.current &&
        videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA &&
        isScanning
      ) {
        const video = videoRef.current;
        const width = video.videoWidth;
        const height = video.videoHeight;

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });

        if (ctx) {
          ctx.drawImage(video, 0, 0, width, height);
          const imageData = ctx.getImageData(0, 0, width, height);
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: "dontInvert",
          });

          if (code && code.data) {
            handleScanSuccess(code.data);
          }
        }
      }
      animationFrameId = requestAnimationFrame(scanFrame);
    };

    if (qrOpen && cameraActive && isScanning) {
      animationFrameId = requestAnimationFrame(scanFrame);
    }

    return () => {
      isActive = false;
      cancelAnimationFrame(animationFrameId);
    };
  }, [qrOpen, cameraActive, isScanning]);

  // Debounced search query for manual attendance input
  useEffect(() => {
    if (!manualSearchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const fetchResults = async () => {
      const results = await searchStudentsForAttendanceAction(manualSearchQuery);
      setSearchResults(results);
    };

    const timer = setTimeout(fetchResults, 200);
    return () => clearTimeout(timer);
  }, [manualSearchQuery]);

  const activeCount = dashboardData.kpis.activeStudents;
  const graceCount = dashboardData.kpis.gracePeriodStudents;
  const freezeCount = dashboardData.kpis.freezeStudents;
  const totalStudents = activeCount + graceCount + freezeCount;

  const activePercent = totalStudents > 0 ? Math.round((activeCount / totalStudents) * 100) : 0;
  const gracePercent = totalStudents > 0 ? Math.round((graceCount / totalStudents) * 100) : 0;
  const freezePercent = totalStudents > 0 ? Math.round((freezeCount / totalStudents) * 100) : 0;

  return (
    <div className="space-y-2.5 min-w-0 w-full pb-6">
      
      {/* Premium Dashboard Header */}
      <div className="relative z-10 flex flex-col gap-4 pt-1 pb-3">
        {/* Header Row 1 */}
          <div>
            <h1 className="text-3xl sm:text-5xl font-light tracking-tight text-zinc-955 dark:text-zinc-50">
              Welcome back, <span className="font-semibold text-brand-orange-500 dark:text-brand-orange-500">{firstName}</span>
            </h1>
          </div>

        {/* Header Row 2: Pill Bar and Stats */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between pt-3 pb-2 sm:pt-6 sm:pb-3">
          {/* Left Part: Premium standalone pills side-by-side with extra gap, scaled proportionally */}
          <div className="flex flex-col gap-2.5 w-full max-w-sm pt-2 shrink-0">
            {totalStudents === 0 ? (
              <div className="h-10 w-full bg-zinc-200 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 flex items-center justify-center text-xs font-semibold rounded-full">
                No active students
              </div>
            ) : (
              <div className="h-10 w-full rounded-full overflow-hidden flex bg-zinc-200/50 dark:bg-zinc-800/50 p-0.5 gap-0.5">
                {activeCount > 0 && (
                  <div 
                    className="h-full bg-zinc-800 dark:bg-white text-white dark:text-black flex items-center justify-center text-xs font-semibold transition-all duration-300 first:rounded-l-full last:rounded-r-full"
                    style={{ width: `${activePercent}%` }}
                  >
                    {activePercent >= 10 ? `${activePercent}%` : ""}
                  </div>
                )}

                {graceCount > 0 && (
                  <div 
                    className="h-full bg-brand-orange-500 text-white flex items-center justify-center text-xs font-bold transition-all duration-300 first:rounded-l-full last:rounded-r-full"
                    style={{ width: `${gracePercent}%` }}
                  >
                    {gracePercent >= 10 ? `${gracePercent}%` : ""}
                  </div>
                )}

                {freezeCount > 0 && (
                  <div 
                    className="h-full bg-zinc-400 dark:bg-zinc-500 text-white dark:text-zinc-950 flex items-center justify-center text-xs font-semibold transition-all duration-300 first:rounded-l-full last:rounded-r-full"
                    style={{ width: `${freezePercent}%` }}
                  >
                    {freezePercent >= 10 ? `${freezePercent}%` : ""}
                  </div>
                )}
              </div>
            )}

            {/* Labels Row */}
            <div className="flex items-center justify-start gap-5 px-1 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-zinc-850 dark:bg-white" />
                <span>active ({activeCount})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-brand-orange-500" />
                <span>grace ({graceCount})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-zinc-400 dark:bg-zinc-500" />
                <span>freeze ({freezeCount})</span>
              </div>
            </div>
          </div>

          {/* Right Part: Three Primary Stats */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 justify-start lg:justify-end shrink-0">
            {/* Stat 1: Admissions This Month */}
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="hidden sm:inline-flex items-center justify-center p-1 rounded-md bg-zinc-100 dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 border border-zinc-200/40 dark:border-zinc-800/40">
                  <UserPlus className="h-4 w-4" />
                </span>
                <span className="text-3xl sm:text-4xl font-extralight text-zinc-955 dark:text-zinc-50 tracking-tight">
                  {dashboardData.kpis.admissionsThisMonth}
                </span>
              </div>
              <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider text-left sm:pl-7 mt-0.5">
                Joined This Mo.
              </p>
            </div>

            {/* Stat 2: Today's Attendance (Counts, no percentage) */}
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="hidden sm:inline-flex items-center justify-center p-1 rounded-md bg-zinc-100 dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 border border-zinc-200/40 dark:border-zinc-800/40">
                  <UserCheck className="h-4 w-4" />
                </span>
                <span className="text-3xl sm:text-4xl font-extralight text-zinc-955 dark:text-zinc-50 tracking-tight">
                  {dashboardData.kpis.todayAttendanceCount}
                </span>
              </div>
              <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider text-left sm:pl-7 mt-0.5">
                Attended Today
              </p>
            </div>

            {/* Stat 3: Monthly Revenue */}
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="hidden sm:inline-flex items-center justify-center p-1 rounded-md bg-zinc-100 dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 border border-zinc-200/40 dark:border-zinc-800/40">
                  <IndianRupee className="h-4 w-4" />
                </span>
                <span className="text-3xl sm:text-4xl font-extralight text-zinc-955 dark:text-zinc-50 tracking-tight">
                  {formatINR(dashboardData.kpis.monthlyRevenue)}
                </span>
              </div>
              <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider text-left sm:pl-7 mt-0.5">
                Revenue This Mo.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Premium Quick Actions Row - Shades representing Terracotta, Emerald Green, and Charcoal grey */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {/* Action 1: Take Attendance (Terracotta / Warm Coral-Orange) */}
        <button
          onClick={() => {
            setQrOpen(true);
          }}
          className="group flex flex-col lg:flex-row items-center gap-2.5 lg:gap-4.5 py-4.5 px-3 lg:py-5.5 lg:px-4.5 rounded-3xl border-0 bg-orange-200/90 dark:bg-orange-950/60 hover:bg-orange-300/80 dark:hover:bg-orange-900/60 active:scale-[0.98] transition-all duration-200 cursor-pointer text-center lg:text-left w-full"
        >
          <img 
            src="/attendance.webp" 
            alt="Attendance" 
            className="h-12 w-12 lg:h-16 lg:w-16 object-cover rounded-xl shrink-0 shadow-3xs" 
          />
          <div className="flex flex-col justify-center min-w-0">
            <span className="font-bold text-xs lg:text-[14px] text-orange-955 dark:text-orange-100 leading-tight">
              Take Attendance
            </span>
            <span className="hidden lg:block text-[10px] lg:text-xs text-orange-855 dark:text-orange-200/70 mt-1 leading-normal">
              Scan via QR or type ID
            </span>
          </div>
          <ChevronRight className="hidden lg:block h-5 w-5 ml-auto text-orange-955 dark:text-orange-200 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all duration-200 shrink-0" strokeWidth={2.5} />
        </button>

        {/* Action 2: New Admission (Emerald Green) */}
        <Link
          href="/students/new"
          className="group flex flex-col lg:flex-row items-center gap-2.5 lg:gap-4.5 py-4.5 px-3 lg:py-5.5 lg:px-4.5 rounded-3xl border-0 bg-emerald-200/90 dark:bg-emerald-950/60 hover:bg-emerald-300/80 dark:hover:bg-emerald-900/60 active:scale-[0.98] transition-all duration-200 cursor-pointer text-center lg:text-left w-full"
        >
          <img 
            src="/newAdmission.webp" 
            alt="New Admission" 
            className="h-12 w-12 lg:h-16 lg:w-16 object-cover rounded-xl shrink-0 shadow-3xs" 
          />
          <div className="flex flex-col justify-center min-w-0">
            <span className="font-bold text-xs lg:text-[14px] text-emerald-955 dark:text-emerald-100 leading-tight">
              New Admission
            </span>
            <span className="hidden lg:block text-[10px] lg:text-xs text-emerald-855 dark:text-emerald-200/70 mt-1 leading-normal">
              Enroll student to a plan
            </span>
          </div>
          <ChevronRight className="hidden lg:block h-5 w-5 ml-auto text-emerald-955 dark:text-emerald-200 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all duration-200 shrink-0" strokeWidth={2.5} />
        </Link>

        {/* Action 3: Collect Fee (Charcoal / Zinc grey) */}
        <button
          onClick={() => {
            setFeeOpen(true);
            setFeeSuccess(false);
            setFeeSelectedStudent(null);
            setFeeSearchQuery("");
            setFeeAmount("");
            setFeeNotes("");
          }}
          className="group flex flex-col lg:flex-row items-center gap-2.5 lg:gap-4.5 py-4.5 px-3 lg:py-5.5 lg:px-4.5 rounded-3xl border-0 bg-zinc-300/95 dark:bg-zinc-800/80 hover:bg-zinc-400/85 dark:hover:bg-zinc-700/80 active:scale-[0.98] transition-all duration-200 cursor-pointer text-center lg:text-left w-full"
        >
          <img 
            src="/fee.webp" 
            alt="Collect Fee" 
            className="h-12 w-12 lg:h-16 lg:w-16 object-cover rounded-xl shrink-0 shadow-3xs" 
          />
          <div className="flex flex-col justify-center min-w-0">
            <span className="font-bold text-xs lg:text-[14px] text-zinc-955 dark:text-zinc-100 leading-tight">
              Collect Fee
            </span>
            <span className="hidden lg:block text-[10px] lg:text-xs text-zinc-850 dark:text-zinc-200/70 mt-1 leading-normal">
              Record student payment
            </span>
          </div>
          <ChevronRight className="hidden lg:block h-5 w-5 ml-auto text-zinc-955 dark:text-zinc-200 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all duration-200 shrink-0" strokeWidth={2.5} />
        </button>
      </div>

      {/* Modern Two-Column Charts Grid (Clean, side-by-side, same gap-3.5 and rounded-2xl border-0 shadow-xs as before) */}
      <div className="grid gap-2.5 lg:grid-cols-2 min-w-0">
        
        {/* Chart 1: Monthly Revenue (Line Chart) */}
        <div className="rounded-3xl border-0 bg-white dark:bg-zinc-900 p-5 shadow-xs min-w-0 overflow-hidden transition-all duration-300">
          <h3 className="text-sm font-bold text-zinc-950 dark:text-zinc-50 uppercase tracking-wider">
            Monthly Revenue
          </h3>
          <div className="mt-4">
            <ChartBox height={chartH}>
              <LineChart data={revenueChartData} margin={chartMargin}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--chart-grid)"
                  vertical={false}
                />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: isMobile ? 10 : 11, fill: "var(--tick-color)", fontWeight: 500 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  width={isMobile ? 36 : 48}
                  tick={{ fontSize: isMobile ? 10 : 11, fill: "var(--tick-color)", fontWeight: 500 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `₹${v}L`}
                />
                <Tooltip
                  contentStyle={chartTooltipStyle}
                  formatter={(value) => [`₹${value}L`, "Revenue"]}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#f16d28"
                  strokeWidth={3}
                  dot={false}
                  activeDot={{ fill: "#f16d28", r: 6, stroke: "var(--background)", strokeWidth: 2 }}
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
                {attendanceView === "daily" ? `Attendance ${currentMonthLabel}` : `Attendance ${currentYear}`}
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-0.5">
                <button
                  onClick={() => setAttendanceStartIndex(Math.max(0, attendanceStartIndex - 10))}
                  disabled={attendanceView === "monthly" || attendanceStartIndex === 0}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors disabled:opacity-25 disabled:cursor-not-allowed disabled:hover:bg-transparent cursor-pointer"
                >
                  <ChevronLeft className="h-5 w-5" strokeWidth={2.5} />
                </button>
                <button
                  onClick={() => setAttendanceStartIndex(Math.min(20, attendanceStartIndex + 10))}
                  disabled={attendanceView === "monthly" || attendanceStartIndex === 20}
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
              <BarChart data={visibleAttendanceData} margin={chartMargin} barCategoryGap={6}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--chart-grid)"
                  vertical={false}
                />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: isMobile ? 10 : 11, fill: "var(--tick-color)", fontWeight: 500 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  width={isMobile ? 36 : 48}
                  domain={['auto', 'auto']}
                  tick={{ fontSize: isMobile ? 10 : 11, fill: "var(--tick-color)", fontWeight: 500 }}
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
                {admissionsView === "daily" ? `Admissions ${currentMonthLabel}` : `Admissions ${currentYear}`}
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-0.5">
                <button
                  onClick={() => setAdmissionsStartIndex(Math.max(0, admissionsStartIndex - 10))}
                  disabled={admissionsView === "monthly" || admissionsStartIndex === 0}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors disabled:opacity-25 disabled:cursor-not-allowed disabled:hover:bg-transparent cursor-pointer"
                >
                  <ChevronLeft className="h-5 w-5" strokeWidth={2.5} />
                </button>
                <button
                  onClick={() => setAdmissionsStartIndex(Math.min(20, admissionsStartIndex + 10))}
                  disabled={admissionsView === "monthly" || admissionsStartIndex === 20}
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
                  tick={{ fontSize: isMobile ? 10 : 11, fill: "var(--tick-color)", fontWeight: 500 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  width={isMobile ? 36 : 48}
                  tick={{ fontSize: isMobile ? 10 : 11, fill: "var(--tick-color)", fontWeight: 500 }}
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
                  activeDot={{ fill: "#f16d28", r: 6, stroke: "var(--background)", strokeWidth: 2 }}
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
                {renewalsView === "daily" ? `Renewals ${currentMonthLabel}` : `Renewals ${currentYear}`}
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-0.5">
                <button
                  onClick={() => setRenewalsStartIndex(Math.max(0, renewalsStartIndex - 10))}
                  disabled={renewalsView === "monthly" || renewalsStartIndex === 0}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors disabled:opacity-25 disabled:cursor-not-allowed disabled:hover:bg-transparent cursor-pointer"
                >
                  <ChevronLeft className="h-5 w-5" strokeWidth={2.5} />
                </button>
                <button
                  onClick={() => setRenewalsStartIndex(Math.min(20, renewalsStartIndex + 10))}
                  disabled={renewalsView === "monthly" || renewalsStartIndex === 20}
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
                  tick={{ fontSize: isMobile ? 10 : 11, fill: "var(--tick-color)", fontWeight: 500 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  width={isMobile ? 36 : 48}
                  tick={{ fontSize: isMobile ? 10 : 11, fill: "var(--tick-color)", fontWeight: 500 }}
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
                  activeDot={{ fill: "#f16d28", r: 6, stroke: "var(--background)", strokeWidth: 2 }}
                />
              </LineChart>
            </ChartBox>
          </div>
        </div>

      </div>

      {/* Recent Activity Section */}
      <div className="rounded-3xl border-0 bg-white dark:bg-zinc-900 p-5 shadow-xs min-w-0 transition-colors">
        <h3 className="text-sm font-bold text-zinc-955 dark:text-zinc-100 uppercase tracking-wider">Recent activity</h3>
        <p className="mt-0.5 text-xs text-zinc-400 dark:text-zinc-500">
          Latest updates across the academy
        </p>
        <ul className="mt-4 divide-y divide-zinc-100 dark:divide-zinc-800">
          {recentActivity.map((item) => (
            <li
              key={item.id}
              className="flex flex-col gap-0.5 py-3.5 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between hover:bg-zinc-50/30 dark:hover:bg-zinc-800/10 px-2 rounded-lg transition-colors"
            >
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{item.text}</span>
              <span className="text-xs text-zinc-400 dark:text-zinc-500 font-semibold shrink-0 sm:pl-4">
                {item.time}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* Interactive Modal 1: Take Attendance */}
      {qrOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-fade-in">
          <div
            ref={modalRef}
            className={`relative w-full rounded-3xl bg-black border border-zinc-800/80 shadow-2xl overflow-hidden flex flex-col justify-between transition-all duration-300 ${
              isFullscreen
                ? "fixed inset-0 w-screen h-screen rounded-none z-[100] max-w-none"
                : "max-w-lg h-[580px] sm:h-[620px]"
            }`}
          >
            {/* 1. Background Video Feed */}
            <video
              ref={videoRef}
              playsInline
              muted
              autoPlay
              className="absolute inset-0 w-full h-full object-cover z-0"
            />

            {/* 2. Dimmed Viewfinder Reticle Overlay */}
            {cameraActive && !cameraError && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                <style dangerouslySetInnerHTML={{__html: `
                  @keyframes scan-laser {
                    0% { top: 0%; opacity: 0.1; }
                    10% { opacity: 1; }
                    90% { opacity: 1; }
                    100% { top: 100%; opacity: 0.1; }
                  }
                `}} />
                {/* Visual Highlight Area (Outside this square, the shadow dims everything) */}
                <div className={`relative rounded-2xl border border-white/10 shadow-[0_0_0_9999px_rgba(0,0,0,0.65)] transition-all duration-300 aspect-square max-h-[50vh] max-w-[80vw] md:max-h-[60vh] ${
                  isFullscreen 
                    ? "h-72 w-72 sm:h-96 sm:w-96 md:h-[450px] md:w-[450px]" 
                    : "h-44 w-44 sm:h-56 sm:w-56"
                }`}>
                  {/* Corner Accents */}
                  <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-brand-orange-500 rounded-tl-lg"></div>
                  <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-brand-orange-500 rounded-tr-lg"></div>
                  <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-brand-orange-500 rounded-bl-lg"></div>
                  <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-brand-orange-500 rounded-br-lg"></div>
                  
                  {/* Scanning Laser Line */}
                  {isScanning && (
                    <div 
                      className="absolute left-1 right-1 h-0.5 bg-brand-orange-500 shadow-[0_0_12px_rgba(241,109,40,0.95)]"
                      style={{
                        animation: "scan-laser 2.2s linear infinite"
                      }}
                    />
                  )}
                </div>
              </div>
            )}

            {/* 3. Header Controls overlay */}
            <div className="absolute top-0 left-0 right-0 p-4 bg-transparent flex items-center justify-between z-20">
              <h3 className="text-sm font-bold text-white flex items-center gap-2 drop-shadow-md">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-orange-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-orange-500"></span>
                </span>
                QR Attendance Scanner
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleFullscreen}
                  title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
                  className="h-8 w-8 rounded-lg flex items-center justify-center text-zinc-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                >
                  {isFullscreen ? (
                    <Minimize2 className="h-4.5 w-4.5" />
                  ) : (
                    <Maximize2 className="h-4.5 w-4.5" />
                  )}
                </button>
                <button
                  onClick={() => {
                    setQrOpen(false);
                    stopCamera();
                  }}
                  className="h-8 w-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* 4. Spinner & Camera error state overlay */}
            {!cameraActive && !cameraError && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 text-zinc-400 z-10 gap-2">
                <span className="h-6 w-6 rounded-full border-2 border-zinc-650 border-t-transparent animate-spin"></span>
                <p className="text-xs">Requesting camera device stream...</p>
              </div>
            )}

            {cameraError && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/95 text-zinc-400 z-10 gap-2 p-6 text-center">
                <p className="text-xs text-rose-500 px-4">{cameraError}</p>
                <button
                  onClick={() => startCamera(facingMode)}
                  className="mt-2 text-xs font-bold text-brand-orange-500 underline cursor-pointer"
                >
                  Retry Camera Access
                </button>
              </div>
            )}

            {/* 5. Flip camera switcher overlay (Floating bottom right, above inputs) */}
            {cameraActive && !cameraError && hasMultipleCameras && (
              <button
                onClick={toggleFacingMode}
                className="absolute bottom-[92px] right-4 bg-black/70 hover:bg-black/90 text-white p-3 rounded-xl transition-all duration-200 cursor-pointer border border-zinc-800/80 shadow-md flex items-center justify-center z-20 hover:scale-[1.05] active:scale-[0.95]"
                title="Flip Camera"
              >
                <RefreshCw className="h-4.5 w-4.5" />
              </button>
            )}

            {/* 6. Scan Feedback Message Overlay */}
            {scanMessage && (scanMessage.type === "error" || isFullscreen) && (
              <div className={`absolute top-[72px] left-1/2 -translate-x-1/2 w-[90%] max-w-xs p-5 rounded-2xl flex items-start gap-3.5 z-30 shadow-xl animate-scale-in backdrop-blur-lg border-0 ${
                scanMessage.type === "success" 
                  ? "bg-emerald-950/95 text-emerald-200"
                  : "bg-rose-950/95 text-rose-200"
              }`}>
                <span className={`h-6 w-6 rounded-full flex items-center justify-center shrink-0 text-white ${
                  scanMessage.type === "success" ? "bg-emerald-500" : "bg-rose-500"
                }`}>
                  {scanMessage.type === "success" ? (
                    <Check className="h-3.5 w-3.5" strokeWidth={3.5} />
                  ) : (
                    <X className="h-3.5 w-3.5" strokeWidth={3.5} />
                  )}
                </span>
                <div className="min-w-0 flex-1 text-left">
                  <h4 className="font-extrabold text-xs text-white">
                    {scanMessage.type === "success" ? "Attendance Recorded!" : "Scan Failed"}
                  </h4>
                  {scanMessage.type === "success" && scannedStudent ? (
                    <div className="mt-1">
                      <p className="font-medium text-xs text-zinc-200">
                        {scannedStudent.name} (TAG{String(scannedStudent.studentNumber).padStart(3, "0")})
                      </p>
                      <p className="text-xs text-emerald-400 font-extrabold mt-1">
                        Session count: {Math.max(0, (scannedStudent.totalSessions ?? 0) - (scannedStudent.sessionsCompleted ?? 0))}
                      </p>
                    </div>
                  ) : (
                    <p className="text-[11px] mt-0.5 text-zinc-350">
                      {scanMessage.text}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* 7. Bottom controls overlay (glassmorphic footer inputs) */}
            <div className="w-full max-w-md mx-auto p-4 bg-transparent flex flex-col gap-2 z-20 mt-auto">
              {/* Autocomplete List overlay (appears overlayed directly above search input) */}
              {manualSearchQuery.trim() && searchResults.length > 0 && (
                <div className="space-y-1 max-h-36 overflow-y-auto border border-zinc-800/80 rounded-xl p-1 bg-black/85 backdrop-blur-md shadow-2xl mb-1">
                  {searchResults.map((student) => {
                    const hasActivePlan = !!student.activePlan;
                    return (
                      <button
                        key={student.id}
                        type="button"
                        disabled={!hasActivePlan}
                        onClick={() => handleSelectStudentManual(student.id)}
                        className={`w-full text-left flex items-center justify-between p-2 rounded-lg border transition-colors cursor-pointer text-xs ${
                          hasActivePlan
                            ? "border-transparent hover:bg-white/10 text-white"
                            : "border-transparent text-zinc-650 opacity-40 cursor-not-allowed"
                        }`}
                      >
                        <div>
                          <p className="font-bold text-zinc-100">
                            {student.name}
                          </p>
                          <p className="text-[9px] text-zinc-400">
                            ID: TAG{String(student.studentNumber).padStart(3, "0")} · {hasActivePlan ? (student.activePlan.planType === "ONE_TO_ONE" ? "Personal training" : "Group class") : "No Active Plan"}
                          </p>
                        </div>
                        <span className={`px-2 py-0.5 rounded-md font-bold text-[8px] uppercase tracking-wider ${
                          hasActivePlan 
                            ? "bg-brand-orange-500/20 text-brand-orange-400" 
                            : "bg-zinc-800 text-zinc-600"
                        }`}>
                          {hasActivePlan ? "Mark" : "Inactive"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              <div className="flex flex-col gap-1">
                <input
                  type="text"
                  value={manualSearchQuery}
                  onChange={(e) => setManualSearchQuery(e.target.value)}
                  placeholder="Enter Roll No or Student Name..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-800/80 bg-black/60 backdrop-blur-md text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-brand-orange-500/40"
                />
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Interactive Modal 3: Collect Fee */}
      {feeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="relative w-full max-w-lg rounded-2xl bg-white dark:bg-zinc-900 border-0 shadow-2xl p-6">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-850 pb-4 mb-4">
              <div>
                <h3 className="text-base font-bold text-zinc-950 dark:text-zinc-50">
                  Collect Student Fee
                </h3>
                <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">
                  Record a manual payment received from a student
                </p>
              </div>
              <button
                onClick={() => setFeeOpen(false)}
                className="h-8 w-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" strokeWidth={2} />
              </button>
            </div>

            {feeSuccess ? (
              <div className="py-6 text-center flex flex-col items-center">
                <span className="h-12 w-12 rounded-full bg-brand-orange-500 text-white flex items-center justify-center shrink-0 shadow-md mb-4 animate-scale-in">
                  <Check className="h-6 w-6" strokeWidth={3} />
                </span>
                <h4 className="font-bold text-lg text-brand-orange-600 dark:text-brand-orange-400">
                  Payment Recorded!
                </h4>
                <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-2 px-4 max-w-sm">
                  Amount of ₹{feeAmount} has been credited to {feeSelectedStudent?.name}'s account.
                </p>
                <div className="mt-4 p-4 border border-zinc-200 dark:border-zinc-850 rounded-xl bg-zinc-50 dark:bg-zinc-950 text-left w-full text-xs">
                  <div className="flex justify-between border-b border-zinc-200/50 dark:border-zinc-850 pb-2">
                    <span className="text-zinc-400 dark:text-zinc-500">Student:</span>
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100">{feeSelectedStudent?.name}</span>
                  </div>
                  <div className="flex justify-between border-b border-zinc-200/50 dark:border-zinc-850 py-2">
                    <span className="text-zinc-400 dark:text-zinc-500">Amount Paid:</span>
                    <span className="font-bold text-zinc-900 dark:text-zinc-100">₹{feeAmount}</span>
                  </div>
                  <div className="flex justify-between border-b border-zinc-200/50 dark:border-zinc-850 py-2">
                    <span className="text-zinc-400 dark:text-zinc-500">Method:</span>
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100">{feeMethod}</span>
                  </div>
                  <div className="flex justify-between pt-2">
                    <span className="text-zinc-400 dark:text-zinc-500">Transaction Date:</span>
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100">{new Date().toLocaleDateString("en-IN")}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setFeeOpen(false)}
                  className="mt-6 px-5 py-2.5 rounded-xl text-xs font-bold bg-zinc-900 dark:bg-zinc-800 text-white hover:bg-zinc-800 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
                >
                  Close Receipt
                </button>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!feeSelectedStudent || !feeAmount) return;
                  setFeeSuccess(true);
                }}
                className="space-y-4"
              >
                
                {/* Search Student Autocomplete */}
                {!feeSelectedStudent ? (
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                      Search Student *
                    </label>
                    <input
                      type="text"
                      value={feeSearchQuery}
                      onChange={(e) => setFeeSearchQuery(e.target.value)}
                      placeholder="Type student name or ID..."
                      className="w-full px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-brand-orange-500/50"
                    />

                    {/* Autocomplete Dropdown */}
                    <div className="mt-2 space-y-1.5 max-h-36 overflow-y-auto border border-zinc-100 dark:border-zinc-850 rounded-xl p-1 bg-zinc-50 dark:bg-zinc-950">
                      {dummyStudents
                        .filter(
                          (st) =>
                            st.name.toLowerCase().includes(feeSearchQuery.toLowerCase()) ||
                            st.studentNumber.toString().includes(feeSearchQuery)
                        )
                        .map((student) => (
                          <button
                            key={student.id}
                            type="button"
                            onClick={() => {
                              setFeeSelectedStudent(student);
                              setFeeAmount(student.outstanding.toString());
                            }}
                            className="w-full text-left flex items-center justify-between p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer text-xs"
                          >
                            <div>
                              <p className="font-bold text-zinc-900 dark:text-zinc-100">{student.name}</p>
                              <p className="text-[10px] text-zinc-400 dark:text-zinc-500">ID: {student.studentNumber} · {student.activePlan}</p>
                            </div>
                            <span className="text-[10px] font-bold text-rose-500">
                              Dues: ₹{student.outstanding}
                            </span>
                          </button>
                        ))}
                    </div>
                  </div>
                ) : (
                  <div className="p-3.5 rounded-xl border border-brand-orange-500/20 bg-brand-orange-500/5 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-bold text-brand-orange-500 dark:text-brand-orange-400 uppercase tracking-wider">
                        Selected Student
                      </p>
                      <p className="font-bold text-zinc-900 dark:text-zinc-100 text-sm mt-0.5">
                        {feeSelectedStudent.name} (ID: {feeSelectedStudent.studentNumber})
                      </p>
                      <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5">
                        Plan Outstanding Dues: ₹{feeSelectedStudent.outstanding}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFeeSelectedStudent(null)}
                      className="px-2.5 py-1 rounded-lg border border-zinc-200 dark:border-zinc-800 text-[10px] font-bold text-zinc-500 hover:text-rose-500 transition-colors cursor-pointer"
                    >
                      Change
                    </button>
                  </div>
                )}

                {/* Amount, Method and Date */}
                <div className="grid grid-cols-2 gap-3.5">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                      Amount Collected (INR) *
                    </label>
                    <input
                      type="number"
                      required
                      value={feeAmount}
                      onChange={(e) => setFeeAmount(e.target.value)}
                      placeholder="e.g. 8640"
                      className="w-full px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-brand-orange-500/50 font-bold"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                      Payment Method
                    </label>
                    <select
                      value={feeMethod}
                      onChange={(e) => setFeeMethod(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-brand-orange-500/50"
                    >
                      <option value="UPI">UPI / GPay / PhonePe</option>
                      <option value="CASH">Cash Payment</option>
                      <option value="BANK_TRANSFER">Bank Transfer / NEFT</option>
                      <option value="OTHER">Other Method</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1 col-span-2">
                    <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                      Payment Notes
                    </label>
                    <textarea
                      value={feeNotes}
                      onChange={(e) => setFeeNotes(e.target.value)}
                      placeholder="Enter optional payment details, bank reference, etc..."
                      rows={2}
                      className="w-full px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-brand-orange-500/50"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 border-t border-zinc-100 dark:border-zinc-850 pt-4 mt-4">
                  <button
                    type="button"
                    onClick={() => setFeeOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!feeSelectedStudent}
                    className={`px-4 py-2 rounded-xl text-xs font-bold text-white shadow-sm transition-colors cursor-pointer ${
                      feeSelectedStudent
                        ? "bg-brand-orange-500 hover:bg-brand-orange-655"
                        : "bg-zinc-200 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-600 cursor-not-allowed"
                    }`}
                  >
                    Record Payment
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}

      {/* 8. Bottom-Right Toast Notification */}
      {!isFullscreen && attendanceNotification && (
        <div className="fixed bottom-6 right-6 z-[200] max-w-[280px] w-full bg-emerald-50/95 dark:bg-emerald-950/90 backdrop-blur-md border border-emerald-200/50 dark:border-emerald-800/30 p-3.5 rounded-2xl shadow-xl flex items-center gap-3"
             style={{
               animation: "slide-in-right 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards"
             }}
        >
          <style dangerouslySetInnerHTML={{__html: `
            @keyframes slide-in-right {
              from { transform: translateX(100%); opacity: 0; }
              to { transform: translateX(0); opacity: 1; }
            }
          `}} />
          <div className="h-8 w-8 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-sm">
            <Check className="h-4.5 w-4.5" strokeWidth={3.5} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              Attendance Recorded!
            </p>
            <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-50 mt-1 truncate">
              {attendanceNotification.name} (TAG{String(attendanceNotification.studentNumber).padStart(3, "0")})
            </h4>
            <p className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
              Session count: {Math.max(0, attendanceNotification.totalSessions - attendanceNotification.sessionsCompleted)}
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

    </div>
  );
}
