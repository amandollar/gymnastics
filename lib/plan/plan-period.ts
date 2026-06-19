import { parseDateInput, toDateInputValue } from "@/lib/utils/student";

/** Set end date for a 1- or 3-month plan window (inclusive range). */
export function endDateForPlanMonths(
  startDateYmd: string,
  months: 1 | 3
): string {
  const start = parseDateInput(startDateYmd);
  const day = start.getDate();
  const offset = day < 15 ? months - 1 : months;
  const end = new Date(start.getFullYear(), start.getMonth() + offset + 1, 0);
  return toDateInputValue(end);
}
