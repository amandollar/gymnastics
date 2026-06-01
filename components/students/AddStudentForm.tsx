"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { createStudentAction } from "@/lib/actions/students";
import { toDateInputValue } from "@/lib/utils/student";
import StudentAvatarPicker from "./StudentAvatarPicker";
import StudentCreatedSuccess from "./StudentCreatedSuccess";

const inputClass =
  "w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-brand-orange-500/20 focus:border-brand-orange-500";

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
    <section className="space-y-4">
      <div>
        <h2 className="text-sm font-medium text-zinc-900">{title}</h2>
        {description && (
          <p className="mt-0.5 text-xs text-zinc-500">{description}</p>
        )}
      </div>
      {children}
    </section>
  );
}

export default function AddStudentForm() {
  const today = toDateInputValue(new Date());
  const [name, setName] = useState("");
  const [state, action, pending] = useActionState(createStudentAction, null);

  if (
    state?.success &&
    state.studentId &&
    state.studentName &&
    state.studentNumber != null &&
    !pending
  ) {
    return (
      <StudentCreatedSuccess
        studentId={state.studentId}
        studentName={state.studentName}
        studentNumber={state.studentNumber}
        avatarUrl={state.avatarUrl}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/students"
          className="text-sm text-zinc-500 hover:text-zinc-800 transition-colors"
        >
          ← Back to students
        </Link>
        <h1 className="mt-2 text-xl sm:text-2xl font-semibold text-zinc-900">
          Add student
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Create a new profile, then assign a plan in the next step.
        </p>
        <div className="mt-4 flex items-center gap-2 text-xs font-medium">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-orange-500 text-white">
            1
          </span>
          <span className="text-zinc-900">Details</span>
          <span className="text-zinc-300">—</span>
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-100 text-zinc-400">
            2
          </span>
          <span className="text-zinc-400">Assign plan</span>
        </div>
      </div>

      <form action={action} className="space-y-6">
        <div className="rounded-xl border border-zinc-200 bg-white shadow-sm divide-y divide-zinc-100">
          <div className="p-4 sm:p-5">
            <FormSection
              title="Profile photo"
              description="Optional. We generate a unique avatar from the name if you skip this."
            >
              <StudentAvatarPicker name={name} />
            </FormSection>
          </div>

          <div className="p-4 sm:p-5 space-y-5">
            <FormSection title="Student information">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-zinc-700 mb-1">
                    Full name
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
                    <p className="mt-1 text-xs text-rose-600">
                      {state.errors.name[0]}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">
                    Date of birth
                  </label>
                  <input
                    name="dateOfBirth"
                    type="date"
                    required
                    max={today}
                    className={inputClass}
                  />
                  {state?.errors?.dateOfBirth && (
                    <p className="mt-1 text-xs text-rose-600">
                      {state.errors.dateOfBirth[0]}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">
                    Admission date
                  </label>
                  <input
                    name="admissionDate"
                    type="date"
                    required
                    defaultValue={today}
                    className={inputClass}
                  />
                  {state?.errors?.admissionDate && (
                    <p className="mt-1 text-xs text-rose-600">
                      {state.errors.admissionDate[0]}
                    </p>
                  )}
                </div>
              </div>
            </FormSection>

            <FormSection title="Parent / guardian">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">
                    Name
                  </label>
                  <input name="parentName" required className={inputClass} />
                  {state?.errors?.parentName && (
                    <p className="mt-1 text-xs text-rose-600">
                      {state.errors.parentName[0]}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">
                    Mobile number
                  </label>
                  <input
                    name="contactNumber"
                    type="tel"
                    inputMode="numeric"
                    pattern="\d{10}"
                    maxLength={10}
                    required
                    className={inputClass}
                    placeholder="10 digits"
                  />
                  {state?.errors?.contactNumber && (
                    <p className="mt-1 text-xs text-rose-600">
                      {state.errors.contactNumber[0]}
                    </p>
                  )}
                </div>
              </div>
            </FormSection>

            <FormSection title="Notes" description="Optional">
              <textarea
                name="notes"
                rows={2}
                className={inputClass}
                placeholder="Medical info, siblings in academy, etc."
              />
            </FormSection>
          </div>
        </div>

        {state?.message && !state.success && (
          <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {state.message}
          </div>
        )}

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Link
            href="/students"
            className="inline-flex items-center justify-center rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            name="next"
            value="later"
            disabled={pending}
            className="inline-flex items-center justify-center rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 cursor-pointer transition-colors"
          >
            {pending ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-600" />
                Saving…
              </span>
            ) : (
              "Save student"
            )}
          </button>
          <button
            type="submit"
            name="next"
            value="assign-plan"
            disabled={pending}
            className="inline-flex items-center justify-center rounded-xl bg-brand-orange-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-orange-600 disabled:opacity-50 cursor-pointer transition-colors"
          >
            {pending ? "Saving…" : "Save & assign plan"}
          </button>
        </div>
      </form>
    </div>
  );
}
