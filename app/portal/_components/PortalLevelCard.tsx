"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { StudentLevel } from "@prisma/client";
import { STUDENT_LEVELS, getLevelConfig } from "@/lib/utils/level";
import { Lock } from "lucide-react";

interface PortalLevelCardProps {
  studentId: string;
  studentName: string;
  currentLevel: StudentLevel;
  trainingFocus?: string | null;
}

const BADGE_IMAGES = [
  "/badges/B0.webp", // BEGINNER
  "/badges/F1.webp", // FOUNDATION_1
  "/badges/F2.webp", // FOUNDATION_2
  "/badges/F3.webp", // FOUNDATION_3
  "/badges/F4.webp", // NATIONAL_4
  "/badges/F5.webp", // NATIONAL_5
  "/badges/F6.webp", // NATIONAL_6
  "/badges/F7.webp", // NATIONAL_7
];

function getBadgeImage(idx: number): string {
  return BADGE_IMAGES[idx] ?? "/icons/logo.webp";
}

const LEVEL_QUOTES: Record<string, string> = {
  BEGINNER: "Every champion was once a beginner.",
  FOUNDATION_1: "Building the foundation of greatness.",
  FOUNDATION_2: "Stronger every single day.",
  FOUNDATION_3: "The roots are growing deep.",
  NATIONAL_4: "Rising to national standards.",
  NATIONAL_5: "Excellence is becoming a habit.",
  NATIONAL_6: "Among the elite. Keep pushing.",
  NATIONAL_7: "You've reached the peak. Stay legendary.",
};

export function PortalLevelCard({ studentId, studentName, currentLevel, trainingFocus }: PortalLevelCardProps) {
  const currentIndex = STUDENT_LEVELS.findIndex((l) => l.value === currentLevel);
  const currentCfg = getLevelConfig(currentLevel);

  return (
    <div className="relative overflow-hidden w-full rounded-[2rem] p-5 sm:p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/60 shadow-sm text-zinc-900 dark:text-zinc-100">
      <div className="relative z-10 flex items-center gap-6 sm:gap-8">
        {/* Badge Image: no bg color, no border, bigger size */}
        <div className="shrink-0">
          <Image
            src={getBadgeImage(currentIndex)}
            alt="Level badge"
            width={128}
            height={128}
            className="w-24 h-24 sm:w-32 sm:h-32 object-contain drop-shadow-md"
            unoptimized
          />
        </div>

        {/* Text Info */}
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-550 mb-1">
            Current Level
          </p>
          <h3 className="text-2xl sm:text-3xl md:text-4xl font-extralight tracking-tight text-zinc-900 dark:text-zinc-55 leading-tight">
            {currentCfg.label}
          </h3>
        </div>
      </div>

      {/* Training Focus & Emphasis */}
      {trainingFocus && (
        <div className="relative z-10 mt-3 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
          <span className="font-extrabold uppercase tracking-widest text-brand-orange-500 mr-1.5">
            Focus:
          </span>
          <span className="font-semibold whitespace-pre-wrap">
            {trainingFocus}
          </span>
        </div>
      )}

      {/* Milestone Badge Timeline: scrollable row at bottom */}
      <div className="relative z-10 mt-5 border-t border-zinc-100 dark:border-zinc-800/60 pt-4">
        <div className="flex items-center gap-4 overflow-x-auto pb-1 scrollbar-none snap-x justify-start md:justify-between">
          {STUDENT_LEVELS.map((lvl, i) => {
            const isActive = i === currentIndex;
            const isCompleted = i < currentIndex;
            return (
              <div key={lvl.value} className="shrink-0 flex flex-col items-center gap-1 snap-start w-10">
                {isCompleted || isActive ? (
                  <div className={`relative transition-all duration-300 ${isActive ? "scale-110" : "opacity-70 hover:opacity-100"}`}>
                    <Image
                      src={getBadgeImage(i)}
                      alt={lvl.label}
                      width={36}
                      height={36}
                      className={`w-9 h-9 object-contain ${isActive ? "" : "grayscale-[30%]"}`}
                      unoptimized
                    />
                  </div>
                ) : (
                  /* Locked upcoming levels */
                  <div className="w-9 h-9 rounded-full border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/40 flex items-center justify-center text-zinc-400 dark:text-zinc-550 transition-all duration-300">
                    <Lock className="w-3.5 h-3.5" />
                  </div>
                )}
                <span className={`text-[8px] font-bold uppercase tracking-wide ${isActive ? "text-brand-orange-500 font-extrabold" : "text-zinc-400 dark:text-zinc-500"}`}>
                  {lvl.shortLabel}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
