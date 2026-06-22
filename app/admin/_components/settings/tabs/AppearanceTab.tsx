"use client";

import React, { useState, useEffect } from "react";
import { useTheme } from "@/app/_components/theme-provider";
import { Sun, Moon, Monitor, Check, Sparkles } from "lucide-react";

const ACCENT_COLORS = {
  orange: {
    label: "Orange",
    value: "orange",
    color50: "#fff7ed",
    color200: "#fed7aa",
    color500: "#f16d28",
    color600: "#d95312",
    color950: "#431407",
    colorHex: "#f16d28",
    hint: "Warm and energetic",
  },
  blue: {
    label: "Blue",
    value: "blue",
    color50: "#eff6ff",
    color200: "#bfdbfe",
    color500: "#3b82f6",
    color600: "#2563eb",
    color950: "#172554",
    colorHex: "#3b82f6",
    hint: "Calm and professional",
  },
  green: {
    label: "Green",
    value: "green",
    color50: "#f0fdf4",
    color200: "#bbf7d0",
    color500: "#22c55e",
    color600: "#16a34a",
    color950: "#052e16",
    colorHex: "#22c55e",
    hint: "Fresh and modern",
  },
  purple: {
    label: "Purple",
    value: "purple",
    color50: "#faf5ff",
    color200: "#e9d5ff",
    color500: "#a855f7",
    color600: "#9333ea",
    color950: "#3b0764",
    colorHex: "#a855f7",
    hint: "Bold and premium",
  },
  rose: {
    label: "Rose",
    value: "rose",
    color50: "#fff1f2",
    color200: "#fecdd3",
    color500: "#f43f5e",
    color600: "#e11d48",
    color950: "#4c0519",
    colorHex: "#f43f5e",
    hint: "Soft and stylish",
  },
};

export default function AppearanceTab() {
  const { theme, setTheme } = useTheme();
  const [accent, setAccent] = useState<string>("orange");
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Load active accent color on mount
  useEffect(() => {
    const savedAccent = localStorage.getItem("theme-accent") || "orange";
    setAccent(savedAccent);
  }, []);

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const handleAccentChange = (accentName: keyof typeof ACCENT_COLORS) => {
    setAccent(accentName);
    localStorage.setItem("theme-accent", accentName);

    const colors = ACCENT_COLORS[accentName];
    const root = document.documentElement;

    // Apply color variables to documentElement
    root.style.setProperty("--color-brand-orange-50", colors.color50);
    root.style.setProperty("--color-brand-orange-200", colors.color200);
    root.style.setProperty("--color-brand-orange-500", colors.color500);
    root.style.setProperty("--color-brand-orange-600", colors.color600);
    root.style.setProperty("--color-brand-orange-950", colors.color950);

    showToast("success", `Accent color updated to ${colors.label}.`);
  };

  const themes = [
    {
      value: "system" as const,
      label: "System",
      icon: Monitor,
      description: "Matches your device settings.",
    },
    {
      value: "dark" as const,
      label: "Dark",
      icon: Moon,
      description: "Rich contrast for late hours.",
    },
    {
      value: "light" as const,
      label: "Light",
      icon: Sun,
      description: "Bright and clean for daytime.",
    },
  ];

  const currentThemeLabel =
    themes.find((t) => t.value === theme)?.label || "System";
  const currentAccent = ACCENT_COLORS[accent as keyof typeof ACCENT_COLORS];

  return (
    <div className="relative">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 rounded-xl border px-4 py-3 text-sm shadow-lg max-w-sm ${
            toast.type === "success"
              ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/40"
              : "bg-rose-50 dark:bg-rose-950/30 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-900/40"
          }`}
        >
          {toast.message}
        </div>
      )}

      <div className="rounded-2xl border border-zinc-100 dark:border-zinc-800/60 bg-white dark:bg-zinc-950 p-5 shadow-xs">
        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
              Appearance
            </h2>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Customize the look and feel of the dashboard.
            </p>
          </div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-zinc-100 dark:bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300">
            <Sparkles className="h-3.5 w-3.5" />
            {currentThemeLabel} · {currentAccent.label}
          </div>
        </div>

        <div className="mb-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-gradient-to-br from-zinc-50 via-white to-zinc-100 dark:from-zinc-900 dark:via-zinc-950 dark:to-zinc-900 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
                Preview
              </p>
              <h3 className="mt-1 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Dashboard look
              </h3>
            </div>
            <span
              className="rounded-full px-2.5 py-1 text-[11px] font-semibold text-white"
              style={{ backgroundColor: currentAccent.color500 }}
            >
              {currentAccent.label}
            </span>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-3">
              <div className="h-2.5 w-16 rounded-full" style={{ backgroundColor: currentAccent.color500 }} />
              <div className="mt-3 h-2 w-20 rounded-full bg-zinc-200 dark:bg-zinc-800" />
              <div className="mt-2 h-2 w-12 rounded-full bg-zinc-100 dark:bg-zinc-900" />
            </div>
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-3">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: currentAccent.color500 }} />
                <span className="h-2 w-16 rounded-full bg-zinc-200 dark:bg-zinc-800" />
              </div>
              <div className="mt-3 h-8 rounded-lg" style={{ backgroundColor: currentAccent.color50 }} />
            </div>
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">Today</span>
                <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold text-white" style={{ backgroundColor: currentAccent.color500 }}>
                  Live
                </span>
              </div>
              <div className="mt-3 h-2 w-full rounded-full bg-zinc-200 dark:bg-zinc-800" />
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-3.5">
            Interface Theme
          </h3>
          <div className="grid gap-3 lg:grid-cols-3">
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
                  className={`flex flex-col items-start p-4 rounded-xl border text-left cursor-pointer transition-all ${
                    isActive
                      ? "border-brand-orange-500 bg-brand-orange-50/20 dark:bg-brand-orange-950/10 ring-1 ring-brand-orange-500"
                      : "border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900/40"
                  }`}
                >
                  <div className={`p-2 rounded-lg mb-3 ${isActive ? "bg-brand-orange-500 text-white" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400"}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                    {t.label}
                  </span>
                  <span className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400">
                    {t.description}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-8">
          <div className="flex items-center justify-between mb-3.5">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Accent color
            </h3>
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              {Object.keys(ACCENT_COLORS).length} options
            </span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {Object.values(ACCENT_COLORS).map((color) => {
              const isSelected = accent === color.value;
              return (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => handleAccentChange(color.value as keyof typeof ACCENT_COLORS)}
                  className={`group rounded-2xl border p-3 text-left transition-all ${
                    isSelected
                      ? "border-brand-orange-500 ring-1 ring-brand-orange-500/20"
                      : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="h-11 w-11 rounded-xl border border-white/20 shadow-sm"
                      style={{ background: `linear-gradient(135deg, ${color.color500}, ${color.color200})` }}
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                          {color.label}
                        </span>
                        {isSelected && <Check className="h-4 w-4 text-brand-orange-500" />}
                      </div>
                      <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                        {color.hint}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
