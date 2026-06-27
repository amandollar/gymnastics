-- ============================================================
-- Full schema catch-up migration for production database.
-- All changes below were applied to the dev DB via db push
-- but never had proper migrations generated.
-- ============================================================

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('INCOME', 'EXPENDITURE', 'INVESTMENT');

-- AlterEnum: Replace Role enum with only ADMIN and STAFF (remove old MANAGER/TRAINER)
-- We use the rename trick because ADD VALUE already ran in the previous migration.
BEGIN;
CREATE TYPE "Role_new" AS ENUM ('ADMIN', 'STAFF');
ALTER TABLE "public"."User" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "User" ALTER COLUMN "role" TYPE "Role_new" USING ("role"::text::"Role_new");
ALTER TYPE "Role" RENAME TO "Role_old";
ALTER TYPE "Role_new" RENAME TO "Role";
DROP TYPE "public"."Role_old";
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'STAFF';
COMMIT;

-- AlterTable: AcademyProfile missing columns
ALTER TABLE "AcademyProfile"
  ADD COLUMN IF NOT EXISTS "parentPortalUrl" TEXT,
  ADD COLUMN IF NOT EXISTS "templateEnquiryFollowUp" TEXT,
  ADD COLUMN IF NOT EXISTS "templateInactiveSessionComplete" TEXT,
  ADD COLUMN IF NOT EXISTS "templateLoginCredentials" TEXT;

-- AlterTable: Batch missing columns
ALTER TABLE "Batch"
  ADD COLUMN IF NOT EXISTS "endAge" INTEGER NOT NULL DEFAULT 99,
  ADD COLUMN IF NOT EXISTS "price1d" INTEGER,
  ADD COLUMN IF NOT EXISTS "price2d" INTEGER,
  ADD COLUMN IF NOT EXISTS "price3d" INTEGER,
  ADD COLUMN IF NOT EXISTS "price4d" INTEGER,
  ADD COLUMN IF NOT EXISTS "price5d" INTEGER,
  ADD COLUMN IF NOT EXISTS "price6d" INTEGER,
  ADD COLUMN IF NOT EXISTS "startAge" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "useDefaultPricing" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable: Coach missing columns
ALTER TABLE "Coach"
  ADD COLUMN IF NOT EXISTS "bio" TEXT,
  ADD COLUMN IF NOT EXISTS "certifications" TEXT,
  ADD COLUMN IF NOT EXISTS "experience" INTEGER,
  ADD COLUMN IF NOT EXISTS "leftDate" TIMESTAMP(3);

-- AlterTable: Student missing columns
ALTER TABLE "Student"
  ADD COLUMN IF NOT EXISTS "idCardProvided" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "registrationFee" INTEGER,
  ADD COLUMN IF NOT EXISTS "reminderDate" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "shirtProvided" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "trainingFocus" TEXT;

-- AlterTable: StudentPlan missing columns
ALTER TABLE "StudentPlan"
  ADD COLUMN IF NOT EXISTS "commissionPercent" INTEGER NOT NULL DEFAULT 50;

-- CreateTable: Notification
CREATE TABLE IF NOT EXISTS "Notification" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isRead" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable: FinanceTransaction
CREATE TABLE IF NOT EXISTS "FinanceTransaction" (
    "id" TEXT NOT NULL,
    "type" "TransactionType" NOT NULL,
    "category" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FinanceTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable: BudgetCategory
CREATE TABLE IF NOT EXISTS "BudgetCategory" (
    "id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BudgetCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable: AutoPay
CREATE TABLE IF NOT EXISTS "AutoPay" (
    "id" TEXT NOT NULL,
    "type" "TransactionType" NOT NULL,
    "category" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AutoPay_pkey" PRIMARY KEY ("id")
);

-- CreateTable: FinanceCategory
CREATE TABLE IF NOT EXISTS "FinanceCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "TransactionType" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FinanceCategory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex (IF NOT EXISTS guards)
CREATE INDEX IF NOT EXISTS "Notification_studentId_idx" ON "Notification"("studentId");
CREATE UNIQUE INDEX IF NOT EXISTS "BudgetCategory_category_month_year_key" ON "BudgetCategory"("category", "month", "year");
CREATE UNIQUE INDEX IF NOT EXISTS "FinanceCategory_name_type_key" ON "FinanceCategory"("name", "type");

-- AddForeignKey
ALTER TABLE "Notification" DROP CONSTRAINT IF EXISTS "Notification_studentId_fkey";
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_studentId_fkey"
  FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;
