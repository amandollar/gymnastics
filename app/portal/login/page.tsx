"use client";

import React, { useActionState } from "react";
import { authenticatePortal } from "@/lib/actions/auth";
import { AlertTriangle, KeyRound, User } from "lucide-react";

export default function PortalLoginPage() {
  const [errorMessage, formAction, isPending] = useActionState(
    authenticatePortal,
    undefined
  );

  return (
    <div className="relative flex min-h-screen min-h-[100dvh] w-full flex-col lg:flex-row font-sans antialiased bg-zinc-50 dark:bg-zinc-950 overflow-hidden transition-colors duration-200">
      {/* Background Graphic with dark mode invert filter */}
      <div 
        className="absolute inset-0 bg-cover bg-center sm:bg-right bg-no-repeat transition-all duration-500 dark:invert-[0.9] dark:opacity-75 pointer-events-none"
        style={{ backgroundImage: "url('/BgIlluststion.webp')" }}
      />
 
      <div className="relative flex w-full lg:w-1/2 flex-col justify-center items-center px-4 py-10 pt-[max(2.5rem,env(safe-area-inset-top))] pb-[max(2.5rem,env(safe-area-inset-bottom))] sm:px-12 md:px-16 xl:px-24 min-h-[100dvh] lg:min-h-screen bg-white/70 dark:bg-zinc-900/80 backdrop-blur-md lg:bg-transparent lg:dark:bg-transparent z-10 transition-colors">
        <div className="absolute top-[max(1.25rem,env(safe-area-inset-top))] left-4 sm:left-6 flex items-center gap-3 lg:hidden">
          <div className="h-12 w-12 sm:h-14 sm:w-14 overflow-hidden rounded-full border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-0.5 shadow-md shrink-0">
            <img
              src="/logo.webp"
              alt="Academy of Gymnastics"
              className="h-full w-full object-cover rounded-full"
            />
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] font-black uppercase tracking-wider text-brand-orange-500 leading-none">
              Portal
            </span>
            <span className="mt-1 text-lg sm:text-xl font-bold text-zinc-955 dark:text-zinc-55 leading-none">
              of Gymnastics
            </span>
          </div>
        </div>
 
        <div className="w-full max-w-sm space-y-6 sm:space-y-8 mt-14 sm:mt-16 lg:mt-0">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-brand-orange-50 dark:bg-brand-orange-950/20 text-brand-orange-600 dark:text-brand-orange-400">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-orange-500 animate-pulse"></span>
              Portal Login
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-955 dark:text-zinc-50">
              Welcome
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-450 font-medium">
              Sign in with your Roll Number (e.g. TAG173) and password
            </p>
          </div>
 
          <form action={formAction} className="space-y-5">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-zinc-700 dark:text-zinc-350"
                >
                  Roll Number / Login ID
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-4 text-zinc-400 dark:text-zinc-550 pointer-events-none">
                    <User className="w-4.5 h-4.5" />
                  </span>
                  <input
                    id="email"
                    name="email"
                    type="text"
                    required
                    placeholder="e.g. TAG173"
                    autoCapitalize="none"
                    autoCorrect="off"
                    className="block w-full rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-950 pl-11 pr-4 py-3 text-sm font-medium text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-550 outline-none transition-all duration-200 focus:border-brand-orange-500/80 focus:ring-4 focus:ring-brand-orange-500/10"
                  />
                </div>
              </div>
 
              <div className="space-y-1.5">
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-zinc-700 dark:text-zinc-350"
                >
                  Password
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-4 text-zinc-400 dark:text-zinc-550 pointer-events-none">
                    <KeyRound className="w-4.5 h-4.5" />
                  </span>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    placeholder="••••••••"
                    className="block w-full rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-950 pl-11 pr-4 py-3 text-sm font-medium text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-550 outline-none transition-all duration-200 focus:border-brand-orange-500/80 focus:ring-4 focus:ring-brand-orange-500/10"
                  />
                </div>
              </div>
            </div>
 
            {errorMessage && (
              <div className="rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 p-4 animate-shake">
                <div className="flex gap-3 items-center">
                  <AlertTriangle className="h-4.5 w-4.5 text-red-650 dark:text-red-400 flex-shrink-0" strokeWidth={2.5} />
                  <p className="text-xs font-bold text-red-650 dark:text-red-400">
                    {errorMessage}
                  </p>
                </div>
              </div>
            )}
 
            <div className="pt-2">
              <button
                type="submit"
                disabled={isPending}
                className="flex w-full items-center justify-center rounded-xl bg-brand-orange-500 px-5 py-3.5 text-sm font-extrabold text-white shadow-md shadow-brand-orange-500/10 transition-all duration-200 hover:bg-brand-orange-600 hover:shadow-lg hover:shadow-brand-orange-500/20 active:scale-[0.99] disabled:pointer-events-none disabled:opacity-50 cursor-pointer"
              >
                {isPending ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Verifying...
                  </span>
                ) : (
                  "Login to Portal"
                )}
              </button>
            </div>
          </form>
 
          <div className="border-t border-zinc-200/20 mt-8 pt-5">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
              The Academy of Gymnastics · Portal
            </span>
          </div>
        </div>
      </div>
 
      {/* Right Section: Visual / Branding Presentation */}
      <div className="hidden lg:flex w-1/2 flex-col justify-center items-center p-12 z-10">
        <div className="relative group w-full h-full flex justify-center items-center flex-col text-left space-y-12">
          <div className="relative">
            <div className="relative h-46 w-46 overflow-hidden rounded-full border border-white/40 dark:border-zinc-700 bg-white/20 dark:bg-zinc-800/15">
              <img
                src="/logo.webp"
                alt="Academy of Gymnastics"
                className="h-full w-full object-cover rounded-full"
              />
            </div>
          </div>
          <div className="space-y-2 text-center">
            <h2 className="text-4xl font-black tracking-[0.05em] text-zinc-955 dark:text-zinc-50 uppercase leading-none">
              PORTAL
            </h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-450 font-medium">
              View active membership, track attendance logs, and print invoices.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
