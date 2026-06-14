"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import StudentStatusBadge from "./StudentStatusBadge";
import StudentAvatar from "./StudentAvatar";
import {
  formatAge,
  formatINR,
  formatTenure,
  type StudentStatus,
} from "@/lib/utils/student";
import { computeDaysLeft } from "@/lib/plan/calculations";
import { updateStudentActivePlanBatchAction } from "@/lib/actions/students";

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
  activePlan: {
    planType: string;
    totalSessions: number;
    sessionsCompleted: number;
    fee: number;
    expiryDate: Date;
    batchId?: string | null;
  } | null;
  sessionsPending: number | null;
  createdAt: Date | string;
};

// ─── Three-dot dropdown ────────────────────────────────────────────────────────

function RowMenu({
  student,
  canManage,
  batches,
}: {
  student: StudentListItem;
  canManage: boolean;
  batches: { id: string; name: string; timing?: string }[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, right: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Modal states for Update Batch
  const [isUpdateBatchOpen, setIsUpdateBatchOpen] = useState(false);
  const [selectedBatchId, setSelectedBatchId] = useState(student.activePlan?.batchId ?? "");
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        className="inline-flex items-center justify-center h-8 w-8 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
      >
        {/* Three vertical dots */}
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <circle cx="12" cy="5" r="1.5" />
          <circle cx="12" cy="12" r="1.5" />
          <circle cx="12" cy="19" r="1.5" />
        </svg>
      </button>

      {open && (
        <div
          ref={menuRef}
          role="menu"
          style={{ position: "fixed", top: coords.top, right: coords.right, zIndex: 9999 }}
          className="w-52 rounded-2xl border border-zinc-200 dark:border-zinc-700/80 bg-white dark:bg-zinc-900 shadow-2xl py-1 overflow-hidden"
        >
          {/* Mark Present */}
          <button
            type="button"
            role="menuitem"
            onClick={() => { setOpen(false); /* TODO: trigger mark present */ }}
            className={itemClass}
          >
            <svg className="w-4 h-4 text-emerald-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            Mark Present
          </button>

          {/* Update Payment */}
          {canManage && (
            <button
              type="button"
              role="menuitem"
              onClick={() => { setOpen(false); /* TODO: trigger update payment */ }}
              className={itemClass}
            >
              <svg className="w-4 h-4 text-sky-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <rect x="2" y="6" width="20" height="13" rx="2" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M2 10h20" />
                <circle cx="7" cy="15" r="1" fill="currentColor" />
              </svg>
              Update Payment
            </button>
          )}

          {/* Change Status */}
          {canManage && (
            <button
              type="button"
              role="menuitem"
              onClick={() => { setOpen(false); /* TODO: trigger change status */ }}
              className={itemClass}
            >
              <svg className="w-4 h-4 text-violet-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h10M4 18h6" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 15l2 2 4-4" />
              </svg>
              Change Status
            </button>
          )}

          {/* Update Batch */}
          {canManage && (
            <button
              type="button"
              role="menuitem"
              onClick={handleOpenUpdateBatch}
              className={itemClass}
            >
              <svg className="w-4 h-4 text-brand-orange-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Update Batch
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
        </div>
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
                  Update the batch assignment for <span className="font-semibold text-zinc-800 dark:text-zinc-200">{student.name}</span>'s active plan.
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
    </>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

type SortOption = "NONE" | "NAME" | "AGE" | "ADMISSION" | "ROLL";

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
  const [batchFilter, setBatchFilter] = useState<string>("ALL");
  const [planTypeFilter, setPlanTypeFilter] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<SortOption>("NONE");

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
    return statusFilter !== "ALL" || batchFilter !== "ALL" || planTypeFilter !== "ALL" || sortBy !== "NONE";
  }, [statusFilter, batchFilter, planTypeFilter, sortBy]);

  const handleClearFilters = () => {
    setStatusFilter("ALL");
    setBatchFilter("ALL");
    setPlanTypeFilter("ALL");
    setSortBy("NONE");
  };

  const filtered = useMemo(() => {
    let rows = [...students];
    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.parentName.toLowerCase().includes(q) ||
          s.contactNumber.includes(q) ||
          String(s.studentNumber).includes(q)
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
    if (sortBy === "NONE") {
      rows.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (sortBy === "NAME") {
      rows.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === "AGE") {
      rows.sort((a, b) => new Date(b.dateOfBirth).getTime() - new Date(a.dateOfBirth).getTime());
    } else if (sortBy === "ADMISSION") {
      rows.sort((a, b) => new Date(b.admissionDate).getTime() - new Date(a.admissionDate).getTime());
    } else if (sortBy === "ROLL") {
      rows.sort((a, b) => a.studentNumber - b.studentNumber);
    }

    return rows;
  }, [students, search, statusFilter, batchFilter, planTypeFilter, sortBy]);

  const stats = useMemo(() => {
    return {
      total: students.length,
      active: students.filter((s) =>
        ["ACTIVE", "GRACE"].includes(s.status)
      ).length,
      noPlan: students.filter((s) => s.status === "NO_PLAN").length,
    };
  }, [students]);

  return (
    <div className="space-y-4 min-w-0">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center justify-between w-full">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
              Students
            </h1>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              {stats.total} total · {stats.active} active · {stats.noPlan} without
              plan
            </p>
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
            placeholder="Search name, parent, ID, phone…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 pl-10 pr-4 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-brand-orange-500/20 transition-all"
          />
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        {/* Mobile View: Filter Trigger Button & Popup */}
        <div className="relative sm:hidden">
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
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3 py-2 text-sm text-zinc-850 dark:text-zinc-150 focus:outline-none focus:ring-2 focus:ring-brand-orange-500/20"
                >
                  <option value="ALL">All statuses</option>
                  <option value="ACTIVE">Active</option>
                  <option value="GRACE">Grace</option>
                  <option value="FREEZE">Freeze</option>
                  <option value="INACTIVE">Inactive</option>
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
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3 py-2 text-sm text-zinc-850 dark:text-zinc-150 focus:outline-none focus:ring-2 focus:ring-brand-orange-500/20"
                >
                  <option value="ALL">All batches</option>
                  <option value="UNASSIGNED">No batch assigned</option>
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
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3 py-2 text-sm text-zinc-850 dark:text-zinc-150 focus:outline-none focus:ring-2 focus:ring-brand-orange-500/20"
                >
                  <option value="ALL">All plans</option>
                  <option value="REGULAR">Group class</option>
                  <option value="ONE_TO_ONE">Personal training</option>
                </select>
              </div>

              {/* Sort Option */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                  Sort By
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3 py-2 text-sm text-zinc-850 dark:text-zinc-150 focus:outline-none focus:ring-2 focus:ring-brand-orange-500/20"
                >
                  <option value="NONE">Sort by newest</option>
                  <option value="NAME">Sort by name</option>
                  <option value="AGE">Sort by age</option>
                  <option value="ADMISSION">Sort by admission</option>
                  <option value="ROLL">Sort by roll</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Desktop View: Inline filters (visible on sm:flex, hidden on mobile) */}
        <div className="hidden sm:flex items-center gap-2">
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
            <option value="NO_PLAN">No plan</option>
          </select>
          <select
            value={batchFilter}
            onChange={(e) => setBatchFilter(e.target.value)}
            className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2 text-sm text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-brand-orange-500/20"
          >
            <option value="ALL">All batches</option>
            <option value="UNASSIGNED">No batch assigned</option>
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
            <option value="REGULAR">Group class</option>
            <option value="ONE_TO_ONE">Personal training</option>
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2 text-sm text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-brand-orange-500/20"
          >
            <option value="NONE">Sort by newest</option>
            <option value="NAME">Sort by name</option>
            <option value="AGE">Sort by age</option>
            <option value="ADMISSION">Sort by admission</option>
            <option value="ROLL">Sort by roll</option>
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
              className="rounded-lg border-0 bg-white dark:bg-zinc-900 p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-2">
                <Link href={`/students/${s.id}`} className="flex items-start gap-3 min-w-0">
                  <StudentAvatar student={s} size={48} />
                  <div className="min-w-0">
                    <p className="font-medium text-zinc-900 dark:text-zinc-100 truncate">
                      #{s.studentNumber} {s.name}
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                      {formatAge(new Date(s.dateOfBirth))} · {formatTenure(new Date(s.admissionDate))}
                    </p>
                  </div>
                </Link>
                <StudentStatusBadge status={s.status} />
              </div>
              {s.activePlan ? (
                <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-400">
                  {s.activePlan.planType === "ONE_TO_ONE" ? "personal" : "grouped"}{" "}
                  · {s.sessionsPending} sessions left ·{" "}
                  {formatINR(s.activePlan.fee)}
                </p>
              ) : (
                <p className="mt-2 text-xs text-zinc-400 dark:text-zinc-500">No plan assigned</p>
              )}
              {/* Mobile row actions */}
              <div className="mt-3 flex items-center gap-2 border-t border-zinc-100 dark:border-zinc-800 pt-3">
                <Link
                  href={`/students/${s.id}`}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 px-3 py-1.5 text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  View
                </Link>
                {canManage && (
                  <Link
                    href={`/students/${s.id}/edit`}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 px-3 py-1.5 text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 012.828 2.828L11.828 15.828a4 4 0 01-1.414.94l-3.414 1.137 1.137-3.414A4 4 0 019 13z" />
                    </svg>
                    Edit
                  </Link>
                )}
                <RowMenu student={s} canManage={canManage} batches={batches} />
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
              <th className="px-4 py-3">Student</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Age</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Plan</th>
              <th className="px-4 py-3">Sessions left</th>
              <th className="px-4 py-3">Days left</th>
              <th className="px-4 py-3">Fee</th>
              <th className="px-4 py-3 text-right">Actions</th>
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
                  className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/30 cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3">
                    <Link href={`/students/${s.id}`} className="flex items-center gap-3 hover:opacity-90">
                      <StudentAvatar student={s} size={40} />
                      <span className="font-medium text-zinc-500 dark:text-zinc-400 tabular-nums">
                        {s.studentNumber}
                      </span>
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/students/${s.id}`}
                      className="font-medium text-zinc-900 dark:text-zinc-100 hover:underline"
                    >
                      {s.name}
                    </Link>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">{s.parentName}</p>
                  </td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">
                    {formatAge(new Date(s.dateOfBirth))}
                  </td>
                  <td className="px-4 py-3">
                    <StudentStatusBadge status={s.status} />
                  </td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">
                    {s.activePlan
                      ? s.activePlan.planType === "ONE_TO_ONE"
                        ? "personal"
                        : "grouped"
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">
                    {s.sessionsPending ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">
                    {s.activePlan
                      ? computeDaysLeft(new Date(s.activePlan.expiryDate))
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">
                    {s.activePlan ? formatINR(s.activePlan.fee) : "—"}
                  </td>

                  {/* ── Actions ── */}
                  <td className="px-4 py-3" data-prevent-row-click="true">
                    <div className="flex items-center justify-end gap-1">
                      {/* View */}
                      <Link
                        href={`/students/${s.id}`}
                        title="View profile"
                        className="inline-flex items-center justify-center h-8 w-8 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </Link>

                      {/* Edit */}
                      {canManage && (
                        <Link
                          href={`/students/${s.id}/edit`}
                          title="Edit profile"
                          className="inline-flex items-center justify-center h-8 w-8 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 012.828 2.828L11.828 15.828a4 4 0 01-1.414.94l-3.414 1.137 1.137-3.414A4 4 0 019 13z" />
                          </svg>
                        </Link>
                      )}

                      {/* Three-dot dropdown */}
                      <RowMenu student={s} canManage={canManage} batches={batches} />
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
