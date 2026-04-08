/**
 * Centralized mapping from org role to its dashboard path.
 * Used by the home route and any other place that needs to redirect
 * a user to their "home" based on role.
 *
 * F4: los ADMIN ya no van directo a `/admin` sino que pasan primero por
 * `/seleccionar-conjunto`, que decide (si hay 0/1/N conjuntos) a dónde mandarlos.
 */
type OrgRole = 'SUPER_ADMIN' | 'ADMIN'

export function getDashboardPathForRole(orgRole: OrgRole): string {
  switch (orgRole) {
    case 'SUPER_ADMIN':
      return '/super-admin'
    case 'ADMIN':
      return '/seleccionar-conjunto'
  }
}
