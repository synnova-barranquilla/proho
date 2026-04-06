/**
 * Centralized mapping from org role to its dashboard path.
 * Used by the home route and any other place that needs to redirect
 * a user to their "home" based on role.
 */
type OrgRole = 'SUPER_ADMIN' | 'ADMIN'

export function getDashboardPathForRole(orgRole: OrgRole): string {
  switch (orgRole) {
    case 'SUPER_ADMIN':
      return '/super-admin'
    case 'ADMIN':
      return '/admin'
  }
}
