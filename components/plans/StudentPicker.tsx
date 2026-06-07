"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Search, X, Check, ChevronDown, UserRound } from "lucide-react";
import { STATUS_STYLES, type StudentStatus } from "@/lib/utils/student";
import StudentAvatar from "@/components/students/StudentAvatar";

export type PlanStudentOption = {
  id: string;
  name: string;
  studentNumber: number;
  status: StudentStatus;
  parentName: string;
  gender?: string | null;
  avatarUrl?: string | null;
};

function StatusPill({ status }: { status: StudentStatus }) {
  const style = STATUS_STYLES[status];
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold leading-none ${style.className}`}
    >
      {style.label}
    </span>
  );
}

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
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = students.find((s) => s.id === value) ?? null;

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

  function handleSelect(id: string) {
    onChange(id);
    setQuery("");
    setOpen(false);
  }

  function handleClear() {
    onChange("");
    setQuery("");
    setOpen(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  function handleTriggerClick() {
    setOpen((o) => !o);
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  return (
    <div className="space-y-2">
      {/* ── Trigger / selected pill ── */}
      {selected && !open ? (
        <div
          className={`
            group flex items-center gap-3 rounded-2xl border-2 border-brand-orange-500/30
            bg-brand-orange-50/60 dark:bg-brand-orange-950/20 px-4 py-3
            transition-all duration-200 cursor-pointer
          `}
          onClick={handleTriggerClick}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && handleTriggerClick()}
          aria-label="Change selected student"
        >
          <StudentAvatar student={selected} size={32} />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate leading-snug">
              {selected.name}
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              #{selected.studentNumber} · {selected.parentName}
            </p>
          </div>
          <StatusPill status={selected.status} />
          <div className="flex items-center gap-1 ml-1">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); handleClear(); }}
              className="h-6 w-6 flex items-center justify-center rounded-full text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              aria-label="Clear selection"
            >
              <X className="h-3.5 w-3.5" />
            </button>
            <ChevronDown className="h-4 w-4 text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition-colors" />
          </div>
        </div>
      ) : (
        /* ── Search input when open or nothing selected ── */
        <div className="relative">
          <Search
            className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 dark:text-zinc-500 pointer-events-none"
            strokeWidth={2}
          />
          <input
            ref={inputRef}
            type="search"
            autoComplete="off"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
            placeholder="Search by name, parent, or student #…"
            className="w-full rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 pl-10 pr-10 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange-500/25 focus:border-brand-orange-500 transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
            aria-label="Search students"
            aria-expanded={open}
            role="combobox"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 flex items-center justify-center rounded-full text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              aria-label="Clear search"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      )}

      {/* ── Dropdown list ── */}
      {open && (
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-xl shadow-black/10 dark:shadow-black/40 overflow-hidden">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 px-4 py-8 text-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
                <UserRound className="h-5 w-5 text-zinc-400" />
              </div>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">No students found</p>
              <Link
                href="/students/new"
                className="text-xs font-medium text-brand-orange-600 dark:text-brand-orange-400 hover:underline"
              >
                Add a student →
              </Link>
            </div>
          ) : (
            <ul
              role="listbox"
              aria-label="Students"
              className="max-h-56 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800"
            >
              {filtered.map((s) => {
                const isSelected = s.id === value;
                return (
                  <li key={s.id}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => handleSelect(s.id)}
                      className={`
                        w-full flex items-center gap-3 px-4 py-3 text-left text-sm
                        transition-colors cursor-pointer
                        ${isSelected
                          ? "bg-brand-orange-50 dark:bg-brand-orange-950/25"
                          : "hover:bg-zinc-50 dark:hover:bg-zinc-800/60"
                        }
                      `}
                    >
                      <StudentAvatar student={s} size={32} />
                      <span className="min-w-0 flex-1">
                        <span className="block font-medium text-zinc-900 dark:text-zinc-100 truncate">
                          {s.name}
                        </span>
                        <span className="block text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                          #{s.studentNumber} · {s.parentName}
                        </span>
                      </span>
                      <StatusPill status={s.status} />
                      {isSelected && (
                        <Check
                          className="h-4 w-4 shrink-0 text-brand-orange-500 ml-1"
                          strokeWidth={2.5}
                        />
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          {/* Footer: result count */}
          {filtered.length > 0 && (
            <div className="px-4 py-2 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
              <p className="text-[11px] text-zinc-400 dark:text-zinc-500">
                {filtered.length} student{filtered.length !== 1 ? "s" : ""}
                {query ? " found" : ""}
              </p>
              {open && (
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="text-[11px] text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 cursor-pointer transition-colors"
                >
                  Close
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {error && (
        <p className="text-xs text-rose-600 dark:text-rose-400 flex items-center gap-1">
          <X className="h-3 w-3" /> {error}
        </p>
      )}
    </div>
  );
}
