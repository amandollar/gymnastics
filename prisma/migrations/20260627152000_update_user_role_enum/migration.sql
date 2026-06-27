-- AlterEnum: Add STAFF to Role enum if it doesn't already exist (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum
                 JOIN pg_type ON pg_type.oid = pg_enum.enumtypid
                 WHERE pg_type.typname = 'Role' AND pg_enum.enumlabel = 'STAFF') THEN
    ALTER TYPE "Role" ADD VALUE 'STAFF';
  END IF;
END $$;

-- AlterTable: Set default role to STAFF (replaces legacy TRAINER default)
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'STAFF';

-- Migrate existing users who still have legacy MANAGER or TRAINER roles
UPDATE "User" SET "role" = 'STAFF' WHERE "role"::text IN ('MANAGER', 'TRAINER');
