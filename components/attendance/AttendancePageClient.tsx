"use client";

import { useState, useMemo, useTransition } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  UserPlus,
  RefreshCw,
  Users,
  TrendingUp,
  Search,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Filter,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import type {
  AttendanceKpis,
  DayAttendanceCount,
  PresentStudent,
  MonthlyBreakdown,
} from "@/lib/services/attendance";

// ─── Constants ────────────────────────────────────────────────────────────────

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const chartTooltipStyle = {
  backgroundColor: "var(--chart-tooltip-bg)",
  border: "1px solid var(--chart-tooltip-border)",
  color: "var(--chart-tooltip-text)",
  borderRadius: "12px",
  fontSize: "12px",
  boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.08), 0 4px 6px -4px rgb(0 0 0 / 0.08)",
  padding: "8px 12px",
};

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  kpis: AttendanceKpis;
  calendarCounts: DayAttendanceCount[];
  rollCallByDate: Record<string, PresentStudent[]>;
  yearlyBreakdown: (MonthlyBreakdown & { month: number })[];
  todayStr: string;
  year: number;
  month: number;
}

// ─── Avatar helpers ───────────────────────────────────────────────────────────

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

const AVATAR_GRADIENTS = [
  "from-orange-400 to-amber-500",
  "from-emerald-400 to-teal-500",
  "from-sky-400 to-blue-500",
  "from-violet-400 to-purple-500",
  "from-rose-400 to-pink-500",
  "from-indigo-400 to-violet-500",
  "from-teal-400 to-emerald-500",
  "from-cyan-400 to-sky-500",
];

function avatarGradient(name: string) {
  return AVATAR_GRADIENTS[name.charCodeAt(0) % AVATAR_GRADIENTS.length];
}

// ─── Heatmap intensity ────────────────────────────────────────────────────────

function heatClass(count: number, max: number): string {
  if (count === 0 || max === 0) return "";
  const r = count / max;
  if (r < 0.25) return "bg-brand-orange-500/[0.08] text-brand-orange-600 dark:text-brand-orange-400 hover:bg-brand-orange-500/[0.12]";
  if (r < 0.50) return "bg-brand-orange-500/[0.22] text-brand-orange-700 dark:text-brand-orange-300 hover:bg-brand-orange-500/[0.26]";
  if (r < 0.75) return "bg-brand-orange-500/[0.42] text-brand-orange-800 dark:text-brand-orange-200 hover:bg-brand-orange-500/[0.48]";
  return "bg-brand-orange-500/[0.75] text-white hover:bg-brand-orange-500/[0.82]";
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

function KpiCard({
  icon,
  label,
  value,
  sublabel,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sublabel?: string;
  accent?: string;
}) {
  return (
    <div className="group flex items-center justify-between rounded-3xl bg-white dark:bg-zinc-900 p-5 sm:p-6 transition-all duration-350 hover:scale-[1.02] hover:bg-zinc-50/50 dark:hover:bg-zinc-900/80">
      <div className="flex-1 min-w-0 pr-3">
        <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
          {label}
        </p>
        <p className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 tabular-nums">
          {value}
        </p>
        {sublabel && (
          <p className="mt-1 text-[11px] text-zinc-400 dark:text-zinc-500 font-medium truncate">
            {sublabel}
          </p>
        )}
      </div>
      <div className={`flex h-11 w-11 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-2xl transition-transform duration-300 group-hover:scale-110 ${accent ?? "bg-zinc-100 dark:bg-zinc-800"}`}>
        {icon}
      </div>
    </div>
  );
}

// ─── Calendar Cell ────────────────────────────────────────────────────────────

function CalendarCell({
  day,
  count,
  maxCount,
  isSelected,
  isToday,
  isFuture,
  onClick,
}: {
  day: number;
  count: number;
  maxCount: number;
  isSelected: boolean;
  isToday: boolean;
  isFuture: boolean;
  onClick: () => void;
}) {
  const hasData = count > 0;

  return (
    <button
      onClick={onClick}
      disabled={isFuture}
      className={`
        relative flex flex-col items-center justify-center gap-0.5
        rounded-2xl text-xs font-bold transition-all duration-200
        aspect-square select-none
        ${isFuture
          ? "text-zinc-300 dark:text-zinc-800 cursor-default opacity-40"
          : isSelected
            ? "bg-brand-orange-500 text-white shadow-lg scale-[1.08] z-10 cursor-pointer"
            : isToday
              ? "ring-2 ring-brand-orange-500 ring-offset-2 dark:ring-offset-zinc-950 text-brand-orange-600 dark:text-brand-orange-400 cursor-pointer hover:scale-105"
              : hasData
                ? `${heatClass(count, maxCount)} hover:scale-105 cursor-pointer`
                : "text-zinc-400 dark:text-zinc-500 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800/60"
        }
      `}
    >
      <span className="leading-none text-[11px] sm:text-xs">{day}</span>
      {hasData && !isSelected && (
        <span className={`text-[8px] font-extrabold leading-none mt-0.5 ${isToday ? "text-brand-orange-500" : "opacity-75"}`}>
          {count}
        </span>
      )}
      {isSelected && hasData && (
        <span className="text-[8px] font-extrabold leading-none mt-0.5 text-white/95">{count}</span>
      )}
      {isToday && !isSelected && (
        <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-brand-orange-500" />
      )}
    </button>
  );
}

// ─── Present Student Row ──────────────────────────────────────────────────────

function PresentRow({ student }: { student: PresentStudent }) {
  return (
    <div className="flex items-center gap-3 px-3 py-3 rounded-2xl hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition-all duration-205 group">
      {/* Avatar */}
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white shadow-sm bg-gradient-to-br ${avatarGradient(student.name)}`}
      >
        {student.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={student.avatarUrl}
            alt={student.name}
            className="h-9 w-9 rounded-full object-cover"
          />
        ) : (
          getInitials(student.name)
        )}
      </div>

      {/* Name + Plan */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-xs font-bold text-zinc-850 dark:text-zinc-200 truncate group-hover:text-zinc-900 dark:group-hover:text-white transition-colors">
            {student.name}
          </p>
          <span className="shrink-0 text-[9px] font-bold text-zinc-400 dark:text-zinc-600 bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded">
            #{student.studentNumber}
          </span>
        </div>
        <div className="flex items-center gap-1.5 mt-1">
          {student.planType && (
            <span
              className={`inline-flex px-1.5 py-0.5 rounded-full text-[8px] font-extrabold uppercase tracking-wider
                ${student.planType === "ONE_TO_ONE"
                  ? "bg-violet-500/10 text-violet-600 dark:text-violet-400"
                  : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400"
                }`}
            >
              {student.planType === "ONE_TO_ONE" ? "1:1" : "Reg"}
            </span>
          )}
          {student.planName && (
            <span className="text-[10px] text-zinc-400 dark:text-zinc-500 truncate">
              {student.planName}
            </span>
          )}
        </div>
      </div>

      {/* Live Present indicator */}
      <div className="flex items-center gap-1.5 shrink-0 px-2 py-1 rounded-full bg-emerald-500/[0.08] dark:bg-emerald-500/[0.12] text-emerald-600 dark:text-emerald-400 text-[10px] font-extrabold transition-all duration-300">
        <span className="relative flex h-1.5 w-1.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
        </span>
        Present
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AttendancePageClient({
  kpis,
  calendarCounts,
  rollCallByDate,
  yearlyBreakdown,
  todayStr,
  year,
  month,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState("");

  // ── Date state synchronization ───────────────────────────────────────────

  const defaultDate = useMemo(() => {
    const today = new Date(todayStr);
    if (year === today.getFullYear() && month === (today.getMonth() + 1)) {
      return todayStr;
    }
    return `${year}-${String(month).padStart(2, "0")}-01`;
  }, [year, month, todayStr]);

  const [selectedDate, setSelectedDate] = useState(defaultDate);

  // Sync state if year/month props change
  const [lastYearMonth, setLastYearMonth] = useState({ year, month });
  if (lastYearMonth.year !== year || lastYearMonth.month !== month) {
    setLastYearMonth({ year, month });
    setSelectedDate(defaultDate);
  }

  // Derive presentStudents list for the selected date
  const presentStudents = useMemo(() => {
    return rollCallByDate[selectedDate] ?? [];
  }, [rollCallByDate, selectedDate]);

  // ── Build a lookup map: dateStr → count ───────────────────────────────────

  const countMap = useMemo(() => {
    const m = new Map<string, number>();
    for (const d of calendarCounts) m.set(d.date, d.count);
    return m;
  }, [calendarCounts]);

  const maxCount = useMemo(
    () => Math.max(...calendarCounts.map((d) => d.count), 1),
    [calendarCounts]
  );

  // ── Build calendar grid ───────────────────────────────────────────────────

  const { daysInMonth, leadingBlanks } = useMemo(() => {
    const dim = new Date(year, month, 0).getDate(); // days in month
    const firstDayJS = new Date(Date.UTC(year, month - 1, 1)).getDay(); // 0=Sun
    const blanks = firstDayJS === 0 ? 6 : firstDayJS - 1; // Mon-first
    return { daysInMonth: dim, leadingBlanks: blanks };
  }, [year, month]);

  // ── Navigation helpers ────────────────────────────────────────────────────

  const navigate = (y: number, m: number) => {
    const params = new URLSearchParams();
    params.set("year", String(y));
    params.set("month", String(m));
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  const goToPrevMonth = () => {
    const newMonth = month === 1 ? 12 : month - 1;
    const newYear = month === 1 ? year - 1 : year;
    navigate(newYear, newMonth);
  };

  const goToNextMonth = () => {
    const now = new Date();
    const isCurrentMonth =
      year === now.getFullYear() && month === now.getMonth() + 1;
    if (isCurrentMonth) return; // don't navigate to future month
    const newMonth = month === 12 ? 1 : month + 1;
    const newYear = month === 12 ? year + 1 : year;
    navigate(newYear, newMonth);
  };

  const selectDate = (dateStr: string) => {
    setSelectedDate(dateStr);
  };

  // ── Filtered roll call ────────────────────────────────────────────────────

  const filteredStudents = useMemo(() => {
    if (!search) return presentStudents;
    const q = search.toLowerCase();
    return presentStudents.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        String(s.studentNumber).includes(q)
    );
  }, [presentStudents, search]);

  // ── Formatted selected date ───────────────────────────────────────────────

  const selectedDateDisplay = useMemo(() => {
    const d = new Date(selectedDate + "T00:00:00");
    return d.toLocaleDateString("en-IN", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }, [selectedDate]);

  const selectedCount = countMap.get(selectedDate) ?? presentStudents.length;

  // ── Monthly breakdown chart data ──────────────────────────────────────────

  const breakdownChartData = yearlyBreakdown.map((mb) => ({
    month: MONTH_NAMES[mb.month - 1].slice(0, 3),
    newAdmissions: mb.newAdmissions,
    renewals: mb.renewals,
    sessions: Math.round(mb.totalSessions / Math.max(mb.activeDays, 1)), // avg daily
  }));

  // For donut: current month breakdown
  const currentBreakdown = yearlyBreakdown.find((mb) => mb.month === month);
  const donutData = [
    { name: "New Admissions", value: currentBreakdown?.newAdmissions ?? 0, color: "#f16d28" },
    { name: "Renewals",       value: currentBreakdown?.renewals ?? 0,       color: "#8b5cf6" },
  ].filter((d) => d.value > 0);

  const isAtCurrentMonth =
    year === new Date().getFullYear() && month === new Date().getMonth() + 1;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className={`space-y-4 pb-8 min-w-0 w-full transition-opacity duration-200 ${isPending ? "opacity-60" : ""}`}>

      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between pt-2 pb-4 flex-wrap gap-4 border-b border-zinc-200/40 dark:border-zinc-800/40 mb-6">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extralight tracking-tight text-zinc-900 dark:text-zinc-50">
            Attendance <span className="font-semibold text-brand-orange-500">Dashboard</span>
          </h1>
        </div>

        {/* Month Navigator */}
        <div className="flex items-center gap-1 rounded-full bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 p-1 shrink-0 shadow-sm">
          <button
            onClick={goToPrevMonth}
            className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all cursor-pointer"
          >
            <ChevronLeft className="h-4 w-4" strokeWidth={2.5} />
          </button>
          <span className="text-xs font-extrabold text-zinc-700 dark:text-zinc-300 min-w-[130px] text-center uppercase tracking-wider select-none tabular-nums">
            {MONTH_NAMES[month - 1]} {year}
          </span>
          <button
            onClick={goToNextMonth}
            disabled={isAtCurrentMonth}
            className={`flex h-8 w-8 items-center justify-center rounded-full transition-all ${
              isAtCurrentMonth
                ? "text-zinc-300 dark:text-zinc-800 cursor-default opacity-40"
                : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
            }`}
          >
            <ChevronRight className="h-4 w-4" strokeWidth={2.5} />
          </button>
        </div>
      </div>

      {/* ── KPI Strip ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard
          icon={<Users className="h-5 w-5 text-brand-orange-500" strokeWidth={2} />}
          label="Attended Today"
          value={kpis.todayCount}
          sublabel={`avg ${kpis.avgDailyAttendance}/day this month`}
          accent="bg-brand-orange-500/10 dark:bg-brand-orange-500/20"
        />
        <KpiCard
          icon={<UserPlus className="h-5 w-5 text-emerald-500" strokeWidth={2} />}
          label="New This Month"
          value={kpis.newStudentsThisMonth}
          sublabel="fresh admissions"
          accent="bg-emerald-500/10 dark:bg-emerald-500/20"
        />
        <KpiCard
          icon={<RefreshCw className="h-5 w-5 text-violet-500" strokeWidth={2} />}
          label="Renewals"
          value={kpis.renewalsThisMonth}
          sublabel="plan renewed this month"
          accent="bg-violet-500/10 dark:bg-violet-500/20"
        />
        <KpiCard
          icon={<TrendingUp className="h-5 w-5 text-sky-500" strokeWidth={2} />}
          label="Total Sessions"
          value={kpis.totalSessionsThisMonth.toLocaleString("en-IN")}
          sublabel={`${kpis.avgDailyAttendance} avg per day`}
          accent="bg-sky-500/10 dark:bg-sky-500/20"
        />
      </div>

      {/* ── Calendar + Roll Call ────────────────────────────────────────── */}
      <div className="grid gap-4 lg:grid-cols-[1fr_420px]">
        {/* Calendar Heatmap */}
        <div className="rounded-3xl bg-white dark:bg-zinc-900 p-6 flex flex-col justify-between h-[480px]">
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-sm font-bold text-zinc-850 dark:text-zinc-200">
                  Attendance Calendar
                </h2>
              </div>
              {/* Modern continuous legend */}
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider select-none">
                <span>Less</span>
                <div className="flex gap-0.5 items-center">
                  <div className="h-2 w-2 rounded-sm bg-zinc-100 dark:bg-zinc-800/60" />
                  <div className="h-2 w-2 rounded-sm bg-brand-orange-500/[0.08]" />
                  <div className="h-2 w-2 rounded-sm bg-brand-orange-500/[0.22]" />
                  <div className="h-2 w-2 rounded-sm bg-brand-orange-500/[0.42]" />
                  <div className="h-2 w-2 rounded-sm bg-brand-orange-500" />
                </div>
                <span>More</span>
              </div>
            </div>

            <div className="max-w-md mx-auto w-full">
              {/* Day labels */}
              <div className="grid grid-cols-7 gap-1.5 mb-2">
                {DAY_LABELS.map((d) => (
                  <div key={d} className="text-center text-[10px] font-extrabold uppercase tracking-wider text-zinc-400 dark:text-zinc-600 py-1">
                    {d}
                  </div>
                ))}
              </div>

              {/* Grid */}
              <div className="grid grid-cols-7 gap-1.5">
                {/* Leading blanks */}
                {Array.from({ length: leadingBlanks }).map((_, i) => (
                  <div key={`b-${i}`} className="aspect-square" />
                ))}
                {/* Day cells */}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const dayNum = i + 1;
                  const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
                  const count = countMap.get(dateStr) ?? 0;
                  const isFuture = dateStr > todayStr;
                  const isToday = dateStr === todayStr;
                  const isSelected = dateStr === selectedDate;

                  return (
                    <CalendarCell
                      key={dateStr}
                      day={dayNum}
                      count={count}
                      maxCount={maxCount}
                      isSelected={isSelected}
                      isToday={isToday}
                      isFuture={isFuture}
                      onClick={() => !isFuture && selectDate(dateStr)}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Present Students Roll Call */}
        <div className="rounded-3xl bg-white dark:bg-zinc-900 p-6 flex flex-col h-[480px]">
          {/* Header */}
          <div className="flex items-center justify-between gap-4 mb-4">
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-zinc-850 dark:text-zinc-200">
                Roll Call — {selectedDateDisplay}
              </h2>
            </div>
            <span className="shrink-0 flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-extrabold tabular-nums">
              <CheckCircle2 className="h-4 w-4" strokeWidth={2.5} />
              {presentStudents.length} Total
            </span>
          </div>

          {/* Search bar */}
          <div className="relative mb-4">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 dark:text-zinc-600" strokeWidth={2} />
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
            {presentStudents.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-zinc-400 dark:text-zinc-500 gap-3 border border-dashed border-zinc-200/60 dark:border-zinc-850 rounded-2xl p-4">
                <CalendarDays className="h-8 w-8 text-zinc-300 dark:text-zinc-700" strokeWidth={1.5} />
                <div className="text-center">
                  <p className="text-xs font-semibold">No attendance recorded</p>
                  <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-1 max-w-[200px] mx-auto">
                    Students can check in by scanning their QR code on the main dashboard scanner.
                  </p>
                </div>
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-zinc-400 dark:text-zinc-500 gap-2">
                <Filter className="h-6 w-6 opacity-40" strokeWidth={1.5} />
                <p className="text-xs font-semibold">No matches found</p>
                <p className="text-[10px] text-zinc-400 dark:text-zinc-500">Refine your search term.</p>
              </div>
            ) : (
              filteredStudents.map((student) => (
                <PresentRow key={student.attendanceId} student={student} />
              ))
            )}
          </div>
        </div>
      </div>

      {/* ── Charts Row ──────────────────────────────────────────────────── */}
      <div className="grid gap-4 lg:grid-cols-[1fr_360px] mt-4">

        {/* New Admissions vs Renewals by Month */}
        <div className="rounded-3xl bg-white dark:bg-zinc-900 p-6 flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold text-zinc-850 dark:text-zinc-200 mb-6">
              Admissions &amp; Renewals — {year}
            </h2>
          </div>
          <div className="w-full flex-1">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart
                data={breakdownChartData}
                margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
                barCategoryGap={12}
                barGap={4}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 10, fill: "var(--tick-color)", fontWeight: 600 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "var(--tick-color)", fontWeight: 600 }}
                  axisLine={false}
                  tickLine={false}
                  width={35}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={chartTooltipStyle}
                  cursor={{ fill: "rgba(241, 109, 40, 0.03)" }}
                  formatter={(val, name) => [Number(val), String(name)]}
                />
                <Bar dataKey="newAdmissions" name="New Admissions" fill="#f16d28" radius={[4, 4, 0, 0]} maxBarSize={18} />
                <Bar dataKey="renewals" name="Renewals" fill="#8b5cf6" radius={[4, 4, 0, 0]} maxBarSize={18} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          {/* Elegant custom legend */}
          <div className="flex items-center gap-6 mt-4 justify-center select-none">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-brand-orange-500" />
              <span className="text-[11px] text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-wider">New Admissions</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-violet-500" />
              <span className="text-[11px] text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-wider">Renewals</span>
            </div>
          </div>
        </div>

        {/* Current Month Donut */}
        <div className="rounded-3xl bg-white dark:bg-zinc-900 p-6 flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold text-zinc-850 dark:text-zinc-200 mb-6">
              {MONTH_NAMES[month - 1]} Breakdown
            </h2>
          </div>

          <div className="flex flex-col items-center gap-6 flex-1 justify-center">
            {donutData.length > 0 ? (
              <>
                <div className="relative w-40 h-40 shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={donutData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={75}
                        paddingAngle={4}
                        dataKey="value"
                        strokeWidth={0}
                      >
                        {donutData.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={chartTooltipStyle}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none">
                    <p className="text-3xl font-extralight text-zinc-900 dark:text-zinc-50 tabular-nums leading-none">
                      {donutData.reduce((a, b) => a + b.value, 0)}
                    </p>
                    <p className="text-[9px] font-extrabold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mt-1">
                      Registrations
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-2 w-full mt-2">
                  {donutData.map((item) => (
                    <div key={item.name} className="flex items-center justify-between gap-2 px-3 py-1.5 rounded-xl bg-zinc-50/60 dark:bg-zinc-950/60">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                        <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 truncate">{item.name}</span>
                      </div>
                      <span className="text-xs font-extrabold text-zinc-900 dark:text-zinc-100 tabular-nums shrink-0">
                        {item.value}
                      </span>
                    </div>
                  ))}
                  <div className="mt-2 pt-2 border-t border-zinc-100 dark:border-zinc-800/60 space-y-1 px-1">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Avg Daily Present</span>
                      <span className="text-xs font-extrabold text-zinc-800 dark:text-zinc-200 tabular-nums">
                        {kpis.avgDailyAttendance}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Total Sessions Logged</span>
                      <span className="text-xs font-extrabold text-zinc-800 dark:text-zinc-200 tabular-nums">
                        {kpis.totalSessionsThisMonth.toLocaleString("en-IN")}
                      </span>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center flex-1 text-zinc-400 dark:text-zinc-500 gap-3 border border-dashed border-zinc-200/60 dark:border-zinc-850 rounded-2xl w-full py-12">
                <RefreshCw className="h-8 w-8 text-zinc-300 dark:text-zinc-700" strokeWidth={1.5} />
                <div className="text-center">
                  <p className="text-xs font-semibold">No data for this month</p>
                  <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5">No admissions or renewals registered.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
