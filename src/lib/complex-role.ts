import { useSuspenseQuery } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'

import { convexQuery } from '@convex-dev/react-query'

import { api } from '../../convex/_generated/api'
import type { Doc } from '../../convex/_generated/dataModel'

export type ComplexRole =
  | 'ADMIN'
  | 'AUXILIAR'
  | 'GUARD'
  | 'OWNER'
  | 'TENANT'
  | 'LESSEE'

interface UserForRole {
  orgRole: 'SUPER_ADMIN' | 'ADMIN' | 'MEMBER'
  isOrgOwner: boolean
  organizationId: Doc<'organizations'>['_id']
}

interface MembershipForRole {
  role: ComplexRole
  active: boolean
}

/**
 * Derives the *effective* complex role for a user viewing a specific
 * complex. Mirrors the server-side logic in `requireComplexAccess`:
 *
 *   1. SUPER_ADMIN → always ADMIN (internal support).
 *   2. ADMIN with `isOrgOwner === true` and matching org → ADMIN
 *      (implicit owner access to all complexes of the org).
 *   3. Otherwise → the role from the active complexMembership, or
 *      `null` if there is no active membership (which should not
 *      happen if the user reached this page at all — the backend
 *      guard would have blocked them).
 *
 * Returning `null` is treated by UI gates as "no access" — render
 * nothing / redirect.
 */
function getEffectiveComplexRole(
  user: UserForRole,
  complex: Pick<Doc<'complexes'>, 'organizationId'>,
  membership: MembershipForRole | null,
): ComplexRole | null {
  if (user.orgRole === 'SUPER_ADMIN') return 'ADMIN'

  if (
    user.isOrgOwner === true &&
    user.organizationId === complex.organizationId
  ) {
    return 'ADMIN'
  }

  if (membership && membership.active) return membership.role

  return null
}

/**
 * Convenience helper: `true` if the user can perform ADMIN-only actions
 * in this complex (create/edit/delete inventory, change configuration,
 * invite staff, etc.).
 */
export function isComplexAdmin(
  user: UserForRole,
  complex: Pick<Doc<'complexes'>, 'organizationId'>,
  membership: MembershipForRole | null,
): boolean {
  return getEffectiveComplexRole(user, complex, membership) === 'ADMIN'
}

// ---------------------------------------------------------------------------
// React hook — use inside any route under /c/$complexSlug/*
// ---------------------------------------------------------------------------

const authenticatedRoute = getRouteApi('/_authenticated')
const complexRoute = getRouteApi('/_authenticated/c/$complexSlug')

/**
 * Hook that returns the current user's effective role in the active
 * complex. Reads user identity from the `_authenticated` route loader
 * and the complex + membership from the cached `getById` query the
 * parent route already prefetched. Zero extra network hits.
 *
 * Must be called inside a component rendered under
 * `/c/$complexSlug/*`.
 */
export function useEffectiveComplexRole(): ComplexRole | null {
  const { convexUser } = authenticatedRoute.useLoaderData()
  const { complexSlug: slug } = complexRoute.useParams()

  const { data } = useSuspenseQuery(
    convexQuery(api.complexes.queries.getBySlug, { slug }),
  )

  if (!data) return null

  return getEffectiveComplexRole(
    convexUser,
    data.complex,
    data.membership ?? null,
  )
}

export function useIsComplexAdmin(): boolean {
  return useEffectiveComplexRole() === 'ADMIN'
}
