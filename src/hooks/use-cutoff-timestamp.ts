import { useMemo } from 'react'

const MS_PER_DAY = 24 * 60 * 60 * 1000

/**
 * Returns a stable cutoff timestamp (now - daysAgo) that only changes
 * once per minute, preventing Convex query cache invalidation on every render.
 */
export function useCutoffTimestamp(daysAgo: number): number {
  const minuteBucket = Math.floor(Date.now() / 60_000)
  return useMemo(
    () => Date.now() - daysAgo * MS_PER_DAY,
    [daysAgo, minuteBucket],
  )
}

/**
 * Returns a stable start-of-day timestamp in the user's local timezone.
 * Only recomputes when the calendar day changes.
 */
export function useStartOfDayTimestamp(): number {
  const now = new Date()
  const dayKey = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`
  return useMemo(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d.getTime()
  }, [dayKey])
}
