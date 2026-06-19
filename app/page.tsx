"use client";

import React, { useState } from "react";
import { Check, ArrowRight } from "lucide-react";

export default function Home() {
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setIsLoading(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 800));
    setIsLoading(false);
    setIsSubmitted(true);
    setEmail("");
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-zinc-950 text-white font-sans selection:bg-brand-orange-500/20 selection:text-white">
      {/* Empty space to balance the footer */}
      <div className="h-16 sm:h-20" />

      {/* Main Content */}
      <main className="flex-1 flex flex-col justify-center items-center px-6 max-w-lg mx-auto w-full text-center space-y-10 z-10">
        {/* Centered Logo */}
        <div className="h-16 w-16 overflow-hidden rounded-full border border-zinc-900 bg-zinc-950/40 p-1 flex items-center justify-center shadow-inner">
          <img
            src="/logo.webp"
            alt="Academy of Gymnastics Logo"
            className="h-full w-full object-cover rounded-full filter grayscale hover:grayscale-0 transition-all duration-700 select-none"
          />
        </div>

        {/* Title and Subtitle */}
        <div className="space-y-3.5">
          <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-zinc-500 block">
            Coming Soon
          </span>
          <h1 className="text-3xl sm:text-4xl font-light tracking-tight text-white">
            The Academy of Gymnastics
          </h1>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto leading-relaxed">
            Our state-of-the-art training space and digital experience are currently in preparation.
          </p>
        </div>

        {/* Email form (Minimal, single border bottom) */}
        <div className="w-full pt-4 max-w-xs mx-auto">
          {isSubmitted ? (
            <div className="flex items-center justify-center gap-2 text-xs font-semibold text-emerald-500 animate-fade-in py-2">
              <Check className="h-3.5 w-3.5" />
              <span>You have been added to the waitlist.</span>
            </div>
          ) : (
            <form 
              onSubmit={handleSubmit} 
              className="flex items-center gap-3 border-b border-zinc-800/80 focus-within:border-zinc-500 transition-colors py-2.5"
            >
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter email to get notified"
                className="flex-1 bg-transparent text-sm text-white placeholder-zinc-700 outline-none"
              />
              <button
                type="submit"
                disabled={isLoading}
                className="text-xs font-semibold uppercase tracking-wider text-zinc-400 hover:text-white transition-colors disabled:opacity-50 flex items-center gap-1 cursor-pointer"
              >
                {isLoading ? "..." : "Notify"}
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </form>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="px-6 py-8 sm:px-8 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-3 text-[10px] tracking-widest uppercase text-zinc-600 font-medium z-20">
        <span>
          &copy; {new Date().getFullYear()} The Academy of Gymnastics
        </span>
        <div className="flex items-center gap-4">
          <a href="mailto:info@academyofgymnastics.com" className="hover:text-zinc-400 transition-colors">
            Contact
          </a>
          <span className="text-zinc-800">&bull;</span>
          <span>Pune, IN</span>
        </div>
      </footer>
    </div>
  );
}
