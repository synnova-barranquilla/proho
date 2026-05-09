import { HOUR, MINUTE, RateLimiter } from '@convex-dev/rate-limiter'

import { components } from '../_generated/api'

export const rateLimiter = new RateLimiter(components.rateLimiter, {
  handleLogin: {
    kind: 'token bucket',
    rate: 10,
    period: MINUTE,
    capacity: 10,
  },
  inviteUser: {
    kind: 'token bucket',
    rate: 10,
    period: MINUTE,
    capacity: 10,
  },
  sendMessage: {
    kind: 'token bucket',
    rate: 20,
    period: MINUTE,
    capacity: 20,
  },
  createBooking: {
    kind: 'token bucket',
    rate: 5,
    period: MINUTE,
    capacity: 5,
  },
  bulkImport: {
    kind: 'fixed window',
    rate: 5,
    period: HOUR,
  },
})
