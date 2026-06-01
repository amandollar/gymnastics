import type { WeekdayName } from "@/lib/plan/calculations";

export const PLAN_DAY_OPTIONS: { short: string; name: WeekdayName }[] = [
  { short: "Mon", name: "Monday" },
  { short: "Tue", name: "Tuesday" },
  { short: "Wed", name: "Wednesday" },
  { short: "Thu", name: "Thursday" },
  { short: "Fri", name: "Friday" },
  { short: "Sat", name: "Saturday" },
  { short: "Sun", name: "Sunday" },
];

export const planInputClass =
  "w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-brand-orange-500/20 focus:border-brand-orange-500";
