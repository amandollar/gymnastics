import { unstable_cache } from "next/cache";
import {
  listStudents as dbListStudents,
  getStudentById as dbGetStudentById,
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
import type { StudentStatus } from "@/lib/utils/student";
import type { EnquiryStatus } from "@prisma/client";

export const listStudents = unstable_cache(
  async (filters?: { search?: string; status?: StudentStatus | "ALL" }) =>
    dbListStudents(filters),
  ["students-list-v2"],
  { tags: ["students"] }
);

export const getStudentById = unstable_cache(
  async (id: string) => dbGetStudentById(id),
  ["student-by-id"],
  { tags: ["students"] }
);

export const listBatches = unstable_cache(
  async () => dbListBatches(),
  ["batches-list"],
  { tags: ["batches"] }
);

export const listEnquiries = unstable_cache(
  async (filters?: { search?: string; status?: EnquiryStatus | "ALL" }) =>
    dbListEnquiries(filters),
  ["enquiries-list"],
  { tags: ["enquiries"] }
);

export const getEnquiryById = unstable_cache(
  async (id: string) => dbGetEnquiryById(id),
  ["enquiry-by-id"],
  { tags: ["enquiries"] }
);

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

export const getMonthlyAttendanceData = unstable_cache(
  async (year: number, month: number) =>
    dbGetMonthlyAttendanceData(year, month),
  ["attendance-monthly-v2"],
  { tags: ["attendance"] }
);

export const getYearlyMonthlyBreakdown = unstable_cache(
  async (year: number) => dbGetYearlyMonthlyBreakdown(year),
  ["attendance-yearly"],
  { tags: ["attendance"] }
);

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
