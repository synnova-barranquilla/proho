import { v } from 'convex/values'

import { internalMutation } from './_generated/server'

/**
 * Bootstrap the system with the initial SUPER_ADMIN user and two
 * organizations: "Synnova Internal" (owner of the super admin) and
 * "Demo Conjunto" (sandbox for manual testing of invitations during F2-F11).
 *
 * Idempotent: safe to re-run. Existing records are detected by slug/workosUserId
 * and not duplicated.
 *
 * Invoked via the CLI script `tools/scripts/convex/super_admin_bootstrap.ts`.
 */
export const bootstrap = internalMutation({
  args: {
    superAdminEmail: v.string(),
    superAdminName: v.string(),
    superAdminWorkosId: v.string(),
  },
  handler: async (ctx, args) => {
    // 1. Synnova internal org
    let synnovaOrg = await ctx.db
      .query('organizations')
      .withIndex('by_slug', (q) => q.eq('slug', 'synnova-internal'))
      .unique()
    if (!synnovaOrg) {
      const id = await ctx.db.insert('organizations', {
        slug: 'synnova-internal',
        name: 'Synnova',
        active: true,
      })
      synnovaOrg = await ctx.db.get(id)
    }

    // 2. Demo conjunto org (sandbox for manual testing)
    let demoOrg = await ctx.db
      .query('organizations')
      .withIndex('by_slug', (q) => q.eq('slug', 'demo-conjunto'))
      .unique()
    if (!demoOrg) {
      const id = await ctx.db.insert('organizations', {
        slug: 'demo-conjunto',
        name: 'Demo Conjunto',
        active: true,
      })
      demoOrg = await ctx.db.get(id)
    }

    // 3. Super admin user
    const existingUser = await ctx.db
      .query('users')
      .withIndex('by_workos_user_id', (q) =>
        q.eq('workosUserId', args.superAdminWorkosId),
      )
      .unique()

    if (existingUser) {
      return {
        status: 'already_exists' as const,
        userId: existingUser._id,
        synnovaOrgId: synnovaOrg!._id,
        demoOrgId: demoOrg!._id,
      }
    }

    const userId = await ctx.db.insert('users', {
      email: args.superAdminEmail,
      name: args.superAdminName,
      workosUserId: args.superAdminWorkosId,
      organizationId: synnovaOrg!._id,
      orgRole: 'SUPER_ADMIN',
      active: true,
    })

    return {
      status: 'created' as const,
      userId,
      synnovaOrgId: synnovaOrg!._id,
      demoOrgId: demoOrg!._id,
    }
  },
})
