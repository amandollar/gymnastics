import type { PlanTypeKey } from "./calculations";

/** Default per-class rates from GYM_TAG_OG.xlsx Fees Calculator sheet */
export const DEFAULT_REGULAR_PRICING: Record<number, number> = {
  1: 400,
  2: 325,
  3: 267,
  4: 245,
  5: 220,
  6: 208,
};

export const DEFAULT_ONE_TO_ONE_PRICING: Record<number, number> = {
  1: 1100,
  2: 1000,
  3: 900,
  4: 850,
  5: 800,
  6: 750,
};

export type PricingMaps = Record<PlanTypeKey, Record<number, number>>;

export function getDefaultPricingMaps(): PricingMaps {
  return {
    REGULAR: { ...DEFAULT_REGULAR_PRICING },
    ONE_TO_ONE: { ...DEFAULT_ONE_TO_ONE_PRICING },
  };
}
