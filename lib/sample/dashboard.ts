/** Sample dashboard data — replace with real queries later */

export const kpiStats = {
  totalAdmissions: 312,          // all-time admissions
  admissionsThisMonth: 12,       // new admissions in current month
  activeStudents: 224,           // currently active membership
  gracePeriodStudents: 24,       // in grace period (plan expired but within grace window)
  activeTrainers: 14,
  monthlyRevenue: 4_85_200,
  revenueChange: 8.4,
  todayAttendanceCount: 186,     // students who attended today (present count only)
  pendingFees: 38_400,
  pendingCount: 7,
  trialsThisWeek: 9,
};

export const revenueByMonth = [
  { month: "Jan", revenue: 3.2 },
  { month: "Feb", revenue: 3.5 },
  { month: "Mar", revenue: 3.8 },
  { month: "Apr", revenue: 4.1 },
  { month: "May", revenue: 4.4 },
  { month: "Jun", revenue: 4.85 },
];

export const weeklyAttendance = [
  { day: "Mon", present: 186 },
  { day: "Tue", present: 192 },
  { day: "Wed", present: 178 },
  { day: "Thu", present: 195 },
  { day: "Fri", present: 188 },
  { day: "Sat", present: 142 },
];

export const recentActivity = [
  { id: 1, text: "Ananya Sharma enrolled in Intermediate Gymnastics", time: "2h ago" },
  { id: 2, text: "Fee payment received — ₹8,500 (Rohan Patel)", time: "4h ago" },
  { id: 3, text: "Trial class booked — Saturday 10:00 AM", time: "5h ago" },
  { id: 4, text: "Coach Meera marked attendance for Batch B-12", time: "Yesterday" },
  { id: 5, text: "3 fee reminders sent for overdue accounts", time: "Yesterday" },
];

export function formatINR(amount: number): string {
  if (amount >= 100_000) {
    return `₹${(amount / 100_000).toFixed(2)}L`;
  }
  return `₹${amount.toLocaleString("en-IN")}`;
}
