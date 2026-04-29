import { v } from 'convex/values'

const daySchedule = v.object({
  start: v.number(),
  end: v.number(),
  open: v.boolean(),
})

export const businessHoursSchema = v.object({
  mon: daySchedule,
  tue: daySchedule,
  wed: daySchedule,
  thu: daySchedule,
  fri: daySchedule,
  sat: daySchedule,
  sun: daySchedule,
})

export const complexConfigFields = {
  complexId: v.id('complexes'),
  // R1: If true, generates a notice when a vehicle from a unit in arrears enters
  ruleEntryInArrears: v.boolean(),
  // R2: If true, generates a notice when a vehicle from the same unit is already inside
  ruleDuplicateVehicle: v.boolean(),
  // R3: Maximum days a vehicle can remain inside (0 = disabled)
  ruleMaxStayDays: v.number(),
  // R4: If true, generates a notice when a vehicle enters while the parking
  // lot is full. Applies to residents and visitors. Admin visits are exempt.
  ruleEntryOverCapacity: v.boolean(),
  // Total parking capacity (0 = unlimited / rule inactive for this type)
  carParkingSlots: v.number(),
  motoParkingSlots: v.number(),

  // --- Communications module ---
  businessHours: v.optional(businessHoursSchema),
  timezone: v.optional(v.string()),
  ticketPrefix: v.optional(v.string()),
  ticketSequence: v.optional(v.number()),
}

export const defaultBusinessHours = {
  mon: { start: 420, end: 1020, open: true },
  tue: { start: 420, end: 1020, open: true },
  wed: { start: 420, end: 1020, open: true },
  thu: { start: 420, end: 1020, open: true },
  fri: { start: 420, end: 1020, open: true },
  sat: { start: 420, end: 720, open: true },
  sun: { start: 0, end: 0, open: false },
}

export const complexConfigDefaults = {
  ruleEntryInArrears: true,
  ruleDuplicateVehicle: true,
  ruleMaxStayDays: 30,
  ruleEntryOverCapacity: true,
  carParkingSlots: 0,
  motoParkingSlots: 0,
  businessHours: defaultBusinessHours,
  timezone: 'America/Bogota',
  ticketSequence: 0,
}
