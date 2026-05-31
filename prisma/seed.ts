import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { PrismaClient, Role } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import * as bcrypt from "bcryptjs";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
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
      password: hashedAdminPassword,
      role: Role.ADMIN,
    },
    create: {
      email: adminEmail,
      name: "Super Admin",
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
      role: Role.MANAGER,
    },
    create: {
      email: managerEmail,
      name: "Saif Tamboli",
      password: hashedManagerPassword,
      role: Role.MANAGER,
    },
  });
  console.log(`Manager: ${manager.email}`);

  const trainerEmail = "trainer@academyofgymnast.com";
  const hashedTrainerPassword = await bcrypt.hash("TrainerPassword123!", 10);

  const trainer = await prisma.user.upsert({
    where: { email: trainerEmail },
    update: {
      password: hashedTrainerPassword,
      role: Role.TRAINER,
    },
    create: {
      email: trainerEmail,
      name: "Trainer Account",
      password: hashedTrainerPassword,
      role: Role.TRAINER,
    },
  });
  console.log(`Trainer: ${trainer.email}`);

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
