import { internalMutation } from '../_generated/server'

/**
 * One-shot fix for users whose `firstName` was corrupted to be their own
 * email address. Root cause was the `/` loader falling back to
 * `auth.user.email` when WorkOS returned no first name, which `handleLogin`
 * then stored on the user row and re-applied on every subsequent login.
 *
 * After fixing the root cause in `src/routes/index.tsx` and
 * `convex/auth/mutations.ts`, run this migration once to clean up any
 * existing users whose `firstName === email`. It finds their accepted
 * invitation (by email) and copies `firstName` / `lastName` back from
 * there (the name the inviter typed when creating the invite).
 *
 * Safe to re-run: users whose firstName does not match their email are
 * left untouched.
 *
 * Usage:
 *   npx convex run migrations/fixUserNames:run
 */
export const run = internalMutation({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query('users').collect()

    let fixed = 0
    let noInvitation = 0
    let skipped = 0

    for (const user of users) {
      if (user.firstName !== user.email) {
        skipped++
        continue
      }

      // Find the invitation the user accepted (by email + ACCEPTED status).
      const invitation = await ctx.db
        .query('invitations')
        .withIndex('by_email_and_status', (q) =>
          q.eq('email', user.email).eq('status', 'ACCEPTED'),
        )
        .order('desc')
        .first()

      if (!invitation) {
        noInvitation++
        continue
      }

      // Only patch if the invitation has a meaningful name (not also email).
      if (!invitation.firstName || invitation.firstName === user.email) {
        noInvitation++
        continue
      }

      await ctx.db.patch(user._id, {
        firstName: invitation.firstName,
        lastName: invitation.lastName,
      })
      fixed++
    }

    return {
      totalUsers: users.length,
      fixed,
      noInvitation,
      skipped,
    }
  },
})
