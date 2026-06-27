/** Plan pricing & session math — from feature-01 spec / GYM_TAG_OG.xlsx Fees Calculator */

import type { PricingMaps } from "./pricing-defaults";
import {
  DEFAULT_ONE_TO_ONE_PRICING,
  DEFAULT_REGULAR_PRICING,
  getDefaultPricingMaps,
} from "./pricing-defaults";
import {
  lookupGraceDays,
  type GracePeriodMap,
} from "./grace-period-utils";

export type { PricingMaps } from "./pricing-defaults";

export const WEEKDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

export type WeekdayName = (typeof WEEKDAYS)[number];

/** @deprecated use getDefaultPricingMaps() — kept for imports */
export const REGULAR_PRICING = DEFAULT_REGULAR_PRICING;
export const ONE_TO_ONE_PRICING = DEFAULT_ONE_TO_ONE_PRICING;

export type PlanTypeKey = "REGULAR" | "ONE_TO_ONE";

export interface PlanComputeInput {
  planType: PlanTypeKey;
  startDate: Date;
  endDate: Date;
  selectedDays: WeekdayName[];
  discountPercent?: number;
  pricingMaps?: PricingMaps;
  /**
   * Grace period map from DB (see lib/services/grace-periods.ts).
   * If omitted the formula (sessionsPerWeek × planMonths × 2) is used.
   */
  gracePeriodMap?: GracePeriodMap;
  customBatchPricing?: Record<number, number | null> | null;
}

export interface PlanComputeResult {
  sessionsPerWeek: number;
  totalSessions: number;
  pricePerSession: number;
  grossFees: number;
  fee: number;
  discountPercent: number;
  /** Number of grace days added after endDate before plan becomes INACTIVE. */
  graceDays: number;
  /**
   * Grace-period deadline = endDate + graceDays.
   * Status is GRACE between endDate+1 and expiryDate (inclusive).
   * Status is INACTIVE after expiryDate.
   */
  expiryDate: Date;
  planMonths: 1 | 3 | null;
}

export function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function differenceInDays(a: Date, b: Date): number {
  const ms = startOfDay(a).getTime() - startOfDay(b).getTime();
  return Math.round(ms / 86400000);
}

export function countSessions(
  startDate: Date,
  endDate: Date,
  selectedDays: WeekdayName[]
): number {
  if (selectedDays.length === 0) return 0;
  const start = startOfDay(startDate);
  const end = startOfDay(endDate);
  if (end < start) return 0;

  let count = 0;
  const current = new Date(start);
  while (current <= end) {
    const dayName = WEEKDAYS[current.getDay()];
    if (selectedDays.includes(dayName)) count++;
    current.setDate(current.getDate() + 1);
  }
  return count;
}

export function getPricePerSession(
  planType: PlanTypeKey,
  sessionsPerWeek: number,
  pricingMaps: PricingMaps = getDefaultPricingMaps()
): number {
  const table = pricingMaps[planType];
  const spw = Math.min(6, Math.max(1, sessionsPerWeek));
  return table[spw] ?? table[1];
}

export function computePlanFields(input: PlanComputeInput): PlanComputeResult {
  const discountPercent = input.discountPercent ?? 0;
  const sessionsPerWeek = input.selectedDays.length;
  const totalSessions = countSessions(
    input.startDate,
    input.endDate,
    input.selectedDays
  );
  let pricePerSession = getPricePerSession(
    input.planType,
    sessionsPerWeek,
    input.pricingMaps
  );

  if (input.planType === "REGULAR" && input.customBatchPricing) {
    const customPrice = input.customBatchPricing[sessionsPerWeek];
    if (customPrice !== undefined && customPrice !== null) {
      pricePerSession = customPrice;
    }
  }

  const grossFees = Math.round(totalSessions * pricePerSession);
  const fee = Math.round(grossFees - (grossFees * discountPercent) / 100);

  const startDay = input.startDate.getDate();
  const monthDiff = (input.endDate.getMonth() - input.startDate.getMonth()) + 12 * (input.endDate.getFullYear() - input.startDate.getFullYear());
  const calculatedMonths = startDay < 15 ? monthDiff + 1 : monthDiff;
  const planMonths: 1 | 3 | null =
    calculatedMonths === 1 ? 1 : calculatedMonths === 3 ? 3 : null;

  // Grace days: from DB map, or formula fallback (only for REGULAR grouped class)
  const graceDays =
    input.planType === "REGULAR" && planMonths !== null
      ? lookupGraceDays(
          input.gracePeriodMap ?? {},
          sessionsPerWeek,
          planMonths
        )
      : 0;

  // expiryDate = endDate + graceDays
  const expiryDate = new Date(input.endDate);
  expiryDate.setDate(expiryDate.getDate() + graceDays);

  // validityDays kept for DB column compat — equals graceDays
  const validityDays = graceDays;

  return {
    sessionsPerWeek,
    totalSessions,
    pricePerSession,
    grossFees,
    fee,
    discountPercent,
    graceDays,
    expiryDate,
    planMonths,
    // keep validityDays accessible via spread — not in interface but stored in DB
    ...({ validityDays } as object),
  } as PlanComputeResult & { validityDays: number };
}

export function computeDaysLeft(expiryDate: Date, today = new Date()): number {
  return differenceInDays(expiryDate, today);
}

/**
 * Automatically selects 3 weekdays for a plan based on the lowest student load
 * in the selected batch, excluding Sundays and preferring alternate days.
 */
export function selectThreeDays(counts: Record<WeekdayName, number>): WeekdayName[] {
  const weekdays: WeekdayName[] = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  // Generate all 20 combinations of 3 days out of the 6 weekdays (excluding Sunday)
  const combinations: WeekdayName[][] = [];
  for (let i = 0; i < weekdays.length; i++) {
    for (let j = i + 1; j < weekdays.length; j++) {
      for (let k = j + 1; k < weekdays.length; k++) {
        combinations.push([weekdays[i], weekdays[j], weekdays[k]]);
      }
    }
  }

  // Helper to check if a combination has consecutive days
  const hasConsecutive = (comb: WeekdayName[]): boolean => {
    const idx0 = weekdays.indexOf(comb[0]);
    const idx1 = weekdays.indexOf(comb[1]);
    const idx2 = weekdays.indexOf(comb[2]);
    return (idx1 - idx0 === 1) || (idx2 - idx1 === 1);
  };

  // Helper to compute sum of students for a combination
  const getSum = (comb: WeekdayName[]): number => {
    return comb.reduce((sum, d) => sum + (counts[d] ?? 0), 0);
  };

  // 1. Find the naive selection (the 3 days with the lowest student count)
  const sortedDays = [...weekdays].sort((a, b) => (counts[a] ?? 0) - (counts[b] ?? 0));
  const naiveSelection: WeekdayName[] = [sortedDays[0], sortedDays[1], sortedDays[2]];

  // 2. If the naive selection does not have consecutive days, return it sorted by weekday order
  if (!hasConsecutive(naiveSelection)) {
    return naiveSelection.sort((a, b) => weekdays.indexOf(a) - weekdays.indexOf(b));
  }

  // 3. If it has consecutive days, try selecting alternate days (combinations with 0 consecutive days)
  const alternateCombinations = combinations.filter(comb => !hasConsecutive(comb));

  // Sort alternate combinations by their student count sum ascending
  alternateCombinations.sort((a, b) => getSum(a) - getSum(b));

  if (alternateCombinations.length > 0) {
    return alternateCombinations[0];
  }

  return naiveSelection.sort((a, b) => weekdays.indexOf(a) - weekdays.indexOf(b));
}
