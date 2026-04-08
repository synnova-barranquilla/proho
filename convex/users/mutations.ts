import { v } from 'convex/values'

import { mutation } from '../_generated/server'
import { requireOrgRole } from '../lib/auth'
import { ERROR_CODES, throwConvexError } from '../lib/errors'

/**
 * F4: Activa/desactiva un ADMIN de la org. Solo un org owner puede hacerlo.
 * - No se puede desactivar a uno mismo.
 * - No se puede desactivar a otro owner (un owner debe degradarse a sí mismo
 *   primero, o el cambio de owners se maneja manualmente desde super-admin).
 * - El user objetivo debe pertenecer a la misma org del caller.
 */
export const setUserActive = mutation({
  args: {
    userId: v.id('users'),
    active: v.boolean(),
  },
  handler: async (ctx, args) => {
    const caller = await requireOrgRole(ctx, ['ADMIN', 'SUPER_ADMIN'])

    // SUPER_ADMIN puede siempre; ADMINs solo owners
    if (caller.orgRole === 'ADMIN' && caller.isOrgOwner !== true) {
      throwConvexError(
        ERROR_CODES.FORBIDDEN,
        'Solo un owner de la organización puede activar/desactivar usuarios',
      )
    }

    const target = await ctx.db.get(args.userId)
    if (!target) {
      throwConvexError(ERROR_CODES.FORBIDDEN, 'Usuario objetivo no encontrado')
    }

    if (caller.orgRole === 'ADMIN') {
      if (target.organizationId !== caller.organizationId) {
        throwConvexError(
          ERROR_CODES.FORBIDDEN,
          'No puedes modificar usuarios fuera de tu organización',
        )
      }
      if (target._id === caller._id) {
        throwConvexError(
          ERROR_CODES.FORBIDDEN,
          'No puedes desactivar tu propia cuenta',
        )
      }
      if (target.isOrgOwner === true) {
        throwConvexError(
          ERROR_CODES.FORBIDDEN,
          'No puedes modificar a otro owner de la organización',
        )
      }
    }

    await ctx.db.patch(args.userId, { active: args.active })
    return { success: true }
  },
})
