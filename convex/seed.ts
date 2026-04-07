import { v } from 'convex/values'

import { internalMutation } from './_generated/server'
import { INTERNAL_ORG_SLUG } from './lib/organizations'

const DEMO_ORG_SLUG = 'demo-conjunto'

/**
 * Bootstrap the system with the initial SUPER_ADMIN user and two
 * organizations: "Synnova Internal" (owner of the super admin) and
 * "Demo Conjunto" (sandbox for manual testing of invitations during F2-F11).
 *
 * Both orgs start with `activeModules: []` — no modules enabled by default.
 *
 * Idempotent: safe to re-run. Existing records are detected by slug/workosUserId
 * and not duplicated.
 *
 * Invoked via the CLI script `tools/scripts/convex/super_admin_bootstrap.ts`.
 */
export const bootstrap = internalMutation({
  args: {
    superAdminEmail: v.string(),
    superAdminFirstName: v.string(),
    superAdminLastName: v.optional(v.string()),
    superAdminWorkosId: v.string(),
  },
  handler: async (ctx, args) => {
    // 1. Synnova internal org
    let synnovaOrg = await ctx.db
      .query('organizations')
      .withIndex('by_slug', (q) => q.eq('slug', INTERNAL_ORG_SLUG))
      .unique()
    if (!synnovaOrg) {
      const id = await ctx.db.insert('organizations', {
        slug: INTERNAL_ORG_SLUG,
        name: 'Synnova',
        active: true,
        activeModules: [],
      })
      synnovaOrg = await ctx.db.get(id)
    }

    // 2. Demo conjunto org (sandbox for manual testing)
    let demoOrg = await ctx.db
      .query('organizations')
      .withIndex('by_slug', (q) => q.eq('slug', DEMO_ORG_SLUG))
      .unique()
    if (!demoOrg) {
      const id = await ctx.db.insert('organizations', {
        slug: DEMO_ORG_SLUG,
        name: 'Demo Conjunto',
        active: true,
        activeModules: [],
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
      firstName: args.superAdminFirstName,
      lastName: args.superAdminLastName,
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
