-- CreateEnum
CREATE TYPE "CoachStatus" AS ENUM ('WORKING', 'LEFT');

-- CreateEnum
CREATE TYPE "CoachAttendanceStatus" AS ENUM ('PRESENT', 'ABSENT');

-- AlterTable
ALTER TABLE "Student" ADD COLUMN "isTempPassword" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "password" TEXT;

-- AlterTable
ALTER TABLE "StudentPlan" ADD COLUMN "coachId" TEXT;

-- CreateTable
CREATE TABLE "AcademyProfile" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "phone2" TEXT,
    "address" TEXT,
    "website" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AcademyProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Coach" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contactNumber" TEXT NOT NULL,
    "email" TEXT,
    "joinDate" TIMESTAMP(3) NOT NULL,
    "timing" TEXT,
    "specialization" TEXT,
    "fixedSalary" INTEGER NOT NULL DEFAULT 0,
    "status" "CoachStatus" NOT NULL DEFAULT 'WORKING',
    "notes" TEXT,
    "avatarUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Coach_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoachAttendance" (
    "id" TEXT NOT NULL,
    "coachId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "status" "CoachAttendanceStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CoachAttendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoachSalaryPayment" (
    "id" TEXT NOT NULL,
    "coachId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "amount" INTEGER NOT NULL,
    "paid" BOOLEAN NOT NULL DEFAULT false,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CoachSalaryPayment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CoachAttendance_coachId_date_key" ON "CoachAttendance"("coachId", "date");

-- CreateIndex
CREATE INDEX "CoachAttendance_coachId_idx" ON "CoachAttendance"("coachId");

-- CreateIndex
CREATE UNIQUE INDEX "CoachSalaryPayment_coachId_year_month_key" ON "CoachSalaryPayment"("coachId", "year", "month");

-- CreateIndex
CREATE INDEX "CoachSalaryPayment_coachId_idx" ON "CoachSalaryPayment"("coachId");

-- CreateIndex
CREATE INDEX "StudentPlan_coachId_idx" ON "StudentPlan"("coachId");

-- AddForeignKey
ALTER TABLE "StudentPlan" ADD CONSTRAINT "StudentPlan_coachId_fkey" FOREIGN KEY ("coachId") REFERENCES "Coach"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoachAttendance" ADD CONSTRAINT "CoachAttendance_coachId_fkey" FOREIGN KEY ("coachId") REFERENCES "Coach"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoachSalaryPayment" ADD CONSTRAINT "CoachSalaryPayment_coachId_fkey" FOREIGN KEY ("coachId") REFERENCES "Coach"("id") ON DELETE CASCADE ON UPDATE CASCADE;
