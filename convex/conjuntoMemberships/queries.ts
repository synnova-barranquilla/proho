import { v } from 'convex/values'

import { query } from '../_generated/server'
import { requireConjuntoAccess, requireOrgRole, requireUser } from '../lib/auth'

/**
 * Lista las memberships activas del usuario autenticado.
 * Útil para resolver "a qué conjuntos tiene acceso este user" desde el cliente.
 */
export const listForCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx)
    return await ctx.db
      .query('conjuntoMemberships')
      .withIndex('by_user_id', (q) => q.eq('userId', user._id))
      .filter((q) => q.eq(q.field('active'), true))
      .collect()
  },
})

/**
 * Lista los usuarios con acceso a un conjunto, filtrados opcionalmente por rol.
 * Incluye el documento del user embebido. Usado por:
 * - `/admin/c/$id/usuarios` para ver VIGILANTE/ASISTENTE
 * - `/admin/equipo` (owners) para ver quién tiene `role: ADMIN` en cada conjunto
 */
export const listByConjunto = query({
  args: {
    conjuntoId: v.id('conjuntos'),
    role: v.optional(
      v.union(
        v.literal('ADMIN'),
        v.literal('ASISTENTE'),
        v.literal('VIGILANTE'),
        v.literal('RESIDENTE'),
      ),
    ),
  },
  handler: async (ctx, args) => {
    await requireConjuntoAccess(ctx, args.conjuntoId, {
      allowedRoles: ['ADMIN'],
    })

    const memberships = args.role
      ? await ctx.db
          .query('conjuntoMemberships')
          .withIndex('by_conjunto_and_role', (q) =>
            q.eq('conjuntoId', args.conjuntoId).eq('role', args.role!),
          )
          .collect()
      : await ctx.db
          .query('conjuntoMemberships')
          .withIndex('by_conjunto_id', (q) =>
            q.eq('conjuntoId', args.conjuntoId),
          )
          .collect()

    const users = await Promise.all(
      memberships.map((m) => ctx.db.get(m.userId)),
    )

    return memberships.map((m, i) => ({ ...m, user: users[i] }))
  },
})

/**
 * Lista todas las memberships de tipo ADMIN para una organización completa.
 * Usado por la pantalla `/admin/equipo` (solo owners).
 */
export const listOrgAdminMemberships = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireOrgRole(ctx, ['ADMIN', 'SUPER_ADMIN'])
    if (user.orgRole === 'ADMIN' && user.isOrgOwner !== true) {
      return []
    }

    const orgConjuntos = await ctx.db
      .query('conjuntos')
      .withIndex('by_organization_id', (q) =>
        q.eq('organizationId', user.organizationId),
      )
      .collect()

    const all = await Promise.all(
      orgConjuntos.map((c) =>
        ctx.db
          .query('conjuntoMemberships')
          .withIndex('by_conjunto_and_role', (q) =>
            q.eq('conjuntoId', c._id).eq('role', 'ADMIN'),
          )
          .collect(),
      ),
    )

    return all.flat().filter((m) => m.active)
  },
})
