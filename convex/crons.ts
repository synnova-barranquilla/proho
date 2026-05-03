import { cronJobs } from 'convex/server'

import { internal } from './_generated/api'

const crons = cronJobs()

// 6 AM Colombia time = 11:00 UTC
crons.daily(
  'daily-summary-email',
  { hourUTC: 11, minuteUTC: 0 },
  internal.email.actions.sendDailySummary,
)

// Close conversations inactive for 30+ minutes
crons.interval(
  'close-inactive-conversations',
  { minutes: 5 },
  internal.communications.actions.closeInactiveConversations,
)

export default crons
