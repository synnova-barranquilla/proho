import { v } from 'convex/values'

import type { Id } from '../_generated/dataModel'
import { mutation, type MutationCtx } from '../_generated/server'
import { requireConjuntoAccess } from '../lib/auth'
import { ERROR_CODES, throwConvexError } from '../lib/errors'
import { isPlacaValida, normalizePlaca } from '../lib/placa'
import {
  evaluateRules,
  type OcupacionSnapshot,
  type RuleConfig,
  type VehicleTipo,
  type VehiculoAdentro,
} from '../lib/rulesEngine'
import { vehiculoTipos } from '../vehiculos/validators'
import { registroAccesoTipos } from './validators'

const DEFAULT_RULE_CONFIG: RuleConfig = {
  reglaIngresoEnMora: true,
  reglaVehiculoDuplicado: true,
  reglaPermanenciaMaxDias: 30,
  reglaIngresoEnSobrecupo: true,
}

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

/**
 * Cuenta vehículos permitidos actualmente dentro del conjunto, agrupados en
 * carros (CARRO/OTRO) y motos. Usa `vehiculo.tipo` si el registro tiene
 * `vehiculoId`; en caso contrario (visitantes) usa `vehiculoTipoVisitante`.
 */
async function getOcupacionConjunto(
  ctx: MutationCtx,
  conjuntoId: Id<'conjuntos'>,
): Promise<OcupacionSnapshot> {
  const registros = await ctx.db
    .query('registrosAcceso')
    .withIndex('by_conjunto_and_salida', (q) =>
      q.eq('conjuntoId', conjuntoId).eq('salidaEn', undefined),
    )
    .filter((q) => q.eq(q.field('decisionFinal'), 'PERMITIDO'))
    .collect()

  let carros = 0
  let motos = 0
  for (const r of registros) {
    let tipo: VehicleTipo = 'CARRO'
    if (r.vehiculoId) {
      const vehiculo = await ctx.db.get(r.vehiculoId)
      tipo = vehiculo?.tipo ?? 'CARRO'
    } else if (r.vehiculoTipoVisitante) {
      tipo = r.vehiculoTipoVisitante
    }
    if (tipo === 'MOTO') motos++
    else carros++
  }

  return { carros, motos }
}

async function loadConfigAndCapacidad(
  ctx: MutationCtx,
  conjuntoId: Id<'conjuntos'>,
): Promise<{ config: RuleConfig; capacidad: OcupacionSnapshot }> {
  const row = await ctx.db
    .query('conjuntoConfig')
    .withIndex('by_conjunto_id', (q) => q.eq('conjuntoId', conjuntoId))
    .unique()

  return {
    config: row
      ? {
          reglaIngresoEnMora: row.reglaIngresoEnMora,
          reglaVehiculoDuplicado: row.reglaVehiculoDuplicado,
          reglaPermanenciaMaxDias: row.reglaPermanenciaMaxDias,
          reglaIngresoEnSobrecupo: row.reglaIngresoEnSobrecupo,
        }
      : DEFAULT_RULE_CONFIG,
    capacidad: {
      carros: row?.parqueaderosCarros ?? 0,
      motos: row?.parqueaderosMotos ?? 0,
    },
  }
}

function requirePlacaValida(placaNormalizada: string) {
  if (!placaNormalizada) {
    throwConvexError(ERROR_CODES.VALIDATION_ERROR, 'Placa obligatoria')
  }
  if (!isPlacaValida(placaNormalizada)) {
    throwConvexError(ERROR_CODES.VALIDATION_ERROR, 'Formato de placa inválido')
  }
}

function requireObservacionesInvariante(args: {
  justificacion?: string
  observaciones?: string
}) {
  if (args.observaciones?.trim() && !args.justificacion?.trim()) {
    throwConvexError(
      ERROR_CODES.VALIDATION_ERROR,
      'Observaciones requiere justificación',
    )
  }
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
 * 5. Crea registro + observaciones si aplica
 */
export const registrarIngreso = mutation({
  args: {
    conjuntoId: v.id('conjuntos'),
    placaRaw: v.string(),
    justificacion: v.optional(v.string()),
    observaciones: v.optional(v.string()),
    forzarPermitido: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { user } = await requireConjuntoAccess(ctx, args.conjuntoId, {
      allowedRoles: ['VIGILANTE', 'ADMIN'],
    })

    const placaNormalizada = normalizePlaca(args.placaRaw)
    requirePlacaValida(placaNormalizada)
    requireObservacionesInvariante(args)

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

    const { config, capacidad } = await loadConfigAndCapacidad(
      ctx,
      args.conjuntoId,
    )

    const [vehiculosUnidadAdentro, ocupacion] = await Promise.all([
      getVehiculosUnidadAdentro(ctx, args.conjuntoId, vehiculo.unidadId),
      getOcupacionConjunto(ctx, args.conjuntoId),
    ])

    const ruleResult = evaluateRules({
      tipo: 'RESIDENTE',
      vehiculoTipo: vehiculo.tipo,
      unidadEnMora: unidad.enMora,
      vehiculosUnidadAdentro,
      ocupacion,
      capacidad,
      config,
      ahora: Date.now(),
    })

    if (ruleResult.violations.length > 0 && !args.forzarPermitido) {
      return {
        found: true as const,
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
      observaciones: args.observaciones?.trim() || undefined,
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
    requirePlacaValida(placaNormalizada)

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
 * VISITANTE pasa por el motor de reglas para el chequeo de sobrecupo.
 * VISITA_ADMIN queda exento (motor lo deja pasar).
 */
export const registrarVisitante = mutation({
  args: {
    conjuntoId: v.id('conjuntos'),
    placaRaw: v.string(),
    tipo: v.union(v.literal('VISITANTE'), v.literal('VISITA_ADMIN')),
    vehiculoTipo: vehiculoTipos,
    unidadId: v.optional(v.id('unidades')),
    justificacion: v.optional(v.string()),
    observaciones: v.optional(v.string()),
    forzarPermitido: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { user } = await requireConjuntoAccess(ctx, args.conjuntoId, {
      allowedRoles: ['VIGILANTE', 'ADMIN'],
    })

    const placaNormalizada = normalizePlaca(args.placaRaw)
    requirePlacaValida(placaNormalizada)
    requireObservacionesInvariante(args)

    if (args.tipo === 'VISITANTE' && !args.unidadId) {
      throwConvexError(
        ERROR_CODES.VALIDATION_ERROR,
        'Unidad de destino obligatoria para visitantes',
      )
    }

    if (args.unidadId) {
      const unidad = await ctx.db.get(args.unidadId)
      if (!unidad || unidad.conjuntoId !== args.conjuntoId) {
        throwConvexError(ERROR_CODES.UNIDAD_NOT_FOUND, 'Unidad no encontrada')
      }
    }

    const { config, capacidad } = await loadConfigAndCapacidad(
      ctx,
      args.conjuntoId,
    )
    const ocupacion = await getOcupacionConjunto(ctx, args.conjuntoId)

    const ruleResult = evaluateRules({
      tipo: args.tipo,
      vehiculoTipo: args.vehiculoTipo,
      vehiculosUnidadAdentro: [],
      ocupacion,
      capacidad,
      config,
      ahora: Date.now(),
    })

    if (ruleResult.violations.length > 0 && !args.forzarPermitido) {
      return {
        requiresJustificacion: true as const,
        violations: ruleResult.violations,
      }
    }

    if (ruleResult.violations.length > 0 && !args.justificacion?.trim()) {
      throwConvexError(
        ERROR_CODES.VALIDATION_ERROR,
        'Justificación obligatoria cuando hay reglas violadas',
      )
    }

    const registroId = await ctx.db.insert('registrosAcceso', {
      conjuntoId: args.conjuntoId,
      tipo: args.tipo,
      placaRaw: args.placaRaw,
      placaNormalizada,
      unidadId: args.unidadId,
      vehiculoTipoVisitante: args.vehiculoTipo,
      entradaEn: Date.now(),
      decisionMotor: ruleResult.violations,
      decisionFinal: 'PERMITIDO',
      justificacion: args.justificacion?.trim() || undefined,
      observaciones: args.observaciones?.trim() || undefined,
      vigilanteId: user._id,
    })

    return {
      registroId,
      violations: ruleResult.violations,
      decisionFinal: 'PERMITIDO' as const,
    }
  },
})

/**
 * Registrar vehículo nuevo como residente + (opcionalmente) ingreso atómico.
 *
 * Orden: validar placa/unidad/duplicado → evaluar reglas → si requiere
 * justificación, retornar SIN insertar nada → si permitido, crear vehículo
 * + registroAcceso.
 *
 * Cuando `soloRegistrar` es true, salta reglas/registro y solo crea el
 * vehículo (para agregar un vehículo de residente sin hacerlo ingresar).
 */
export const registrarResidenteNuevo = mutation({
  args: {
    conjuntoId: v.id('conjuntos'),
    placaRaw: v.string(),
    unidadId: v.id('unidades'),
    vehiculoTipo: vehiculoTipos,
    propietarioNombre: v.optional(v.string()),
    justificacion: v.optional(v.string()),
    observaciones: v.optional(v.string()),
    forzarPermitido: v.optional(v.boolean()),
    soloRegistrar: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { user } = await requireConjuntoAccess(ctx, args.conjuntoId, {
      allowedRoles: ['VIGILANTE', 'ADMIN'],
    })

    const placaNormalizada = normalizePlaca(args.placaRaw)
    requirePlacaValida(placaNormalizada)
    requireObservacionesInvariante(args)

    const unidad = await ctx.db.get(args.unidadId)
    if (!unidad || unidad.conjuntoId !== args.conjuntoId) {
      throwConvexError(ERROR_CODES.UNIDAD_NOT_FOUND, 'Unidad no encontrada')
    }

    // Placa única
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

    // Modo "solo registrar": crea vehículo y sale. Sin reglas, sin registroAcceso.
    if (args.soloRegistrar) {
      const vehiculoId = await ctx.db.insert('vehiculos', {
        conjuntoId: args.conjuntoId,
        unidadId: args.unidadId,
        placa: placaNormalizada,
        tipo: args.vehiculoTipo,
        propietarioNombre: args.propietarioNombre?.trim() || undefined,
        active: true,
      })
      return { vehiculoId, soloRegistrado: true as const }
    }

    const { config, capacidad } = await loadConfigAndCapacidad(
      ctx,
      args.conjuntoId,
    )

    const [vehiculosUnidadAdentro, ocupacion] = await Promise.all([
      getVehiculosUnidadAdentro(ctx, args.conjuntoId, args.unidadId),
      getOcupacionConjunto(ctx, args.conjuntoId),
    ])

    const ruleResult = evaluateRules({
      tipo: 'RESIDENTE',
      vehiculoTipo: args.vehiculoTipo,
      unidadEnMora: unidad.enMora,
      vehiculosUnidadAdentro,
      ocupacion,
      capacidad,
      config,
      ahora: Date.now(),
    })

    // Violaciones sin forzar → retornar SIN insertar nada. El cliente reenvía
    // con forzarPermitido=true; al reentrar, el chequeo de duplicado no falla
    // porque aún no hemos creado el vehículo.
    if (ruleResult.violations.length > 0 && !args.forzarPermitido) {
      return {
        requiresJustificacion: true as const,
        violations: ruleResult.violations,
      }
    }

    if (ruleResult.violations.length > 0 && !args.justificacion?.trim()) {
      throwConvexError(
        ERROR_CODES.VALIDATION_ERROR,
        'Justificación obligatoria cuando hay reglas violadas',
      )
    }

    const vehiculoId = await ctx.db.insert('vehiculos', {
      conjuntoId: args.conjuntoId,
      unidadId: args.unidadId,
      placa: placaNormalizada,
      tipo: args.vehiculoTipo,
      propietarioNombre: args.propietarioNombre?.trim() || undefined,
      active: true,
    })

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
      observaciones: args.observaciones?.trim() || undefined,
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
