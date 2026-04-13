/**
 * Centralized mapping from org role to its dashboard path.
 * Used by the home route and any other place that needs to redirect
 * a user to their "home" based on role.
 *
 * - SUPER_ADMIN → /super-admin
 * - ADMIN → /seleccionar-conjunto (decides based on 0/1/N conjuntos)
 * - MEMBER with conjuntoSlug → /c/$slug (direct to their conjunto)
 * - MEMBER without conjuntoSlug → /seleccionar-conjunto
 */
type OrgRole = 'SUPER_ADMIN' | 'ADMIN' | 'MEMBER'

export function getDashboardPathForRole(
  orgRole: OrgRole,
  conjuntoSlug?: string,
): string {
  if (orgRole === 'SUPER_ADMIN') return '/super-admin'
  if (conjuntoSlug) return `/c/${conjuntoSlug}`
  return '/seleccionar-conjunto'
}
