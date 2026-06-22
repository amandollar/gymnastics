"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { updateEnquiryAction } from "@/lib/actions/enquiries";
import type { EnquiryStatus } from "@prisma/client";
import EnquiryStatusBadge, { ENQUIRY_STATUS_STYLES } from "./EnquiryStatusBadge";

const inputClass =
  "w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-3.5 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-brand-orange-500/50 focus:border-brand-orange-500 transition-all duration-200";

function toDateInputValue(dateVal: Date | string | null | undefined): string {
  if (!dateVal) return "";
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export type EditEnquiryItem = {
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

interface EditEnquiryModalProps {
  isOpen: boolean;
  onClose: () => void;
  enquiry: EditEnquiryItem | null;
}

export default function EditEnquiryModal({
  isOpen,
  onClose,
  enquiry,
}: EditEnquiryModalProps) {
  const router = useRouter();

  useEffect(() => {
    if (!isOpen) {
      router.refresh();
    }
  }, [isOpen, router]);

  if (!isOpen || !enquiry) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="relative w-full max-w-2xl bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-800/80 overflow-hidden flex flex-col transition-colors">
        <ModalInnerForm
          enquiry={enquiry}
          onClose={onClose}
        />
      </div>
    </div>
  );
}

function ModalInnerForm({
  enquiry,
  onClose,
}: {
  enquiry: EditEnquiryItem;
  onClose: () => void;
}) {
  // Form states
  const [status, setStatus] = useState<EnquiryStatus>(enquiry.status);
  const [childName, setChildName] = useState(enquiry.childName);
  const [parentName, setParentName] = useState(enquiry.parentName);
  const [contactNumber, setContactNumber] = useState(enquiry.contactNumber);
  const [childAge, setChildAge] = useState(enquiry.childAge?.toString() || "");
  const [gender, setGender] = useState(enquiry.gender || "");
  const [source, setSource] = useState(enquiry.source || "");
  const [interestedIn, setInterestedIn] = useState(enquiry.interestedIn || "");
  const [followUpDate, setFollowUpDate] = useState(toDateInputValue(enquiry.followUpDate));
  const [notes, setNotes] = useState(enquiry.notes || "");

  const updateEnquiryWithId = updateEnquiryAction.bind(null, enquiry.id);
  const [state, action, pending] = useActionState(updateEnquiryWithId, null);

  // Close on success
  useEffect(() => {
    if (state?.success) {
      onClose();
    }
  }, [state, onClose]);

  // Compute dirtiness
  const isDirty =
    status !== enquiry.status ||
    childName !== enquiry.childName ||
    parentName !== enquiry.parentName ||
    contactNumber !== enquiry.contactNumber ||
    childAge !== (enquiry.childAge?.toString() || "") ||
    gender !== (enquiry.gender || "") ||
    source !== (enquiry.source || "") ||
    interestedIn !== (enquiry.interestedIn || "") ||
    followUpDate !== toDateInputValue(enquiry.followUpDate) ||
    notes !== (enquiry.notes || "");

  return (
    <form action={action} className="flex flex-col overflow-hidden">
      {/* Modal Header */}
      <div className="flex items-center justify-between px-6 pt-6 pb-2 shrink-0">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
            Edit Enquiry #{enquiry.enquiryNumber}
          </h2>
          <EnquiryStatusBadge status={status} />
        </div>
        <button
          type="button"
          onClick={onClose}
          className="h-8 w-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
        >
          <X className="h-5 w-5" strokeWidth={2} />
        </button>
      </div>

      {/* Modal Body */}
      <div className="px-6 py-3 overflow-y-auto max-h-[65vh] scrollbar-thin scrollbar-thumb-zinc-200 dark:scrollbar-thumb-zinc-850">
        <div className="grid gap-x-4 gap-y-5 grid-cols-1 sm:grid-cols-6">
          
          {/* Status field */}
          <div className="sm:col-span-6">
            <label className="block text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-1.5">
              Enquiry Status *
            </label>
            <input type="hidden" name="status" value={status} />
            <div className="flex flex-wrap gap-2 pt-0.5">
              {(Object.keys(ENQUIRY_STATUS_STYLES) as EnquiryStatus[]).map((statusKey) => {
                const isSelected = status === statusKey;
                const config = ENQUIRY_STATUS_STYLES[statusKey];
                
                let activeClass = "";
                let hoverClass = "";
                
                if (statusKey === "NEW") {
                  activeClass = "bg-blue-600 text-white border-blue-600 ring-2 ring-blue-500/20 dark:bg-blue-500 dark:border-blue-500";
                  hoverClass = "hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-950/20 dark:hover:text-blue-400 hover:border-blue-200 dark:hover:border-blue-800";
                } else if (statusKey === "CONTACTED") {
                  activeClass = "bg-amber-500 text-white border-amber-500 ring-2 ring-amber-500/20 dark:bg-amber-500 dark:border-amber-500";
                  hoverClass = "hover:bg-amber-50 hover:text-amber-600 dark:hover:bg-amber-950/20 dark:hover:text-amber-400 hover:border-amber-200 dark:hover:border-amber-800";
                } else if (statusKey === "FOLLOW_UP") {
                  activeClass = "bg-purple-600 text-white border-purple-600 ring-2 ring-purple-500/20 dark:bg-purple-500 dark:border-purple-500";
                  hoverClass = "hover:bg-purple-50 hover:text-purple-600 dark:hover:bg-purple-950/20 dark:hover:text-purple-400 hover:border-purple-200 dark:hover:border-purple-800";
                } else if (statusKey === "CONVERTED") {
                  activeClass = "bg-emerald-600 text-white border-emerald-600 ring-2 ring-emerald-500/20 dark:bg-emerald-500 dark:border-emerald-500";
                  hoverClass = "hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-950/20 dark:hover:text-emerald-400 hover:border-emerald-200 dark:hover:border-emerald-800";
                } else if (statusKey === "LOST") {
                  activeClass = "bg-zinc-600 text-white border-zinc-600 ring-2 ring-zinc-500/20 dark:bg-zinc-600 dark:border-zinc-600";
                  hoverClass = "hover:bg-zinc-50 hover:text-zinc-600 dark:hover:bg-zinc-800/50 dark:hover:text-zinc-400 hover:border-zinc-200 dark:hover:border-zinc-800";
                }

                return (
                  <button
                    key={statusKey}
                    type="button"
                    onClick={() => setStatus(statusKey)}
                    className={`px-4 py-2 rounded-full text-xs font-semibold border transition-all duration-200 cursor-pointer ${
                      isSelected
                        ? activeClass
                        : `bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-450 ${hoverClass}`
                    }`}
                  >
                    {config.label}
                  </button>
                );
              })}
            </div>
            {state?.errors?.status && (
              <p className="mt-1 text-xs text-rose-650">{state.errors.status[0]}</p>
            )}
          </div>

          {/* Child's Name */}
          <div className="sm:col-span-6">
            <label className="block text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-1.5">
              Child's name *
            </label>
            <input
              name="childName"
              required
              value={childName}
              onChange={(e) => setChildName(e.target.value)}
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
              value={parentName}
              onChange={(e) => setParentName(e.target.value)}
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
              value={contactNumber}
              onChange={(e) => setContactNumber(e.target.value)}
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
                value={childAge}
                onChange={(e) => setChildAge(e.target.value)}
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
              <select
                name="gender"
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className={inputClass}
              >
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
            <select
              name="source"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              className={inputClass}
            >
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
              value={interestedIn}
              onChange={(e) => setInterestedIn(e.target.value)}
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
              value={followUpDate}
              onChange={(e) => setFollowUpDate(e.target.value)}
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
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className={inputClass}
              placeholder="Provide details about their interest, conversation notes, etc."
            />
            {state?.errors?.notes && (
              <p className="mt-1 text-xs text-rose-650">{state.errors.notes[0]}</p>
            )}
          </div>
        </div>

        {state?.message && !state.success && (
          <div className="rounded-xl bg-rose-50 dark:bg-rose-950/20 p-4 text-sm text-rose-650 dark:text-rose-400 mt-4">
            {state.message}
          </div>
        )}
      </div>

      {/* Form Actions Footer */}
      <div className="flex items-center justify-end gap-2 px-6 pb-6 pt-3 bg-transparent shrink-0">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 text-sm font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-855 transition-colors cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!isDirty || pending}
          className="inline-flex items-center justify-center rounded-xl bg-brand-orange-500 hover:bg-brand-orange-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
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
    </form>
  );
}
