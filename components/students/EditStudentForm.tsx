"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { updateStudentAction } from "@/lib/actions/students";
import { toDateInputValue } from "@/lib/utils/student";
import StudentAvatarPicker from "./StudentAvatarPicker";
import DateOfBirthField from "./DateOfBirthField";
import SimpleDateInput from "./SimpleDateInput";

const inputClass =
  "w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-3.5 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-brand-orange-500/50 focus:border-brand-orange-500 transition-all duration-200";

function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3.5">
      <div>
        <h2 className="text-[11px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
          {title}
        </h2>
        {description && (
          <p className="mt-0.5 text-xs text-zinc-400 dark:text-zinc-500">{description}</p>
        )}
      </div>
      {children}
    </section>
  );
}

type StudentData = {
  id: string;
  name: string;
  dateOfBirth: Date;
  gender: string;
  parentName: string;
  contactNumber: string;
  admissionDate: Date;
  notes: string | null;
  medicalHistory: string | null;
  avatarUrl?: string | null;
  studentNumber: number;
};

export default function EditStudentForm({ student }: { student: StudentData }) {
  const today = toDateInputValue(new Date());
  const [name, setName] = useState(student.name);

  // Bind studentId into the action
  const boundAction = updateStudentAction.bind(null, student.id);
  const [state, action, pending] = useActionState(boundAction, null);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-1.5 pt-1 pb-3">
        <Link
          href={`/students/${student.id}`}
          className="text-xs sm:text-sm text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300 transition-colors inline-flex items-center gap-1 font-medium"
        >
          ← Back to profile
        </Link>
        <h1 className="text-3xl sm:text-5xl font-light tracking-tight text-zinc-900 dark:text-zinc-50">
          Edit Student
        </h1>
        <p className="text-sm text-zinc-400 dark:text-zinc-500">
          #{student.studentNumber} · Editing basic details
        </p>
      </div>

      <form action={action} className="space-y-6 max-w-3xl mx-auto">
        <div className="rounded-3xl border-0 bg-white dark:bg-zinc-900 p-6 shadow-xs space-y-6 transition-colors">

          {/* Student information */}
          <FormSection title="Student information">
            {/* Avatar */}
            <div className="flex flex-col items-center justify-center pt-2 pb-4">
              <StudentAvatarPicker name={name} currentAvatarUrl={student.avatarUrl} />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
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
                  defaultValue={student.gender}
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

              {/* Admission date */}
              <div>
                <label className="block text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-1.5">
                  Admission date *
                </label>
                <SimpleDateInput
                  name="admissionDate"
                  required
                  defaultValue={toDateInputValue(new Date(student.admissionDate))}
                  className={inputClass}
                />
                {state?.errors?.admissionDate && (
                  <p className="mt-1 text-xs text-rose-600">{state.errors.admissionDate[0]}</p>
                )}
              </div>
            </div>
          </FormSection>

          {/* Parent / guardian */}
          <div className="border-t border-zinc-100 dark:border-zinc-800/80 pt-6">
            <FormSection title="Parent / guardian">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-1.5">
                    Parent's name *
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
                    <p className="mt-1 text-xs text-rose-600">{state.errors.contactNumber[0]}</p>
                  )}
                </div>
              </div>
            </FormSection>
          </div>

          {/* Medical history */}
          <div className="border-t border-zinc-100 dark:border-zinc-800/80 pt-6">
            <FormSection title="Medical history" description="Allergies, conditions, etc.">
              <textarea
                name="medicalHistory"
                rows={2}
                defaultValue={student.medicalHistory ?? ""}
                className={inputClass}
                placeholder="e.g. Allergies, medical conditions…"
              />
            </FormSection>
          </div>

          {/* Notes */}
          <div className="border-t border-zinc-100 dark:border-zinc-800/80 pt-6">
            <FormSection title="Notes" description="Optional details about student">
              <textarea
                name="notes"
                rows={2}
                defaultValue={student.notes ?? ""}
                className={inputClass}
                placeholder="e.g. Any general notes…"
              />
            </FormSection>
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
    </div>
  );
}
