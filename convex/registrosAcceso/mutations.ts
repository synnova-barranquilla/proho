import { v } from 'convex/values'

import type { Id } from '../_generated/dataModel'
import { mutation, type MutationCtx } from '../_generated/server'
import { requireConjuntoAccess } from '../lib/auth'
import { ERROR_CODES, throwConvexError } from '../lib/errors'
import { normalizePlaca } from '../lib/placa'
import { evaluateRules, type VehiculoAdentro } from '../lib/rulesEngine'
import { vehiculoTipos } from '../vehiculos/validators'
import { registroAccesoTipos } from './validators'

// ─── Helpers ───────────────────────────────────────────────────────────

async function getVehiculosUnidadAdentro(
  ctx: MutationCtx,
  conjuntoId: Id<'conjuntos'>,
  unidadId: Id<'unidades'>,
): Promise<VehiculoAdentro[]> {
  const registros = await ctx.db
    .query('registrosAcceso')
    .withIndex('by_conjunto_and_unidad', (q) =>
      q.eq('conjuntoId', conjuntoId).eq('unidadId', unidadId),
    )
    .collect()

  const activos = registros.filter(
    (r) => r.salidaEn === undefined && r.vehiculoId,
  )

  const result: VehiculoAdentro[] = []
  for (const r of activos) {
    const vehiculo = r.vehiculoId ? await ctx.db.get(r.vehiculoId) : null
    result.push({
      tipo: vehiculo?.tipo ?? 'CARRO',
      placaNormalizada: r.placaNormalizada,
      entradaEn: r.entradaEn,
    })
  }
  return result
}

// ─── Mutations ─────────────────────────────────────────────────────────

/**
 * Registrar ingreso de vehículo residente conocido.
 *
 * Flujo:
 * 1. Busca vehículo por placa
 * 2. Si no encontrado → retorna { found: false }
 * 3. Evalúa reglas server-side
 * 4. Si violaciones + sin justificación → retorna { requiresJustificacion, violations }
 * 5. Crea registro + novedades si aplica
 */
export const registrarIngreso = mutation({
  args: {
    conjuntoId: v.id('conjuntos'),
    placaRaw: v.string(),
    justificacion: v.optional(v.string()),
    novedad: v.optional(v.string()),
    forzarPermitido: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { user } = await requireConjuntoAccess(ctx, args.conjuntoId, {
      allowedRoles: ['VIGILANTE', 'ADMIN'],
    })

    const placaNormalizada = normalizePlaca(args.placaRaw)
    if (!placaNormalizada) {
      throwConvexError(ERROR_CODES.VALIDATION_ERROR, 'Placa obligatoria')
    }

    // Buscar vehículo registrado
    const vehiculo = await ctx.db
      .query('vehiculos')
      .withIndex('by_conjunto_and_placa', (q) =>
        q.eq('conjuntoId', args.conjuntoId).eq('placa', placaNormalizada),
      )
      .unique()

    if (!vehiculo) {
      return { found: false as const }
    }

    if (!vehiculo.active) {
      throwConvexError(
        ERROR_CODES.VEHICULO_NOT_FOUND,
        'El vehículo está desactivado',
      )
    }

    // Obtener unidad y config
    const unidad = await ctx.db.get(vehiculo.unidadId)
    if (!unidad) {
      throwConvexError(ERROR_CODES.UNIDAD_NOT_FOUND, 'Unidad no encontrada')
    }

    const config = await ctx.db
      .query('conjuntoConfig')
      .withIndex('by_conjunto_id', (q) => q.eq('conjuntoId', args.conjuntoId))
      .unique()

    // Obtener vehículos de la misma unidad actualmente dentro
    const vehiculosUnidadAdentro = await getVehiculosUnidadAdentro(
      ctx,
      args.conjuntoId,
      vehiculo.unidadId,
    )

    // Evaluar reglas server-side
    const ruleResult = evaluateRules({
      tipo: 'RESIDENTE',
      vehiculoTipo: vehiculo.tipo,
      unidadEnMora: unidad.enMora,
      vehiculosUnidadAdentro,
      config: config ?? {
        reglaIngresoEnMora: true,
        reglaVehiculoDuplicado: true,
        reglaPermanenciaMaxDias: 30,
      },
      ahora: Date.now(),
    })

    // Si hay violaciones y no se forzó el ingreso
    if (ruleResult.violations.length > 0 && !args.forzarPermitido) {
      return {
        found: true as const,
        requiresJustificacion: true,
        violations: ruleResult.violations,
      }
    }

    // Si se forzó pero no hay justificación
    if (ruleResult.violations.length > 0 && !args.justificacion?.trim()) {
      throwConvexError(
        ERROR_CODES.VALIDATION_ERROR,
        'Justificación obligatoria cuando hay reglas violadas',
      )
    }

    // Crear registro de acceso
    const registroId = await ctx.db.insert('registrosAcceso', {
      conjuntoId: args.conjuntoId,
      tipo: 'RESIDENTE',
      vehiculoId: vehiculo._id,
      placaRaw: args.placaRaw,
      placaNormalizada,
      unidadId: vehiculo.unidadId,
      entradaEn: Date.now(),
      decisionMotor: ruleResult.violations,
      decisionFinal: 'PERMITIDO',
      justificacion: args.justificacion?.trim() || undefined,
      novedad: args.novedad?.trim() || undefined,
      vigilanteId: user._id,
    })

    return {
      found: true as const,
      registroId,
      violations: ruleResult.violations,
      decisionFinal: 'PERMITIDO' as const,
    }
  },
})

/**
 * Registrar salida vehicular.
 * Si no hay registro activo (salida sin entrada), crea uno retroactivo.
 */
export const registrarSalida = mutation({
  args: {
    conjuntoId: v.id('conjuntos'),
    placaRaw: v.string(),
  },
  handler: async (ctx, args) => {
    const { user } = await requireConjuntoAccess(ctx, args.conjuntoId, {
      allowedRoles: ['VIGILANTE', 'ADMIN'],
    })

    const placaNormalizada = normalizePlaca(args.placaRaw)
    if (!placaNormalizada) {
      throwConvexError(ERROR_CODES.VALIDATION_ERROR, 'Placa obligatoria')
    }

    // Buscar registro activo
    const registros = await ctx.db
      .query('registrosAcceso')
      .withIndex('by_conjunto_and_placa', (q) =>
        q
          .eq('conjuntoId', args.conjuntoId)
          .eq('placaNormalizada', placaNormalizada),
      )
      .collect()

    const activo = registros.find((r) => r.salidaEn === undefined)
    const ahora = Date.now()

    if (activo) {
      // Salida normal
      await ctx.db.patch(activo._id, {
        salidaEn: ahora,
      })
      return { registroId: activo._id, exitWithoutEntry: false }
    }

    // Salida sin entrada — crear registro retroactivo
    const vehiculo = await ctx.db
      .query('vehiculos')
      .withIndex('by_conjunto_and_placa', (q) =>
        q.eq('conjuntoId', args.conjuntoId).eq('placa', placaNormalizada),
      )
      .unique()

    const registroId = await ctx.db.insert('registrosAcceso', {
      conjuntoId: args.conjuntoId,
      tipo: vehiculo ? 'RESIDENTE' : 'VISITANTE',
      vehiculoId: vehiculo?._id,
      placaRaw: args.placaRaw,
      placaNormalizada,
      unidadId: vehiculo?.unidadId,
      salidaEn: ahora,
      decisionMotor: [],
      decisionFinal: 'PERMITIDO',
      vigilanteId: user._id,
    })

    return { registroId, exitWithoutEntry: true }
  },
})

/**
 * Registrar ingreso de visitante (VISITANTE o VISITA_ADMIN).
 * Sin motor de reglas — siempre PERMITIDO.
 */
export const registrarVisitante = mutation({
  args: {
    conjuntoId: v.id('conjuntos'),
    placaRaw: v.string(),
    tipo: v.union(v.literal('VISITANTE'), v.literal('VISITA_ADMIN')),
    unidadId: v.optional(v.id('unidades')),
  },
  handler: async (ctx, args) => {
    const { user } = await requireConjuntoAccess(ctx, args.conjuntoId, {
      allowedRoles: ['VIGILANTE', 'ADMIN'],
    })

    const placaNormalizada = normalizePlaca(args.placaRaw)
    if (!placaNormalizada) {
      throwConvexError(ERROR_CODES.VALIDATION_ERROR, 'Placa obligatoria')
    }

    // Visitante requiere unidad destino
    if (args.tipo === 'VISITANTE' && !args.unidadId) {
      throwConvexError(
        ERROR_CODES.VALIDATION_ERROR,
        'Unidad de destino obligatoria para visitantes',
      )
    }

    // Verificar que la unidad existe
    if (args.unidadId) {
      const unidad = await ctx.db.get(args.unidadId)
      if (!unidad || unidad.conjuntoId !== args.conjuntoId) {
        throwConvexError(ERROR_CODES.UNIDAD_NOT_FOUND, 'Unidad no encontrada')
      }
    }

    const registroId = await ctx.db.insert('registrosAcceso', {
      conjuntoId: args.conjuntoId,
      tipo: args.tipo,
      placaRaw: args.placaRaw,
      placaNormalizada,
      unidadId: args.unidadId,
      entradaEn: Date.now(),
      decisionMotor: [],
      decisionFinal: 'PERMITIDO',
      vigilanteId: user._id,
    })

    return { registroId }
  },
})

/**
 * Registrar vehículo nuevo como residente + ingreso atómico.
 * Crea vehículo permanente en tabla vehiculos y registro de acceso.
 */
export const registrarResidenteNuevo = mutation({
  args: {
    conjuntoId: v.id('conjuntos'),
    placaRaw: v.string(),
    unidadId: v.id('unidades'),
    vehiculoTipo: vehiculoTipos,
    propietarioNombre: v.optional(v.string()),
    justificacion: v.optional(v.string()),
    novedad: v.optional(v.string()),
    forzarPermitido: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { user } = await requireConjuntoAccess(ctx, args.conjuntoId, {
      allowedRoles: ['VIGILANTE', 'ADMIN'],
    })

    const placaNormalizada = normalizePlaca(args.placaRaw)
    if (!placaNormalizada) {
      throwConvexError(ERROR_CODES.VALIDATION_ERROR, 'Placa obligatoria')
    }

    // Verificar unidad
    const unidad = await ctx.db.get(args.unidadId)
    if (!unidad || unidad.conjuntoId !== args.conjuntoId) {
      throwConvexError(ERROR_CODES.UNIDAD_NOT_FOUND, 'Unidad no encontrada')
    }

    // Verificar placa única
    const existing = await ctx.db
      .query('vehiculos')
      .withIndex('by_conjunto_and_placa', (q) =>
        q.eq('conjuntoId', args.conjuntoId).eq('placa', placaNormalizada),
      )
      .unique()
    if (existing) {
      throwConvexError(
        ERROR_CODES.VEHICULO_PLACA_DUPLICATE,
        `Ya existe un vehículo con la placa ${placaNormalizada}`,
      )
    }

    // Crear vehículo permanente
    const vehiculoId = await ctx.db.insert('vehiculos', {
      conjuntoId: args.conjuntoId,
      unidadId: args.unidadId,
      placa: placaNormalizada,
      tipo: args.vehiculoTipo,
      propietarioNombre: args.propietarioNombre?.trim() || undefined,
      active: true,
    })

    // Evaluar reglas
    const config = await ctx.db
      .query('conjuntoConfig')
      .withIndex('by_conjunto_id', (q) => q.eq('conjuntoId', args.conjuntoId))
      .unique()

    const vehiculosUnidadAdentro = await getVehiculosUnidadAdentro(
      ctx,
      args.conjuntoId,
      args.unidadId,
    )

    const ruleResult = evaluateRules({
      tipo: 'RESIDENTE',
      vehiculoTipo: args.vehiculoTipo,
      unidadEnMora: unidad.enMora,
      vehiculosUnidadAdentro,
      config: config ?? {
        reglaIngresoEnMora: true,
        reglaVehiculoDuplicado: true,
        reglaPermanenciaMaxDias: 30,
      },
      ahora: Date.now(),
    })

    // Si hay violaciones y no se forzó
    if (ruleResult.violations.length > 0 && !args.forzarPermitido) {
      return {
        vehiculoId,
        requiresJustificacion: true,
        violations: ruleResult.violations,
      }
    }

    if (ruleResult.violations.length > 0 && !args.justificacion?.trim()) {
      throwConvexError(
        ERROR_CODES.VALIDATION_ERROR,
        'Justificación obligatoria cuando hay reglas violadas',
      )
    }

    // Crear registro de acceso
    const registroId = await ctx.db.insert('registrosAcceso', {
      conjuntoId: args.conjuntoId,
      tipo: 'RESIDENTE',
      vehiculoId,
      placaRaw: args.placaRaw,
      placaNormalizada,
      unidadId: args.unidadId,
      entradaEn: Date.now(),
      decisionMotor: ruleResult.violations,
      decisionFinal: 'PERMITIDO',
      justificacion: args.justificacion?.trim() || undefined,
      novedad: args.novedad?.trim() || undefined,
      vigilanteId: user._id,
    })

    return {
      vehiculoId,
      registroId,
      violations: ruleResult.violations,
      decisionFinal: 'PERMITIDO' as const,
    }
  },
})

/**
 * Registrar rechazo de ingreso (para auditoría).
 */
export const registrarRechazo = mutation({
  args: {
    conjuntoId: v.id('conjuntos'),
    placaRaw: v.string(),
    tipo: registroAccesoTipos,
    vehiculoId: v.optional(v.id('vehiculos')),
    unidadId: v.optional(v.id('unidades')),
    decisionMotor: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const { user } = await requireConjuntoAccess(ctx, args.conjuntoId, {
      allowedRoles: ['VIGILANTE', 'ADMIN'],
    })

    const placaNormalizada = normalizePlaca(args.placaRaw)

    const registroId = await ctx.db.insert('registrosAcceso', {
      conjuntoId: args.conjuntoId,
      tipo: args.tipo,
      vehiculoId: args.vehiculoId,
      placaRaw: args.placaRaw,
      placaNormalizada,
      unidadId: args.unidadId,
      decisionMotor: args.decisionMotor,
      decisionFinal: 'RECHAZADO',
      vigilanteId: user._id,
    })

    return { registroId }
  },
})
