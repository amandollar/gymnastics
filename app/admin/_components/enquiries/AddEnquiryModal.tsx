"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { X, Check } from "lucide-react";
import { createEnquiryAction } from "@/lib/actions/enquiries";

const inputClass =
  "w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-3.5 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-brand-orange-500/50 focus:border-brand-orange-500 transition-all duration-200";

interface AddEnquiryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddEnquiryModal({ isOpen, onClose }: AddEnquiryModalProps) {
  const router = useRouter();
  const [resetKey, setResetKey] = useState(0);

  if (!isOpen) return null;

  const handleClose = () => {
    router.refresh();
    onClose();
  };

  const handleAddAnother = () => {
    setResetKey((prev) => prev + 1);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="relative w-full max-w-2xl bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-800/80 overflow-hidden flex flex-col transition-colors">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-2">
          <h2 className="text-lg font-bold text-zinc-955 dark:text-zinc-550">
            New Enquiry
          </h2>
          <button
            type="button"
            onClick={handleClose}
            className="h-8 w-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-zinc-650 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" strokeWidth={2} />
          </button>
        </div>

        {/* Modal Body with Reset Key */}
        <ModalInnerForm
          key={resetKey}
          onClose={handleClose}
          onAddAnother={handleAddAnother}
        />

      </div>
    </div>
  );
}

function ModalInnerForm({
  onClose,
  onAddAnother,
}: {
  onClose: () => void;
  onAddAnother: () => void;
}) {
  const [state, action, pending] = useActionState(createEnquiryAction, null);

  if (state?.success && state.enquiryNumber && !pending) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-6 text-center max-w-md mx-auto">
        {/* Success Checkmark Circle */}
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 ring-4 ring-emerald-100 dark:ring-emerald-900/20">
          <Check className="h-6 w-6" strokeWidth={2.5} />
        </div>

        <h3 className="mt-5 text-xl font-bold text-zinc-900 dark:text-zinc-550">
          Enquiry Registered
        </h3>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-450 leading-relaxed">
          Walk-in enquiry <span className="font-semibold text-zinc-800 dark:text-zinc-200">#{state.enquiryNumber}</span> has been saved successfully.
        </p>

        <div className="mt-8 flex flex-col gap-2.5 w-full sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center rounded-xl bg-brand-orange-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-orange-600 transition-colors w-full sm:w-auto cursor-pointer"
          >
            Done
          </button>
          <button
            type="button"
            onClick={onAddAnother}
            className="inline-flex items-center justify-center rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-5 py-2.5 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors w-full sm:w-auto cursor-pointer"
          >
            Add another
          </button>
        </div>
      </div>
    );
  }

  return (
    <form action={action} className="flex flex-col overflow-hidden">
      <div className="px-6 py-3 overflow-y-auto max-h-[65vh] scrollbar-thin scrollbar-thumb-zinc-200 dark:scrollbar-thumb-zinc-850">
        
        <div className="grid gap-x-4 gap-y-5 grid-cols-1 sm:grid-cols-6">
          {/* Child's Name */}
          <div className="sm:col-span-6">
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

          {/* Parent's Name */}
          <div className="sm:col-span-3">
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

          {/* Mobile Number */}
          <div className="sm:col-span-3">
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

          {/* Age & Gender (stays side-by-side even on the smallest mobile width) */}
          <div className="grid grid-cols-3 gap-4 col-span-1 sm:col-span-3">
            {/* Age */}
            <div className="col-span-1">
              <label className="block text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-1.5">
                Age
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

            {/* Gender */}
            <div className="col-span-2">
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

          {/* Source */}
          <div className="sm:col-span-3">
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

          {/* Interested Program */}
          <div className="sm:col-span-3">
            <label className="block text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-1.5">
              Interested program / plan
            </label>
            <input
              name="interestedIn"
              className={inputClass}
              placeholder="e.g. gymnastics, session pass"
            />
            {state?.errors?.interestedIn && (
              <p className="mt-1 text-xs text-rose-650">{state.errors.interestedIn[0]}</p>
            )}
          </div>

          {/* Next Follow-up Date */}
          <div className="sm:col-span-3">
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

          {/* Additional Notes */}
          <div className="sm:col-span-6">
            <label className="block text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-1.5">
              Additional notes / comments
            </label>
            <textarea
              name="notes"
              rows={2.5}
              className={inputClass}
              placeholder="Provide details about their interest, conversation notes, etc."
            />
            {state?.errors?.notes && (
              <p className="mt-1 text-xs text-rose-650">{state.errors.notes[0]}</p>
            )}
          </div>
        </div>

        {state?.message && !state.success && (
          <div className="rounded-xl bg-rose-50 dark:bg-rose-950/20 p-4 text-sm text-rose-650 dark:text-rose-400">
            {state.message}
          </div>
        )}
      </div>

      {/* Form Actions Footer */}
      <div className="flex items-center justify-end gap-2 px-6 pb-6 pt-3 bg-transparent shrink-0">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 text-sm font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-850 transition-colors cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center justify-center rounded-xl bg-brand-orange-500 hover:bg-brand-orange-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm disabled:opacity-50 cursor-pointer transition-colors"
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
    </form>
  );
}
