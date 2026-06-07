/** Sample attendance data — replace with real DB queries later */

export type DayAttendance = {
  date: string;   // "YYYY-MM-DD"
  count: number;
  isToday: boolean;
  isWeekend: boolean;
};

export type RollCallStudent = {
  id: string;
  studentNumber: number;
  name: string;
  avatarUrl: string | null;
  gender: string;
  planName: string;
  planType: "REGULAR" | "ONE_TO_ONE";
  present: boolean;
};

export type AttendanceKpis = {
  newStudentsThisMonth: number;
  renewalsThisMonth: number;
  avgDailyAttendance: number;
  totalSessionsThisMonth: number;
  todayCount: number;
};

// ─── KPI Stats ───────────────────────────────────────────────────────────────

export const sampleAttendanceKpis: AttendanceKpis = {
  newStudentsThisMonth: 12,
  renewalsThisMonth: 8,
  avgDailyAttendance: 179,
  totalSessionsThisMonth: 4120,
  todayCount: 186,
};

// ─── Monthly Calendar Data (June 2026) ───────────────────────────────────────

function buildCalendarDays(): DayAttendance[] {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth(); // 0-indexed
  const todayStr = today.toISOString().slice(0, 10);
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const weekendCounts = [0, 85, 110, 0, 92, 105, 0]; // by weekday

  const weekdayCounts = [0, 188, 192, 175, 195, 183, 0]; // Mon-Sun

  const days: DayAttendance[] = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const dateObj = new Date(year, month, d);
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const dayOfWeek = dateObj.getDay(); // 0=Sun,1=Mon...6=Sat
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const isFuture = dateStr > todayStr;

    let count = 0;
    if (!isFuture) {
      const base = isWeekend ? weekendCounts[dayOfWeek] : weekdayCounts[dayOfWeek];
      // add a little variance
      count = base + Math.round(Math.sin(d * 1.7) * 12);
      if (count < 0) count = 0;
    }

    days.push({ date: dateStr, count, isToday: dateStr === todayStr, isWeekend });
  }
  return days;
}

export const sampleCalendarDays: DayAttendance[] = buildCalendarDays();

// ─── Roll Call Students ───────────────────────────────────────────────────────

export const sampleRollCall: RollCallStudent[] = [
  { id: "s01", studentNumber: 101, name: "Rohan Patel",        avatarUrl: null, gender: "Male",   planName: "Intermediate Gymnastics", planType: "REGULAR",    present: true },
  { id: "s02", studentNumber: 102, name: "Ananya Sharma",      avatarUrl: null, gender: "Female", planName: "Beginner Gymnastics",      planType: "REGULAR",    present: true },
  { id: "s03", studentNumber: 103, name: "Kabir Mehta",        avatarUrl: null, gender: "Male",   planName: "Advanced Trampoline",     planType: "ONE_TO_ONE", present: false },
  { id: "s04", studentNumber: 104, name: "Siddharth Rao",      avatarUrl: null, gender: "Male",   planName: "Elite Artistic Plan",     planType: "REGULAR",    present: true },
  { id: "s05", studentNumber: 105, name: "Meera Nair",         avatarUrl: null, gender: "Female", planName: "Beginner Gymnastics",     planType: "REGULAR",    present: false },
  { id: "s06", studentNumber: 106, name: "Aditya Kapoor",      avatarUrl: null, gender: "Male",   planName: "Intermediate Gymnastics", planType: "REGULAR",    present: true },
  { id: "s07", studentNumber: 107, name: "Priya Iyer",         avatarUrl: null, gender: "Female", planName: "Advanced Trampoline",     planType: "ONE_TO_ONE", present: true },
  { id: "s08", studentNumber: 108, name: "Arjun Desai",        avatarUrl: null, gender: "Male",   planName: "Beginner Gymnastics",     planType: "REGULAR",    present: true },
  { id: "s09", studentNumber: 109, name: "Kavya Reddy",        avatarUrl: null, gender: "Female", planName: "Intermediate Gymnastics", planType: "REGULAR",    present: false },
  { id: "s10", studentNumber: 110, name: "Vivaan Singh",       avatarUrl: null, gender: "Male",   planName: "Elite Artistic Plan",     planType: "REGULAR",    present: true },
  { id: "s11", studentNumber: 111, name: "Diya Banerjee",      avatarUrl: null, gender: "Female", planName: "Beginner Gymnastics",     planType: "REGULAR",    present: true },
  { id: "s12", studentNumber: 112, name: "Ishaan Joshi",       avatarUrl: null, gender: "Male",   planName: "Advanced Trampoline",     planType: "ONE_TO_ONE", present: false },
  { id: "s13", studentNumber: 113, name: "Anika Gupta",        avatarUrl: null, gender: "Female", planName: "Intermediate Gymnastics", planType: "REGULAR",    present: true },
  { id: "s14", studentNumber: 114, name: "Reyansh Kumar",      avatarUrl: null, gender: "Male",   planName: "Elite Artistic Plan",     planType: "REGULAR",    present: true },
  { id: "s15", studentNumber: 115, name: "Saanvi Choudhary",   avatarUrl: null, gender: "Female", planName: "Beginner Gymnastics",     planType: "REGULAR",    present: false },
  { id: "s16", studentNumber: 116, name: "Arnav Malhotra",     avatarUrl: null, gender: "Male",   planName: "Intermediate Gymnastics", planType: "REGULAR",    present: true },
  { id: "s17", studentNumber: 117, name: "Naina Khanna",       avatarUrl: null, gender: "Female", planName: "Advanced Trampoline",     planType: "ONE_TO_ONE", present: true },
  { id: "s18", studentNumber: 118, name: "Yash Verma",         avatarUrl: null, gender: "Male",   planName: "Beginner Gymnastics",     planType: "REGULAR",    present: false },
  { id: "s19", studentNumber: 119, name: "Pari Agarwal",       avatarUrl: null, gender: "Female", planName: "Elite Artistic Plan",     planType: "REGULAR",    present: true },
  { id: "s20", studentNumber: 120, name: "Dev Bhatia",         avatarUrl: null, gender: "Male",   planName: "Intermediate Gymnastics", planType: "REGULAR",    present: true },
];

// ─── Monthly Trend (daily count for trend bar chart) ─────────────────────────

export const sampleMonthlyTrend: { date: string; count: number }[] = sampleCalendarDays
  .filter((d) => d.count > 0)
  .map((d) => ({ date: d.date, count: d.count }));

// ─── New vs Renewals breakdown ────────────────────────────────────────────────

export const sampleNewVsRenewals = [
  { name: "New Admissions", value: 12, color: "#f16d28" },
  { name: "Renewals",       value: 8,  color: "#18181b" },
  { name: "Re-activations", value: 4,  color: "#a1a1aa" },
];
