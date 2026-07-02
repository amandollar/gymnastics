"use client";

import React, { useEffect } from "react";
import Navbar from "./_components/navbar";
import { Roboto } from "next/font/google";
import { usePathname } from "next/navigation";
import IntroAnimation from "./_components/IntroAnimation";

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["100", "300", "400", "500", "700", "900"],
  variable: "--font-roboto",
});

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isHomePage = pathname === "/";

  // Enforce light mode on mount and restore original on unmount
  useEffect(() => {
    const root = window.document.documentElement;
    const hadDark = root.classList.contains("dark");
    
    root.classList.remove("dark");
    root.classList.add("light");

    return () => {
      // Restore actual user theme when leaving landing route group
      const savedTheme = localStorage.getItem("theme") || "dark";
      root.classList.remove("light", "dark");
      if (savedTheme === "system") {
        const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        root.classList.add(systemDark ? "dark" : "light");
      } else {
        root.classList.add(savedTheme);
      }
    };
  }, []);

  return (
    <div 
      className={`${roboto.variable} min-h-screen flex flex-col justify-between bg-zinc-50 text-zinc-900 selection:bg-brand-orange-500/10 selection:text-brand-orange-950`}
      style={{
        fontFamily: "var(--font-roboto), sans-serif",
        ["--font-inter" as any]: "var(--font-roboto)",
      }}
    >
      <IntroAnimation />
      <Navbar />

      <div className={`flex-1 flex flex-col ${isHomePage ? "" : "pt-16"}`}>
        {children}
      </div>

      {/* Footer */}
      <footer className="w-full max-w-7xl mx-auto px-6 py-8 sm:px-8 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-3 text-[10px] tracking-widest uppercase text-zinc-500 font-medium z-20 border-t border-zinc-200/60">
        <span>
          &copy; {new Date().getFullYear()} The Academy of Gymnastics
        </span>
        <div className="flex items-center gap-4">
          <a href="mailto:contact@academy.com" className="hover:text-zinc-800 transition-colors">
            Contact
          </a>
          <span className="text-zinc-300">&bull;</span>
          <span>Pune, IN</span>
        </div>
      </footer>
    </div>
  );
}
