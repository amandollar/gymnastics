import React from "react";
import { auth, signOut } from "@/auth";
import { redirect } from "next/navigation";

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
  const roleColors: Record<string, string> = {
    ADMIN:
      "bg-brand-orange-500/10 text-brand-orange-600 dark:bg-brand-orange-500/20 dark:text-brand-orange-500 border border-brand-orange-500/20",
    MANAGER:
      "bg-zinc-100 text-zinc-900 dark:bg-zinc-800/40 dark:text-white border border-zinc-200 dark:border-zinc-800",
    TRAINER:
      "bg-white text-zinc-600 border border-zinc-200 dark:bg-zinc-950 dark:text-zinc-400 dark:border-zinc-900",
  };

  const userRole = (user as { role?: string })?.role || "TRAINER";

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col dark:bg-zinc-950">
      <header className="sticky top-0 z-30 border-b border-zinc-200/40 bg-white/70 backdrop-blur-md dark:border-zinc-800/20 dark:bg-zinc-950/70 shadow-sm">
        <div className="flex h-16 items-center justify-between px-6 sm:px-10">
          <div className="flex items-center gap-3">
            <div className="relative group">
              <div className="absolute -inset-0.5 rounded-full bg-gradient-to-r from-brand-orange-600 to-brand-orange-500 opacity-60 blur-xs transition duration-1000 group-hover:opacity-100 group-hover:duration-200"></div>
              <div className="relative h-9 w-9 overflow-hidden rounded-full border border-brand-orange-500 bg-black shadow-sm">
                <img
                  src="/logo.webp"
                  alt="TAG"
                  className="h-full w-full object-cover"
                />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-[0.18em] text-brand-orange-500 leading-none">
                The Academy
              </span>
              <span className="mt-1 text-sm font-extrabold text-zinc-900 dark:text-white leading-none">
                of Gymnastics
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end hidden md:flex">
              <span className="text-xs font-extrabold text-zinc-900 dark:text-white">
                {user?.name || "User"}
              </span>
              <span className="text-[10px] font-bold text-zinc-500">
                {user?.email}
              </span>
            </div>

            <span
              className={`rounded-full px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider ${roleColors[userRole] || roleColors.TRAINER}`}
            >
              {userRole}
            </span>

            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/login" });
              }}
            >
              <button
                type="submit"
                className="rounded-xl border border-zinc-200 bg-white px-3.5 py-2 text-xs font-extrabold text-zinc-700 shadow-sm transition-all hover:bg-zinc-50 hover:text-zinc-950 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-white active:scale-[0.97]"
              >
                Sign Out
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="flex-1 p-6 sm:p-10">{children}</main>
    </div>
  );
}
