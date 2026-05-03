import { v } from 'convex/values'

export const documentType = v.union(
  v.literal('CC'),
  v.literal('CE'),
  v.literal('PA'),
)

/** TS-level document type derived from the Convex validator. */
export type DocumentType = 'CC' | 'CE' | 'PA'

export const residentTypes = v.union(
  v.literal('OWNER'),
  v.literal('LESSEE'),
  v.literal('TENANT'),
)

/** TS-level resident type derived from the Convex validator. */
export type ResidentType = 'OWNER' | 'LESSEE' | 'TENANT'

export const residentFields = {
  complexId: v.id('complexes'),
  unitId: v.id('units'),
  firstName: v.string(),
  lastName: v.string(),
  documentType,
  documentNumber: v.string(),
  phone: v.optional(v.string()),
  email: v.optional(v.string()),
  type: residentTypes,
  active: v.boolean(),
}
