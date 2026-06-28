"use client";

import { useState, useRef, useEffect } from "react";
import { X, Check, Maximize2, Minimize2, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import jsQR from "jsqr";
import {
  searchStudentsForAttendanceAction,
  markAttendanceAction,
  getAttendanceSessionDataAction,
  markCoachAttendanceFromScanAction,
} from "@/lib/actions/attendance";

interface AttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAttendanceRecorded: (student: {
    name: string;
    studentNumber: number;
    activePlan: string;
    sessionsCompleted: number;
    totalSessions: number;
  }) => void;
}

export default function AttendanceModal({
  isOpen,
  onClose,
  onAttendanceRecorded,
}: AttendanceModalProps) {
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

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const modalRef = useRef<HTMLDivElement | null>(null);
  const notificationTimerRef = useRef<NodeJS.Timeout | null>(null);

  // ── Session cache refs (populated once on modal open, not per-scan) ──────────
  type CachedStudent = {
    id: string;
    studentNumber: number;
    name: string;
    activePlan: { planType: string; sessionsCompleted: number; totalSessions: number } | null;
  };
  const studentsCacheRef = useRef<Map<string, CachedStudent>>(new Map());
  const attendedTodayRef = useRef<Set<string>>(new Set());
  const processingRef = useRef<Set<string>>(new Set());

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
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

  // Detect device and initialize scanner
  useEffect(() => {
    if (typeof window !== "undefined") {
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

      checkDevice();
      getAttendanceSessionDataAction().then((data) => {
        studentsCacheRef.current = new Map(data.students.map((s) => [s.id, s]));
        attendedTodayRef.current = new Set(data.attendedStudentIds);
        processingRef.current = new Set();
      }).catch((err) => {
        console.warn("Session cache preload failed — scanner will use per-scan DB calls:", err);
      });
    }

    return () => {
      stopCamera();
      studentsCacheRef.current = new Map();
      attendedTodayRef.current = new Set();
      processingRef.current = new Set();
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
      setIsFullscreen(false);
    };
  }, []);

  // ── Attendance marking — cache-first, optimistic write ───────────────────────
  const markAttendance = async (studentId: string, fallbackStudent?: any) => {
    if (processingRef.current.has(studentId)) return;

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

    processingRef.current.add(studentId);
    attendedTodayRef.current.add(studentId);
    setIsScanning(false);

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

      onAttendanceRecorded({
        name: studentData.name,
        studentNumber: studentData.studentNumber,
        activePlan: planName,
        sessionsCompleted: sessionCount,
        totalSessions: totalCount,
      });

      try {
        const audio = new Audio("/audio/atttendance-success.mp3");
        audio.volume = 1.0;
        audio.play().catch((err) => console.log("Audio play deferred/failed:", err));
      } catch (e) {
        console.log("Audio not supported or allowed:", e);
      }
    };

    const cachedStudent = studentsCacheRef.current.get(studentId) ?? fallbackStudent;
    if (cachedStudent) {
      triggerSuccessUI(cachedStudent);
    }

    try {
      const res = await markAttendanceAction(studentId, todayStr);
      if (res.success) {
        if (!cachedStudent && res.student) triggerSuccessUI(res.student);
        router.refresh();
      } else {
        attendedTodayRef.current.delete(studentId);
        setScanMessage({ type: "error", text: res.message || "Failed to mark attendance" });
      }
    } catch (err: any) {
      console.error("Background mark error:", err);
      attendedTodayRef.current.delete(studentId);
      if (!cachedStudent) {
        setScanMessage({ type: "error", text: err.message || "Failed to mark attendance" });
      }
    } finally {
      processingRef.current.delete(studentId);
    }

    setTimeout(() => {
      setIsScanning(true);
      setScanMessage(null);
      setScannedStudent(null);
    }, 2500);
  };

  const markCoachAttendance = async (coachId: string) => {
    if (processingRef.current.has(coachId)) return;

    if (attendedTodayRef.current.has(coachId)) {
      setIsScanning(false);
      setScanMessage({
        type: "error",
        text: `Employee is already marked present today.`,
      });
      setTimeout(() => { setIsScanning(true); setScanMessage(null); }, 2500);
      return;
    }

    processingRef.current.add(coachId);
    attendedTodayRef.current.add(coachId);
    setIsScanning(false);

    try {
      const res = await markCoachAttendanceFromScanAction(coachId);
      if (res.success && res.employee) {
        setScanMessage({
          type: "success",
          text: `Attendance marked successfully for ${res.employee.name}`,
        });

        setScannedStudent({
          id: res.employee.id,
          studentNumber: 0,
          name: res.employee.name,
          parentName: "",
          contactNumber: "",
          activePlan: res.employee.role === "COACH" ? "Coach" : "Staff",
          outstanding: 0,
          sessionsCompleted: 0,
          totalSessions: 0,
        });

        onAttendanceRecorded({
          name: res.employee.name,
          studentNumber: 0,
          activePlan: res.employee.role === "COACH" ? "Coach" : "Staff",
          sessionsCompleted: 0,
          totalSessions: 0,
        });

        try {
          const audio = new Audio("/audio/atttendance-success.mp3");
          audio.volume = 1.0;
          audio.play().catch((err) => console.log("Audio play deferred/failed:", err));
        } catch (e) {
          console.log("Audio not supported or allowed:", e);
        }

        router.refresh();
      } else {
        attendedTodayRef.current.delete(coachId);
        setScanMessage({ type: "error", text: res.message || "Failed to mark employee attendance" });
      }
    } catch (err: any) {
      console.error("Background coach mark error:", err);
      attendedTodayRef.current.delete(coachId);
      setScanMessage({ type: "error", text: err.message || "Failed to mark employee attendance" });
    } finally {
      processingRef.current.delete(coachId);
    }

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
    let studentId: string | null = null;
    let studentNumber: number | null = null;
    let coachId: string | null = null;

    if (qrValue.includes("/students/")) {
      const parts = qrValue.split("/students/");
      const rawId = parts[parts.length - 1];
      studentId = rawId.split(/[?#\/]/)[0].trim() || null;
    } else if (qrValue.includes("/coaches/")) {
      const parts = qrValue.split("/coaches/");
      const rawId = parts[parts.length - 1];
      coachId = rawId.split(/[?#\/]/)[0].trim() || null;
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
    } else if (coachId) {
      await markCoachAttendance(coachId);
    } else if (studentNumber !== null) {
      const res = await searchStudentsForAttendanceAction(String(studentNumber));
      if (res && res.length > 0) {
        await markAttendance(res[0].id, res[0]);
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

    if (cameraActive && isScanning) {
      animationFrameId = requestAnimationFrame(scanFrame);
    }

    return () => {
      isActive = false;
      cancelAnimationFrame(animationFrameId);
    };
  }, [cameraActive, isScanning]);

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

  return (
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
                stopCamera();
                onClose();
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

        {/* 5. Flip camera switcher overlay */}
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
          {/* Autocomplete List overlay */}
          {manualSearchQuery.trim() && searchResults.length > 0 && (
            <div className="space-y-1 max-h-36 overflow-y-auto border border-zinc-800/80 rounded-xl p-1 bg-black/85 backdrop-blur-md shadow-2xl mb-1">
              {searchResults.map((student) => {
                const hasValidPlan = student.status === "ACTIVE" || student.status === "GRACE" || student.status === "FREEZE";
                return (
                  <button
                    key={student.id}
                    type="button"
                    disabled={!hasValidPlan}
                    onClick={() => handleSelectStudentManual(student.id)}
                    className={`w-full text-left flex items-center justify-between p-2 rounded-lg border transition-colors cursor-pointer text-xs ${
                      hasValidPlan
                        ? "border-transparent hover:bg-white/10 text-white"
                        : "border-transparent text-zinc-650 opacity-40 cursor-not-allowed"
                    }`}
                  >
                    <div>
                      <p className="font-bold text-zinc-100">
                        {student.name}
                      </p>
                      <p className="text-[9px] text-zinc-400">
                        ID: TAG{String(student.studentNumber).padStart(3, "0")} · {hasValidPlan ? (student.activePlan.planType === "ONE_TO_ONE" ? "Personal training" : "Group class") : `Plan is ${student.status?.toLowerCase().replace("_", " ")}`}
                      </p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-md font-bold text-[8px] uppercase tracking-wider ${
                      hasValidPlan 
                        ? "bg-brand-orange-500/20 text-brand-orange-400" 
                        : "bg-zinc-800 text-zinc-600"
                    }`}>
                      {hasValidPlan ? "Mark" : "Blocked"}
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
  );
}
