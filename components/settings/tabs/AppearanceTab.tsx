"use client";

import React, { useState, useEffect } from "react";
import { useTheme } from "../../theme-provider";
import { Sun, Moon, Monitor, Check } from "lucide-react";

const ACCENT_COLORS = {
  orange: {
    label: "Orange (Default)",
    value: "orange",
    color50: "#fff7ed",
    color200: "#fed7aa",
    color500: "#f16d28",
    color600: "#d95312",
    color950: "#431407",
    colorHex: "#f16d28",
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
      description: "Follows system-level light/dark preferences.",
    },
    {
      value: "dark" as const,
      label: "Dark",
      icon: Moon,
      description: "Easy on the eyes in low light settings.",
    },
    {
      value: "light" as const,
      label: "Light",
      icon: Sun,
      description: "Clean and bright look during daytime.",
    },
  ];

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
        {/* Header inside card */}
        <div className="mb-5">
          <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
            Appearance
          </h2>
        </div>

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
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
