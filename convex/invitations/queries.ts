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

    const [invitations, orgs, users] = await Promise.all([
      ctx.db.query('invitations').order('desc').collect(),
      ctx.db.query('organizations').collect(),
      ctx.db.query('users').collect(),
    ])

    const orgMap = new Map(orgs.map((o) => [o._id, o]))
    const userMap = new Map(users.map((u) => [u._id, u]))

    return invitations
      .filter((inv) => inv.status === 'PENDING')
      .map((inv) => ({
        ...inv,
        organization: orgMap.get(inv.organizationId) ?? null,
        invitedByUser: userMap.get(inv.invitedBy) ?? null,
      }))
  },
})

/**
 * F4: Lista las invitaciones pendientes de rol ADMIN a nivel org para la
 * organización del usuario autenticado. Solo accesible para org owners.
 *
 * "Pendientes a nivel org" significa:
 *   - `status === 'PENDING'`
 *   - `orgRole === 'ADMIN'`
 *   - `conjuntoId === undefined` (las conjunto-scoped no aplican aquí; esas
 *     se listan desde `/admin/c/$conjuntoId/usuarios`)
 *
 * Usada por `/admin/equipo` para mostrar la sección "Invitaciones pendientes"
 * junto a la tabla de administradores ya activos.
 */
export const listPendingOrgAdminInvitations = query({
  args: {},
  handler: async (ctx) => {
    const caller = await getCurrentUser(ctx)
    if (!caller) return []
    // Solo owners ven las invitaciones pendientes del equipo de la org.
    if (caller.orgRole === 'ADMIN' && caller.isOrgOwner !== true) return []

    const pending = await ctx.db
      .query('invitations')
      .withIndex('by_organization_id_and_status', (q) =>
        q.eq('organizationId', caller.organizationId).eq('status', 'PENDING'),
      )
      .collect()

    return pending.filter(
      (inv) => inv.orgRole === 'ADMIN' && inv.conjuntoId === undefined,
    )
  },
})
