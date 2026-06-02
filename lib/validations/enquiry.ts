import { z } from "zod";

export const createEnquirySchema = z.object({
  childName: z.string().min(2, "Child's name is required"),
  childAge: z.coerce
    .number()
    .int()
    .min(1)
    .max(25)
    .optional()
    .or(z.literal("").transform(() => undefined)),
  gender: z
    .enum(["Male", "Female", "Other"])
    .optional()
    .or(z.literal("").transform(() => undefined)),
  parentName: z.string().min(2, "Parent name is required"),
  contactNumber: z
    .string()
    .regex(/^\d{10}$/, "Contact must be exactly 10 digits"),
  source: z
    .enum(["WALK_IN", "REFERRAL", "SOCIAL_MEDIA", "OTHER"])
    .optional()
    .or(z.literal("").transform(() => undefined)),
  interestedIn: z.string().optional(),
  notes: z.string().optional(),
  followUpDate: z.string().optional(),
});

export const updateEnquirySchema = createEnquirySchema.extend({
  status: z.enum(["NEW", "CONTACTED", "FOLLOW_UP", "CONVERTED", "LOST"]),
});
