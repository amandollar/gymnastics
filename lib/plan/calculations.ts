/** Plan pricing & session math — from feature-01 spec / GYM_TAG_OG.xlsx Fees Calculator */

import type { PricingMaps } from "./pricing-defaults";
import {
  DEFAULT_ONE_TO_ONE_PRICING,
  DEFAULT_REGULAR_PRICING,
  getDefaultPricingMaps,
} from "./pricing-defaults";

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
}

export interface PlanComputeResult {
  sessionsPerWeek: number;
  totalSessions: number;
  pricePerSession: number;
  grossFees: number;
  fee: number;
  discountPercent: number;
  validityDays: number;
  expiryDate: Date;
  planMonths: 1 | 3 | null;
}

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function differenceInDays(a: Date, b: Date): number {
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

function graceFactor(sessionsPerWeek: number): number {
  if (sessionsPerWeek === 2) return 4;
  if (sessionsPerWeek === 3 || sessionsPerWeek === 4) return 6;
  if (sessionsPerWeek >= 5) return 8;
  return 0;
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

  const rangeDays = Math.max(
    0,
    differenceInDays(input.endDate, input.startDate)
  );
  const planWeeks = Math.round(rangeDays / 30);
  const validityDays = planWeeks * graceFactor(sessionsPerWeek);

  const expiryDate = new Date(input.startDate);
  expiryDate.setDate(expiryDate.getDate() + validityDays);

  const diffDays = differenceInDays(input.endDate, input.startDate);
  const planMonths: 1 | 3 | null =
    diffDays <= 31 ? 1 : diffDays <= 93 ? 3 : null;

  return {
    sessionsPerWeek,
    totalSessions,
    pricePerSession,
    grossFees,
    fee,
    discountPercent,
    validityDays,
    expiryDate,
    planMonths,
  };
}

export function computeDaysLeft(expiryDate: Date, today = new Date()): number {
  return differenceInDays(expiryDate, today);
}
