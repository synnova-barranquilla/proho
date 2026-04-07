/**
 * The slug of the internal Synnova organization. This org hosts the
 * SUPER_ADMIN users (Synnova team) and cannot be deactivated, invited to,
 * or have modules toggled. It is created only via the seed bootstrap script.
 */
export const INTERNAL_ORG_SLUG = 'synnova-internal'

/**
 * Returns true if the given slug belongs to the internal Synnova organization.
 */
export function isInternalOrg(slug: string): boolean {
  return slug === INTERNAL_ORG_SLUG
}
