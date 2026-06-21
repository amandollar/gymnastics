-- CreateEnum
CREATE TYPE "CoachRole" AS ENUM ('COACH', 'STAFF');

-- AlterTable
ALTER TABLE "Coach" ADD COLUMN     "role" "CoachRole" NOT NULL DEFAULT 'COACH';
