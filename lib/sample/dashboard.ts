/** Sample dashboard data — replace with real queries later */

export const kpiStats = {
  studentsEnrolled: 248,
  studentsChange: 12,
  activeTrainers: 14,
  trainersChange: 1,
  monthlyRevenue: 4_85_200,
  revenueChange: 8.4,
  attendanceRate: 91,
  attendanceChange: 2.1,
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

export const studentsByProgram = [
  { name: "Beginner", value: 92, color: "#f16d28" },
  { name: "Intermediate", value: 78, color: "#3b82f6" },
  { name: "Advanced", value: 48, color: "#10b981" },
  { name: "Competitive", value: 30, color: "#8b5cf6" },
];

export const revenueBySource = [
  { name: "Memberships", value: 62, color: "#f16d28" },
  { name: "Trial classes", value: 14, color: "#3b82f6" },
  { name: "Workshops", value: 12, color: "#10b981" },
  { name: "Events & camps", value: 8, color: "#8b5cf6" },
  { name: "Other", value: 4, color: "#a1a1aa" },
];

export const weeklyAttendance = [
  { day: "Mon", present: 186, absent: 14 },
  { day: "Tue", present: 192, absent: 11 },
  { day: "Wed", present: 178, absent: 18 },
  { day: "Thu", present: 195, absent: 9 },
  { day: "Fri", present: 188, absent: 12 },
  { day: "Sat", present: 142, absent: 8 },
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
