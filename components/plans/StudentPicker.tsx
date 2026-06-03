"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import StudentStatusBadge from "@/components/students/StudentStatusBadge";
import type { StudentStatus } from "@/lib/utils/student";
import { Search } from "lucide-react";

export type PlanStudentOption = {
  id: string;
  name: string;
  studentNumber: number;
  status: StudentStatus;
  parentName: string;
};

export default function StudentPicker({
  students,
  value,
  onChange,
  error,
}: {
  students: PlanStudentOption[];
  value: string;
  onChange: (studentId: string) => void;
  error?: string;
}) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return students;
    return students.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.parentName.toLowerCase().includes(q) ||
        String(s.studentNumber).includes(q)
    );
  }, [students, query]);

  const selected = students.find((s) => s.id === value);

  return (
    <div className="space-y-3">
      <div className="relative">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, parent, or student #…"
          className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 pl-10 pr-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange-500/20 focus:border-brand-orange-500"
          aria-label="Search students"
        />
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400 dark:text-zinc-500" strokeWidth={1.5} />
      </div>

      {selected && (
        <div className="flex items-center justify-between gap-3 rounded-xl border-2 border-brand-orange-200 dark:border-brand-orange-500/20 bg-orange-50 dark:bg-brand-orange-950/20 px-4 py-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">
               {selected.name}
            </p>
            <p className="text-xs text-zinc-650 dark:text-zinc-400">
               #{selected.studentNumber} · {selected.parentName}
            </p>
          </div>
          <StudentStatusBadge status={selected.status} />
        </div>
      )}

      <ul
        className="max-h-52 overflow-y-auto rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 divide-y divide-zinc-100 dark:divide-zinc-800"
        role="listbox"
        aria-label="Students"
      >
        {filtered.length === 0 ? (
          <li className="px-4 py-6 text-sm text-zinc-500 dark:text-zinc-400 text-center">
            No students found.{" "}
            <Link href="/students/new" className="text-brand-orange-600 dark:text-brand-orange-400 font-medium hover:underline">
              Add a student
            </Link>
          </li>
        ) : (
          filtered.map((s) => {
            const isSelected = s.id === value;
            return (
              <li key={s.id}>
                <button
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => onChange(s.id)}
                  className={`w-full flex items-center justify-between gap-3 px-4 py-3 text-left text-sm transition-colors cursor-pointer ${
                    isSelected
                      ? "bg-brand-orange-50 dark:bg-brand-orange-950/20"
                      : "hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                  }`}
                >
                  <span className="min-w-0">
                    <span className="font-medium text-zinc-900 dark:text-zinc-100">{s.name}</span>
                    <span className="block text-xs text-zinc-500 dark:text-zinc-450">
                      #{s.studentNumber} · {s.parentName}
                    </span>
                  </span>
                  <StudentStatusBadge status={s.status} />
                </button>
              </li>
            );
          })
        )}
      </ul>

      {error && <p className="text-xs text-rose-600">{error}</p>}
    </div>
  );
}
