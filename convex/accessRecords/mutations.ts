import { v } from 'convex/values'

import type { Id } from '../_generated/dataModel'
import { mutation, type MutationCtx } from '../_generated/server'
import { complexConfigDefaults } from '../complexConfig/validators'
import { requireComplexAccess } from '../lib/auth'
import { ERROR_CODES, throwConvexError } from '../lib/errors'
import { normalizePlate, requireValidPlate } from '../lib/plate'
import {
  evaluateRules,
  type OccupancySnapshot,
  type RuleConfig,
  type VehicleInside,
  type VehicleTipo,
} from '../lib/rulesEngine'
import { vehicleTypes } from '../vehicles/validators'
import { accessRecordTypes } from './validators'

const DEFAULT_RULE_CONFIG: RuleConfig = {
  ruleEntryInArrears: complexConfigDefaults.ruleEntryInArrears,
  ruleDuplicateVehicle: complexConfigDefaults.ruleDuplicateVehicle,
  ruleMaxStayDays: complexConfigDefaults.ruleMaxStayDays,
  ruleEntryOverCapacity: complexConfigDefaults.ruleEntryOverCapacity,
}

async function getVehiclesUnitInside(
  ctx: MutationCtx,
  complexId: Id<'complexes'>,
  unitId: Id<'units'>,
): Promise<VehicleInside[]> {
  const records = await ctx.db
    .query('accessRecords')
    .withIndex('by_complex_and_unit', (q) =>
      q.eq('complexId', complexId).eq('unitId', unitId),
    )
    .collect()

  const active = records.filter((r) => r.exitedAt === undefined && r.vehicleId)

  const result: VehicleInside[] = []
  for (const r of active) {
    const vehicle = r.vehicleId ? await ctx.db.get(r.vehicleId) : null
    result.push({
      vehicleType: vehicle?.type ?? 'CAR',
      normalizedPlate: r.normalizedPlate,
      enteredAt: r.enteredAt,
    })
  }
  return result
}

/**
 * Counts vehicles currently permitted inside the complex, grouped into
 * cars (CARRO/OTRO) and motos. Uses `vehicle.type` if the record has
 * `vehicleId`; otherwise (visitors) uses `visitorVehicleType`.
 */
async function getComplexOccupancy(
  ctx: MutationCtx,
  complexId: Id<'complexes'>,
): Promise<OccupancySnapshot> {
  const records = await ctx.db
    .query('accessRecords')
    .withIndex('by_complex_and_exit', (q) =>
      q.eq('complexId', complexId).eq('exitedAt', undefined),
    )
    .filter((q) => q.eq(q.field('finalDecision'), 'ALLOWED'))
    .collect()

  let cars = 0
  let motorcycles = 0
  for (const r of records) {
    let vehicleType: VehicleTipo = 'CAR'
    if (r.vehicleId) {
      const vehicle = await ctx.db.get(r.vehicleId)
      vehicleType = vehicle?.type ?? 'CAR'
    } else if (r.visitorVehicleType) {
      vehicleType = r.visitorVehicleType
    }
    if (vehicleType === 'MOTORCYCLE') motorcycles++
    else cars++
  }

  return { cars, motorcycles }
}

async function loadConfigAndCapacity(
  ctx: MutationCtx,
  complexId: Id<'complexes'>,
): Promise<{ config: RuleConfig; capacity: OccupancySnapshot }> {
  const row = await ctx.db
    .query('complexConfig')
    .withIndex('by_complex_id', (q) => q.eq('complexId', complexId))
    .unique()

  return {
    config: row
      ? {
          ruleEntryInArrears: row.ruleEntryInArrears,
          ruleDuplicateVehicle: row.ruleDuplicateVehicle,
          ruleMaxStayDays: row.ruleMaxStayDays,
          ruleEntryOverCapacity: row.ruleEntryOverCapacity,
        }
      : DEFAULT_RULE_CONFIG,
    capacity: {
      cars: row?.carParkingSlots ?? 0,
      motorcycles: row?.motoParkingSlots ?? 0,
    },
  }
}

function requireObservationsInvariant(args: {
  justification?: string
  observations?: string
}) {
  if (args.observations?.trim() && !args.justification?.trim()) {
    throwConvexError(
      ERROR_CODES.VALIDATION_ERROR,
      'Observaciones requiere justificación',
    )
  }
}

/**
 * Register entry of a known resident vehicle.
 *
 * Flow:
 * 1. Search vehicle by plate
 * 2. If not found -> return { found: false }
 * 3. Evaluate rules server-side
 * 4. If violations + no justification -> return { requiresJustification, violations }
 * 5. Create record + observations if applicable
 */
export const registerEntry = mutation({
  args: {
    complexId: v.id('complexes'),
    rawPlate: v.string(),
    justification: v.optional(v.string()),
    observations: v.optional(v.string()),
    forcePermitted: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { user } = await requireComplexAccess(ctx, args.complexId, {
      allowedRoles: ['GUARD', 'ADMIN'],
    })

    const normalizedPlate = normalizePlate(args.rawPlate)
    requireValidPlate(normalizedPlate)
    requireObservationsInvariant(args)

    // Search for registered vehicle
    const vehicle = await ctx.db
      .query('vehicles')
      .withIndex('by_complex_and_plate', (q) =>
        q.eq('complexId', args.complexId).eq('plate', normalizedPlate),
      )
      .unique()

    if (!vehicle) {
      return { found: false as const }
    }

    if (!vehicle.active) {
      throwConvexError(
        ERROR_CODES.VEHICLE_NOT_FOUND,
        'El vehículo está desactivado',
      )
    }

    const unit = await ctx.db.get(vehicle.unitId)
    if (!unit) {
      throwConvexError(ERROR_CODES.UNIT_NOT_FOUND, 'Unidad no encontrada')
    }

    const { config, capacity } = await loadConfigAndCapacity(
      ctx,
      args.complexId,
    )

    const [vehiclesUnitInside, occupancy] = await Promise.all([
      getVehiclesUnitInside(ctx, args.complexId, vehicle.unitId),
      getComplexOccupancy(ctx, args.complexId),
    ])

    const ruleResult = evaluateRules({
      recordType: 'RESIDENT',
      vehicleType: vehicle.type,
      unitInArrears: unit.inArrears,
      vehiclesUnitInside: vehiclesUnitInside,
      occupancy: occupancy,
      capacity,
      config,
      now: Date.now(),
    })

    if (ruleResult.violations.length > 0 && !args.forcePermitted) {
      return {
        found: true as const,
        requiresJustification: true,
        violations: ruleResult.violations,
      }
    }

    if (ruleResult.violations.length > 0 && !args.justification?.trim()) {
      throwConvexError(
        ERROR_CODES.VALIDATION_ERROR,
        'Justificación obligatoria cuando hay reglas violadas',
      )
    }

    const recordId = await ctx.db.insert('accessRecords', {
      complexId: args.complexId,
      type: 'RESIDENT',
      vehicleId: vehicle._id,
      rawPlate: args.rawPlate,
      normalizedPlate,
      unitId: vehicle.unitId,
      enteredAt: Date.now(),
      engineDecision: ruleResult.violations,
      finalDecision: 'ALLOWED',
      justification: args.justification?.trim() || undefined,
      observations: args.observations?.trim() || undefined,
      guardId: user._id,
    })

    return {
      found: true as const,
      recordId,
      violations: ruleResult.violations,
      finalDecision: 'ALLOWED' as const,
    }
  },
})

/**
 * Register vehicle exit.
 * If no active record (exit without entry), creates a retroactive one.
 */
export const registerExit = mutation({
  args: {
    complexId: v.id('complexes'),
    rawPlate: v.string(),
  },
  handler: async (ctx, args) => {
    const { user } = await requireComplexAccess(ctx, args.complexId, {
      allowedRoles: ['GUARD', 'ADMIN'],
    })

    const normalizedPlate = normalizePlate(args.rawPlate)
    requireValidPlate(normalizedPlate)

    const records = await ctx.db
      .query('accessRecords')
      .withIndex('by_complex_and_plate', (q) =>
        q
          .eq('complexId', args.complexId)
          .eq('normalizedPlate', normalizedPlate),
      )
      .collect()

    const active = records.find((r) => r.exitedAt === undefined)
    const now = Date.now()

    if (active) {
      await ctx.db.patch(active._id, {
        exitedAt: now,
      })
      return { recordId: active._id, exitWithoutEntry: false }
    }

    // Exit without entry — create retroactive record
    const vehicle = await ctx.db
      .query('vehicles')
      .withIndex('by_complex_and_plate', (q) =>
        q.eq('complexId', args.complexId).eq('plate', normalizedPlate),
      )
      .unique()

    const recordId = await ctx.db.insert('accessRecords', {
      complexId: args.complexId,
      type: vehicle ? 'RESIDENT' : 'VISITOR',
      vehicleId: vehicle?._id,
      rawPlate: args.rawPlate,
      normalizedPlate,
      unitId: vehicle?.unitId,
      exitedAt: now,
      engineDecision: [],
      finalDecision: 'ALLOWED',
      guardId: user._id,
    })

    return { recordId, exitWithoutEntry: true }
  },
})

/**
 * Register visitor entry (VISITANTE or VISITA_ADMIN).
 * VISITANTE goes through the rules engine for overcapacity check.
 * VISITA_ADMIN is exempt (engine lets it through).
 */
export const registerVisitor = mutation({
  args: {
    complexId: v.id('complexes'),
    rawPlate: v.string(),
    type: v.union(v.literal('VISITOR'), v.literal('ADMIN_VISIT')),
    vehicleType: vehicleTypes,
    unitId: v.optional(v.id('units')),
    justification: v.optional(v.string()),
    observations: v.optional(v.string()),
    forcePermitted: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { user } = await requireComplexAccess(ctx, args.complexId, {
      allowedRoles: ['GUARD', 'ADMIN'],
    })

    const normalizedPlate = normalizePlate(args.rawPlate)
    requireValidPlate(normalizedPlate)
    requireObservationsInvariant(args)

    if (args.type === 'VISITOR' && !args.unitId) {
      throwConvexError(
        ERROR_CODES.VALIDATION_ERROR,
        'Unidad de destino obligatoria para visitantes',
      )
    }

    if (args.unitId) {
      const unit = await ctx.db.get(args.unitId)
      if (!unit || unit.complexId !== args.complexId) {
        throwConvexError(ERROR_CODES.UNIT_NOT_FOUND, 'Unidad no encontrada')
      }
    }

    const { config, capacity } = await loadConfigAndCapacity(
      ctx,
      args.complexId,
    )
    const occupancy = await getComplexOccupancy(ctx, args.complexId)

    const ruleResult = evaluateRules({
      recordType: args.type,
      vehicleType: args.vehicleType,
      vehiclesUnitInside: [],
      occupancy: occupancy,
      capacity,
      config,
      now: Date.now(),
    })

    if (ruleResult.violations.length > 0 && !args.forcePermitted) {
      return {
        requiresJustification: true as const,
        violations: ruleResult.violations,
      }
    }

    if (ruleResult.violations.length > 0 && !args.justification?.trim()) {
      throwConvexError(
        ERROR_CODES.VALIDATION_ERROR,
        'Justificación obligatoria cuando hay reglas violadas',
      )
    }

    const recordId = await ctx.db.insert('accessRecords', {
      complexId: args.complexId,
      type: args.type,
      rawPlate: args.rawPlate,
      normalizedPlate,
      unitId: args.unitId,
      visitorVehicleType: args.vehicleType,
      enteredAt: Date.now(),
      engineDecision: ruleResult.violations,
      finalDecision: 'ALLOWED',
      justification: args.justification?.trim() || undefined,
      observations: args.observations?.trim() || undefined,
      guardId: user._id,
    })

    return {
      recordId,
      violations: ruleResult.violations,
      finalDecision: 'ALLOWED' as const,
    }
  },
})

/**
 * Register new resident vehicle + (optionally) atomic entry.
 *
 * Order: validate plate/unit/duplicate -> evaluate rules -> if requires
 * justification, return WITHOUT inserting anything -> if permitted, create
 * vehicle + accessRecord.
 *
 * When `registerOnly` is true, skips rules/record and only creates the
 * vehicle (to add a resident vehicle without making it enter).
 */
export const registerNewResident = mutation({
  args: {
    complexId: v.id('complexes'),
    rawPlate: v.string(),
    unitId: v.id('units'),
    vehicleType: vehicleTypes,
    ownerName: v.optional(v.string()),
    justification: v.optional(v.string()),
    observations: v.optional(v.string()),
    forcePermitted: v.optional(v.boolean()),
    registerOnly: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { user } = await requireComplexAccess(ctx, args.complexId, {
      allowedRoles: ['GUARD', 'ADMIN'],
    })

    const normalizedPlate = normalizePlate(args.rawPlate)
    requireValidPlate(normalizedPlate)
    requireObservationsInvariant(args)

    const unit = await ctx.db.get(args.unitId)
    if (!unit || unit.complexId !== args.complexId) {
      throwConvexError(ERROR_CODES.UNIT_NOT_FOUND, 'Unidad no encontrada')
    }

    // Unique plate
    const existing = await ctx.db
      .query('vehicles')
      .withIndex('by_complex_and_plate', (q) =>
        q.eq('complexId', args.complexId).eq('plate', normalizedPlate),
      )
      .unique()
    if (existing) {
      throwConvexError(
        ERROR_CODES.VEHICLE_PLATE_DUPLICATE,
        `Ya existe un vehículo con la placa ${normalizedPlate}`,
      )
    }

    // "Register only" mode: create vehicle and exit. No rules, no accessRecord.
    if (args.registerOnly) {
      const vehicleId = await ctx.db.insert('vehicles', {
        complexId: args.complexId,
        unitId: args.unitId,
        plate: normalizedPlate,
        type: args.vehicleType,
        ownerName: args.ownerName?.trim() || undefined,
        active: true,
      })
      return { vehicleId, registerOnly: true as const }
    }

    const { config, capacity } = await loadConfigAndCapacity(
      ctx,
      args.complexId,
    )

    const [vehiclesUnitInside, occupancy] = await Promise.all([
      getVehiclesUnitInside(ctx, args.complexId, args.unitId),
      getComplexOccupancy(ctx, args.complexId),
    ])

    const ruleResult = evaluateRules({
      recordType: 'RESIDENT',
      vehicleType: args.vehicleType,
      unitInArrears: unit.inArrears,
      vehiclesUnitInside: vehiclesUnitInside,
      occupancy: occupancy,
      capacity,
      config,
      now: Date.now(),
    })

    // Violations without forcing -> return WITHOUT inserting anything. The client
    // resends with forcePermitted=true; on re-entry, the duplicate check won't
    // fail because we haven't created the vehicle yet.
    if (ruleResult.violations.length > 0 && !args.forcePermitted) {
      return {
        requiresJustification: true as const,
        violations: ruleResult.violations,
      }
    }

    if (ruleResult.violations.length > 0 && !args.justification?.trim()) {
      throwConvexError(
        ERROR_CODES.VALIDATION_ERROR,
        'Justificación obligatoria cuando hay reglas violadas',
      )
    }

    const vehicleId = await ctx.db.insert('vehicles', {
      complexId: args.complexId,
      unitId: args.unitId,
      plate: normalizedPlate,
      type: args.vehicleType,
      ownerName: args.ownerName?.trim() || undefined,
      active: true,
    })

    const recordId = await ctx.db.insert('accessRecords', {
      complexId: args.complexId,
      type: 'RESIDENT',
      vehicleId,
      rawPlate: args.rawPlate,
      normalizedPlate,
      unitId: args.unitId,
      enteredAt: Date.now(),
      engineDecision: ruleResult.violations,
      finalDecision: 'ALLOWED',
      justification: args.justification?.trim() || undefined,
      observations: args.observations?.trim() || undefined,
      guardId: user._id,
    })

    return {
      vehicleId,
      recordId,
      violations: ruleResult.violations,
      finalDecision: 'ALLOWED' as const,
    }
  },
})

/**
 * Register entry rejection (for audit).
 */
export const registerRejection = mutation({
  args: {
    complexId: v.id('complexes'),
    rawPlate: v.string(),
    type: accessRecordTypes,
    vehicleId: v.optional(v.id('vehicles')),
    unitId: v.optional(v.id('units')),
    engineDecision: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const { user } = await requireComplexAccess(ctx, args.complexId, {
      allowedRoles: ['GUARD', 'ADMIN'],
    })

    const normalizedPlate = normalizePlate(args.rawPlate)

    const recordId = await ctx.db.insert('accessRecords', {
      complexId: args.complexId,
      type: args.type,
      vehicleId: args.vehicleId,
      rawPlate: args.rawPlate,
      normalizedPlate,
      unitId: args.unitId,
      engineDecision: args.engineDecision,
      finalDecision: 'REJECTED',
      guardId: user._id,
    })

    return { recordId }
  },
})
