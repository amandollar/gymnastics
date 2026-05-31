"use client";

import React, { useActionState } from "react";
import { authenticate } from "@/lib/actions/auth";

export default function LoginPage() {
  const [errorMessage, formAction, isPending] = useActionState(
    authenticate,
    undefined
  );

  return (
    <div className="flex min-h-screen w-full flex-col lg:flex-row bg-white font-sans antialiased select-none">
      <div className="flex w-full flex-col justify-center bg-white px-8 py-12 sm:px-16 md:px-24 lg:w-1/2 lg:px-16 xl:px-24">
        <div className="mx-auto w-full max-w-sm space-y-8">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-[-0.035em] text-zinc-950">
              Welcome back
            </h1>
            <p className="text-sm font-medium text-zinc-400 leading-normal">
              Please sign in to your management account.
            </p>
          </div>

          <form action={formAction} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label
                  htmlFor="email"
                  className="block text-xs font-semibold text-zinc-700"
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
                  className="block w-full rounded-md border border-zinc-200 bg-white px-3.5 py-2.5 text-sm font-normal text-zinc-900 placeholder-zinc-400 outline-none transition-all focus:border-brand-orange-500 focus:ring-2 focus:ring-brand-orange-500/10"
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="password"
                  className="block text-xs font-semibold text-zinc-700"
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
                  className="block w-full rounded-md border border-zinc-200 bg-white px-3.5 py-2.5 text-sm font-normal text-zinc-900 placeholder-zinc-400 outline-none transition-all focus:border-brand-orange-500 focus:ring-2 focus:ring-brand-orange-500/10"
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs font-medium">
              <label className="flex items-center gap-2 text-zinc-500 cursor-pointer">
                <input
                  type="checkbox"
                  className="h-3.5 w-3.5 rounded border-zinc-300 text-brand-orange-500 focus:ring-brand-orange-500/20"
                />
                <span>Remember me</span>
              </label>
              <a
                href="#"
                className="text-brand-orange-500 hover:text-brand-orange-600 transition-colors"
              >
                Forgot password?
              </a>
            </div>

            {errorMessage && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-3.5">
                <div className="flex gap-2.5 items-center">
                  <svg
                    className="h-4 w-4 text-red-600 flex-shrink-0"
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
                  <p className="text-xs font-semibold text-red-600">
                    {errorMessage}
                  </p>
                </div>
              </div>
            )}

            <div className="pt-1">
              <button
                type="submit"
                disabled={isPending}
                className="flex w-full items-center justify-center rounded-lg bg-brand-orange-500 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-orange-600 focus:outline-none active:scale-[0.99] disabled:pointer-events-none disabled:opacity-50"
              >
                {isPending ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Signing in...
                  </span>
                ) : (
                  "Sign in to your account"
                )}
              </button>
            </div>
          </form>

          <div className="border-t border-zinc-100 pt-6">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
              The Academy of Gymnastics · Pune
            </span>
          </div>
        </div>
      </div>

      <div className="hidden w-1/2 flex-col justify-center bg-zinc-50/70 p-16 lg:flex border-l border-zinc-200/50 relative overflow-hidden">
        <div className="relative z-10 max-w-sm space-y-8">
          <div className="h-28 w-28 overflow-hidden rounded-full border border-zinc-200 bg-white p-0.5 shadow-sm">
            <img
              src="/IMG_3758.PNG"
              alt="Academy of Gymnastics"
              className="h-full w-full object-cover rounded-full"
            />
          </div>

          <div className="space-y-4">
            <h2 className="text-4xl font-extrabold tracking-[-0.03em] text-zinc-950 leading-[1.12]">
              Academy of
              <br />
              Gymnastics
            </h2>
            <p className="text-zinc-500 font-medium text-base leading-relaxed max-w-xs">
              Empowering athletes, mastering skills, tracking champions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
