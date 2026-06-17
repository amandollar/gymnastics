import { StudentLevel } from "@prisma/client";

export interface LevelConfig {
  value: StudentLevel;
  label: string;
  shortLabel: string;
  color: string; // Tailwind gradient class
  textColor: string;
  borderColor: string;
  badgeBg: string;
  badgeText: string;
  activeRing: string;
  activeBg: string;
}

export const STUDENT_LEVELS: readonly LevelConfig[] = [
  {
    value: "BEGINNER",
    label: "Beginner",
    shortLabel: "B0",
    color: "from-zinc-400 to-zinc-500 dark:from-zinc-500 dark:to-zinc-600",
    textColor: "text-zinc-500 dark:text-zinc-450",
    borderColor: "border-zinc-500/30 dark:border-zinc-500/20",
    badgeBg: "bg-zinc-50 dark:bg-zinc-950/20",
    badgeText: "text-zinc-700 dark:text-zinc-400",
    activeRing: "ring-zinc-500/50",
    activeBg: "bg-zinc-500",
  },
  {
    value: "FOUNDATION_1",
    label: "Foundation 1",
    shortLabel: "F1",
    color: "from-sky-400 to-sky-500 dark:from-sky-500 dark:to-sky-600",
    textColor: "text-sky-500 dark:text-sky-400",
    borderColor: "border-sky-500/30 dark:border-sky-500/20",
    badgeBg: "bg-sky-50 dark:bg-sky-950/20",
    badgeText: "text-sky-700 dark:text-sky-400",
    activeRing: "ring-sky-500/50",
    activeBg: "bg-sky-500",
  },
  {
    value: "FOUNDATION_2",
    label: "Foundation 2",
    shortLabel: "F2",
    color: "from-blue-400 to-blue-500 dark:from-blue-500 dark:to-blue-600",
    textColor: "text-blue-500 dark:text-blue-400",
    borderColor: "border-blue-500/30 dark:border-blue-500/20",
    badgeBg: "bg-blue-50 dark:bg-blue-950/20",
    badgeText: "text-blue-700 dark:text-blue-400",
    activeRing: "ring-blue-500/50",
    activeBg: "bg-blue-500",
  },
  {
    value: "FOUNDATION_3",
    label: "Foundation 3",
    shortLabel: "F3",
    color: "from-indigo-400 to-indigo-500 dark:from-indigo-500 dark:to-indigo-600",
    textColor: "text-indigo-500 dark:text-indigo-400",
    borderColor: "border-indigo-500/30 dark:border-indigo-500/20",
    badgeBg: "bg-indigo-50 dark:bg-indigo-950/20",
    badgeText: "text-indigo-700 dark:text-indigo-400",
    activeRing: "ring-indigo-500/50",
    activeBg: "bg-indigo-500",
  },
  {
    value: "NATIONAL_4",
    label: "National 4",
    shortLabel: "N4",
    color: "from-purple-400 to-purple-500 dark:from-purple-500 dark:to-purple-600",
    textColor: "text-purple-500 dark:text-purple-400",
    borderColor: "border-purple-500/30 dark:border-purple-500/20",
    badgeBg: "bg-purple-50 dark:bg-purple-950/20",
    badgeText: "text-purple-700 dark:text-purple-400",
    activeRing: "ring-purple-500/50",
    activeBg: "bg-purple-500",
  },
  {
    value: "NATIONAL_5",
    label: "National 5",
    shortLabel: "N5",
    color: "from-pink-400 to-pink-500 dark:from-pink-500 dark:to-pink-600",
    textColor: "text-pink-500 dark:text-pink-400",
    borderColor: "border-pink-500/30 dark:border-pink-500/20",
    badgeBg: "bg-pink-50 dark:bg-pink-950/20",
    badgeText: "text-pink-700 dark:text-pink-400",
    activeRing: "ring-pink-500/50",
    activeBg: "bg-pink-500",
  },
  {
    value: "NATIONAL_6",
    label: "National 6",
    shortLabel: "N6",
    color: "from-rose-400 to-rose-500 dark:from-rose-500 dark:to-rose-600",
    textColor: "text-rose-500 dark:text-rose-450",
    borderColor: "border-rose-500/30 dark:border-rose-500/20",
    badgeBg: "bg-rose-50 dark:bg-rose-950/20",
    badgeText: "text-rose-700 dark:text-rose-400",
    activeRing: "ring-rose-500/50",
    activeBg: "bg-rose-500",
  },
  {
    value: "NATIONAL_7",
    label: "National 7",
    shortLabel: "N7",
    color: "from-amber-400 to-amber-500 dark:from-amber-500 dark:to-amber-600",
    textColor: "text-amber-500 dark:text-amber-400",
    borderColor: "border-amber-500/30 dark:border-amber-500/20",
    badgeBg: "bg-amber-50 dark:bg-amber-950/20",
    badgeText: "text-amber-700 dark:text-amber-400",
    activeRing: "ring-amber-500/50",
    activeBg: "bg-amber-500",
  },
];

export function getLevelConfig(value: StudentLevel | null | undefined): LevelConfig {
  const found = STUDENT_LEVELS.find((l) => l.value === value);
  return found || STUDENT_LEVELS[0];
}
