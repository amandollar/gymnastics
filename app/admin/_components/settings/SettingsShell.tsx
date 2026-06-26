
"use client";

import React from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Building, Users, Calendar, Clock, CreditCard, Download, Palette, LogOut, ChevronRight, ChevronLeft, MessageSquare } from "lucide-react";
import AcademyTab from "./tabs/AcademyTab";
import AccessTab from "./tabs/AccessTab";
import BatchesTab from "./tabs/BatchesTab";
import GracePeriodsTab from "./tabs/GracePeriodsTab";
import FeeStructureTab from "./tabs/FeeStructureTab";
import ExportTab from "./tabs/ExportTab";
import AppearanceTab from "./tabs/AppearanceTab";
import MessagesTab from "./tabs/MessagesTab";
import type { BatchWithCount } from "@/lib/services/batches";
import type { GracePeriodMap } from "@/lib/plan/grace-period-utils";
import type { PricingMaps } from "@/lib/services/pricing";

interface User {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "STAFF";
  createdAt: Date;
}

import type { AcademyProfile } from "@prisma/client";

interface SettingsShellProps {
  initialUsers: User[];
  currentUserId: string;
  initialBatches: BatchWithCount[];
  initialGracePeriodMap: GracePeriodMap;
  initialPricingMaps: PricingMaps;
  initialProfile: AcademyProfile;
  userRole: string;
  signOutAction: () => Promise<void>;
  students: any[];
  employees: { id: string; name: string; email: string | null; role: "COACH" | "STAFF" }[];
}

export default function SettingsShell({
  initialUsers,
  currentUserId,
  initialBatches,
  initialGracePeriodMap,
  initialPricingMaps,
  initialProfile,
  userRole,
  signOutAction,
  students,
  employees,
}: SettingsShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const [clientActiveTab, setClientActiveTab] = React.useState<string | null>(
    searchParams.get("tab")
  );
  const [showLogoutConfirm, setShowLogoutConfirm] = React.useState(false);

  React.useEffect(() => {
    setClientActiveTab(searchParams.get("tab"));
  }, [searchParams]);

  const effectiveTab = clientActiveTab || "academy";

  const tabs = [
    {
      id: "academy",
      label: "Academy",
      icon: Building,
    },
    {
      id: "users",
      label: "Access Controls",
      icon: Users,
    },
    {
      id: "batches",
      label: "Batches",
      icon: Calendar,
    },
    {
      id: "grace-periods",
      label: "Grace Periods",
      icon: Clock,
    },
    {
      id: "fee-structure",
      label: "Fee Structure",
      icon: CreditCard,
    },
    {
      id: "export",
      label: "Data Export",
      icon: Download,
    },
    {
      id: "appearance",
      label: "Appearance",
      icon: Palette,
    },
    {
      id: "msg-templates",
      label: "Msg templates",
      icon: MessageSquare,
    },
  ];

  const handleTabChange = (tabId: string) => {
    setClientActiveTab(tabId);
    const params = new URLSearchParams(window.location.search);
    params.set("tab", tabId);
    window.history.pushState(null, "", `${window.location.pathname}?${params.toString()}`);
  };

  const renderActiveTabContent = () => {
    switch (effectiveTab) {
      case "academy":
        return <AcademyTab initialProfile={initialProfile} />;
      case "users":
        return <AccessTab initialUsers={initialUsers} currentUserId={currentUserId} coaches={employees} />;
      case "batches":
        return <BatchesTab initialBatches={initialBatches} students={students} />;
      case "grace-periods":
        return <GracePeriodsTab initialGracePeriodMap={initialGracePeriodMap} />;
      case "fee-structure":
        return <FeeStructureTab initialPricingMaps={initialPricingMaps} />;
      case "export":
        return <ExportTab />;
      case "appearance":
        return <AppearanceTab />;
      case "msg-templates":
        return <MessagesTab initialProfile={initialProfile} />;
      default:
        return <AcademyTab initialProfile={initialProfile} />;
    }
  };

  return (
    <div className="mx-auto max-w-7xl relative min-w-0 w-full px-2 sm:px-0">
      <div className="flex flex-col md:flex-row gap-6 items-stretch">
        {/* Desktop Sidebar Settings Navigation (visible on md and up) */}
        <aside className="hidden md:flex flex-col md:w-40 lg:w-48 shrink-0 border-0 gap-5 md:sticky md:top-8 md:h-[calc(100vh-7rem)] overflow-y-auto self-start pb-2">
          <div>
            <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">Settings</h1>
          </div>
          <div className="flex flex-col gap-0.5">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = effectiveTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleTabChange(tab.id)}
                  className={`w-full flex items-center gap-2.5 px-3 md:px-2 lg:px-3 py-2.5 text-sm font-medium rounded-lg transition-all cursor-pointer text-left ${
                    isActive
                      ? "bg-brand-orange-50 dark:bg-brand-orange-950/30 text-brand-orange-600 dark:text-brand-orange-400 font-semibold"
                      : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50/60 dark:hover:bg-zinc-900/30 hover:text-zinc-900 dark:hover:text-zinc-50"
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0 transition-all hidden lg:block" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Spacer to push logout to the bottom */}
          <div className="flex-1" />

          {/* User Logout Button */}
          <div>
            <button
              type="button"
              onClick={() => setShowLogoutConfirm(true)}
              className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-medium rounded-lg text-red-650 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all cursor-pointer border-0"
              title="Sign out"
            >
              <LogOut className="h-4 w-4 shrink-0" strokeWidth={2} />
              <span>Logout</span>
            </button>
          </div>
        </aside>

        {/* Mobile Sidebar/Menu Page (visible below md when no activeTab is selected) */}
        {!clientActiveTab && (
          <aside className="flex md:hidden flex-col w-full shrink-0 gap-6 min-h-[calc(100vh-140px)] py-4">
            <div className="flex items-center justify-between gap-3 w-full">
              <h1 className="text-3xl font-light tracking-tight text-zinc-900 dark:text-zinc-50">Settings</h1>
              <span className="inline-flex items-center rounded-full bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 text-[10px] font-semibold text-amber-800 dark:text-amber-300 ring-1 ring-amber-200/80 dark:ring-amber-900/30 uppercase tracking-wider shrink-0">
                {userRole === "SUPER" || userRole === "SUPER_ADMIN" ? "Admin" : userRole}
              </span>
            </div>

            {/* Options List Card */}
            <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-150 dark:border-zinc-850/80 shadow-xs overflow-hidden p-6 divide-y divide-zinc-100 dark:divide-zinc-800/80">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => handleTabChange(tab.id)}
                    className="w-full flex items-center justify-between py-3.5 text-base font-medium text-zinc-900 dark:text-zinc-100 hover:bg-zinc-50/30 dark:hover:bg-zinc-900/10 transition-all cursor-pointer text-left border-0"
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="h-5 w-5 text-zinc-500 dark:text-zinc-400" />
                      <span>{tab.label}</span>
                    </div>
                    <ChevronRight className="h-4.5 w-4.5 text-zinc-400 dark:text-zinc-600" />
                  </button>
                );
              })}
            </div>

            {/* Spacer */}
            <div className="flex-1" />

            {/* User Logout Button at the bottom */}
            <div className="mt-8">
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(true)}
                className="w-full flex items-center justify-center gap-2 px-3 py-3 text-base font-semibold rounded-xl text-red-650 hover:text-red-700 bg-transparent hover:bg-red-50 dark:hover:bg-red-950/30 transition-all border-0 cursor-pointer"
                title="Sign out"
              >
                <LogOut className="h-5 w-5 shrink-0" strokeWidth={2} />
                <span>Logout</span>
              </button>
            </div>
          </aside>
        )}

        {/* Right Section: Content Area */}
        <main className={`flex-1 w-full min-w-0 md:bg-white md:dark:bg-zinc-950 md:rounded-[28px] p-0 md:p-8 md:shadow-xs md:border-0 min-h-[580px] ${
          clientActiveTab ? "block" : "hidden md:block"
        }`}>
          {/* Back Button on Mobile */}
          {clientActiveTab && (
            <div className="md:hidden mb-6">
              <button
                type="button"
                onClick={() => {
                  setClientActiveTab(null);
                  const params = new URLSearchParams(window.location.search);
                  params.delete("tab");
                  window.history.pushState(null, "", `${window.location.pathname}?${params.toString()}`);
                }}
                className="flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 font-semibold text-sm py-1 cursor-pointer"
              >
                <ChevronLeft className="h-4 w-4" />
                <span>Back to Settings</span>
              </button>
            </div>
          )}
          
          <div className="w-full">
            {renderActiveTabContent()}
          </div>
        </main>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          {/* Backdrop click close */}
          <div className="absolute inset-0" onClick={() => setShowLogoutConfirm(false)} />
          
          <div className="relative bg-white dark:bg-zinc-900 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl border border-zinc-150 dark:border-zinc-850/80 p-6 flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-full bg-red-50 dark:bg-red-950/20 flex items-center justify-center text-red-650 dark:text-red-400 mb-4">
              <LogOut className="w-6 h-6" />
            </div>
            
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 mb-2">
              Log out of your account?
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-6">
              You will need to sign in again to access settings and manage the academy.
            </p>
            
            <div className="flex items-center gap-3 w-full">
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition-all cursor-pointer text-center"
              >
                Cancel
              </button>
              <form action={signOutAction} className="flex-1">
                <button
                  type="submit"
                  className="w-full px-4 py-2.5 rounded-xl text-sm font-semibold bg-red-600 hover:bg-red-750 text-white transition-all cursor-pointer text-center"
                >
                  Logout
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
