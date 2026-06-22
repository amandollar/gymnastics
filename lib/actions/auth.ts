"use server";

import { signIn } from "@/auth";
import { AuthError } from "next-auth";

export async function authenticate(
  prevState: string | undefined,
  formData: FormData
) {
  try {
    const rawData = Object.fromEntries(formData);
    await signIn("credentials", {
      email: rawData.email,
      password: rawData.password,
      redirectTo: "/admin/dashboard",
    });
    return undefined;
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return "Invalid email or password.";
        default:
          return "Incorrect login details. Please try again.";
      }
    }

    if (
      (error as { message?: string; digest?: string }).message === "NEXT_REDIRECT" ||
      (error as { digest?: string }).digest?.startsWith("NEXT_REDIRECT")
    ) {
      throw error;
    }

    console.error("Login error:", error);
    return "An unexpected error occurred. Please try again.";
  }
}

export async function authenticatePortal(
  prevState: string | undefined,
  formData: FormData
) {
  try {
    const rawData = Object.fromEntries(formData);
    await signIn("credentials", {
      email: rawData.email,
      password: rawData.password,
      redirectTo: "/portal",
    });
    return undefined;
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return "Invalid Roll Number or password.";
        default:
          return "Incorrect login details. Please try again.";
      }
    }

    if (
      (error as { message?: string; digest?: string }).message === "NEXT_REDIRECT" ||
      (error as { digest?: string }).digest?.startsWith("NEXT_REDIRECT")
    ) {
      throw error;
    }

    console.error("Portal login error:", error);
    return "An unexpected error occurred. Please try again.";
  }
}

