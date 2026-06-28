"use client";

import { useActionState, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { createStudentAction } from "@/lib/actions/students";
import { toDateInputValue } from "@/lib/utils/student";
import StudentAvatarPicker from "./StudentAvatarPicker";
import AdmissionSuccessModal from "./AdmissionSuccessModal";
import DateOfBirthField from "./DateOfBirthField";
import SimpleDateInput from "./SimpleDateInput";
import { STUDENT_LEVELS } from "@/lib/utils/level";

const inputClass =
  "w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-3.5 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-brand-orange-500/50 focus:border-brand-orange-500 transition-all duration-200";

function FormSection({
  title,
  description,
  children,
}: {
  title?: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3.5">
      {title && (
        <div>
          <h2 className="text-[11px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">{title}</h2>
          {description && (
            <p className="mt-0.5 text-xs text-zinc-400 dark:text-zinc-550">{description}</p>
          )}
        </div>
      )}
      {children}
    </section>
  );
}

export default function AddStudentForm() {
  const today = toDateInputValue(new Date());
  const searchParams = useSearchParams();
  const defaultChildName = searchParams.get("childName") || "";
  const defaultParentName = searchParams.get("parentName") || "";
  const defaultContactNumber = searchParams.get("contactNumber") || "";
  const defaultGender = searchParams.get("gender") || "";
  const defaultChildAge = searchParams.get("childAge") || "";

  let defaultDob = "";
  if (defaultChildAge) {
    const ageNum = Number(defaultChildAge);
    if (!isNaN(ageNum) && ageNum > 0) {
      const birthYear = new Date().getFullYear() - ageNum;
      defaultDob = `${birthYear}-06-01`;
    }
  }

  const [name, setName] = useState(defaultChildName);
  const [gender, setGender] = useState(defaultGender);
  const [state, action, pending] = useActionState(createStudentAction, null);

  const showSuccessModal = !!(
    state?.success &&
    state.studentId &&
    state.studentName &&
    state.studentNumber != null &&
    !pending
  );

  return (
    <div className="space-y-6">
      {/* Header Section (aligned left, max-width matches dashboard max-w-7xl, no subtitle) */}
      <div className="flex flex-col gap-1.5 pt-1 pb-3">
        <h1 className="text-3xl sm:text-5xl font-light tracking-tight text-zinc-955 dark:text-zinc-50">
          New Admission
        </h1>
      </div>

      <form action={action} className="space-y-6 max-w-3xl mx-auto">
        <div className="rounded-3xl border-0 bg-white dark:bg-zinc-900 p-6 shadow-xs space-y-8 transition-colors">
          {/* Section 1: Student information */}
          <div>
            <FormSection title="Student information">
              {/* Profile image centered below the title */}
              <div className="flex flex-col items-center justify-center pt-2 pb-4">
                <StudentAvatarPicker gender={gender} />
              </div>

              <div className="grid gap-x-4 gap-y-7 sm:grid-cols-2">
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
                    <p className="mt-1 text-xs text-rose-600">
                      {state.errors.name[0]}
                    </p>
                  )}
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-1.5">
                    Date of birth *
                  </label>
                  <DateOfBirthField
                    maxDate={today}
                    defaultValue={defaultDob}
                    selectClassName={inputClass}
                    error={state?.errors?.dateOfBirth?.[0]}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-2.5">
                    Gender *
                  </label>
                  <input type="hidden" name="gender" value={gender} required />
                  <div className="flex gap-2.5">
                    {["Male", "Female", "Other"].map((g) => {
                      const isSelected = gender === g;
                      return (
                        <button
                          key={g}
                          type="button"
                          onClick={() => setGender(g)}
                          className={`flex-1 rounded-full border px-4 py-2 text-sm font-semibold text-center transition-all duration-200 cursor-pointer ${
                            isSelected
                              ? "bg-brand-orange-500 border-brand-orange-500 text-white shadow-xs shadow-brand-orange-500/10"
                              : "bg-zinc-50 dark:bg-zinc-950/60 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900/40"
                          }`}
                        >
                          {g}
                        </button>
                      );
                    })}
                  </div>
                  {state?.errors?.gender && (
                    <p className="mt-1 text-xs text-rose-600">{state.errors.gender[0]}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-1.5">
                    Admission date *
                  </label>
                  <SimpleDateInput
                    name="admissionDate"
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

                <div>
                  <label className="block text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-1.5">
                    Student Level *
                  </label>
                  <select
                    name="level"
                    required
                    className={inputClass}
                    defaultValue="BEGINNER"
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
            </FormSection>
          </div>

          {/* Section 3: Parent / guardian */}
          <div>
            <FormSection title="Parent / guardian & Admission Fees">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-1.5">
                    Parent&apos;s name *
                  </label>
                  <input name="parentName" required defaultValue={defaultParentName} className={inputClass} placeholder="e.g. Vijay Sharma" />
                  {state?.errors?.parentName && (
                    <p className="mt-1 text-xs text-rose-600">
                      {state.errors.parentName[0]}
                    </p>
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
                    defaultValue={defaultContactNumber}
                    className={inputClass}
                    placeholder="10 digit mobile"
                  />
                  {state?.errors?.contactNumber && (
                    <p className="mt-1 text-xs text-rose-600">{state.errors.contactNumber[0]}</p>
                  )}
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-1.5">
                    Registration Fee (₹)
                  </label>
                  <input
                    name="registrationFee"
                    type="number"
                    min={0}
                    className={inputClass}
                    placeholder="e.g. 1000 (leave blank or 0 if none)"
                  />
                  {state?.errors?.registrationFee && (
                    <p className="mt-1 text-xs text-rose-600">{state.errors.registrationFee[0]}</p>
                  )}
                </div>
              </div>
            </FormSection>
          </div>

          {/* Medical history */}
          <div>
            <FormSection title="Medical history">
              <textarea
                name="medicalHistory"
                rows={2}
                className={inputClass}
                placeholder="e.g. Allergies, medical conditions…"
              />
              {state?.errors?.medicalHistory && (
                <p className="mt-1 text-xs text-rose-600">{state.errors.medicalHistory[0]}</p>
              )}
            </FormSection>
          </div>

          {/* Training Focus */}
          <div>
            <FormSection title="Training Focus">
              <textarea
                name="trainingFocus"
                rows={2}
                className={inputClass}
                placeholder="e.g. Strength training, flexibility, techniques…"
              />
              {state?.errors?.trainingFocus && (
                <p className="mt-1 text-xs text-rose-600">{state.errors.trainingFocus[0]}</p>
              )}
            </FormSection>
          </div>

          {/* Notes */}
          <div>
            <FormSection title="Notes">
              <textarea
                name="notes"
                rows={2}
                className={inputClass}
                placeholder="e.g. Any general notes…"
              />
              {state?.errors?.notes && (
                <p className="mt-1 text-xs text-rose-600">{state.errors.notes[0]}</p>
              )}
            </FormSection>
          </div>
        </div>

        {state?.message && !state.success && (
          <div className="rounded-2xl border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-955/20 px-4 py-3 text-sm text-rose-700 dark:text-rose-400">
            {state.message}
          </div>
        )}

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Link
            href="/admin/students"
            className="inline-flex items-center justify-center rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4.5 py-2.5 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-850 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={pending}
            className="inline-flex items-center justify-center rounded-full bg-brand-orange-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-orange-600 disabled:opacity-50 cursor-pointer transition-colors"
          >
            {pending ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-100" />
                Saving Admission…
              </span>
            ) : (
              "Take Admission"
            )}
          </button>
        </div>
      </form>

      <AdmissionSuccessModal
        isOpen={showSuccessModal}
        studentId={state?.studentId || ""}
        studentName={state?.studentName || ""}
        studentNumber={state?.studentNumber || 0}
        avatarUrl={state?.avatarUrl}
        gender={state?.gender}
        registrationFee={state?.registrationFee || undefined}
      />
    </div>
  );
}
