"use client";

import Link from "next/link";
import StudentAvatar from "./StudentAvatar";
import { Check, ArrowRight } from "lucide-react";

export default function StudentCreatedSuccess({
  studentId,
  studentName,
  studentNumber,
  avatarUrl,
  gender,
}: {
  studentId: string;
  studentName: string;
  studentNumber: number;
  avatarUrl?: string | null;
  gender?: string | null;
}) {
  return (
    <div className="space-y-4">
      <div>
        <Link
          href="/students"
          className="text-sm text-zinc-500 hover:text-zinc-800 transition-colors"
        >
          ← Back to students
        </Link>
      </div>

      <div className="rounded-2xl border-0 bg-white dark:bg-zinc-900 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-br from-emerald-50/40 via-white dark:via-zinc-900 to-orange-50/20 px-6 pt-8 pb-6 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-500/25">
            <Check className="h-6 w-6" strokeWidth={2.5} />
          </div>
          <h1 className="mt-4 text-xl sm:text-2xl font-semibold text-zinc-900">
            Student added
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Profile saved. You can assign a training plan now or do it later.
          </p>
        </div>

        <div className="border-t border-zinc-100 px-6 py-6">
          <div className="flex flex-col items-center text-center">
            <StudentAvatar
              student={{
                id: studentId,
                name: studentName,
                studentNumber,
                avatarUrl,
                gender,
              }}
              size={80}
              className="ring-4 ring-white shadow-md"
            />
            <p className="mt-4 text-lg font-semibold text-zinc-900">
              {studentName}
            </p>
            <p className="text-sm text-zinc-500">
              Student ID #{studentNumber}
            </p>
            <span className="mt-2 inline-flex items-center rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-600">
              No plan assigned yet
            </span>
          </div>

          <div className="mt-8 space-y-3">
            <Link
              href={`/plans?student=${studentId}`}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-orange-500 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-brand-orange-600 transition-colors"
            >
              Create & assign plan
              <ArrowRight className="h-4 w-4" strokeWidth={2} />
            </Link>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <Link
                href={`/students/${studentId}`}
                className="flex items-center justify-center rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
              >
                View profile
              </Link>
              <Link
                href="/students/new"
                className="flex items-center justify-center rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
              >
                Add another student
              </Link>
            </div>
          </div>
        </div>
      </div>

      <p className="text-center text-xs text-zinc-400">
        Plans set fees, sessions, and expiry automatically from your academy rules.
      </p>
    </div>
  );
}
