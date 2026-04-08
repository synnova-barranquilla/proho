import { v } from 'convex/values'

export const conjuntoFields = {
  organizationId: v.id('organizations'),
  slug: v.string(),
  nombre: v.string(),
  direccion: v.string(),
  ciudad: v.string(),
  active: v.boolean(),
}
