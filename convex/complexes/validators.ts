import { v } from 'convex/values'

export const complexFields = {
  organizationId: v.id('organizations'),
  slug: v.string(),
  name: v.string(),
  address: v.string(),
  city: v.string(),
  active: v.boolean(),
}
