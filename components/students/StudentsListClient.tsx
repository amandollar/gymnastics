"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import StudentStatusBadge from "./StudentStatusBadge";
import StudentAvatar from "./StudentAvatar";
import {
  formatAge,
  formatINR,
  type StudentStatus,
} from "@/lib/utils/student";
import { computeDaysLeft } from "@/lib/plan/calculations";
import {
  updateStudentActivePlanBatchAction,
  updateStudentNotesAndMedicalAction,
} from "@/lib/actions/students";
import { StudentLevel } from "@prisma/client";
import { markAttendanceAction, undoMarkAttendanceAction } from "@/lib/actions/attendance";
import { STUDENT_LEVELS, getLevelConfig } from "@/lib/utils/level";
import { FreezePlanPopup } from "./studentProfile/FreezePlanPopup";
import { UpgradeLevelModal } from "./studentProfile/UpgradeLevelModal";

export type StudentListItem = {
  id: string;
  studentNumber: number;
  name: string;
  dateOfBirth: Date;
  parentName: string;
  contactNumber: string;
  admissionDate: Date;
  gender: string;
  avatarUrl?: string | null;
  status: StudentStatus;
  level: StudentLevel;
  activePlan: {
    planType: string;
    totalSessions: number;
    sessionsCompleted: number;
    fee: number;
    expiryDate: Date;
    batchId?: string | null;
    payments?: { amount: number }[];
  } | null;
  sessionsPending: number | null;
  createdAt: Date | string;
  notes?: string | null;
  medicalHistory?: string | null;
};

// ─── Three-dot dropdown ────────────────────────────────────────────────────────

function RowMenu({
  student,
  canManage,
  batches,
  onMarkPresent,
}: {
  student: StudentListItem;
  canManage: boolean;
  batches: { id: string; name: string; timing?: string }[];
  onMarkPresent: (student: StudentListItem) => void;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, right: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Modal states for Freeze Plan and Upgrade Level
  const [showFreeze, setShowFreeze] = useState(false);
  const [showUpgradeLevel, setShowUpgradeLevel] = useState(false);

  // Modal states for Update Batch
  const [isUpdateBatchOpen, setIsUpdateBatchOpen] = useState(false);
  const [selectedBatchId, setSelectedBatchId] = useState(student.activePlan?.batchId ?? "");
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modal states for Add Notes (Notes & Medical History)
  const [isNotesModalOpen, setIsNotesModalOpen] = useState(false);
  const [notes, setNotes] = useState(student.notes ?? "");
  const [medicalHistory, setMedicalHistory] = useState(student.medicalHistory ?? "");
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [notesError, setNotesError] = useState<string | null>(null);

  // Calculate fixed position from the button's screen rect
  function openMenu() {
    if (btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      setCoords({ top: r.bottom + 4, right: window.innerWidth - r.right });
    }
    setOpen(true);
  }

  // Close on outside click or scroll
  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        btnRef.current &&
        !btnRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    function onScroll() { setOpen(false); }
    document.addEventListener("mousedown", handler);
    window.addEventListener("scroll", onScroll, true);
    return () => {
      document.removeEventListener("mousedown", handler);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [open]);

  const handleOpenUpdateBatch = () => {
    setOpen(false);
    setSelectedBatchId(student.activePlan?.batchId ?? "");
    setError(null);
    setIsUpdateBatchOpen(true);
  };

  const handleOpenNotesModal = () => {
    setOpen(false);
    setNotes(student.notes ?? "");
    setMedicalHistory(student.medicalHistory ?? "");
    setNotesError(null);
    setIsNotesModalOpen(true);
  };

  const handleSaveNotes = async () => {
    setIsSavingNotes(true);
    setNotesError(null);
    try {
      const res = await updateStudentNotesAndMedicalAction(student.id, {
        notes: notes || null,
        medicalHistory: medicalHistory || null,
      });
      if (res.success) {
        setIsNotesModalOpen(false);
        router.refresh();
      } else {
        setNotesError(res.message || "Failed to update notes");
      }
    } catch (err) {
      setNotesError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setIsSavingNotes(false);
    }
  };

  const handleUpdateBatch = async () => {
    setIsUpdating(true);
    setError(null);
    try {
      const res = await updateStudentActivePlanBatchAction(
        student.id,
        selectedBatchId || null
      );
      if (res.success) {
        setIsUpdateBatchOpen(false);
        router.refresh();
      } else {
        setError(res.message || "Failed to update batch");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setIsUpdating(false);
    }
  };

  const itemClass =
    "flex items-center gap-2.5 w-full px-3.5 py-2.5 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors text-left cursor-pointer";

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={() => (open ? setOpen(false) : openMenu())}
        id={`student-menu-${student.id}`}
        aria-haspopup="true"
        aria-expanded={open}
        className="inline-flex items-center justify-center h-8 w-8 rounded-lg text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
      >
        {/* Three vertical dots */}
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <circle cx="12" cy="5" r="1.5" />
          <circle cx="12" cy="12" r="1.5" />
          <circle cx="12" cy="19" r="1.5" />
        </svg>
      </button>

      {open && (
        <nav
          ref={menuRef}
          role="menu"
          style={{ position: "fixed", top: coords.top, right: coords.right, zIndex: 9999 }}
          className="w-52 rounded-2xl border border-zinc-200 dark:border-zinc-700/80 bg-white dark:bg-zinc-900 shadow-2xl py-1 overflow-hidden z-50 animate-scale-in origin-top-right"
        >
          {/* Edit details */}
          {canManage && (
            <Link
              href={`/students/${student.id}/edit`}
              role="menuitem"
              onClick={() => setOpen(false)}
              className={itemClass}
            >
              <svg className="w-4 h-4 text-zinc-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 012.828 2.828L11.828 15.828a4 4 0 01-1.414.94l-3.414 1.137 1.137-3.414A4 4 0 019 13z" />
              </svg>
              Edit details
            </Link>
          )}

          {/* Add Notes */}
          {canManage && (
            <button
              type="button"
              role="menuitem"
              onClick={handleOpenNotesModal}
              className={itemClass}
            >
              <svg className="w-4 h-4 text-zinc-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Add Notes
            </button>
          )}

          {/* Mark Present */}
          {(() => {
            const isPermitted = student.status === "ACTIVE" || student.status === "GRACE" || student.status === "FREEZE";
            return (
              <button
                type="button"
                role="menuitem"
                disabled={!isPermitted}
                onClick={() => {
                  if (isPermitted) {
                    setOpen(false);
                    onMarkPresent(student);
                  }
                }}
                className={`flex items-center gap-2.5 w-full px-3.5 py-2.5 text-sm text-left transition-colors ${
                  isPermitted
                    ? "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 cursor-pointer"
                    : "text-zinc-400 dark:text-zinc-650 opacity-50 cursor-not-allowed"
                }`}
              >
                <svg className={`w-4 h-4 shrink-0 ${isPermitted ? "text-emerald-500" : "text-zinc-400 dark:text-zinc-600"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Mark Present
              </button>
            );
          })()}

          {/* Freeze Plan */}
          {canManage && student.activePlan && student.status !== "INACTIVE" && student.status !== "NO_PLAN" && student.status !== "EXPIRED" && (
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                setShowFreeze(true);
              }}
              className={itemClass}
            >
              <svg className="w-4 h-4 text-sky-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v18M3 12h18M12 9l-3-3M12 15l-3 3M12 9l3-3M12 15l3 3M9 12L6 9M15 12l3-3M9 12l-3 3M15 12l3 3" />
              </svg>
              Freeze Plan
            </button>
          )}

          {/* Upgrade Level */}
          {canManage && (
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                setShowUpgradeLevel(true);
              }}
              className={itemClass}
            >
              <svg className="w-4 h-4 text-brand-orange-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              Upgrade Level
            </button>
          )}

          <div className="my-1 border-t border-zinc-100 dark:border-zinc-800" />

          {/* Get ID Card */}
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              window.open(`/students/${student.id}/id-card`, "_blank");
            }}
            className={itemClass}
          >
            <svg className="w-4 h-4 text-zinc-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <rect x="3" y="4" width="18" height="16" rx="2" />
              <circle cx="9" cy="10" r="2.5" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 19c0-2 1.8-3.5 4-3.5s4 1.5 4 3.5" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 9h3M15 13h2" />
            </svg>
            Get ID Card
          </button>
        </nav>
      )}

      {/* Freeze popup */}
      {showFreeze && student.activePlan && (
        <FreezePlanPopup
          activePlan={student.activePlan as any}
          studentId={student.id}
          onClose={() => setShowFreeze(false)}
        />
      )}

      {/* Upgrade Level modal */}
      {showUpgradeLevel && (
        <UpgradeLevelModal
          isOpen={showUpgradeLevel}
          onClose={() => setShowUpgradeLevel(false)}
          studentId={student.id}
          studentName={student.name}
          currentLevel={student.level}
        />
      )}

      {/* Update Batch Modal */}
      {isUpdateBatchOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget && !isUpdating) {
              setIsUpdateBatchOpen(false);
            }
          }}
        >
          <div className="relative w-full max-w-md rounded-3xl bg-white dark:bg-zinc-900 shadow-2xl p-6 overflow-hidden animate-scale-in">
            {/* Modal Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                Update Batch
              </h3>
              <button
                type="button"
                disabled={isUpdating}
                onClick={() => setIsUpdateBatchOpen(false)}
                className="h-8 w-8 rounded-xl flex items-center justify-center text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer disabled:opacity-50"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            {student.activePlan ? (
              <div className="space-y-4">
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  Update the batch assignment for <span className="font-semibold text-zinc-800 dark:text-zinc-200">{student.name}</span>&apos;s active plan.
                </p>

                {error && (
                  <div className="p-3 text-xs bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 rounded-xl border border-rose-100 dark:border-rose-900/30">
                    {error}
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                    Select Batch
                  </label>
                  <select
                    value={selectedBatchId}
                    onChange={(e) => setSelectedBatchId(e.target.value)}
                    disabled={isUpdating}
                    className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-brand-orange-500/20 disabled:opacity-50"
                  >
                    <option value="">No batch assigned</option>
                    {batches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} {b.timing ? `(${b.timing})` : ""}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200">{student.name}</span> has no active plan. Please assign a plan first to place them in a batch.
                </p>
                {error && (
                  <div className="p-3 text-xs bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 rounded-xl border border-rose-100 dark:border-rose-900/30">
                    {error}
                  </div>
                )}
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex gap-2.5 justify-end mt-6">
              <button
                type="button"
                disabled={isUpdating}
                onClick={() => setIsUpdateBatchOpen(false)}
                className="px-4 py-2 text-sm font-semibold text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              {student.activePlan && (
                <button
                  type="button"
                  disabled={isUpdating}
                  onClick={handleUpdateBatch}
                  className="px-4 py-2 text-sm font-semibold text-white bg-brand-orange-500 hover:bg-brand-orange-600 rounded-xl transition-colors cursor-pointer disabled:opacity-50 inline-flex items-center gap-1.5"
                >
                  {isUpdating ? "Updating..." : "Update"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Notes & Medical Modal */}
      {isNotesModalOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget && !isSavingNotes) {
              setIsNotesModalOpen(false);
            }
          }}
        >
          <div className="relative w-full max-w-md rounded-3xl bg-white dark:bg-zinc-900 shadow-2xl p-6 overflow-hidden animate-scale-in space-y-4">
            {/* Modal Header */}
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                Notes & Medical History
              </h3>
              <button
                type="button"
                disabled={isSavingNotes}
                onClick={() => setIsNotesModalOpen(false)}
                className="h-8 w-8 rounded-xl flex items-center justify-center text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer disabled:opacity-50"
              >
                ✕
              </button>
            </div>

            {notesError && (
              <div className="p-3 text-xs bg-rose-50 dark:bg-rose-955/20 text-rose-600 dark:text-rose-400 rounded-xl border border-rose-100 dark:border-rose-900/30 animate-fade-in">
                {notesError}
              </div>
            )}

            {/* Modal Body */}
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-400 dark:text-zinc-550 uppercase tracking-wider">
                  Medical & Allergies
                </label>
                <textarea
                  value={medicalHistory}
                  onChange={(e) => setMedicalHistory(e.target.value)}
                  disabled={isSavingNotes}
                  placeholder="e.g. Asthma, peanut allergy, none..."
                  rows={3}
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-3 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-brand-orange-500/50 disabled:opacity-50"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-400 dark:text-zinc-550 uppercase tracking-wider">
                  Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  disabled={isSavingNotes}
                  placeholder="e.g. Behavioral notes, requirements..."
                  rows={3}
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-3 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-brand-orange-500/50 disabled:opacity-50"
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex gap-2.5 justify-end pt-2">
              <button
                type="button"
                disabled={isSavingNotes}
                onClick={() => setIsNotesModalOpen(false)}
                className="px-4 py-2 text-sm font-semibold text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSavingNotes}
                onClick={handleSaveNotes}
                className="px-4 py-2 text-sm font-semibold text-white bg-brand-orange-500 hover:bg-brand-orange-600 rounded-xl transition-colors cursor-pointer disabled:opacity-50 inline-flex items-center gap-1.5"
              >
                {isSavingNotes ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

type SortField = "NONE" | "ROLL" | "NAME" | "AGE" | "LEVEL" | "SESSIONS_LEFT" | "DAYS_LEFT" | "ADMISSION";

export default function StudentsListClient({
  students,
  batches,
  canManage,
}: {
  students: StudentListItem[];
  batches: { id: string; name: string; timing?: string }[];
  canManage: boolean;
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StudentStatus | "ALL">("ALL");

  const [toast, setToast] = useState<{
    studentId: string;
    studentName: string;
    message: string;
    dateStr: string;
  } | null>(null);
  const undoTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (undoTimeoutRef.current) {
        clearTimeout(undoTimeoutRef.current);
      }
    };
  }, []);

  const handleMarkPresent = async (student: StudentListItem) => {
    if (undoTimeoutRef.current) {
      clearTimeout(undoTimeoutRef.current);
      undoTimeoutRef.current = null;
    }
    setToast(null);

    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

    const res = await markAttendanceAction(student.id, todayStr);
    if (res.success) {
      setToast({
        studentId: student.id,
        studentName: student.name,
        message: `Marked ${student.name} present`,
        dateStr: todayStr,
      });

      router.refresh();

      undoTimeoutRef.current = setTimeout(() => {
        setToast(null);
      }, 3000);
    } else {
      alert(res.message || "Failed to mark attendance");
    }
  };

  const handleUndo = async () => {
    if (!toast) return;

    if (undoTimeoutRef.current) {
      clearTimeout(undoTimeoutRef.current);
      undoTimeoutRef.current = null;
    }

    const res = await undoMarkAttendanceAction(toast.studentId, toast.dateStr);
    if (res.success) {
      setToast({
        studentId: "",
        studentName: "",
        message: `Undone attendance for ${toast.studentName}`,
        dateStr: "",
      });
      router.refresh();
      setTimeout(() => {
        setToast(null);
      }, 1500);
    } else {
      alert(res.message || "Failed to undo attendance");
      setToast(null);
    }
  };
  const [batchFilter, setBatchFilter] = useState<string>("ALL");
  const [planTypeFilter, setPlanTypeFilter] = useState<string>("ALL");
  const [sortField, setSortField] = useState<SortField>("NONE");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // Popup states
  const [filterOpen, setFilterOpen] = useState(false);
  const [headerMenuOpen, setHeaderMenuOpen] = useState(false);

  // Refs
  const filterRef = useRef<HTMLDivElement>(null);
  const headerMenuRef = useRef<HTMLDivElement>(null);

  // Click outside handling for popups
  useEffect(() => {
    if (!filterOpen) return;
    function clickHandler(e: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        const toggleButton = filterRef.current.parentElement?.querySelector("button");
        if (toggleButton && !toggleButton.contains(e.target as Node)) {
          setFilterOpen(false);
        }
      }
    }
    document.addEventListener("mousedown", clickHandler);
    return () => document.removeEventListener("mousedown", clickHandler);
  }, [filterOpen]);

  useEffect(() => {
    if (!headerMenuOpen) return;
    function clickHandler(e: MouseEvent) {
      if (headerMenuRef.current && !headerMenuRef.current.contains(e.target as Node)) {
        const toggleButton = headerMenuRef.current.parentElement?.querySelector("button");
        if (toggleButton && !toggleButton.contains(e.target as Node)) {
          setHeaderMenuOpen(false);
        }
      }
    }
    document.addEventListener("mousedown", clickHandler);
    return () => document.removeEventListener("mousedown", clickHandler);
  }, [headerMenuOpen]);

  const isFilterApplied = useMemo(() => {
    return statusFilter !== "ALL" || batchFilter !== "ALL" || planTypeFilter !== "ALL" || sortField !== "NONE";
  }, [statusFilter, batchFilter, planTypeFilter, sortField]);

  const handleClearFilters = () => {
    setStatusFilter("ALL");
    setBatchFilter("ALL");
    setPlanTypeFilter("ALL");
    setSortField("NONE");
    setSortOrder("asc");
  };

  const filtered = useMemo(() => {
    let rows = [...students];
    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.studentNumber.toString().startsWith(q)
      );
    }
    if (statusFilter !== "ALL") {
      rows = rows.filter((s) => s.status === statusFilter);
    }
    if (batchFilter !== "ALL") {
      if (batchFilter === "UNASSIGNED") {
        rows = rows.filter((s) => !s.activePlan || !s.activePlan.batchId);
      } else {
        rows = rows.filter((s) => s.activePlan?.batchId === batchFilter);
      }
    }
    if (planTypeFilter !== "ALL") {
      rows = rows.filter((s) => s.activePlan?.planType === planTypeFilter);
    }

    // Apply sorting
    if (sortField === "NONE") {
      rows.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (sortField === "NAME") {
      rows.sort((a, b) => {
        const cmp = a.name.localeCompare(b.name);
        return sortOrder === "asc" ? cmp : -cmp;
      });
    } else if (sortField === "AGE") {
      rows.sort((a, b) => {
        const timeA = new Date(a.dateOfBirth).getTime();
        const timeB = new Date(b.dateOfBirth).getTime();
        return sortOrder === "asc" ? timeB - timeA : timeA - timeB;
      });
    } else if (sortField === "ADMISSION") {
      rows.sort((a, b) => {
        const timeA = new Date(a.admissionDate).getTime();
        const timeB = new Date(b.admissionDate).getTime();
        return sortOrder === "asc" ? timeA - timeB : timeB - timeA;
      });
    } else if (sortField === "ROLL") {
      rows.sort((a, b) => {
        return sortOrder === "asc"
          ? a.studentNumber - b.studentNumber
          : b.studentNumber - a.studentNumber;
      });
    } else if (sortField === "SESSIONS_LEFT") {
      rows.sort((a, b) => {
        const sa = a.sessionsPending;
        const sb = b.sessionsPending;
        if (sa === null && sb === null) return 0;
        if (sa === null) return 1;
        if (sb === null) return -1;
        return sortOrder === "asc" ? sa - sb : sb - sa;
      });
    } else if (sortField === "DAYS_LEFT") {
      rows.sort((a, b) => {
        const hasA = !!a.activePlan;
        const hasB = !!b.activePlan;
        if (!hasA && !hasB) return 0;
        if (!hasA) return 1;
        if (!hasB) return -1;
        const daysA = computeDaysLeft(new Date(a.activePlan!.expiryDate));
        const daysB = computeDaysLeft(new Date(b.activePlan!.expiryDate));
        return sortOrder === "asc" ? daysA - daysB : daysB - daysA;
      });
    } else if (sortField === "LEVEL") {
      rows.sort((a, b) => {
        const idxA = STUDENT_LEVELS.findIndex((lvl) => lvl.value === a.level);
        const idxB = STUDENT_LEVELS.findIndex((lvl) => lvl.value === b.level);
        return sortOrder === "asc" ? idxA - idxB : idxB - idxA;
      });
    }

    return rows;
  }, [students, search, statusFilter, batchFilter, planTypeFilter, sortField, sortOrder]);



  const handleHeaderSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const renderHeader = (label: string, field: SortField) => {
    const isActive = sortField === field;
    return (
      <th
        onClick={() => handleHeaderSort(field)}
        className="px-4 py-3 cursor-pointer select-none group hover:bg-zinc-100/50 dark:hover:bg-zinc-800/60 transition-colors"
      >
        <div className="flex items-center gap-1">
          <span>{label}</span>
          {isActive ? (
            sortOrder === "asc" ? (
              <svg className="w-3.5 h-3.5 text-brand-orange-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
              </svg>
            ) : (
              <svg className="w-3.5 h-3.5 text-brand-orange-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            )
          ) : (
            <svg className="w-3.5 h-3.5 text-zinc-450 dark:text-zinc-500 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
            </svg>
          )}
        </div>
      </th>
    );
  };

  return (
    <div className="space-y-4 min-w-0">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center justify-between w-full">
          <div>
            <h1 className="text-3xl sm:text-5xl font-light tracking-tight text-zinc-955 dark:text-zinc-50">
              Students
            </h1>
          </div>
          {canManage && (
            <div className="relative">
              {/* Desktop action buttons */}
              <div className="hidden sm:flex items-center gap-2">
                <Link
                  href="/students/bulk-upload"
                  className="inline-flex items-center justify-center rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 py-2.5 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                >
                  Bulk upload
                </Link>
                <Link
                  href="/students/print-ids"
                  className="inline-flex items-center gap-1.5 justify-center rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 py-2.5 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                >
                  Print IDs
                </Link>
                <Link
                  href="/students/new"
                  className="inline-flex items-center justify-center rounded-lg bg-brand-orange-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-orange-600 transition-colors"
                >
                  Add student
                </Link>
              </div>

              {/* Mobile three-dot menu */}
              <div className="sm:hidden relative">
                <button
                  type="button"
                  onClick={() => setHeaderMenuOpen(!headerMenuOpen)}
                  className="inline-flex items-center justify-center h-10 w-10 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-350 cursor-pointer transition-colors"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <circle cx="12" cy="5" r="1.5" />
                    <circle cx="12" cy="12" r="1.5" />
                    <circle cx="12" cy="19" r="1.5" />
                  </svg>
                </button>
                {headerMenuOpen && (
                  <div
                    ref={headerMenuRef}
                    className="absolute right-0 mt-2 w-48 rounded-2xl border border-zinc-200 dark:border-zinc-700/80 bg-white dark:bg-zinc-900 shadow-2xl py-1.5 overflow-hidden z-50 animate-scale-in"
                  >
                    <Link
                      href="/students/bulk-upload"
                      onClick={() => setHeaderMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-zinc-705 dark:text-zinc-295 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                    >
                      Bulk upload
                    </Link>
                    <Link
                      href="/students/print-ids"
                      onClick={() => setHeaderMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                    >
                      Print IDs
                    </Link>
                    <Link
                      href="/students/new"
                      onClick={() => setHeaderMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-zinc-700 dark:text-zinc-300 font-semibold hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                    >
                      Add student
                    </Link>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-2 items-center">
        <div className="relative flex-1">
          <input
            type="search"
            placeholder="Search name or ID…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 pl-10 pr-4 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-brand-orange-500/20 transition-all"
          />
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        {/* Mobile View: Filter Trigger Button & Popup */}
        <div className="relative lg:hidden">
          <button
            type="button"
            onClick={() => setFilterOpen(!filterOpen)}
            className={`inline-flex items-center justify-center h-10 w-10 rounded-xl border transition-all cursor-pointer ${
              isFilterApplied
                ? "border-brand-orange-500 bg-brand-orange-50/50 dark:bg-brand-orange-950/20 text-brand-orange-600 dark:text-brand-orange-400"
                : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800"
            }`}
          >
            <div className="relative flex items-center justify-center">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 8.293A1 1 0 013 7.586V4z" />
              </svg>
              {isFilterApplied && (
                <span className="absolute -top-1 -right-1 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-orange-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-orange-500"></span>
                </span>
              )}
            </div>
          </button>

          {/* Filter Popup/Popover */}
          {filterOpen && (
            <div
              ref={filterRef}
              className="absolute right-0 mt-2 w-72 rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-2xl p-5 z-40 space-y-4 animate-scale-in"
            >
              <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-2.5">
                <h4 className="text-sm font-bold text-zinc-950 dark:text-zinc-50">Filter &amp; Sort</h4>
                {isFilterApplied && (
                  <button
                    type="button"
                    onClick={handleClearFilters}
                    className="text-xs font-semibold text-brand-orange-500 hover:text-brand-orange-600 transition-colors"
                  >
                    Clear all
                  </button>
                )}
              </div>

              {/* Status Filter */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                  Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as StudentStatus | "ALL")}
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3 py-2 text-sm text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-brand-orange-500/20"
                >
                  <option value="ALL">All statuses</option>
                  <option value="ACTIVE">Active</option>
                  <option value="GRACE">Grace</option>
                  <option value="FREEZE">Freeze</option>
                  <option value="INACTIVE">Inactive</option>
                  <option value="EXPIRED">Expired</option>
                  <option value="NO_PLAN">No plan</option>
                </select>
              </div>

              {/* Batch Filter */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                  Batch
                </label>
                <select
                  value={batchFilter}
                  onChange={(e) => setBatchFilter(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3 py-2 text-sm text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-brand-orange-500/20"
                >
                  <option value="ALL">All batches</option>
                  <option value="UNASSIGNED">No batch allotted</option>
                  {batches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Plan Type Filter */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                  Plan Type
                </label>
                <select
                  value={planTypeFilter}
                  onChange={(e) => setPlanTypeFilter(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3 py-2 text-sm text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-brand-orange-500/20"
                >
                  <option value="ALL">All plans</option>
                  <option value="REGULAR">Grouped</option>
                  <option value="ONE_TO_ONE">Personal</option>
                </select>
              </div>

              {/* Sort Option */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                  Sort By
                </label>
                <select
                  value={sortField}
                  onChange={(e) => {
                    setSortField(e.target.value as SortField);
                    setSortOrder("asc");
                  }}
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3 py-2 text-sm text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-brand-orange-500/20"
                >
                  <option value="NONE">Sort by newest</option>
                  <option value="NAME">Sort by name</option>
                  <option value="AGE">Sort by age</option>
                  <option value="LEVEL">Sort by level</option>
                  <option value="ADMISSION">Sort by admission</option>
                  <option value="ROLL">Sort by roll</option>
                  <option value="SESSIONS_LEFT">Sess. Left</option>
                  <option value="DAYS_LEFT">Days left</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Desktop View: Inline filters (visible on lg:flex, hidden on mobile/tablet) */}
        <div className="hidden lg:flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StudentStatus | "ALL")}
            className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2 text-sm text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-brand-orange-500/20"
          >
            <option value="ALL">All statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="GRACE">Grace</option>
            <option value="FREEZE">Freeze</option>
            <option value="INACTIVE">Inactive</option>
            <option value="EXPIRED">Expired</option>
            <option value="NO_PLAN">No plan</option>
          </select>
          <select
            value={batchFilter}
            onChange={(e) => setBatchFilter(e.target.value)}
            className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2 text-sm text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-brand-orange-500/20"
          >
            <option value="ALL">All batches</option>
            <option value="UNASSIGNED">No batch</option>
            {batches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
          <select
            value={planTypeFilter}
            onChange={(e) => setPlanTypeFilter(e.target.value)}
            className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2 text-sm text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-brand-orange-500/20"
          >
            <option value="ALL">All plans</option>
            <option value="REGULAR">Grouped</option>
            <option value="ONE_TO_ONE">Personal</option>
          </select>
          <select
            value={sortField}
            onChange={(e) => {
              setSortField(e.target.value as SortField);
              setSortOrder("asc");
            }}
            className="md:hidden rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2 text-sm text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-brand-orange-500/20"
          >
            <option value="NONE">Sort by newest</option>
            <option value="NAME">Sort by name</option>
            <option value="AGE">Sort by age</option>
            <option value="LEVEL">Sort by level</option>
            <option value="ADMISSION">Sort by admission</option>
            <option value="ROLL">Sort by roll</option>
            <option value="SESSIONS_LEFT">Sess. Left</option>
            <option value="DAYS_LEFT">Days left</option>
          </select>
          {isFilterApplied && (
            <button
              type="button"
              onClick={handleClearFilters}
              className="text-xs font-semibold text-brand-orange-500 hover:text-brand-orange-600 transition-colors whitespace-nowrap px-1 cursor-pointer"
            >
              Clear all
            </button>
          )}
        </div>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-2">
        {filtered.length === 0 ? (
          <p className="text-center text-sm text-zinc-500 dark:text-zinc-400 py-10">No students found.</p>
        ) : (
          filtered.map((s) => (
            <div
              key={s.id}
              className={`rounded-lg border-0 p-4 shadow-sm ${
                s.status === "EXPIRED"
                  ? "bg-zinc-100/50 dark:bg-zinc-900/40 text-zinc-400 dark:text-zinc-500"
                  : "bg-white dark:bg-zinc-900"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <Link href={`/students/${s.id}`} prefetch={false} className={`flex items-start gap-3 min-w-0 ${s.status === "EXPIRED" ? "opacity-60" : ""}`}>
                  <StudentAvatar student={s} size={48} />
                  <div className="min-w-0">
                    <p className="font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                      TAG{s.studentNumber} {s.name}
                    </p>
                    <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 flex items-center gap-1.5 flex-wrap">
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded-md text-[9px] font-bold ${getLevelConfig(s.level).badgeBg} ${getLevelConfig(s.level).badgeText} ring-1 ring-zinc-200/40 dark:ring-zinc-800/40`}>
                        {getLevelConfig(s.level).shortLabel}
                      </span>
                      <span>·</span>
                      <span>Age: {formatAge(new Date(s.dateOfBirth))}</span>
                      <span>·</span>
                      <span>{s.contactNumber}</span>
                      <span>·</span>
                      <span className="inline-flex items-center gap-1">
                        <span className={`h-1.5 w-1.5 rounded-full ${
                          s.status === "ACTIVE"
                            ? "bg-emerald-500"
                            : s.status === "GRACE"
                            ? "bg-amber-500"
                            : s.status === "FREEZE"
                            ? "bg-sky-500"
                            : s.status === "INACTIVE"
                            ? "bg-orange-500"
                            : s.status === "EXPIRED"
                            ? "bg-zinc-400"
                            : "bg-zinc-450"
                        }`} />
                        <span>
                          {s.status === "ACTIVE" ? "Active" : s.status === "GRACE" ? "Grace" : s.status === "FREEZE" ? "Freeze" : s.status === "INACTIVE" ? "Inactive" : s.status === "EXPIRED" ? "Expired" : "No plan"}
                        </span>
                      </span>
                    </div>
                  </div>
                </Link>
                <div className="flex items-center gap-1.5 shrink-0">
                  <RowMenu student={s} canManage={canManage} batches={batches} onMarkPresent={handleMarkPresent} />
                </div>
              </div>

              {/* Details grid */}
              <div className={`mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-xs ${s.status === "EXPIRED" ? "opacity-60" : ""}`}>
                <div>
                  <span className="text-zinc-400 dark:text-zinc-550">Plan:</span>{" "}
                  <span className="font-medium text-zinc-700 dark:text-zinc-300">
                    {s.activePlan ? (
                      (s.status === "INACTIVE" || s.status === "EXPIRED") && canManage ? (
                        <Link
                          href={`/plans?student=${s.id}`}
                          prefetch={false}
                          className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 px-2 py-0.5 text-[10px] font-bold text-white transition-colors shadow-sm mt-0.5"
                        >
                          <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                          </svg>
                          New plan
                        </Link>
                      ) : (
                        s.activePlan.planType === "ONE_TO_ONE" ? "personal" : "grouped"
                      )
                    ) : (
                      canManage ? (
                        <Link
                          href={`/plans?student=${s.id}`}
                          prefetch={false}
                          className="inline-flex items-center gap-1 rounded-lg bg-brand-orange-500 hover:bg-brand-orange-600 px-2 py-0.5 text-[10px] font-bold text-white transition-colors shadow-sm mt-0.5"
                        >
                          Assign plan
                        </Link>
                      ) : (
                        "—"
                      )
                    )}
                  </span>
                </div>
                <div>
                  <span className="text-zinc-400 dark:text-zinc-550">Fee:</span>{" "}
                  {s.activePlan ? (
                    <span className="font-medium text-zinc-700 dark:text-zinc-300">
                      {formatINR(s.activePlan.fee)}
                      {(() => {
                        const totalPaid = s.activePlan.payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
                        const dues = Math.max(0, s.activePlan.fee - totalPaid);
                        return dues > 0 ? (
                          <span className="ml-1.5 text-xs font-semibold text-rose-500 dark:text-rose-450">
                            ({formatINR(dues)} due)
                          </span>
                        ) : (
                          <span className="ml-1.5 text-xs font-medium text-zinc-400 dark:text-zinc-550 inline-flex items-center gap-0.5">
                            <svg className="w-3 h-3 text-emerald-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                            paid
                          </span>
                        );
                      })()}
                    </span>
                  ) : (
                    <span className="font-medium text-zinc-700 dark:text-zinc-300">—</span>
                  )}
                </div>
                <div>
                  <span className="text-zinc-400 dark:text-zinc-550">Sess. Left:</span>{" "}
                  <span className="font-medium text-zinc-700 dark:text-zinc-300">
                    {s.sessionsPending ?? "—"}
                  </span>
                </div>
                <div>
                  <span className="text-zinc-400 dark:text-zinc-550">Days left:</span>{" "}
                  <span className="font-medium text-zinc-700 dark:text-zinc-300">
                    {s.activePlan
                      ? computeDaysLeft(new Date(s.activePlan.expiryDate))
                      : "—"}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block rounded-lg border-0 bg-white dark:bg-zinc-900 shadow-sm overflow-x-auto transition-colors">
        <table className="w-full text-left text-sm min-w-[720px]">
          <thead>
            <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-800/40 text-xs font-medium text-zinc-500 dark:text-zinc-400">
              {renderHeader("Student", "ROLL")}
              {renderHeader("Name", "NAME")}
              {renderHeader("Age", "AGE")}
              {renderHeader("Level", "LEVEL")}
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Plan</th>
              {renderHeader("Sess. Left", "SESSIONS_LEFT")}
              {renderHeader("Days left", "DAYS_LEFT")}
              <th className="px-4 py-3">Fee</th>
              <th className="px-4 py-3 text-right"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-10 text-center text-zinc-500 dark:text-zinc-400">
                  No students found.
                </td>
              </tr>
            ) : (
              filtered.map((s) => (
                <tr
                  key={s.id}
                  onClick={(e) => {
                    const target = e.target as HTMLElement;
                    if (target.closest('a, button, select, input, [data-prevent-row-click="true"]')) {
                      return;
                    }
                    router.push(`/students/${s.id}`);
                  }}
                  className={`hover:bg-zinc-50/80 dark:hover:bg-zinc-800/30 cursor-pointer transition-colors ${
                    s.status === "EXPIRED"
                      ? "text-zinc-400 dark:text-zinc-555 bg-zinc-50/30 dark:bg-zinc-950/20"
                      : ""
                  }`}
                >
                  <td className={`px-4 py-3 ${s.status === "EXPIRED" ? "opacity-60" : ""}`}>
                    <Link href={`/students/${s.id}`} prefetch={false} className="flex items-center gap-3 hover:opacity-90">
                      <StudentAvatar student={s} size={40} />
                      <span className="font-medium text-zinc-500 dark:text-zinc-400 tabular-nums">
                        {s.studentNumber}
                      </span>
                    </Link>
                  </td>
                  <td className={`px-4 py-3 ${s.status === "EXPIRED" ? "opacity-60" : ""}`}>
                    <Link
                      href={`/students/${s.id}`}
                      prefetch={false}
                      className={`font-medium hover:underline ${
                        s.status === "EXPIRED"
                          ? "text-zinc-400 dark:text-zinc-500"
                          : "text-zinc-900 dark:text-zinc-100"
                      }`}
                    >
                      {s.name}
                    </Link>
                    <p className={`text-xs ${
                      s.status === "EXPIRED"
                        ? "text-zinc-450 dark:text-zinc-500/80"
                        : "text-zinc-500 dark:text-zinc-400"
                    }`}>{s.contactNumber}</p>
                  </td>
                  <td className={`px-4 py-3 ${
                    s.status === "EXPIRED"
                      ? "text-zinc-400/80 dark:text-zinc-500/80 opacity-60"
                      : "text-zinc-600 dark:text-zinc-300"
                  }`}>
                    {formatAge(new Date(s.dateOfBirth))}
                  </td>
                  <td className={`px-4 py-3 ${s.status === "EXPIRED" ? "opacity-60" : ""}`}>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold ${getLevelConfig(s.level).badgeBg} ${getLevelConfig(s.level).badgeText} ring-1 ring-zinc-200/40 dark:ring-zinc-800/40`}>
                      {getLevelConfig(s.level).shortLabel}
                    </span>
                  </td>
                  <td className={`px-4 py-3 ${s.status === "EXPIRED" ? "opacity-60" : ""}`}>
                    <StudentStatusBadge status={s.status} />
                  </td>
                  <td className="px-4 py-3 text-zinc-650 dark:text-zinc-350">
                    {s.activePlan ? (
                      (s.status === "INACTIVE" || s.status === "EXPIRED") && canManage ? (
                        <Link
                          href={`/plans?student=${s.id}`}
                          prefetch={false}
                          data-prevent-row-click="true"
                          className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 px-2.5 py-1 text-xs font-semibold text-white transition-colors shadow-sm"
                        >
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                          </svg>
                          New plan
                        </Link>
                      ) : (
                        <span className={s.status === "EXPIRED" ? "opacity-60" : ""}>
                          {s.activePlan.planType === "ONE_TO_ONE" ? "personal" : "grouped"}
                        </span>
                      )
                    ) : (
                      canManage ? (
                        <Link
                          href={`/plans?student=${s.id}`}
                          prefetch={false}
                          data-prevent-row-click="true"
                          className="inline-flex items-center gap-1 rounded-lg bg-brand-orange-500 hover:bg-brand-orange-600 px-2.5 py-1 text-xs font-semibold text-white transition-colors shadow-sm"
                        >
                          Assign plan
                        </Link>
                      ) : (
                        "—"
                      )
                    )}
                  </td>
                  <td className={`px-4 py-3 ${
                    s.status === "EXPIRED"
                      ? "text-zinc-400/80 dark:text-zinc-500/80 opacity-60"
                      : "text-zinc-600 dark:text-zinc-300"
                  }`}>
                    {s.sessionsPending ?? "—"}
                  </td>
                  <td className={`px-4 py-3 ${
                    s.status === "EXPIRED"
                      ? "text-zinc-400/80 dark:text-zinc-500/80 opacity-60"
                      : "text-zinc-600 dark:text-zinc-300"
                  }`}>
                    {s.activePlan
                      ? computeDaysLeft(new Date(s.activePlan.expiryDate))
                      : "—"}
                  </td>
                  <td className={`px-4 py-3 ${
                    s.status === "EXPIRED"
                      ? "text-zinc-400/80 dark:text-zinc-500/80 opacity-60"
                      : "text-zinc-600 dark:text-zinc-300"
                  }`}>
                    {s.activePlan ? (
                      <div className="flex flex-col gap-0.5">
                        <span className={`font-semibold ${
                          s.status === "EXPIRED"
                            ? "text-zinc-400 dark:text-zinc-500"
                            : "text-zinc-900 dark:text-zinc-100"
                        }`}>
                          {formatINR(s.activePlan.fee)}
                        </span>
                        {(() => {
                          const totalPaid = s.activePlan.payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
                          const dues = Math.max(0, s.activePlan.fee - totalPaid);
                          return dues > 0 ? (
                            <span className="text-xs font-semibold text-rose-500 dark:text-rose-400">
                              {formatINR(dues)} due
                            </span>
                          ) : (
                            <span className="text-xs font-medium text-zinc-400 dark:text-zinc-555 flex items-center gap-1">
                              <svg className="w-3.5 h-3.5 text-emerald-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                              paid
                            </span>
                          );
                        })()}
                      </div>
                    ) : (
                      "—"
                    )}
                  </td>

                  {/* ── Actions ── */}
                  <td className="px-4 py-3" data-prevent-row-click="true">
                    <div className="flex items-center justify-end gap-1">
                      {/* Three-dot dropdown */}
                      <RowMenu student={s} canManage={canManage} batches={batches} onMarkPresent={handleMarkPresent} />
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {/* Undo Toast Notification (Bottom of screen) */}
      {toast && (
        <div
          className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-sm z-50 rounded-2xl border px-4 py-3.5 text-sm font-semibold shadow-lg bg-zinc-900 text-white border-zinc-800 flex items-center justify-between gap-4 animate-fade-in"
        >
          <span className="truncate">{toast.message}</span>
          {toast.studentId && (
            <button
              onClick={handleUndo}
              className="text-brand-orange-400 hover:text-brand-orange-350 active:scale-95 text-xs font-bold uppercase tracking-wider shrink-0 transition-all cursor-pointer"
            >
              Undo
            </button>
          )}
        </div>
      )}
    </div>
  );
}
