/**
 * Grace period utility functions for client and server.
 * Keyed by "sessionsPerWeek:planMonths" → graceDays.
 * planMonths is 1 or 3. sessionsPerWeek is 1–4 (or more).
 */
export type GracePeriodMap = Record<string, number>;

/**
 * Compute the default grace days using the business formula:
 *   graceDays = sessionsPerWeek × planMonths × 2
 *
 * Exception: sessionsPerWeek === 1 → always 0 (no grace).
 */
export function computeDefaultGraceDays(
  sessionsPerWeek: number,
  planMonths: number
): number {
  if (sessionsPerWeek <= 1) return 0;
  return sessionsPerWeek * planMonths * 2;
}

/** Build a key for the grace period map. */
export function gracePeriodKey(sessionsPerWeek: number, planMonths: number): string {
  return `${sessionsPerWeek}:${planMonths}`;
}

/**
 * Returns the configured grace days for a (sessionsPerWeek, planMonths) pair.
 * Falls back to the formula if no custom setting exists in the map.
 */
export function lookupGraceDays(
  map: GracePeriodMap,
  sessionsPerWeek: number,
  planMonths: number
): number {
  const key = gracePeriodKey(sessionsPerWeek, planMonths);
  if (key in map) return map[key];
  return computeDefaultGraceDays(sessionsPerWeek, planMonths);
}
