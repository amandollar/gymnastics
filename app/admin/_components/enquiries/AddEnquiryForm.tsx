"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { createEnquiryAction } from "@/lib/actions/enquiries";

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
        <h2 className="text-[11px] font-bold text-zinc-400 dark:text-zinc-550 uppercase tracking-wider">
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

export default function AddEnquiryForm() {
  const [state, action, pending] = useActionState(createEnquiryAction, null);

  if (state?.success && state.enquiryNumber && !pending) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center max-w-md mx-auto">
        {/* Success Checkmark Circle */}
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 ring-4 ring-emerald-100 dark:ring-emerald-900/20">
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>

        <h2 className="mt-5 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Enquiry Registered
        </h2>
        <p className="mt-2.5 text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
          Walk-in enquiry <span className="font-semibold text-zinc-800 dark:text-zinc-200">#{state.enquiryNumber}</span> has been saved successfully.
        </p>

        <div className="mt-8 flex flex-col gap-2 w-full sm:flex-row sm:justify-center">
          <Link
            href="/enquiries"
            className="inline-flex items-center justify-center rounded-xl bg-brand-orange-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-orange-600 transition-colors w-full sm:w-auto"
          >
            Go to Enquiries
          </Link>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center justify-center rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-5 py-2.5 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors w-full sm:w-auto"
          >
            Add another
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col gap-1.5 pt-1 pb-3">
        <Link
          href="/enquiries"
          className="text-xs sm:text-sm text-zinc-500 hover:text-zinc-850 dark:hover:text-zinc-300 transition-colors inline-flex items-center gap-1 font-medium"
        >
          ← Back to enquiries
        </Link>
        <h1 className="text-3xl sm:text-5xl font-light tracking-tight text-zinc-950 dark:text-zinc-50">
          New Enquiry
        </h1>
      </div>

      <form action={action} className="space-y-6 max-w-3xl mx-auto">
        <div className="rounded-3xl border-0 bg-white dark:bg-zinc-900 p-6 shadow-sm space-y-6 transition-colors">
          
          {/* Section 1: Child information */}
          <div>
            <FormSection title="Child information">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-1.5">
                    Child's name *
                  </label>
                  <input
                    name="childName"
                    required
                    className={inputClass}
                    placeholder="e.g. Rahul Sharma"
                  />
                  {state?.errors?.childName && (
                    <p className="mt-1 text-xs text-rose-650">{state.errors.childName[0]}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-1.5">
                    Approximate Age
                  </label>
                  <input
                    name="childAge"
                    type="number"
                    min="1"
                    max="25"
                    className={inputClass}
                    placeholder="e.g. 8"
                  />
                  {state?.errors?.childAge && (
                    <p className="mt-1 text-xs text-rose-650">{state.errors.childAge[0]}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-1.5">
                    Gender
                  </label>
                  <select name="gender" className={inputClass}>
                    <option value="">Select gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                  {state?.errors?.gender && (
                    <p className="mt-1 text-xs text-rose-650">{state.errors.gender[0]}</p>
                  )}
                </div>
              </div>
            </FormSection>
          </div>

          {/* Section 2: Parent / guardian */}
          <div className="border-t border-zinc-100 dark:border-zinc-800/85 pt-6">
            <FormSection title="Parent / guardian">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-1.5">
                    Parent's name *
                  </label>
                  <input
                    name="parentName"
                    required
                    className={inputClass}
                    placeholder="e.g. Ajay Sharma"
                  />
                  {state?.errors?.parentName && (
                    <p className="mt-1 text-xs text-rose-650">{state.errors.parentName[0]}</p>
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
                    title="Please enter a 10-digit mobile number"
                    className={inputClass}
                    placeholder="10 digit mobile number"
                  />
                  {state?.errors?.contactNumber && (
                    <p className="mt-1 text-xs text-rose-650">{state.errors.contactNumber[0]}</p>
                  )}
                </div>
              </div>
            </FormSection>
          </div>

          {/* Section 3: Enquiry details */}
          <div className="border-t border-zinc-100 dark:border-zinc-800/85 pt-6">
            <FormSection title="Enquiry details">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-1.5">
                    Source
                  </label>
                  <select name="source" className={inputClass}>
                    <option value="">Select source</option>
                    <option value="WALK_IN">Walk-in</option>
                    <option value="REFERRAL">Referral</option>
                    <option value="SOCIAL_MEDIA">Social Media</option>
                    <option value="OTHER">Other</option>
                  </select>
                  {state?.errors?.source && (
                    <p className="mt-1 text-xs text-rose-650">{state.errors.source[0]}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-1.5">
                    Interested program / plan
                  </label>
                  <input
                    name="interestedIn"
                    className={inputClass}
                    placeholder="e.g. 10 session pass, gymnastics"
                  />
                  {state?.errors?.interestedIn && (
                    <p className="mt-1 text-xs text-rose-650">{state.errors.interestedIn[0]}</p>
                  )}
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-1.5">
                    Next follow-up date
                  </label>
                  <input
                    type="date"
                    name="followUpDate"
                    className={`${inputClass} [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-60 hover:[&::-webkit-calendar-picker-indicator]:opacity-100 dark:[&::-webkit-calendar-picker-indicator]:invert`}
                  />
                  {state?.errors?.followUpDate && (
                    <p className="mt-1 text-xs text-rose-650">{state.errors.followUpDate[0]}</p>
                  )}
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-1.5">
                    Additional notes / comments
                  </label>
                  <textarea
                    name="notes"
                    rows={3}
                    className={inputClass}
                    placeholder="Provide details about their interest, conversation notes, etc."
                  />
                  {state?.errors?.notes && (
                    <p className="mt-1 text-xs text-rose-650">{state.errors.notes[0]}</p>
                  )}
                </div>
              </div>
            </FormSection>
          </div>

          {state?.message && !state.success && (
            <div className="rounded-xl bg-rose-50 dark:bg-rose-950/20 p-4 text-sm text-rose-650 dark:text-rose-400">
              {state.message}
            </div>
          )}

          {/* Form Actions */}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end border-t border-zinc-100 dark:border-zinc-800/85 pt-6">
            <Link
              href="/enquiries"
              className="inline-flex items-center justify-center rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-5 py-2.5 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-850 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={pending}
              className="inline-flex items-center justify-center rounded-xl bg-brand-orange-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-orange-600 disabled:opacity-50 cursor-pointer transition-colors"
            >
              {pending ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-650" />
                  Saving…
                </span>
              ) : (
                "Save enquiry"
              )}
            </button>
          </div>

        </div>
      </form>
    </div>
  );
}
