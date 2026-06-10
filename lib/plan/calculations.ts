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
  const pricePerSession = getPricePerSession(
    input.planType,
    sessionsPerWeek,
    input.pricingMaps
  );
  const grossFees = Math.round(totalSessions * pricePerSession);
  const fee = Math.round(grossFees - (grossFees * discountPercent) / 100);

  const diffDays = differenceInDays(input.endDate, input.startDate);
  const planMonths: 1 | 3 | null =
    diffDays <= 31 ? 1 : diffDays <= 93 ? 3 : null;

  // Grace days: from DB map, or formula fallback
  const graceDays =
    planMonths !== null
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
