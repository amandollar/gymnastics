"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
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

export default function StudentsListClient({
  students,
  canManage,
}: {
  students: StudentListItem[];
  canManage: boolean;
}) {
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
          <Link
            href="/students/new"
            className="inline-flex w-full sm:w-auto items-center justify-center rounded-lg bg-brand-orange-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-orange-600 transition-colors"
          >
            Add student
          </Link>
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
            <Link
              key={s.id}
              href={`/students/${s.id}`}
              className="block rounded-lg border-0 bg-white dark:bg-zinc-900 p-4 shadow-sm hover:shadow-md transition-all duration-300"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-3 min-w-0">
                  <StudentAvatar student={s} size={48} />
                  <div className="min-w-0">
                    <p className="font-medium text-zinc-900 dark:text-zinc-100 truncate">
                      #{s.studentNumber} {s.name}
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                      {formatAge(new Date(s.dateOfBirth))} · {formatTenure(new Date(s.admissionDate))}
                    </p>
                  </div>
                </div>
                <StudentStatusBadge status={s.status} />
              </div>
              {s.activePlan ? (
                <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-400">
                  {s.activePlan.planType === "ONE_TO_ONE" ? "1-to-1" : "Regular"} ·{" "}
                  {s.sessionsPending} sessions left ·{" "}
                  {formatINR(s.activePlan.fee)}
                </p>
              ) : (
                <p className="mt-2 text-xs text-zinc-400 dark:text-zinc-500">No plan assigned</p>
              )}
            </Link>
          ))
        )}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block rounded-lg border-0 bg-white dark:bg-zinc-900 shadow-sm overflow-x-auto transition-colors">
        <table className="w-full text-left text-sm min-w-[640px]">
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
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-zinc-500 dark:text-zinc-400">
                  No students found.
                </td>
              </tr>
            ) : (
              filtered.map((s) => (
                <tr key={s.id} className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/30 transition-colors">
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
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
