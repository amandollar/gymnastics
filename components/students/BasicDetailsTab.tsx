"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { updateStudentAction } from "@/lib/actions/students";
import {
  toDateInputValue,
  formatJoinedDate,
  STATUS_STYLES,
  type StudentStatus,
} from "@/lib/utils/student";
import StudentAvatarPicker from "./StudentAvatarPicker";
import DateOfBirthField from "./DateOfBirthField";

import { STUDENT_LEVELS } from "@/lib/utils/level";

const inputClass =
  "w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-3.5 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-brand-orange-500/50 focus:border-brand-orange-500 transition-all duration-200";

type StudentData = {
  id: string;
  name: string;
  dateOfBirth: Date;
  gender: string;
  parentName: string;
  contactNumber: string;
  admissionDate: Date;
  level: string;
  notes: string | null;
  medicalHistory: string | null;
  avatarUrl?: string | null;
  studentNumber: number;
  status?: string;
  activePlan?: { planType: string } | null;
};

export default function BasicDetailsTab({ student }: { student: StudentData }) {
  const today = toDateInputValue(new Date());
  const [name, setName] = useState(student.name);
  const [gender, setGender] = useState(student.gender);

  const boundAction = updateStudentAction.bind(null, student.id);
  const [state, action, pending] = useActionState(boundAction, null);

  return (
    <form action={action} className="space-y-6 max-w-3xl mx-auto">
      <input
        type="hidden"
        name="admissionDate"
        value={toDateInputValue(new Date(student.admissionDate))}
      />
      <div className="rounded-3xl border-0 bg-white dark:bg-zinc-900 p-6 shadow-xs space-y-8 transition-colors">

        {/* Read-only meta strip */}
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-zinc-500 dark:text-zinc-400 pb-2">
          <div>
            <span className="text-zinc-400 dark:text-zinc-500">Roll Number: </span>
            <span className="font-semibold text-zinc-800 dark:text-zinc-200">
              {`TAG${String(student.studentNumber).padStart(3, "0")}`}
            </span>
          </div>
          <div>
            <span className="text-zinc-400 dark:text-zinc-500">Joined: </span>
            <span className="font-semibold text-zinc-800 dark:text-zinc-200">
              {formatJoinedDate(new Date(student.admissionDate))}
            </span>
          </div>
          {student.status && (
            <div className="flex items-center gap-1">
              <span className="text-zinc-400 dark:text-zinc-500">Status: </span>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                  STATUS_STYLES[student.status as StudentStatus]?.className ||
                  "bg-zinc-100 text-zinc-650"
                }`}
              >
                {STATUS_STYLES[student.status as StudentStatus]?.label ||
                  student.status}
              </span>
            </div>
          )}
          {student.activePlan && (
            <div>
              <span className="text-zinc-400 dark:text-zinc-500">Plan: </span>
              <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                {student.activePlan.planType === "ONE_TO_ONE"
                  ? "Personal training"
                  : "Group class"}
              </span>
            </div>
          )}
        </div>

        <div className="flex flex-col items-center justify-center pt-2 pb-2">
          <StudentAvatarPicker
            gender={gender}
            currentAvatarUrl={student.avatarUrl}
          />
        </div>

        <div className="grid gap-x-4 gap-y-7 sm:grid-cols-2">
          {/* Full name */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-1.5">
              Full name *
            </label>
            <input
              name="name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputClass}
              placeholder="e.g. Ananya Sharma"
            />
            {state?.errors?.name && (
              <p className="mt-1 text-xs text-rose-600">{state.errors.name[0]}</p>
            )}
          </div>

          {/* Date of birth */}
          <div>
            <label className="block text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-1.5">
              Date of birth *
            </label>
            <DateOfBirthField
              defaultValue={toDateInputValue(new Date(student.dateOfBirth))}
              maxDate={today}
              selectClassName={inputClass}
              error={state?.errors?.dateOfBirth?.[0]}
            />
          </div>

          {/* Gender */}
          <div>
            <label className="block text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-1.5">
              Gender *
            </label>
            <select
              name="gender"
              required
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className={inputClass}
            >
              <option value="" disabled>Select gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
            {state?.errors?.gender && (
              <p className="mt-1 text-xs text-rose-600">{state.errors.gender[0]}</p>
            )}
          </div>

          {/* Student Level */}
          <div>
            <label className="block text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-1.5">
              Student Level *
            </label>
            <select
              name="level"
              required
              defaultValue={student.level}
              className={inputClass}
            >
              {STUDENT_LEVELS.map((lvl) => (
                <option key={lvl.value} value={lvl.value}>
                  {lvl.label}
                </option>
              ))}
            </select>
            {state?.errors?.level && (
              <p className="mt-1 text-xs text-rose-600">{state.errors.level[0]}</p>
            )}
          </div>
        </div>

        {/* Parent / guardian */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-1.5">
              Parent&apos;s name *
            </label>
            <input
              name="parentName"
              required
              defaultValue={student.parentName}
              className={inputClass}
              placeholder="e.g. Vijay Sharma"
            />
            {state?.errors?.parentName && (
              <p className="mt-1 text-xs text-rose-600">{state.errors.parentName[0]}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-1.5">
              Mobile number *
            </label>
            <input
              name="contactNumber"
              type="tel"
              inputMode="numeric"
              pattern="\d{10}"
              maxLength={10}
              required
              defaultValue={student.contactNumber}
              className={inputClass}
              placeholder="10 digit mobile"
            />
            {state?.errors?.contactNumber && (
              <p className="mt-1 text-xs text-rose-600">
                {state.errors.contactNumber[0]}
              </p>
            )}
          </div>
        </div>

        {/* Medical history */}
        <div>
          <label className="block text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-1.5">
            Medical history
          </label>
          <p className="text-xs text-zinc-400 dark:text-zinc-500 mb-1.5">
            Allergies, conditions, etc.
          </p>
          <textarea
            name="medicalHistory"
            rows={2}
            defaultValue={student.medicalHistory ?? ""}
            className={inputClass}
            placeholder="e.g. Allergies, medical conditions…"
          />
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-1.5">
            Notes
          </label>
          <p className="text-xs text-zinc-400 dark:text-zinc-500 mb-1.5">
            Optional details about student
          </p>
          <textarea
            name="notes"
            rows={2}
            defaultValue={student.notes ?? ""}
            className={inputClass}
            placeholder="e.g. Any general notes…"
          />
        </div>
      </div>

      {/* Error banner */}
      {state?.message && !state.success && (
        <div className="rounded-2xl border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-955/20 px-4 py-3 text-sm text-rose-700 dark:text-rose-400">
          {state.message}
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Link
          href={`/students/${student.id}`}
          className="inline-flex items-center justify-center rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4.5 py-2.5 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-850 transition-colors"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center justify-center rounded-xl bg-brand-orange-500 px-4.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-orange-600 disabled:opacity-50 cursor-pointer transition-colors"
        >
          {pending ? (
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              Saving…
            </span>
          ) : (
            "Save changes"
          )}
        </button>
      </div>
    </form>
  );
}
