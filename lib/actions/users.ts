"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import * as bcrypt from "bcryptjs";
import { z } from "zod";
import { revalidatePath, updateTag } from "next/cache";

// Validation schemas
const CreateUserSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["ADMIN", "STAFF"]),
});

const UpdateUserSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters").optional().or(z.literal("")),
  role: z.enum(["ADMIN", "STAFF"]),
});

// Helper to assert Admin permission
async function assertAdmin() {
  const session = await auth();
  const user = session?.user as { role?: string; id?: string } | undefined;
  if (!user || user.role !== "ADMIN") {
    throw new Error("Unauthorized: Only administrators can manage users.");
  }
  return user;
}

/**
 * Fetch all users
 */
export async function getUsers() {
  await assertAdmin();
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
    console.error("Failed to fetch users:", error);
    throw new Error("Failed to load users list.");
  }
}

/**
 * Create a new user
 */
export async function createUser(prevState: any, formData: FormData) {
  try {
    await assertAdmin();

    const rawData = Object.fromEntries(formData);
    const validated = CreateUserSchema.safeParse({
      name: rawData.name,
      email: rawData.email,
      password: rawData.password,
      role: rawData.role,
    });

    if (!validated.success) {
      return {
        success: false,
        errors: validated.error.flatten().fieldErrors,
      };
    }

    const { name, email, password, role } = validated.data;

    // Check if email already exists
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return {
        success: false,
        errors: { email: ["This email is already in use."] },
      };
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
      },
      select: {
        id: true,
        createdAt: true,
      },
    });

    revalidatePath("/admin/settings");
    updateTag("users");
    return {
      success: true,
      message: "User account created successfully.",
      user: {
        id: user.id,
        createdAt: user.createdAt,
      },
    };
  } catch (error: any) {
    console.error("Error creating user:", error);
    return {
      success: false,
      message: error.message || "An unexpected error occurred.",
    };
  }
}

/**
 * Update an existing user
 */
export async function updateUser(
  userId: string,
  prevState: any,
  formData: FormData
) {
  try {
    await assertAdmin();

    const rawData = Object.fromEntries(formData);
    const validated = UpdateUserSchema.safeParse({
      name: rawData.name,
      email: rawData.email,
      password: rawData.password,
      role: rawData.role,
    });

    if (!validated.success) {
      return {
        success: false,
        errors: validated.error.flatten().fieldErrors,
      };
    }

    const { name, email, password, role } = validated.data;

    // Check email uniqueness if email has changed
    const existingUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!existingUser) {
      return {
        success: false,
        message: "User not found.",
      };
    }

    if (existingUser.email !== email) {
      const emailConflict = await prisma.user.findUnique({ where: { email } });
      if (emailConflict) {
        return {
          success: false,
          errors: { email: ["This email is already in use."] },
        };
      }
    }

    const updateData: any = {
      name,
      email,
      role,
    };

    // Only update password if provided
    if (password && password.trim() !== "") {
      updateData.password = await bcrypt.hash(password, 10);
    }

    await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    revalidatePath("/admin/settings");
    updateTag("users");
    return { success: true, message: "User account updated successfully." };
  } catch (error: any) {
    console.error("Error updating user:", error);
    return {
      success: false,
      message: error.message || "An unexpected error occurred.",
    };
  }
}

/**
 * Delete a user
 */
export async function deleteUser(userId: string) {
  try {
    const currentUser = await assertAdmin();

    // Prevent self deletion
    if (currentUser.id === userId) {
      return {
        success: false,
        message: "You cannot delete your own admin account.",
      };
    }

    const existingUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!existingUser) {
      return {
        success: false,
        message: "User not found.",
      };
    }

    await prisma.user.delete({ where: { id: userId } });

    revalidatePath("/admin/settings");
    updateTag("users");
    return { success: true, message: "User account deleted successfully." };
  } catch (error: any) {
    console.error("Error deleting user:", error);
    return {
      success: false,
      message: error.message || "An unexpected error occurred.",
    };
  }
}
