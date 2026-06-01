import { z } from "zod";

export const createStudentSchema = z.object({
  name: z.string().min(2, "Name is required"),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  parentName: z.string().min(2, "Parent name is required"),
  contactNumber: z
    .string()
    .regex(/^\d{10}$/, "Contact must be exactly 10 digits"),
  admissionDate: z.string().min(1, "Admission date is required"),
  notes: z.string().optional(),
});

export const assignPlanSchema = z.object({
  planType: z.enum(["REGULAR", "ONE_TO_ONE"]),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  selectedDays: z
    .array(z.string())
    .min(1, "Select at least one day of the week"),
  discountPercent: z.coerce.number().min(0).max(100).default(0),
});

export const planTemplateSchema = z.object({
  name: z.string().min(2, "Name is required"),
  planType: z.enum(["REGULAR", "ONE_TO_ONE"]),
  durationMonths: z.coerce.number().int().positive().optional(),
  totalSessions: z.coerce.number().int().positive().optional(),
  validityDays: z.coerce.number().int().positive().optional(),
  defaultFee: z.coerce.number().int().positive().optional(),
  description: z.string().optional(),
});
