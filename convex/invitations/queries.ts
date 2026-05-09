import { v } from 'convex/values'

import { query } from '../_generated/server'
import { getCurrentUser, requireOrgRole } from '../lib/auth'
import { ERROR_CODES, throwConvexError } from '../lib/errors'

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
      throwConvexError(
        ERROR_CODES.FORBIDDEN,
        'Cannot list invitations of another organization',
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

/**
 * Lists all PENDING invitations in the system with their organization and
 * invitedBy user embedded. Only SUPER_ADMIN can call this.
 *
 * Used by `/super-admin/usuarios` for the "Pendientes" table.
 */
export const listAllPendingWithOrg = query({
  args: {},
  handler: async (ctx) => {
    await requireOrgRole(ctx, ['SUPER_ADMIN'])

    const orgs = await ctx.db.query('organizations').collect()

    const pendingByOrg = await Promise.all(
      orgs.map((org) =>
        ctx.db
          .query('invitations')
          .withIndex('by_organization_id_and_status', (q) =>
            q.eq('organizationId', org._id).eq('status', 'PENDING'),
          )
          .collect(),
      ),
    )

    const invitations = pendingByOrg.flat()

    const invitedByIds = [...new Set(invitations.map((inv) => inv.invitedBy))]
    const users = await Promise.all(invitedByIds.map((id) => ctx.db.get(id)))
    const userMap = new Map(
      users
        .filter((u): u is NonNullable<typeof u> => u !== null)
        .map((u) => [u._id, u]),
    )

    const orgMap = new Map(orgs.map((o) => [o._id, o]))

    return invitations
      .sort((a, b) => b._creationTime - a._creationTime)
      .map((inv) => ({
        ...inv,
        organization: orgMap.get(inv.organizationId) ?? null,
        invitedByUser: userMap.get(inv.invitedBy) ?? null,
      }))
  },
})

/**
 * Lists pending ADMIN org-level invitations for the authenticated user's
 * organization. Only accessible for org owners.
 *
 * "Pending org-level" means:
 *   - `status === 'PENDING'`
 *   - `orgRole === 'ADMIN'`
 *   - `complexId === undefined` (complex-scoped ones don't apply here; those
 *     are listed from `/admin/c/$complexId/usuarios`)
 *
 * Used by `/admin/equipo` to show the "Pending invitations" section
 * alongside the table of already active administrators.
 */
export const listPendingOrgAdminInvitations = query({
  args: {
    organizationId: v.optional(v.id('organizations')),
  },
  handler: async (ctx, args) => {
    const caller = await getCurrentUser(ctx)
    if (!caller) return []
    if (caller.orgRole === 'ADMIN' && caller.isOrgOwner !== true) return []

    const orgId =
      caller.orgRole === 'SUPER_ADMIN' && args.organizationId
        ? args.organizationId
        : caller.organizationId

    const pending = await ctx.db
      .query('invitations')
      .withIndex('by_organization_id_and_status', (q) =>
        q.eq('organizationId', orgId).eq('status', 'PENDING'),
      )
      .collect()

    return pending.filter(
      (inv) => inv.orgRole === 'ADMIN' && inv.complexId === undefined,
    )
  },
})
