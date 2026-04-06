import { v } from 'convex/values'

import { query } from '../_generated/server'
import { requireOrgRole } from '../lib/auth'

/**
 * Lists invitations for a given organization.
 * - SUPER_ADMIN can list any org.
 * - ADMIN can only list invitations of their own org.
 */
export const listByOrganization = query({
  args: {
    organizationId: v.id('organizations'),
  },
  handler: async (ctx, args) => {
    const caller = await requireOrgRole(ctx, ['SUPER_ADMIN', 'ADMIN'])

    if (
      caller.orgRole === 'ADMIN' &&
      caller.organizationId !== args.organizationId
    ) {
      throw new Error(
        'Forbidden: cannot list invitations of another organization',
      )
    }

    return await ctx.db
      .query('invitations')
      .withIndex('by_organization_id_and_status', (q) =>
        q.eq('organizationId', args.organizationId),
      )
      .collect()
  },
})
