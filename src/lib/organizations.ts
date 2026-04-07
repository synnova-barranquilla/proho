/**
 * Client-side mirror of `convex/lib/organizations.ts::INTERNAL_ORG_SLUG`.
 * Kept in sync manually.
 */
export const INTERNAL_ORG_SLUG = 'synnova-internal'

/**
 * Returns true if the given slug belongs to the internal Synnova organization.
 */
export function isInternalOrgSlug(slug: string): boolean {
  return slug === INTERNAL_ORG_SLUG
}
