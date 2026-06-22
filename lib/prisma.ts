import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { createPgPool } from "@/lib/db/pg-pool";

/** Bump when schema models change — invalidates stale dev singletons */
const PRISMA_CLIENT_VERSION = "2026-coach-commission-v1";

const globalForPrisma = global as unknown as {
  prisma?: PrismaClient;
  prismaClientVersion?: string;
};

function createPrismaClient() {
  const pool = createPgPool();
  const adapter = new PrismaPg(pool);

  const client = new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

  if (typeof (client as PrismaClient & { student?: unknown }).student === "undefined") {
    throw new Error(
      "Prisma Client is out of date (missing Student model). Run: npm run db:generate — then restart the dev server."
    );
  }

  if (typeof (client as PrismaClient & { enquiry?: unknown }).enquiry === "undefined") {
    throw new Error(
      "Prisma Client is out of date (missing Enquiry model). Run: npx prisma generate — then restart the dev server."
    );
  }

  if (typeof (client as PrismaClient & { batch?: unknown }).batch === "undefined") {
    throw new Error(
      "Prisma Client is out of date (missing Batch model). Run: npm run db:generate — then restart the dev server."
    );
  }

  if (typeof (client as PrismaClient & { academyProfile?: unknown }).academyProfile === "undefined") {
    throw new Error(
      "Prisma Client is out of date (missing AcademyProfile model). Run: npx prisma generate — then restart the dev server."
    );
  }

  return client;
}

function getPrisma(): PrismaClient {
  const cached = globalForPrisma.prisma;
  const versionOk = globalForPrisma.prismaClientVersion === PRISMA_CLIENT_VERSION;

  if (cached && versionOk) {
    return cached;
  }

  const client = createPrismaClient();

  // Cache on global in ALL environments so warm serverless invocations reuse
  // the existing pg connection pool instead of opening a new TCP+TLS handshake
  // to Neon on every request. Safe because Node.js module-level globals persist
  // across invocations in the same container / long-lived process.
  globalForPrisma.prisma = client;
  globalForPrisma.prismaClientVersion = PRISMA_CLIENT_VERSION;

  return client;
}

export const prisma = getPrisma();
