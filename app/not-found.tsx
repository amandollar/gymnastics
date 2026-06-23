"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Aclonica } from "next/font/google";

const aclonica = Aclonica({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-aclonica",
});

export default function NotFound() {
  return (
    <div className={`min-h-screen w-full flex flex-col items-center justify-center bg-zinc-50 text-zinc-900 relative overflow-hidden select-none ${aclonica.variable}`}>
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @keyframes fadeInUp {
              from {
                opacity: 0;
                transform: translateY(20px);
              }
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }
            .animate-fade-in-up {
              opacity: 0;
              animation: fadeInUp 1.0s cubic-bezier(0.16, 1, 0.3, 1) forwards;
            }
          `,
        }}
      />
      
      {/* Main Content Area: Centered column aligned higher up */}
      <main className="flex flex-col items-center text-center max-w-2xl px-6 z-10 -mt-16 sm:-mt-24">
        
        {/* Big Centered WebP Illustration (No hover effect or background glow) */}
        <div className="w-full max-w-[440px] sm:max-w-[560px] md:max-w-[620px]">
          <Image
            src="/images/404PageIllustration.webp"
            alt="404 - Looks like you've crashed illustration"
            width={620}
            height={620}
            priority
            className="w-full h-auto object-contain select-none pointer-events-none drop-shadow-xl"
          />
        </div>

        {/* Title: Whoops! (Increased gap above slightly, animated) */}
        <h1 
          className={`${aclonica.className} text-4xl sm:text-5xl lg:text-6xl font-normal leading-tight tracking-tight text-zinc-900 mt-8 animate-fade-in-up`}
          style={{ animationDelay: "0.15s" }}
        >
          Whoops!
        </h1>

        {/* Subtext: Looks like you've crashed. (Same font, larger size, zero top gap, animated) */}
        <p 
          className={`${aclonica.className} text-lg sm:text-xl md:text-2xl text-zinc-500 mt-0 font-normal leading-relaxed animate-fade-in-up`}
          style={{ animationDelay: "0.3s" }}
        >
          Looks like you&apos;ve crashed.
        </p>

        {/* Single CTA Button: Back to Home (Pill shaped, no shadow, no icon, animated with no hover translate) */}
        <div 
          className="mt-8 animate-fade-in-up"
          style={{ animationDelay: "0.45s" }}
        >
          <Link
            href="/"
            className="inline-flex items-center justify-center text-xs font-bold uppercase tracking-wider text-white bg-brand-orange-500 hover:bg-brand-orange-600 px-8 py-4 rounded-full transition-colors duration-300 cursor-pointer"
          >
            Back to Home
          </Link>
        </div>
      </main>

      {/* Rotated watermark "404" in the bottom right corner (Fixed light color text-zinc-300 / #d4d4d8) */}
      <div 
        className={`${aclonica.className} absolute bottom-4 right-4 sm:bottom-8 sm:right-8 md:bottom-12 md:right-12 z-0 flex items-center select-none pointer-events-none font-bold text-[18vw] sm:text-[14vw] md:text-[12vw] leading-none tracking-tight`}
        style={{ color: "#d4d4d8" }}
      >
        <span className="inline-block transform -rotate-12">4</span>
        <span className="inline-block transform rotate-6 mx-[-0.05em]">0</span>
        <span className="inline-block transform -rotate-3">4</span>
      </div>
    </div>
  );
}
