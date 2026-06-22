"use client";

import { useState } from "react";
import { StudentLevel } from "@prisma/client";
import { STUDENT_LEVELS, getLevelConfig } from "@/lib/utils/level";
import { UpgradeLevelModal } from "./UpgradeLevelModal";

interface LevelProgressProps {
  studentId: string;
  studentName: string;
  currentLevel: StudentLevel;
  canManage: boolean;
}

export function LevelProgress({
  studentId,
  studentName,
  currentLevel,
  canManage,
}: LevelProgressProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const currentIndex = STUDENT_LEVELS.findIndex((lvl) => lvl.value === currentLevel);
  const currentCfg = getLevelConfig(currentLevel);

  return (
    <div
      className="bg-white dark:bg-zinc-900 p-5 shadow-sm border border-zinc-200/60 dark:border-zinc-800/80 space-y-4 transition-all"
      style={{ borderRadius: "1.5rem" }}
    >
      {/* Header Info */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">
          Current Level
        </span>

        {/* Upgrade Level Button */}
        {canManage && (
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-semibold text-brand-orange-500 hover:text-brand-orange-600 bg-brand-orange-50 dark:bg-brand-orange-950/20 hover:bg-brand-orange-100 dark:hover:bg-brand-orange-900/35 transition-colors cursor-pointer active:scale-95 border border-brand-orange-200/30"
          >
            Upgrade
            <svg
              className="w-3 h-3 stroke-[2.5]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 19V5m0 0l-7 7m7-7l7 7" />
            </svg>
          </button>
        )}
      </div>

      {/* Level Text (Thinner Light Style) */}
      <div className="flex items-center gap-2">
        <h3 className="text-xl sm:text-2xl font-light tracking-tight text-zinc-900 dark:text-zinc-50">
          {currentCfg.label}
        </h3>
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold ${currentCfg.badgeBg} ${currentCfg.badgeText} ring-1 ring-zinc-200/40 dark:ring-zinc-800/40`}
        >
          {currentCfg.shortLabel}
        </span>
      </div>

      {/* Progress Roadmap Visualizer (Flat Segmented Bar) */}
      <div className="space-y-2 pt-1">
        {/* Segmented Track Line */}
        <div
          className="grid gap-1.5 h-2"
          style={{ gridTemplateColumns: `repeat(${STUDENT_LEVELS.length}, minmax(0, 1fr))` }}
        >
          {STUDENT_LEVELS.map((lvl, index) => {
            const isActiveOrPast = index <= currentIndex;

            return (
              <div
                key={lvl.value}
                className={`h-full rounded-full transition-all duration-500 ${
                  isActiveOrPast
                    ? "bg-brand-orange-500"
                    : "bg-zinc-100 dark:bg-zinc-800"
                }`}
                title={lvl.label}
              />
            );
          })}
        </div>

        {/* Tiny level labels underneath the progress bar */}
        <div className="flex justify-between px-0.5">
          {STUDENT_LEVELS.map((lvl, index) => {
            const isActive = index === currentIndex;
            const isCompleted = index < currentIndex;

            return (
              <span
                key={lvl.value}
                className={`text-[9px] font-bold tracking-tighter w-4 text-center transition-colors uppercase ${
                  isActive
                    ? "text-brand-orange-500 scale-105"
                    : isCompleted
                    ? "text-zinc-700 dark:text-zinc-300 font-semibold"
                    : "text-zinc-400 dark:text-zinc-650"
                }`}
              >
                {lvl.shortLabel}
              </span>
            );
          })}
        </div>
      </div>

      {/* Upgrade Level Popup Modal */}
      {isModalOpen && (
        <UpgradeLevelModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          studentId={studentId}
          studentName={studentName}
          currentLevel={currentLevel}
        />
      )}
    </div>
  );
}
