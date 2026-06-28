"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useTheme } from "@/app/_components/theme-provider";
import { Sun, Moon, Monitor, LogOut, ChevronRight, User, Lock, X } from "lucide-react";

interface SettingsTabProps {
  student: any;
  siblings: any[];
  academyProfile: any;
  onLogout: () => void;
  onSwitchSibling: (siblingId: string) => void;
}

export default function SettingsTab({
  student,
  siblings,
  academyProfile,
  onLogout,
  onSwitchSibling,
}: SettingsTabProps) {
  const { theme, setTheme } = useTheme();
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [showConfirmLogout, setShowConfirmLogout] = useState(false);
  const [showSwitchModal, setShowSwitchModal] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const handleSwitch = async (siblingId: string) => {
    if (isSwitching) return;
    setIsSwitching(true);
    try {
      await onSwitchSibling(siblingId);
    } catch (err) {
      console.error(err);
      showToast("error", "Failed to switch profiles.");
      setIsSwitching(false);
    }
  };

  const themes = [
    {
      value: "system" as const,
      label: "System",
      icon: Monitor,
      description: "Matches device settings.",
    },
    {
      value: "dark" as const,
      label: "Dark",
      icon: Moon,
      description: "Contrast for late hours.",
    },
    {
      value: "light" as const,
      label: "Light",
      icon: Sun,
      description: "Clean for daytime.",
    },
  ];

  return (
    <div className="relative space-y-6 max-w-2xl mx-auto">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 rounded-2xl border px-4 py-3.5 text-xs font-semibold shadow-lg max-w-sm transition-all duration-300 animate-fade-in ${
            toast.type === "success"
              ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200/60 dark:border-emerald-900/30"
              : "bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border-rose-200/60 dark:border-rose-900/30"
          }`}
        >
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="hidden md:block">
        <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Settings</h1>
      </div>

      {/* Theme Settings Section */}
      <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200/60 dark:border-zinc-800/80 shadow-3xs">
        <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50 mb-3.5">
          Interface Theme
        </h3>
        <div className="grid grid-cols-3 gap-2.5">
          {themes.map((t) => {
            const Icon = t.icon;
            const isActive = theme === t.value;
            return (
              <button
                key={t.value}
                type="button"
                onClick={() => {
                  setTheme(t.value);
                  showToast("success", `${t.label} theme activated.`);
                }}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center cursor-pointer transition-all duration-200 min-h-[92px] ${
                  isActive
                    ? "border-brand-orange-500 bg-brand-orange-500/5 dark:bg-brand-orange-500/10 ring-1 ring-brand-orange-500"
                    : "border-zinc-200 dark:border-zinc-800/60 hover:bg-zinc-50 dark:hover:bg-zinc-800/40 hover:border-zinc-300 dark:hover:border-zinc-700"
                }`}
              >
                <div className={`p-2 rounded-lg mb-2 ${isActive ? "bg-brand-orange-500 text-white shadow-2xs" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400"}`}>
                  <Icon className="h-4.5 w-4.5" />
                </div>
                <span className="text-[11px] font-bold text-zinc-900 dark:text-zinc-100 leading-none">
                  {t.label}
                </span>
                <span className="mt-1 text-[8px] text-zinc-400 dark:text-zinc-500 leading-tight hidden xs:block">
                  {t.description}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Account Settings List Card */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200/60 dark:border-zinc-800/80 shadow-3xs overflow-hidden divide-y divide-zinc-100 dark:divide-zinc-800/60">
        {/* Sibling switcher item */}
        <button
          type="button"
          onClick={() => setShowSwitchModal(true)}
          className="w-full flex items-center justify-between px-5 py-4.5 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors text-left cursor-pointer group"
        >
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-xl bg-brand-orange-500/10 text-brand-orange-500">
              <User className="w-4.5 h-4.5" />
            </span>
            <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 group-hover:text-brand-orange-500 transition-colors">
              Switch Profile / Account
            </span>
          </div>
          <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:text-brand-orange-500 transition-colors" />
        </button>

        {/* Change password item */}
        <Link
          href="/portal/settings/change-password"
          className="w-full flex items-center justify-between px-5 py-4.5 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors text-left cursor-pointer group"
        >
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-xl bg-brand-orange-500/10 text-brand-orange-500">
              <Lock className="w-4.5 h-4.5" />
            </span>
            <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 group-hover:text-brand-orange-500 transition-colors">
              Change Password
            </span>
          </div>
          <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:text-brand-orange-500 transition-colors" />
        </Link>

        {/* Log out item */}
        <button
          type="button"
          onClick={() => setShowConfirmLogout(true)}
          className="w-full flex items-center justify-between px-5 py-4.5 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors text-left cursor-pointer group"
        >
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-xl bg-rose-500/10 text-rose-500">
              <LogOut className="w-4.5 h-4.5" />
            </span>
            <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 group-hover:text-rose-500 transition-colors">
              Log Out
            </span>
          </div>
          <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:text-rose-500 transition-colors" />
        </button>
      </div>

      {/* About TAG Section */}
      <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200/60 dark:border-zinc-800/80 shadow-3xs flex flex-col items-center text-center">
        <img
          src="/icons/logo.webp"
          alt="TAG Logo"
          className="h-16 w-16 rounded-full object-cover border border-zinc-200 dark:border-zinc-800 shadow-sm mb-3.5"
        />
        <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-55">
          Academy of Gymnastics
        </h3>
        <p className="text-[10px] text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mt-0.5 mb-4">
          TAG CRM
        </p>

        <div className="w-full text-xs space-y-2.5 text-left border-t border-zinc-100 dark:border-zinc-800/60 pt-4">
          <div className="flex justify-between items-center">
            <span className="text-zinc-450 dark:text-zinc-500 font-medium">Contact Phone 1</span>
            <a href={`tel:${academyProfile.phone}`} className="font-semibold text-zinc-800 dark:text-zinc-200 hover:text-brand-orange-500">
              {academyProfile.phone}
            </a>
          </div>
          {academyProfile.phone2 && (
            <div className="flex justify-between items-center">
              <span className="text-zinc-450 dark:text-zinc-500 font-medium">Contact Phone 2</span>
              <a href={`tel:${academyProfile.phone2}`} className="font-semibold text-zinc-800 dark:text-zinc-200 hover:text-brand-orange-500">
                {academyProfile.phone2}
              </a>
            </div>
          )}
          {academyProfile.email && (
            <div className="flex justify-between items-center">
              <span className="text-zinc-455 dark:text-zinc-500 font-medium">Email Address</span>
              <a href={`mailto:${academyProfile.email}`} className="font-semibold text-zinc-800 dark:text-zinc-200 hover:text-brand-orange-500">
                {academyProfile.email}
              </a>
            </div>
          )}
          {academyProfile.website && (
            <div className="flex justify-between items-center">
              <span className="text-zinc-455 dark:text-zinc-500 font-medium">Website</span>
              <a
                href={`https://${academyProfile.website}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-brand-orange-500 hover:underline"
              >
                {academyProfile.website}
              </a>
            </div>
          )}
          {academyProfile.address && (
            <div className="flex flex-col gap-1 pt-1.5 border-t border-zinc-50 dark:border-zinc-850/60">
              <span className="text-zinc-450 dark:text-zinc-500 font-medium">Academy Address</span>
              <span className="text-zinc-755 dark:text-zinc-300 leading-relaxed text-[11px] whitespace-pre-line">
                {academyProfile.address}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Sibling Switch Profile Modal */}
      {showSwitchModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => setShowSwitchModal(false)}
          />
          <div className="relative w-full max-w-sm rounded-[2rem] bg-white dark:bg-zinc-900 shadow-2xl p-6 animate-scale-in animate-duration-200">
            <button
              onClick={() => setShowSwitchModal(false)}
              className="absolute right-4 top-4 p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-50 mb-4">
              Switch Account
            </h3>

            <div className="space-y-2.5 mb-5 max-h-[40vh] overflow-y-auto pr-1">
              {siblings && siblings.length > 0 ? (
                siblings.map((sibling: any) => (
                  <button
                    key={sibling.id}
                    disabled={isSwitching}
                    onClick={() => handleSwitch(sibling.id)}
                    className="w-full flex items-center justify-between p-3 rounded-xl border border-zinc-150 dark:border-zinc-800 hover:border-brand-orange-500/30 bg-zinc-50/50 dark:bg-zinc-950/20 hover:bg-brand-orange-500/[0.02] dark:hover:bg-brand-orange-500/[0.01] transition-all text-left cursor-pointer group disabled:opacity-50"
                  >
                    <div className="flex items-center gap-3">
                      {sibling.avatarUrl ? (
                        <img
                          src={sibling.avatarUrl}
                          alt={sibling.name}
                          className="w-9 h-9 rounded-full object-cover border border-zinc-200 dark:border-zinc-850 shadow-3xs"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-brand-orange-500/10 text-brand-orange-500 flex items-center justify-center font-bold text-xs shrink-0 border border-brand-orange-500/10">
                          {sibling.name.charAt(0)}
                        </div>
                      )}
                      <div>
                        <h4 className="text-xs font-bold text-zinc-805 dark:text-zinc-200 group-hover:text-brand-orange-500 transition-colors">
                          {sibling.name}
                        </h4>
                        <span className="text-[9px] text-zinc-450 dark:text-zinc-500 font-semibold uppercase tracking-wider">
                          Roll: TAG{sibling.studentNumber}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:text-brand-orange-500 transition-colors" />
                  </button>
                ))
              ) : (
                <div className="text-center py-4 text-xs text-zinc-400 dark:text-zinc-500 font-medium">
                  No other linked sibling profiles found.
                </div>
              )}
            </div>

            <div className="border-t border-zinc-100 dark:border-zinc-800/60 pt-4">
              <Link
                href="/portal/login"
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 hover:border-brand-orange-500 hover:text-brand-orange-500 hover:bg-brand-orange-500/[0.02] transition-colors text-xs font-bold text-zinc-600 dark:text-zinc-450 cursor-pointer"
              >
                + Add Another Account
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Logout Confirmation Modal */}
      {showConfirmLogout && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity animate-fade-in"
            onClick={() => setShowConfirmLogout(false)}
          />
          <div className="relative w-full max-w-xs rounded-[2rem] bg-white dark:bg-zinc-900 shadow-2xl p-6 text-center animate-scale-in animate-duration-200">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-orange-500/10 text-brand-orange-500 mx-auto mb-4">
              <LogOut className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-50 mb-1.5">
              Confirm Log Out
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-6">
              Are you sure you want to sign out of the parent portal?
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setShowConfirmLogout(false)}
                className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 py-2.5 text-xs font-semibold text-zinc-655 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onLogout}
                className="rounded-xl bg-brand-orange-500 py-2.5 text-xs font-bold text-white hover:bg-brand-orange-600 transition-colors shadow-2xs cursor-pointer"
              >
                Log Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
