"use client";

import React, { useState, useActionState, useEffect } from "react";
import { updateAcademyProfileAction } from "@/lib/actions/academy";
import { Save } from "lucide-react";

import type { AcademyProfile } from "@prisma/client";

interface AcademyTabProps {
  initialProfile: AcademyProfile;
  isReadOnly?: boolean;
}

const inputClass =
  "w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-3 py-2 text-base md:text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-brand-orange-500/20 focus:border-brand-orange-500 transition-colors";

export default function AcademyTab({ initialProfile, isReadOnly = false }: AcademyTabProps) {
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const [phone, setPhone] = useState(initialProfile.phone || "");
  const [phone2, setPhone2] = useState(initialProfile.phone2 || "");
  const [email, setEmail] = useState(initialProfile.email || "");
  const [website, setWebsite] = useState(initialProfile.website || "");
  const [parentPortalUrl, setParentPortalUrl] = useState(
    initialProfile.parentPortalUrl || "",
  );
  const [address, setAddress] = useState(initialProfile.address || "");

  useEffect(() => {
    setPhone(initialProfile.phone || "");
    setPhone2(initialProfile.phone2 || "");
    setEmail(initialProfile.email || "");
    setWebsite(initialProfile.website || "");
    setParentPortalUrl(initialProfile.parentPortalUrl || "");
    setAddress(initialProfile.address || "");
  }, [initialProfile]);

  const hasChanges =
    phone !== (initialProfile.phone || "") ||
    phone2 !== (initialProfile.phone2 || "") ||
    email !== (initialProfile.email || "") ||
    website !== (initialProfile.website || "") ||
    parentPortalUrl !== (initialProfile.parentPortalUrl || "") ||
    address !== (initialProfile.address || "");

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const [state, formAction, isPending] = useActionState(
    async (state: any, formData: FormData) => {
      const result = await updateAcademyProfileAction(state, formData);
      if (result.success) {
        showToast("success", result.message || "Academy profile saved.");
      } else {
        showToast("error", result.message || "Failed to save profile.");
      }
      return result;
    },
    null,
  );

  return (
    <div className="relative">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 rounded-xl border px-4 py-3 text-sm shadow-lg max-w-sm ${
            toast.type === "success"
              ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/40"
              : "bg-rose-50 dark:bg-rose-955/30 text-rose-805 dark:text-rose-300 border-rose-200 dark:border-rose-900/40"
          }`}
        >
          {toast.message}
        </div>
      )}

      <div className="rounded-2xl border-0 bg-transparent p-0 shadow-none">
        {/* Header inside card */}
        <div className="mb-5">
          <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
            Academy Profile
          </h2>
        </div>
        <form action={formAction} className="space-y-6">
          {/* Logo & Academy Name (Non-editable) */}
          <div className="flex flex-col items-center justify-center gap-3 pt-4 pb-10 select-none pointer-events-none">
            <img
              src="/icons/logo.webp"
              alt="Academy Logo"
              className="h-32 w-32 rounded-full border border-zinc-200 dark:border-zinc-800 object-cover shrink-0 shadow-xs"
            />
            <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 text-center">
              The Academy of Gymnastics
            </h3>
          </div>

          <div className="grid lg:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-650 dark:text-zinc-400 mb-1.5">
                Contact Phone 1 *
              </label>
              <input
                type="text"
                name="phone"
                required
                disabled={isReadOnly}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. 9876543210"
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-650 dark:text-zinc-400 mb-1.5">
                Contact Phone 2 *
              </label>
              <input
                type="text"
                name="phone2"
                required
                disabled={isReadOnly}
                value={phone2}
                onChange={(e) => setPhone2(e.target.value)}
                placeholder="e.g. 9876543211"
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-650 dark:text-zinc-400 mb-1.5">
              Contact Email
            </label>
            <input
              type="email"
              name="email"
              disabled={isReadOnly}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. contact@tagacademy.com"
              className={inputClass}
            />
          </div>

          <div className="grid lg:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-650 dark:text-zinc-400 mb-1.5">
                Website URL
              </label>
              <input
                type="text"
                name="website"
                disabled={isReadOnly}
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="e.g. www.youracademy.com"
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-650 dark:text-zinc-400 mb-1.5">
                Parent Portal URL
              </label>
              <input
                type="text"
                name="parentPortalUrl"
                disabled={isReadOnly}
                value={parentPortalUrl}
                onChange={(e) => setParentPortalUrl(e.target.value)}
                placeholder="e.g. https://youracademy.com/parents"
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-650 dark:text-zinc-400 mb-1.5">
              Address *
            </label>
            <textarea
              name="address"
              required
              disabled={isReadOnly}
              rows={4}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Full academy address..."
              className={inputClass + " resize-none font-sans"}
            />
          </div>

          {!isReadOnly && (
            <div className="flex justify-end gap-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
              <button
                type="submit"
                disabled={isPending || !hasChanges}
                className="inline-flex items-center gap-2 rounded-xl bg-zinc-900 dark:bg-zinc-100 px-4 py-2.5 text-sm font-semibold text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors shadow-xs"
              >
                <Save className="h-4 w-4" />
                {isPending ? "Saving profile..." : "Save Profile"}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
