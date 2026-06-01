import React from "react";
import { auth, signOut } from "@/auth";
import { redirect } from "next/navigation";
import DashboardSidebar from "@/components/layout/DashboardSidebar";
import DashboardHeader from "@/components/layout/DashboardHeader";
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
    <div className="min-h-[100dvh] bg-zinc-50 flex">
      <DashboardSidebar isAdmin={isAdmin} />

      <div className="flex-1 flex flex-col min-w-0 md:pl-60">
        <DashboardHeader
          userName={user?.name || "User"}
          userEmail={user?.email || ""}
          userRole={userRole}
          isAdmin={isAdmin}
          signOutAction={signOutAction}
        />

        <main className="flex-1 p-3 sm:p-6 lg:p-8 pb-20 md:pb-8 min-w-0">
          {children}
        </main>

        <MobileBottomNav isAdmin={isAdmin} />
      </div>
    </div>
  );
}
