"use client";

import React, { useActionState } from "react";
import { authenticate } from "@/lib/actions/auth";

export default function LoginPage() {
  const [errorMessage, formAction, isPending] = useActionState(
    authenticate,
    undefined
  );

  return (
    <div
      className="relative flex min-h-screen w-full flex-col lg:flex-row font-sans antialiased select-none bg-cover bg-right bg-no-repeat"
      style={{ backgroundImage: "url('/BgIlluststion.webp')" }}
    >
      {/* Left Section: Login Form (50% on large width, entirely transparent background) */}
      <div className="relative flex w-full lg:w-1/2 flex-col justify-center items-center px-6 py-12 sm:px-12 md:px-16 xl:px-24 min-h-screen">
        
        {/* Mobile branding header (absolute top-left, visible only on small screens) */}
        <div className="absolute top-6 left-6 flex items-center gap-4 lg:hidden">
          <div className="h-16 w-16 overflow-hidden rounded-full border border-zinc-200/80 bg-white p-0.5 shadow-md">
            <img
              src="/logo.webp"
              alt="Academy of Gymnastics"
              className="h-full w-full object-cover rounded-full"
            />
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] font-black uppercase tracking-wider text-brand-orange-500 leading-none">
              The Academy
            </span>
            <span className="mt-1 text-xl font-black text-zinc-950 uppercase leading-none">
              of Gymnastics
            </span>
          </div>
        </div>

        {/* Vertically Centered Form Container */}
        <div className="w-full max-w-sm space-y-8 mt-16 lg:mt-0">
          <div className="space-y-2">
            <h1 className="text-3xl font-extrabold tracking-[-0.03em] text-zinc-950">
              Welcome back
            </h1>
            <p className="text-sm font-semibold text-zinc-500">
              Please sign in to your management account
            </p>
          </div>

          <form action={formAction} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label
                  htmlFor="email"
                  className="block text-xs font-bold text-zinc-700 tracking-wide uppercase"
                >
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="Enter your email"
                  className="block w-full rounded-xl border border-zinc-200/80 bg-white px-4 py-3 text-sm font-medium text-zinc-900 placeholder-zinc-400 outline-none transition-all duration-200 focus:border-brand-orange-500/80 focus:ring-4 focus:ring-brand-orange-500/10"
                />
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="password"
                  className="block text-xs font-bold text-zinc-700 tracking-wide uppercase"
                >
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  placeholder="••••••••"
                  className="block w-full rounded-xl border border-zinc-200/80 bg-white px-4 py-3 text-sm font-medium text-zinc-900 placeholder-zinc-400 outline-none transition-all duration-200 focus:border-brand-orange-500/80 focus:ring-4 focus:ring-brand-orange-500/10"
                />
              </div>
            </div>

            <div className="flex items-center justify-end text-xs font-bold pt-1">
              <a
                href="#"
                className="text-brand-orange-500 hover:text-brand-orange-600 transition-colors"
              >
                Forgot password?
              </a>
            </div>

            {errorMessage && (
              <div className="rounded-xl bg-red-50 border border-red-200 p-4">
                <div className="flex gap-3 items-center">
                  <svg
                    className="h-4.5 w-4.5 text-red-600 flex-shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                  <p className="text-xs font-bold text-red-600">
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
                    Signing in...
                  </span>
                ) : (
                  "Sign In"
                )}
              </button>
            </div>
          </form>

          <div className="border-t border-zinc-200/20 mt-8 pt-5">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400">
              The Academy of Gymnastics · Pune
            </span>
          </div>
        </div>
      </div>

      {/* Right Section: Visual / Branding Presentation (50% on large width, entirely transparent background) */}
      <div className="hidden lg:flex w-1/2 flex-col justify-center items-center p-12">
        <div className="relative group w-full h-full flex justify-center items-center flex-col items-start text-left space-y-12">
          <div className="relative">
            <div className="relative h-46 w-46 overflow-hidden rounded-full border border-white/40 bg-white/20 ">
              <img
                src="/logo.webp"
                alt="Academy of Gymnastics"
                className="h-full w-full object-cover rounded-full"
              />
            </div>
          </div>
          <div className="space-y-1">
            <h2 className="text-4xl font-black tracking-[0.05em] text-zinc-950 uppercase leading-none">
              The Academy
            </h2>
            <p className="text-4xl font-black tracking-[0.05em] text-zinc-950 uppercase leading-none">
              of Gymnastics
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
