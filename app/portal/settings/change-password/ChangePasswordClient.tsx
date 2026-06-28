"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lock, RefreshCw, Eye, EyeOff } from "lucide-react";
import { changePortalPasswordAction } from "@/lib/actions/students";

interface ChangePasswordClientProps {
  student: any;
}

export default function ChangePasswordClient({ student }: ChangePasswordClientProps) {
  const router = useRouter();

  // Password States
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Visibility States
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Subdomain States
  const [isSubdomain, setIsSubdomain] = useState(false);
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const host = window.location.hostname;
      if (host === "portal.localhost" || host.startsWith("portal.")) {
        setIsSubdomain(true);
      }
    }
  }, []);

  const backUrl = isSubdomain ? "/settings" : "/portal/settings";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await changePortalPasswordAction(
        student.id,
        student.isTempPassword ? undefined : currentPassword,
        newPassword
      );
      if (res.success) {
        setSuccess(true);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        // Redirect back to settings page after short delay
        setTimeout(() => {
          router.push(backUrl);
        }, 1500);
      } else {
        setError(res.message || "Failed to update password.");
      }
    } catch (err) {
      console.error(err);
      setError("An error occurred while changing password.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen min-h-[100dvh] w-full bg-[var(--background)] dark:bg-zinc-950 flex flex-col items-center justify-center p-4 sm:p-6 md:p-8 font-sans transition-colors duration-200">
      <div className="w-full max-w-sm space-y-5 animate-fade-in">
        {/* Page Header */}
        <div className="flex flex-col gap-1">
          {!student.isTempPassword && (
            <Link
              href={backUrl}
              className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 hover:text-brand-orange-500 transition-colors cursor-pointer w-fit"
            >
              Back to Settings
            </Link>
          )}
          <h1 className="text-xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight">
            {student.isTempPassword ? "Reset Password Required" : "Change Password"}
          </h1>
        </div>

        {student.isTempPassword && (
          <div className="p-3.5 text-xs font-semibold text-center text-amber-800 dark:text-amber-300 bg-amber-500/10 border border-amber-500/20 rounded-2xl leading-relaxed">
            Please update your temporary password to access your dashboard.
          </div>
        )}

        {/* Main Form Card */}
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-[2rem] border border-zinc-200/60 dark:border-zinc-800/80 shadow-3xs">
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Hidden Username input for browser auto-saving correct User ID */}
            <input
              type="text"
              name="username"
              value={`TAG${student.studentNumber}`}
              readOnly
              className="hidden"
              autoComplete="username"
            />

            {/* Status Messages */}
            {error && (
              <div className="p-3 text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 rounded-xl">
                {error}
              </div>
            )}

            {success && (
              <div className="p-3 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 rounded-xl">
                Password updated successfully! Redirecting...
              </div>
            )}

            {!student.isTempPassword && (
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-zinc-450 dark:text-zinc-500 uppercase tracking-widest pl-1 block">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    type={showCurrent ? "text" : "password"}
                    name="current-password"
                    autoComplete="current-password"
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    className="w-full bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-200 dark:border-zinc-800 rounded-xl pl-3.5 pr-10 py-2.5 text-xs text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-650 focus:border-brand-orange-500 focus:outline-none transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrent(!showCurrent)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors p-1 cursor-pointer"
                  >
                    {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[9px] font-bold text-zinc-450 dark:text-zinc-500 uppercase tracking-widest pl-1 block">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showNew ? "text" : "password"}
                  name="new-password"
                  autoComplete="new-password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min. 6 characters"
                  className="w-full bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-200 dark:border-zinc-800 rounded-xl pl-3.5 pr-10 py-2.5 text-xs text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-650 focus:border-brand-orange-500 focus:outline-none transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors p-1 cursor-pointer"
                >
                  {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-bold text-zinc-450 dark:text-zinc-500 uppercase tracking-widest pl-1 block">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  type={showConfirm ? "text" : "password"}
                  name="confirm-password"
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                  className="w-full bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-200 dark:border-zinc-800 rounded-xl pl-3.5 pr-10 py-2.5 text-xs text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-650 focus:border-brand-orange-500 focus:outline-none transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors p-1 cursor-pointer"
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || success}
              className="w-full mt-2 flex items-center justify-center gap-2 py-3 rounded-xl bg-brand-orange-500 hover:bg-brand-orange-600 disabled:bg-brand-orange-500/40 text-white font-bold text-xs transition-colors shadow-2xs cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5" />
                  Change Password
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
