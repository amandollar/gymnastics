import { parseDateInput, toDateInputValue } from "@/lib/utils/student";

/** Set end date for a 1- or 3-month plan window (inclusive range). */
export function endDateForPlanMonths(
  startDateYmd: string,
  months: 1 | 3
): string {
  const start = parseDateInput(startDateYmd);
  const end = new Date(start);
  end.setMonth(end.getMonth() + months);
  end.setDate(end.getDate() - 1);
  return toDateInputValue(end);
}
