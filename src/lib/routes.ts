/**
 * Centralized mapping from org role to its dashboard path.
 * Used by the home route and any other place that needs to redirect
 * a user to their "home" based on role.
 *
 * - SUPER_ADMIN → /super-admin
 * - ADMIN → /seleccionar-conjunto (decides based on 0/1/N complexes)
 * - MEMBER with complexSlug → /c/$slug (direct to their complex)
 * - MEMBER without complexSlug → /seleccionar-conjunto
 */
type OrgRole = 'SUPER_ADMIN' | 'ADMIN' | 'MEMBER'

export function getDashboardPathForRole(
  orgRole: OrgRole,
  complexSlug?: string,
): string {
  if (orgRole === 'SUPER_ADMIN') return '/super-admin'
  if (complexSlug) return `/c/${complexSlug}`
  return '/seleccionar-conjunto'
}
