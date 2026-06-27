-- AlterEnum: Add STAFF to Role enum if it doesn't already exist (idempotent)
-- NOTE: ALTER TYPE ADD VALUE cannot be used in the same transaction as statements
-- that reference the new value. The ALTER TABLE and UPDATE are in the next migration.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum
                 JOIN pg_type ON pg_type.oid = pg_enum.enumtypid
                 WHERE pg_type.typname = 'Role' AND pg_enum.enumlabel = 'STAFF') THEN
    ALTER TYPE "Role" ADD VALUE 'STAFF';
  END IF;
END $$;
