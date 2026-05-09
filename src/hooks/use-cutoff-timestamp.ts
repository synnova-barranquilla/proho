const MS_PER_DAY = 24 * 60 * 60 * 1000
const FIVE_MINUTES = 5 * 60_000

/**
 * Rounds Date.now() to the nearest 5-minute window. This produces the
 * same value across mount/unmount cycles (Suspense), preventing
 * Convex query key churn that causes infinite subscription loops.
 */
function stableNow(): number {
  return Math.floor(Date.now() / FIVE_MINUTES) * FIVE_MINUTES
}

/**
 * Returns a stable cutoff timestamp (now - daysAgo).
 * Deterministic within a 5-minute window regardless of remounts.
 */
export function useCutoffTimestamp(daysAgo: number): number {
  return stableNow() - daysAgo * MS_PER_DAY
}

/**
 * Returns a stable cutoff timestamp from a period in milliseconds.
 * Returns undefined when periodMs is 0 (meaning "all time").
 * Deterministic within a 5-minute window regardless of remounts.
 */
export function usePeriodCutoff(periodMs: number): number | undefined {
  if (periodMs <= 0) return undefined
  return stableNow() - periodMs
}

/**
 * Returns a stable start-of-day timestamp in the user's local timezone.
 * Deterministic within the same calendar day.
 */
export function useStartOfDayTimestamp(): number {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}
