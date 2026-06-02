"use client";

import { Dumbbell } from "lucide-react";

export default function MentorsPageClient() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-4">
      <div className="relative mb-6">
        <div className="relative p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 text-brand-orange-500 shadow-md">
          <Dumbbell className="h-10 w-10" style={{ animationDuration: '3s' }} />
        </div>
      </div>
      <h1 className="text-2xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight">
        Mentors & Coaches
      </h1>
      <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400 font-semibold uppercase tracking-widest bg-zinc-100 dark:bg-zinc-800 px-3 py-1 rounded-full">
        Soon
      </p>
    </div>
  );
}
