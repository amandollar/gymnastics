"use client";

import React from "react";
import { useTheme } from "../theme-provider";
import { Sun, Moon, Monitor } from "lucide-react";

export default function ThemeSelector() {
  const { theme, setTheme } = useTheme();

  const options = [
    {
      value: "light" as const,
      label: "Light",
      icon: <Sun className="h-4 w-4" strokeWidth={2} />,
    },
    {
      value: "dark" as const,
      label: "Dark",
      icon: <Moon className="h-4 w-4" strokeWidth={2} />,
    },
    {
      value: "system" as const,
      label: "System",
      icon: <Monitor className="h-4 w-4" strokeWidth={2} />,
    },
  ];

  return (
    <div className="px-4 py-3.5 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30">
      <p className="text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-2 px-1">
        Theme Mode
      </p>
      <div className="grid grid-cols-3 gap-1 bg-zinc-100 dark:bg-zinc-800/80 p-0.5 rounded-lg border border-zinc-200/50 dark:border-zinc-700/30">
        {options.map((opt) => {
          const isActive = theme === opt.value;
          return (
            <button
              key={opt.value}
              onClick={() => setTheme(opt.value)}
              className={`flex flex-col sm:flex-row items-center justify-center gap-1.5 py-1.5 px-2 rounded-md text-xs font-medium transition-all duration-200 cursor-pointer ${
                isActive
                  ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-xs"
                  : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-white/40 dark:hover:bg-zinc-700/20"
              }`}
              title={`${opt.label} Theme`}
            >
              {opt.icon}
              <span className="hidden sm:inline text-[11px]">{opt.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
