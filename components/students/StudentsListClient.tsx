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
  } | null;
  sessionsPending: number | null;
};

// ─── Three-dot dropdown ────────────────────────────────────────────────────────

function RowMenu({
  student,
  canManage,
}: {
  student: StudentListItem;
  canManage: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, right: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

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
    </>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

export default function StudentsListClient({
  students,
  canManage,
}: {
  students: StudentListItem[];
  canManage: boolean;
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StudentStatus | "ALL">("ALL");

  const filtered = useMemo(() => {
    let rows = students;
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
    return rows;
  }, [students, search, statusFilter]);

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
          <div className="flex gap-2 w-full sm:w-auto">
            <Link
              href="/students/bulk-upload"
              className="flex-1 sm:flex-none inline-flex items-center justify-center rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 py-2.5 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
            >
              Bulk upload
            </Link>
            <Link
              href="/students/new"
              className="flex-1 sm:flex-none inline-flex items-center justify-center rounded-lg bg-brand-orange-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-orange-600 transition-colors"
            >
              Add student
            </Link>
          </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="search"
          placeholder="Search name, parent, ID, phone…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-brand-orange-500/20"
        />
        <select
          value={statusFilter}
          onChange={(e) =>
            setStatusFilter(e.target.value as StudentStatus | "ALL")
          }
          className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2 text-sm text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-brand-orange-500/20"
        >
          <option value="ALL">All statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="GRACE">Grace</option>
          <option value="FREEZE">Freeze</option>
          <option value="INACTIVE">Inactive</option>
          <option value="NO_PLAN">No plan</option>
        </select>
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
                  {s.activePlan.planType === "ONE_TO_ONE" ? "1-to-1" : "Regular"}{" "}
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
                  className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
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
                    className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 012.828 2.828L11.828 15.828a4 4 0 01-1.414.94l-3.414 1.137 1.137-3.414A4 4 0 019 13z" />
                    </svg>
                    Edit
                  </Link>
                )}
                <RowMenu student={s} canManage={canManage} />
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
                        ? "1-to-1"
                        : "Regular"
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
                      <RowMenu student={s} canManage={canManage} />
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
