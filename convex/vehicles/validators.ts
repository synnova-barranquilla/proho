import { v } from 'convex/values'

export const vehicleTypes = v.union(
  v.literal('CAR'),
  v.literal('MOTORCYCLE'),
  v.literal('OTHER'),
)

/** TS-level vehicle type derived from the Convex validator. */
export type VehicleTipo = 'CAR' | 'MOTORCYCLE' | 'OTHER'

export const vehicleFields = {
  complexId: v.id('complexes'),
  unitId: v.id('units'),
  plate: v.string(),
  type: vehicleTypes,
  ownerName: v.optional(v.string()),
  active: v.boolean(),
}
