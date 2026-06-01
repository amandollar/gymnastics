import { prisma } from "@/lib/prisma";

export async function getAllUsers() {
  try {
    return await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });
  } catch (error) {
    console.error("Database service error fetching users:", error);
    throw new Error("Failed to retrieve user directory from database.");
  }
}
