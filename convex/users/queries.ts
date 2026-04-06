import { query } from '../_generated/server'
import { getCurrentUser } from '../lib/auth'

/**
 * Returns the currently authenticated user's full Convex record.
 * Used by the `_authenticated` loader and the home page.
 */
export const getCurrentUser_public = query({
  args: {},
  handler: async (ctx) => {
    return await getCurrentUser(ctx)
  },
})
