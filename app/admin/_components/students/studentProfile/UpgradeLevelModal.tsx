"use client";

import { useState, useEffect, useTransition } from "react";
import { StudentLevel } from "@prisma/client";
import { STUDENT_LEVELS, getLevelConfig } from "@/lib/utils/level";
import { updateStudentLevelAction } from "@/lib/actions/students";

interface UpgradeLevelModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentId: string;
  studentName: string;
  currentLevel: StudentLevel;
}

const inputClass =
  "w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3.5 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-brand-orange-500/50 focus:border-brand-orange-500 transition-all duration-200";

export function UpgradeLevelModal({
  isOpen,
  onClose,
  studentId,
  studentName,
  currentLevel,
}: UpgradeLevelModalProps) {
  // Determine next level in sequence to pre-select
  const currentIndex = STUDENT_LEVELS.findIndex((lvl) => lvl.value === currentLevel);
  const safeIndex = currentIndex === -1 ? 0 : currentIndex;
  const nextIndex = Math.min(safeIndex + 1, STUDENT_LEVELS.length - 1);
  const defaultSelectedLevel = STUDENT_LEVELS[nextIndex].value;

  const [selectedLevel, setSelectedLevel] = useState<StudentLevel>(defaultSelectedLevel);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Sync state if currentLevel changes or when the modal opens
  useEffect(() => {
    const idx = STUDENT_LEVELS.findIndex((lvl) => lvl.value === currentLevel);
    const safeIdx = idx === -1 ? 0 : idx;
    const nxtIdx = Math.min(safeIdx + 1, STUDENT_LEVELS.length - 1);
    setSelectedLevel(STUDENT_LEVELS[nxtIdx].value);
  }, [currentLevel, isOpen]);

  if (!isOpen) return null;

  const handleUpdate = () => {
    setError(null);
    startTransition(async () => {
      try {
        const res = await updateStudentLevelAction(studentId, selectedLevel);
        if (res.success) {
          onClose();
        } else {
          setError(res.message || "Failed to update level");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An unexpected error occurred");
      }
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isPending) onClose();
      }}
    >
      <div className="w-full max-w-sm bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl overflow-hidden p-6 space-y-4 animate-menu-show border border-zinc-100 dark:border-zinc-800 relative">
        {/* Loading Overlay with Upgrading Animation */}
        {isPending && (
          <div className="absolute inset-0 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-[2px] z-50 flex flex-col items-center justify-center space-y-3 p-6">
            <div className="relative flex items-center justify-center">
              {/* Pulsing wave */}
              <div className="w-12 h-12 rounded-full border-2 border-brand-orange-500/30 animate-ping absolute" />
              {/* Spin loader */}
              <div className="w-10 h-10 rounded-full border-2 border-zinc-200 dark:border-zinc-800 border-t-brand-orange-500 animate-spin" />
            </div>
            <div className="text-center space-y-1">
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 animate-pulse">
                Upgrading Level...
              </p>
              <p className="text-[10px] text-zinc-400 dark:text-zinc-500">
                Saving changes to database
              </p>
            </div>
          </div>
        )}
        {/* Header */}
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Upgrade Level
          </h3>
          <button
            onClick={onClose}
            disabled={isPending}
            type="button"
            className="p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-zinc-400 cursor-pointer disabled:opacity-50"
          >
            ✕
          </button>
        </div>

        {/* From Level Info */}
        <div className="space-y-1">
          <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
            From
          </span>
          <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
            {getLevelConfig(currentLevel).label}
          </p>
        </div>

        {/* Upgrade To Dropdown */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
            Upgrade to
          </label>
          <select
            value={selectedLevel}
            onChange={(e) => setSelectedLevel(e.target.value as StudentLevel)}
            className={inputClass}
            disabled={isPending}
          >
            {STUDENT_LEVELS.map((lvl) => (
              <option key={lvl.value} value={lvl.value}>
                {lvl.label} {lvl.value === currentLevel ? " (Current)" : ""}
              </option>
            ))}
          </select>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-955/20 px-3 py-2.5 text-xs text-rose-700 dark:text-rose-400 font-medium">
            ⚠️ {error}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <button
            type="button"
            disabled={isPending}
            onClick={onClose}
            className="flex-1 rounded-xl border border-zinc-200 dark:border-zinc-700 px-3 py-2.5 text-xs font-semibold text-zinc-600 dark:text-zinc-350 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isPending || selectedLevel === currentLevel}
            onClick={handleUpdate}
            className="flex-1 rounded-xl bg-brand-orange-500 hover:bg-brand-orange-600 px-3 py-2.5 text-xs font-semibold text-white transition-colors cursor-pointer disabled:opacity-50"
          >
            {isPending ? "Updating…" : "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
}
