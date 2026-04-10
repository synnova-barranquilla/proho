import { v } from 'convex/values'

import { mutation } from '../_generated/server'
import { requireConjuntoAccess, requireOrgRole } from '../lib/auth'
import { ERROR_CODES, throwConvexError } from '../lib/errors'
import { conjuntoRoles } from './validators'

/**
 * Crea una nueva membership para un user existente en un conjunto específico.
 *
 * Reglas:
 * - El caller debe tener acceso al conjunto con rol ADMIN (owner o ADMIN membership).
 * - El target user debe pertenecer a la misma organización que el conjunto.
 * - No puede existir otra membership (activa o inactiva) para el mismo par
 *   (userId, conjuntoId). Si ya existe y está inactiva, usar `setActive`.
 *
 * Usado por:
 * - `/admin/equipo` al agregar acceso de un ADMIN a un conjunto nuevo.
 * - Flujos internos de aceptación de invitations (handleLogin en Paso 3).
 */
export const create = mutation({
  args: {
    userId: v.id('users'),
    conjuntoId: v.id('conjuntos'),
    role: conjuntoRoles,
  },
  handler: async (ctx, args) => {
    const { user: caller, conjunto } = await requireConjuntoAccess(
      ctx,
      args.conjuntoId,
      { allowedRoles: ['ADMIN'] },
    )

    const target = await ctx.db.get(args.userId)
    if (!target) {
      throwConvexError(ERROR_CODES.FORBIDDEN, 'Usuario objetivo no encontrado')
    }
    if (target.organizationId !== conjunto.organizationId) {
      throwConvexError(
        ERROR_CODES.FORBIDDEN,
        'El usuario no pertenece a la misma organización del conjunto',
      )
    }

    const existing = await ctx.db
      .query('conjuntoMemberships')
      .withIndex('by_user_and_conjunto', (q) =>
        q.eq('userId', args.userId).eq('conjuntoId', args.conjuntoId),
      )
      .unique()

    if (existing) {
      if (!existing.active) {
        // Reactivate a previously revoked membership instead of rejecting.
        await ctx.db.patch(existing._id, {
          active: true,
          role: args.role,
          assignedBy: caller._id,
          assignedAt: Date.now(),
        })
        return { membershipId: existing._id }
      }
      throwConvexError(
        ERROR_CODES.MEMBERSHIP_ALREADY_EXISTS,
        'El usuario ya tiene una membership activa para este conjunto',
      )
    }

    // Solo un owner puede marcar createdByOwner=true. Los ADMIN no-owner que
    // creen memberships desde la pantalla de equipo generan createdByOwner=false.
    const createdByOwner =
      caller.orgRole === 'ADMIN' && caller.isOrgOwner === true

    const membershipId = await ctx.db.insert('conjuntoMemberships', {
      userId: args.userId,
      conjuntoId: args.conjuntoId,
      role: args.role,
      active: true,
      assignedBy: caller._id,
      assignedAt: Date.now(),
      createdByOwner,
    })

    return { membershipId }
  },
})

/**
 * Cambia el rol de una membership existente. Solo ADMIN del conjunto.
 */
export const updateRole = mutation({
  args: {
    membershipId: v.id('conjuntoMemberships'),
    role: conjuntoRoles,
  },
  handler: async (ctx, args) => {
    const membership = await ctx.db.get(args.membershipId)
    if (!membership) {
      throwConvexError(
        ERROR_CODES.MEMBERSHIP_NOT_FOUND,
        'Membership no encontrada',
      )
    }

    await requireConjuntoAccess(ctx, membership.conjuntoId, {
      allowedRoles: ['ADMIN'],
    })

    await ctx.db.patch(args.membershipId, { role: args.role })
    return { success: true }
  },
})

/**
 * Activa/desactiva una membership. Desactivar equivale a revocar acceso
 * (el user pierde acceso al conjunto pero la fila queda para auditoría).
 */
export const setActive = mutation({
  args: {
    membershipId: v.id('conjuntoMemberships'),
    active: v.boolean(),
  },
  handler: async (ctx, args) => {
    const membership = await ctx.db.get(args.membershipId)
    if (!membership) {
      throwConvexError(
        ERROR_CODES.MEMBERSHIP_NOT_FOUND,
        'Membership no encontrada',
      )
    }

    await requireConjuntoAccess(ctx, membership.conjuntoId, {
      allowedRoles: ['ADMIN'],
    })

    const patch: Partial<typeof membership> = { active: args.active }
    if (!args.active) {
      patch.revokedAt = Date.now()
    } else {
      patch.revokedAt = undefined
    }

    await ctx.db.patch(args.membershipId, patch)
    return { success: true }
  },
})

/**
 * Elimina físicamente una membership. Preferir `setActive(false)` para
 * preservar auditoría. Esta función existe para limpiar errores de data entry.
 * Solo ADMIN owner de la org (no ADMIN no-owner) puede eliminar.
 */
export const remove = mutation({
  args: {
    membershipId: v.id('conjuntoMemberships'),
  },
  handler: async (ctx, args) => {
    const caller = await requireOrgRole(ctx, ['ADMIN', 'SUPER_ADMIN'])
    const membership = await ctx.db.get(args.membershipId)
    if (!membership) {
      throwConvexError(
        ERROR_CODES.MEMBERSHIP_NOT_FOUND,
        'Membership no encontrada',
      )
    }

    // Verificar que el conjunto pertenece a la org del caller (excepto SUPER_ADMIN)
    if (caller.orgRole === 'ADMIN') {
      if (caller.isOrgOwner !== true) {
        throwConvexError(
          ERROR_CODES.FORBIDDEN,
          'Solo un owner puede eliminar memberships',
        )
      }
      const conjunto = await ctx.db.get(membership.conjuntoId)
      if (!conjunto || conjunto.organizationId !== caller.organizationId) {
        throwConvexError(
          ERROR_CODES.FORBIDDEN,
          'Conjunto fuera de tu organización',
        )
      }
    }

    await ctx.db.delete(args.membershipId)
    return { success: true }
  },
})
