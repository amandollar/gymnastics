/**
 * Computes the fraction of the month that the employee was active.
 * Used to pro-rate fixed salary and PT commissions.
 * 
 * @param joinDate The join date of the employee
 * @param leftDate The departure date of the employee (or null if still working)
 * @param year The target year (e.g. 2026)
 * @param month The target month, 1-indexed (1 = January, 12 = December)
 * @returns A multiplier between 0 and 1 representing the fraction of the month worked
 */
export function getMonthSalaryMultiplier(
  joinDate: Date | string,
  leftDate: Date | string | null,
  year: number,
  month: number
): number {
  const join = new Date(joinDate);
  const left = leftDate ? new Date(leftDate) : null;

  // Create start and end of target month
  const startOfMonth = new Date(year, month - 1, 1, 0, 0, 0, 0);
  const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);
  const totalDaysInMonth = new Date(year, month, 0).getDate();

  // If joinDate is after the end of this month, they haven't joined yet
  if (join > endOfMonth) {
    return 0;
  }

  // If they left before this month started, they get 0
  if (left && left < startOfMonth) {
    return 0;
  }

  // Determine which day they started in this month
  let startDay = 1;
  if (join >= startOfMonth && join <= endOfMonth) {
    startDay = join.getDate();
  }

  // Determine which day they left in this month
  let endDay = totalDaysInMonth;
  if (left && left >= startOfMonth && left <= endOfMonth) {
    endDay = left.getDate();
  }

  const activeDays = Math.max(0, endDay - startDay + 1);
  return activeDays / totalDaysInMonth;
}
