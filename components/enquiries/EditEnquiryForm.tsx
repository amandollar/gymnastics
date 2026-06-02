"use client";

import { useActionState } from "react";
import Link from "next/link";
import { updateEnquiryAction } from "@/lib/actions/enquiries";
import type { EnquiryStatus } from "@prisma/client";

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

function toDateInputValue(dateVal: Date | string | null | undefined): string {
  if (!dateVal) return "";
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export type EditEnquiryProps = {
  enquiry: {
    id: string;
    enquiryNumber: number;
    childName: string;
    childAge: number | null;
    gender: string | null;
    parentName: string;
    contactNumber: string;
    source: string | null;
    interestedIn: string | null;
    status: EnquiryStatus;
    notes: string | null;
    followUpDate: Date | string | null;
  };
};

export default function EditEnquiryForm({ enquiry }: EditEnquiryProps) {
  const updateEnquiryWithId = updateEnquiryAction.bind(null, enquiry.id);
  const [state, action, pending] = useActionState(updateEnquiryWithId, null);

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
        <h1 className="text-3xl sm:text-5xl font-light tracking-tight text-zinc-955 dark:text-zinc-50">
          Edit Enquiry #{enquiry.enquiryNumber}
        </h1>
      </div>

      <form action={action} className="space-y-6 max-w-3xl mx-auto">
        <div className="rounded-3xl border-0 bg-white dark:bg-zinc-900 p-6 shadow-sm space-y-6 transition-colors">
          
          {/* Status field - prominent at top of edit form */}
          <div>
            <label className="block text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-1.5">
              Enquiry Status *
            </label>
            <select
              name="status"
              required
              defaultValue={enquiry.status}
              className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-brand-orange-50/20 dark:bg-brand-orange-950/10 px-3.5 py-2.5 text-sm font-medium text-brand-orange-600 dark:text-brand-orange-400 focus:outline-none focus:ring-1 focus:ring-brand-orange-500/50 focus:border-brand-orange-500 transition-all duration-200"
            >
              <option value="NEW">New</option>
              <option value="CONTACTED">Contacted</option>
              <option value="FOLLOW_UP">Follow-up</option>
              <option value="CONVERTED">Converted</option>
              <option value="LOST">Lost</option>
            </select>
            {state?.errors?.status && (
              <p className="mt-1 text-xs text-rose-650">{state.errors.status[0]}</p>
            )}
          </div>

          {/* Section 1: Child information */}
          <div className="border-t border-zinc-100 dark:border-zinc-800/85 pt-6">
            <FormSection title="Child information">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-1.5">
                    Child's name *
                  </label>
                  <input
                    name="childName"
                    required
                    defaultValue={enquiry.childName}
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
                    defaultValue={enquiry.childAge ?? ""}
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
                  <select name="gender" defaultValue={enquiry.gender ?? ""} className={inputClass}>
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
                    defaultValue={enquiry.parentName}
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
                    defaultValue={enquiry.contactNumber}
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
                  <select name="source" defaultValue={enquiry.source ?? ""} className={inputClass}>
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
                    defaultValue={enquiry.interestedIn ?? ""}
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
                    defaultValue={toDateInputValue(enquiry.followUpDate)}
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
                    defaultValue={enquiry.notes ?? ""}
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
                "Save changes"
              )}
            </button>
          </div>

        </div>
      </form>
    </div>
  );
}
