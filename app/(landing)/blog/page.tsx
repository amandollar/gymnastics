import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function BlogPage() {
  return (
    <div className="flex-1 flex flex-col justify-center items-center px-6 py-16 max-w-lg mx-auto w-full text-center space-y-10 z-10">
      {/* Visual Accent */}
      <div className="h-16 w-16 overflow-hidden rounded-full border border-zinc-200 bg-zinc-100 p-1 flex items-center justify-center shadow-inner text-zinc-400 select-none">
        <span className="text-xs font-bold tracking-wider">TAG</span>
      </div>

      {/* Title and Subtitle */}
      <div className="space-y-3.5">
        <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-brand-orange-500 block animate-pulse">
          Coming Soon
        </span>
        <h1 className="text-3xl sm:text-4xl font-light tracking-tight text-zinc-900">
          Blog & News
        </h1>
        <p className="text-xs text-zinc-500 max-w-sm mx-auto leading-relaxed">
          Stay updated with gymnastics training tips, academy news, schedule adjustments, and student features. Articles coming soon.
        </p>
      </div>

      <div className="pt-4">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-555 hover:text-zinc-900 transition-colors cursor-pointer"
        >
          <span>Back to Home</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}
