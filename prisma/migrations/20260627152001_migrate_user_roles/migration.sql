-- This migration runs AFTER 20260627152000_update_user_role_enum which committed STAFF
-- to the Role enum. Only now can we safely reference 'STAFF' in DML/DDL.

-- AlterTable: Set default role to STAFF (replaces legacy TRAINER default)
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'STAFF';

-- Migrate existing users who still have legacy MANAGER or TRAINER roles
UPDATE "User" SET "role" = 'STAFF' WHERE "role"::text IN ('MANAGER', 'TRAINER');
