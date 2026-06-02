import React from "react";
import { auth, signOut } from "@/auth";
import { redirect } from "next/navigation";
import { getAllUsers } from "@/lib/services/users";
import SettingsClient from "@/components/settings/SettingsClient";

export default async function SettingsPage() {
  const session = await auth();
  const user = session?.user;

  // Protect page: Only ADMIN role is authorized
  const userRole = (user as { role?: string })?.role;
  if (!session || userRole !== "ADMIN") {
    redirect("/dashboard");
  }

  // Fetch users via service layer
  const users = await getAllUsers();

  async function signOutAction() {
    "use server";
    await signOut({ redirectTo: "/login" });
  }

  return (
    <SettingsClient
      initialUsers={users as any[]}
      currentUserId={(user as { id: string }).id}
      signOutAction={signOutAction}
    />
  );
}
