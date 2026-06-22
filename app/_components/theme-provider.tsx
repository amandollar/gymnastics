"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "dark" | "light" | "system";

type ThemeContextType = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Start with "dark" on SSR. After mount, read actual localStorage value.
  const [theme, setThemeState] = useState<Theme>("dark");

  const applyTheme = (currentTheme: Theme) => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");
    if (currentTheme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
      root.classList.add(systemTheme);
    } else {
      root.classList.add(currentTheme);
    }
  };

  // On mount, sync from localStorage
  useEffect(() => {
    const saved = (localStorage.getItem("theme") as Theme) || "dark";
    setThemeState(saved);
    applyTheme(saved);

    // Sync accent color
    const savedAccent = localStorage.getItem("theme-accent") || "orange";
    const ACCENT_COLORS = {
      orange: {
        color50: "#fff7ed",
        color200: "#fed7aa",
        color500: "#f16d28",
        color600: "#d95312",
        color950: "#431407",
      },
      blue: {
        color50: "#eff6ff",
        color200: "#bfdbfe",
        color500: "#3b82f6",
        color600: "#2563eb",
        color950: "#172554",
      },
      green: {
        color50: "#f0fdf4",
        color200: "#bbf7d0",
        color500: "#22c55e",
        color600: "#16a34a",
        color950: "#052e16",
      },
    };
    const colors = ACCENT_COLORS[savedAccent as keyof typeof ACCENT_COLORS] || ACCENT_COLORS.orange;
    const root = window.document.documentElement;
    root.style.setProperty("--color-brand-orange-50", colors.color50);
    root.style.setProperty("--color-brand-orange-200", colors.color200);
    root.style.setProperty("--color-brand-orange-500", colors.color500);
    root.style.setProperty("--color-brand-orange-600", colors.color600);
    root.style.setProperty("--color-brand-orange-950", colors.color950);
  }, []);

  // Re-apply when theme changes and watch system preference
  useEffect(() => {
    applyTheme(theme);
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      if (theme === "system") applyTheme("system");
    };
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme]);

  const setTheme = (newTheme: Theme) => {
    localStorage.setItem("theme", newTheme);
    setThemeState(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
