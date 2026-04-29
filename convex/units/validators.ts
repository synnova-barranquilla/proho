import { v } from 'convex/values'

export const unitTypes = v.union(
  v.literal('APARTMENT'),
  v.literal('HOUSE'),
  v.literal('COMMERCIAL'),
)

export const unitFields = {
  complexId: v.id('complexes'),
  tower: v.string(),
  number: v.string(),
  type: unitTypes,
  inArrears: v.boolean(),
  arrearsNote: v.optional(v.string()),
}
