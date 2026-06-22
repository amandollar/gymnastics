"use client";

import { useState, useMemo } from "react";
import { Search, CalendarDays, Filter } from "lucide-react";
import StudentAvatar from "@/app/admin/_components/students/StudentAvatar";
import type { PresentStudent } from "@/lib/services/attendance";

interface PresentRowProps {
  student: PresentStudent;
}

function PresentRow({ student }: PresentRowProps) {
  return (
    <div className="flex items-center gap-3 px-3 py-2.5 rounded-2xl hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition-all duration-205 group">
      {/* Avatar */}
      <StudentAvatar
        student={student}
        size={40}
        className="h-9 w-9 rounded-full object-cover bg-zinc-100 shrink-0"
      />

      {/* Name + Plan */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200 truncate group-hover:text-zinc-900 dark:group-hover:text-white transition-colors">
            {student.name}
          </p>
          <span className="shrink-0 text-[9px] font-bold text-zinc-400 dark:text-zinc-650 bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded">
            TAG{student.studentNumber}
          </span>
        </div>
        {student.planName && (
          <p className="text-[10px] text-zinc-400 dark:text-zinc-500 truncate mt-0.5">
            {student.planName}
          </p>
        )}
      </div>
    </div>
  );
}

interface RollCallCardProps {
  selectedDate: string;
  selectedDateDisplay: string;
  rollCallByDate: Record<string, PresentStudent[]>;
  registrationsByDate?: Record<string, PresentStudent[]>;
  renewalsByDate?: Record<string, PresentStudent[]>;
  viewType: "attendance" | "registrations" | "renewals";
  onViewTypeChange: (type: "attendance" | "registrations" | "renewals") => void;
}

export default function RollCallCard({
  selectedDate,
  selectedDateDisplay,
  rollCallByDate,
  registrationsByDate,
  renewalsByDate,
  viewType,
  onViewTypeChange,
}: RollCallCardProps) {
  const [search, setSearch] = useState("");

  // Derive active student list based on viewType
  const activeStudentsForDate = useMemo(() => {
    if (viewType === "registrations") {
      return registrationsByDate?.[selectedDate] ?? [];
    }
    if (viewType === "renewals") {
      return renewalsByDate?.[selectedDate] ?? [];
    }
    return rollCallByDate[selectedDate] ?? [];
  }, [viewType, selectedDate, rollCallByDate, registrationsByDate, renewalsByDate]);

  // Filter list by search query
  const filteredStudents = useMemo(() => {
    if (!search) return activeStudentsForDate;
    const q = search.toLowerCase();
    return activeStudentsForDate.filter(
      (s) =>
        s.name.toLowerCase().includes(q) || String(s.studentNumber).includes(q),
    );
  }, [activeStudentsForDate, search]);

  return (
    <div className="rounded-3xl bg-white dark:bg-zinc-900 p-6 flex flex-col h-[480px] lg:h-[520px] min-w-[300px] lg:min-w-[340px]">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-4">
        <div className="min-w-0">
          <h2 className="text-sm font-bold text-zinc-800 dark:text-zinc-200">
            {selectedDateDisplay}
          </h2>
        </div>
        <div className="shrink-0">
          <select
            value={viewType}
            onChange={(e) => onViewTypeChange(e.target.value as any)}
            className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200/50 dark:border-zinc-800/50 rounded-xl px-2.5 py-1.5 text-xs font-bold text-zinc-700 dark:text-zinc-300 outline-none focus:ring-1 focus:ring-brand-orange-500/20 cursor-pointer"
          >
            <option value="attendance">Attendance</option>
            <option value="registrations">Registrations</option>
            <option value="renewals">Renewals</option>
          </select>
        </div>
      </div>

      {/* Search bar */}
      <div className="relative mb-4">
        <Search
          className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 dark:text-zinc-600"
          strokeWidth={2}
        />
        <input
          type="text"
          placeholder="Search by student name or ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 text-xs rounded-2xl bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-brand-orange-500/20 border border-zinc-200/50 dark:border-zinc-800/50 transition-all"
        />
      </div>

      {/* Student List */}
      <div className="flex-1 overflow-y-auto -mx-1 pr-1 pb-6 space-y-1">
        {activeStudentsForDate.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-zinc-400 dark:text-zinc-500 gap-3 border border-dashed border-zinc-200/60 dark:border-zinc-800/50 rounded-2xl p-4">
            <CalendarDays
              className="h-8 w-8 text-zinc-300 dark:text-zinc-700"
              strokeWidth={1.5}
            />
            <div className="text-center">
              <p className="text-xs font-semibold">
                {viewType === "attendance"
                  ? "No attendance recorded"
                  : viewType === "registrations"
                    ? "No registrations on this day"
                    : "No renewals on this day"}
              </p>
              <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-1 max-w-[200px] mx-auto">
                {viewType === "attendance"
                  ? "Students can check in by scanning their QR code on the main dashboard scanner."
                  : viewType === "registrations"
                    ? "New student admissions created on this calendar date will appear here."
                    : "Student plans starting on this calendar date will appear here."}
              </p>
            </div>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-zinc-400 dark:text-zinc-500 gap-2">
            <Filter className="h-6 w-6 opacity-40" strokeWidth={1.5} />
            <p className="text-xs font-semibold">No matches found</p>
            <p className="text-[10px] text-zinc-400 dark:text-zinc-500">
              Refine your search term.
            </p>
          </div>
        ) : (
          filteredStudents.map((student) => (
            <PresentRow key={student.attendanceId} student={student} />
          ))
        )}
      </div>
    </div>
  );
}
