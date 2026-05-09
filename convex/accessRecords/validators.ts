import { v } from 'convex/values'

export const accessRecordTypes = v.union(
  v.literal('RESIDENT'),
  v.literal('VISITOR'),
  v.literal('ADMIN_VISIT'),
)

export const finalDecisionValues = v.union(
  v.literal('ALLOWED'),
  v.literal('REJECTED'),
)

export const accessRecordFields = {
  complexId: v.id('complexes'),
  type: accessRecordTypes,

  // Vehicle — vehicleId only if it's a registered resident
  vehicleId: v.optional(v.id('vehicles')),
  rawPlate: v.string(),
  normalizedPlate: v.string(),

  // Destination — does not apply for VISITA_ADMIN
  unitId: v.optional(v.id('units')),

  // Times — enteredAt optional for exit without entry
  enteredAt: v.optional(v.number()),
  exitedAt: v.optional(v.number()),

  // Vehicle type when there's no vehicleId (visitor/admin visit).
  // For residents it's derived from vehicle.type.
  visitorVehicleType: v.optional(
    v.union(v.literal('CAR'), v.literal('MOTORCYCLE'), v.literal('OTHER')),
  ),

  // Resolved vehicle type set at write time — avoids joining vehicles table on reads
  resolvedVehicleType: v.optional(
    v.union(v.literal('CAR'), v.literal('MOTORCYCLE'), v.literal('OTHER')),
  ),

  // Rules engine decision
  engineDecision: v.array(v.string()),
  finalDecision: finalDecisionValues,
  justification: v.optional(v.string()),
  observations: v.optional(v.string()),

  // Audit
  guardId: v.id('users'),
}
