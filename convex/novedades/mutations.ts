import { v } from 'convex/values'

import { mutation } from '../_generated/server'
import { requireConjuntoAccess } from '../lib/auth'
import { ERROR_CODES, throwConvexError } from '../lib/errors'

/**
 * Crear novedad manual del vigilante.
 * Solo requiere descripción — tipo siempre es MANUAL.
 */
export const crearManual = mutation({
  args: {
    conjuntoId: v.id('conjuntos'),
    descripcion: v.string(),
  },
  handler: async (ctx, args) => {
    const { user } = await requireConjuntoAccess(ctx, args.conjuntoId, {
      allowedRoles: ['VIGILANTE', 'ADMIN'],
    })

    const descripcion = args.descripcion.trim()
    if (!descripcion) {
      throwConvexError(ERROR_CODES.VALIDATION_ERROR, 'Descripción obligatoria')
    }

    const novedadId = await ctx.db.insert('novedades', {
      conjuntoId: args.conjuntoId,
      tipo: 'MANUAL',
      descripcion,
      vigilanteId: user._id,
      creadoEn: Date.now(),
    })

    return { novedadId }
  },
})
