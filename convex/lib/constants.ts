// ---------------------------------------------------------------------------
// Shared constants used across Convex backend modules.
// Keep this file free of Convex runtime imports so it can also be consumed
// from the frontend via relative path when needed.
// ---------------------------------------------------------------------------

// --- Time -------------------------------------------------------------------

/** Milliseconds in one day (24 h). */
export const MS_PER_DAY = 24 * 60 * 60 * 1000

/** Milliseconds in seven days — used for invitation / link expiry. */
export const SEVEN_DAYS_MS = 7 * MS_PER_DAY

// --- Communications ---------------------------------------------------------

/** After this many ms of inactivity a conversation is auto-closed (30 min). */
export const CONVERSATION_INACTIVITY_MS = 30 * 60 * 1000

/** Max simultaneous active + escalated conversations per resident. */
export const MAX_ACTIVE_CONVERSATIONS = 5

/** Lookback window for detecting recurring tickets from the same resident. */
export const RECURRENCE_LOOKBACK_MS = 90 * MS_PER_DAY

// --- Slug validation --------------------------------------------------------

export const SLUG_MIN = 3
export const SLUG_MAX = 40
export const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export const RESERVED_SLUGS: ReadonlySet<string> = new Set([
  'synnova-internal',
  'demo-conjunto',
  'api',
  'www',
  'admin',
  'app',
  'auth',
  'login',
  'logout',
])
