import React from "react";
import { auth } from "@/auth";

export default async function DashboardPage() {
  const session = await auth();
  const user = session?.user;

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div className="relative overflow-hidden rounded-2xl bg-zinc-950 p-8 text-white shadow-md border border-zinc-800">
        <div className="absolute right-0 top-0 -mr-16 -mt-16 h-48 w-48 rounded-full bg-brand-orange-500/10 blur-2xl"></div>

        <div className="relative z-10">
          <span className="text-[10px] font-black uppercase tracking-[0.25em] text-brand-orange-500">
            System Initialized
          </span>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
            Welcome back, {user?.name || "User"}
          </h1>
          <p className="mt-3 text-sm text-zinc-400 max-w-lg leading-relaxed font-semibold">
            Your credentials have been authenticated. The Academy of Gymnastics
            (TAG) portal is live, fully secure, and styled in a premium
            high-contrast design.
          </p>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="bg-white border border-zinc-200/80 rounded-2xl p-6 shadow-sm dark:bg-zinc-900 dark:border-zinc-800">
          <div className="flex items-center justify-between">
            <h2 className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
              Auth Session State
            </h2>
            <svg
              className="h-5 w-5 text-brand-orange-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.75h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
              />
            </svg>
          </div>
          <div className="mt-5 flex items-center gap-3">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-orange-500 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-brand-orange-500"></span>
            </span>
            <span className="text-lg font-extrabold text-zinc-900 dark:text-white">
              Stateless JWT Active
            </span>
          </div>
          <div className="mt-5 border-t border-zinc-100 pt-4 dark:border-zinc-800/60">
            <p className="text-xs text-zinc-400 dark:text-zinc-500 leading-relaxed font-semibold">
              Middleware intercepts incoming connections, performing instant
              token verification without database lookup.
            </p>
          </div>
        </div>

        <div className="bg-white border border-zinc-200/80 rounded-2xl p-6 shadow-sm dark:bg-zinc-900 dark:border-zinc-800">
          <div className="flex items-center justify-between">
            <h2 className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
              Identity Claims
            </h2>
            <svg
              className="h-5 w-5 text-brand-orange-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
              />
            </svg>
          </div>
          <div className="mt-5 space-y-3">
            <div className="flex justify-between text-xs">
              <span className="font-bold text-zinc-400">Claim ID</span>
              <span className="font-extrabold text-zinc-900 dark:text-white bg-zinc-100 dark:bg-zinc-800 rounded px-1.5 py-0.5 border border-zinc-200/50 dark:border-zinc-700/50">
                {(user as { id?: string })?.id || "N/A"}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="font-bold text-zinc-400">Mailbox</span>
              <span className="font-extrabold text-zinc-900 dark:text-white">
                {user?.email || "N/A"}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="font-bold text-zinc-400">Scope Level</span>
              <span className="font-black text-brand-orange-500 uppercase">
                {(user as { role?: string })?.role || "TRAINER"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
