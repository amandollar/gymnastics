import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { PrismaClient, Role } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import * as bcrypt from "bcryptjs";
import { createPgPool } from "../lib/db/pg-pool";

const pool = createPgPool();
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Starting database seed...");

  const adminEmail = process.env.ADMIN_SEED_EMAIL || "admin@academyofgymnast.com";
  const adminPassword = process.env.ADMIN_SEED_PASSWORD || "AdminPassword123!";
  const hashedAdminPassword = await bcrypt.hash(adminPassword, 10);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      name: "Saif Tamboli",
      password: hashedAdminPassword,
      role: Role.ADMIN,
    },
    create: {
      email: adminEmail,
      name: "Saif Tamboli",
      password: hashedAdminPassword,
      role: Role.ADMIN,
    },
  });
  console.log(`Admin: ${admin.email}`);

  const managerEmail = "manager@academyofgymnast.com";
  const hashedManagerPassword = await bcrypt.hash("ManagerPassword123!", 10);

  const manager = await prisma.user.upsert({
    where: { email: managerEmail },
    update: {
      password: hashedManagerPassword,
      role: Role.STAFF,
    },
    create: {
      email: managerEmail,
      name: "Saif Tamboli",
      password: hashedManagerPassword,
      role: Role.STAFF,
    },
  });
  console.log(`Manager: ${manager.email}`);

  const trainerEmail = "trainer@academyofgymnast.com";
  const hashedTrainerPassword = await bcrypt.hash("TrainerPassword123!", 10);

  const trainer = await prisma.user.upsert({
    where: { email: trainerEmail },
    update: {
      password: hashedTrainerPassword,
      role: Role.STAFF,
    },
    create: {
      email: trainerEmail,
      name: "Trainer Account",
      password: hashedTrainerPassword,
      role: Role.STAFF,
    },
  });
  console.log(`Trainer: ${trainer.email}`);

  const templates = [
    {
      name: "12 Sessions · ~1 month",
      planType: "REGULAR" as const,
      totalSessions: 12,
      validityDays: 36,
      defaultFee: 3200,
      description: "Common starter package from academy sheet",
    },
    {
      name: "36 Sessions · ~3 months",
      planType: "REGULAR" as const,
      totalSessions: 36,
      validityDays: 108,
      defaultFee: 8640,
    },
    {
      name: "60 Sessions · extended",
      planType: "REGULAR" as const,
      totalSessions: 60,
      validityDays: 120,
      defaultFee: 11880,
    },
  ];

  for (const t of templates) {
    const existing = await prisma.planTemplate.findFirst({
      where: { name: t.name },
    });
    if (!existing) {
      await prisma.planTemplate.create({ data: t });
    }
  }
  console.log("Plan templates seeded.");

  console.log("Seeding complete.");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("Seed error:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
