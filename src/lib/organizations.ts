import { INTERNAL_ORG_SLUG } from '../../convex/lib/organizations'

/**
 * Returns true if the given slug belongs to the internal Synnova organization.
 */
export function isInternalOrgSlug(slug: string): boolean {
  return slug === INTERNAL_ORG_SLUG
}
