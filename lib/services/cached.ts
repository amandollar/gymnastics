import { unstable_cache } from "next/cache";
import {
  listStudents as dbListStudents,
  getStudentById as dbGetStudentById,
  listStudentsWithReminders as dbListStudentsWithReminders,
} from "./students";
import { listBatches as dbListBatches } from "./batches";
import {
  listEnquiries as dbListEnquiries,
  getEnquiryById as dbGetEnquiryById,
} from "./enquiries";
import { getPricingMaps as dbGetPricingMaps } from "./pricing";
import { getGracePeriodMap as dbGetGracePeriodMap } from "./grace-periods";
import {
  getMonthlyAttendanceData as dbGetMonthlyAttendanceData,
  getYearlyMonthlyBreakdown as dbGetYearlyMonthlyBreakdown,
} from "./attendance";
import { getAllUsers as dbGetAllUsers } from "./users";
import { listPlanTemplates as dbListPlanTemplates } from "./plan-templates";
import { listCoaches as dbListCoaches } from "./coaches";
import { getDashboardData as dbGetDashboardData } from "./dashboard";
import { getAcademyProfile as dbGetAcademyProfile } from "./academy";
import type { StudentStatus } from "@/lib/utils/student";
import type { EnquiryStatus, CoachStatus, CoachRole } from "@prisma/client";

export const listStudents = unstable_cache(
  async (filters?: { search?: string; status?: StudentStatus | "ALL" }) =>
    dbListStudents(filters),
  ["students-list-v3"],
  { tags: ["students"] }
);

export const listStudentsWithReminders = unstable_cache(
  async () => dbListStudentsWithReminders(),
  ["students-with-reminders-v1"],
  { tags: ["students"] }
);

export const getStudentById = (id: string) => unstable_cache(
  async () => dbGetStudentById(id),
  ["student-by-id", id],
  { tags: ["students"] }
)();

export const listBatches = unstable_cache(
  async () => dbListBatches(),
  ["batches-list-v4"],
  { tags: ["batches"] }
);

export const listEnquiries = unstable_cache(
  async (filters?: { search?: string; status?: EnquiryStatus | "ALL" }) =>
    dbListEnquiries(filters),
  ["enquiries-list"],
  { tags: ["enquiries"] }
);

export const getEnquiryById = (id: string) => unstable_cache(
  async () => dbGetEnquiryById(id),
  ["enquiry-by-id", id],
  { tags: ["enquiries"] }
)();

export const getPricingMaps = unstable_cache(
  async () => dbGetPricingMaps(),
  ["pricing-maps"],
  { tags: ["pricing"] }
);

export const getGracePeriodMap = unstable_cache(
  async () => dbGetGracePeriodMap(),
  ["grace-periods-map"],
  { tags: ["grace-periods"] }
);

export const getMonthlyAttendanceData = (year: number, month: number) => unstable_cache(
  async () => dbGetMonthlyAttendanceData(year, month),
  ["attendance-monthly-v2", String(year), String(month)],
  { tags: ["attendance"] }
)();

export const getYearlyMonthlyBreakdown = (year: number) => unstable_cache(
  async () => dbGetYearlyMonthlyBreakdown(year),
  ["attendance-yearly", String(year)],
  { tags: ["attendance"] }
)();

export const getAllUsers = unstable_cache(
  async () => dbGetAllUsers(),
  ["users-list"],
  { tags: ["users"] }
);

export const listPlanTemplates = unstable_cache(
  async () => dbListPlanTemplates(),
  ["plan-templates-list"],
  { tags: ["plan-templates"] }
);

const getCachedCoaches = unstable_cache(
  async (status?: CoachStatus | "ALL", role?: CoachRole) =>
    dbListCoaches({ status, role }),
  ["coaches-list-v3"],
  { tags: ["coaches"] }
);

export const listCoaches = (options?: { status?: CoachStatus | "ALL"; role?: CoachRole }) => {
  return getCachedCoaches(options?.status, options?.role);
};

import { getCoachMonthlyAttendanceSerializable as dbGetCoachMonthlyAttendanceSerializable } from "./coaches";

export const getCoachMonthlyAttendanceSerializable = unstable_cache(
  async (year: number, month: number) =>
    dbGetCoachMonthlyAttendanceSerializable(year, month),
  ["coaches-monthly-attendance"],
  { tags: ["coaches"] }
);

export const getDashboardData = unstable_cache(
  async () => dbGetDashboardData(),
  ["dashboard-data"],
  { tags: ["dashboard"], revalidate: 60 }
);

export const getAcademyProfile = unstable_cache(
  async () => dbGetAcademyProfile(),
  ["academy-profile"],
  { tags: ["academy"] }
);
