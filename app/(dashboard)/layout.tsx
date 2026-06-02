import React from "react";
import { auth, signOut } from "@/auth";
import { redirect } from "next/navigation";
import DashboardSidebar from "@/components/layout/DashboardSidebar";
import { MobileBottomNav } from "@/components/layout/MobileDashboardNav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const user = session.user;
  const userRole = (user as { role?: string })?.role || "TRAINER";
  const isAdmin = userRole === "ADMIN";

  async function signOutAction() {
    "use server";
    await signOut({ redirectTo: "/login" });
  }

  return (
    <div className="min-h-[100dvh] bg-[var(--background)] dark:bg-zinc-950 flex gap-0 md:gap-2 transition-colors duration-200">
      <DashboardSidebar
        isAdmin={isAdmin}
        userName={user?.name || "User"}
        userRole={userRole}
        signOutAction={signOutAction}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 p-4 sm:p-6 lg:p-8 pt-6 sm:pt-6 lg:pt-8 pb-24 md:pb-8 min-w-0 text-zinc-900 dark:text-zinc-100">
          {children}
        </main>

        <MobileBottomNav isAdmin={isAdmin} signOutAction={signOutAction} />
      </div>
    </div>
  );
}
