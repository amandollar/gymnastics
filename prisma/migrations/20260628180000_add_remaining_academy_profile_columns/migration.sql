-- AlterTable: Add remaining missing columns to AcademyProfile
ALTER TABLE "AcademyProfile"
  ADD COLUMN IF NOT EXISTS "templatePaymentReceived" TEXT,
  ADD COLUMN IF NOT EXISTS "templateAdmissionWelcome" TEXT,
  ADD COLUMN IF NOT EXISTS "templateAllSessionsCompleted" TEXT,
  ADD COLUMN IF NOT EXISTS "autoSendGrace" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "autoSendInactive" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "autoSendAllSessionsCompleted" BOOLEAN NOT NULL DEFAULT true;
