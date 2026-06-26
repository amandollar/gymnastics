"use client";

import React from "react";
import { useTheme } from "@/app/_components/theme-provider";
import { Sun, Moon, Monitor } from "lucide-react";

export default function ThemeSelector({ isCollapsed = false }: { isCollapsed?: boolean }) {
  const { theme, setTheme } = useTheme();

  const options = [
    {
      value: "system" as const,
      label: "System",
      icon: <Monitor className="h-4 w-4 shrink-0" strokeWidth={2} />,
    },
    {
      value: "dark" as const,
      label: "Dark",
      icon: <Moon className="h-4 w-4 shrink-0" strokeWidth={2} />,
    },
    {
      value: "light" as const,
      label: "Light",
      icon: <Sun className="h-4 w-4 shrink-0" strokeWidth={2} />,
    },
  ];

  if (isCollapsed) {
    const activeOption = options.find((opt) => opt.value === theme) || options[0];
    
    const toggleTheme = () => {
      if (theme === "system") {
        setTheme("dark");
      } else if (theme === "dark") {
        setTheme("light");
      } else {
        setTheme("system");
      }
    };

    return (
      <div className="py-4 flex justify-center">
        <button
          onClick={toggleTheme}
          className="flex h-11 w-11 items-center justify-center rounded-xl text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all cursor-pointer"
          title={`Theme: ${activeOption.label} (Click to toggle)`}
        >
          {React.cloneElement(activeOption.icon, { className: "h-5 w-5 shrink-0" })}
        </button>
      </div>
    );
  }

  return (
    <div className="px-3 py-3.5">
      <p className="text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-2 px-1">
        Theme Mode
      </p>
      <div className="flex gap-1 bg-zinc-100 dark:bg-zinc-800/80 p-1 rounded-2xl border border-zinc-200/50 dark:border-zinc-700/30 overflow-hidden">
        {options.map((opt) => {
          const isActive = theme === opt.value;
          return (
            <button
              key={opt.value}
              onClick={() => setTheme(opt.value)}
              className={`flex items-center justify-center gap-1.5 transition-all duration-200 cursor-pointer h-8 rounded-xl ${
                isActive
                  ? "flex-1 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm text-xs font-semibold"
                  : "w-10 flex-none text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-white/40 dark:hover:bg-zinc-700/20"
              }`}
              title={`${opt.label} Theme`}
            >
              {opt.icon}
              {isActive && <span className="text-[11px] font-semibold">{opt.label}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
