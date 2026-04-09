import { useSuspenseQuery } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'

import { convexQuery } from '@convex-dev/react-query'

import { api } from '../../convex/_generated/api'
import type { Doc, Id } from '../../convex/_generated/dataModel'

export type ConjuntoRole = 'ADMIN' | 'ASISTENTE' | 'VIGILANTE' | 'RESIDENTE'

interface UserForRole {
  orgRole: 'SUPER_ADMIN' | 'ADMIN'
  isOrgOwner: boolean
  organizationId: Doc<'organizations'>['_id']
}

interface MembershipForRole {
  role: ConjuntoRole
  active: boolean
}

/**
 * Derives the *effective* conjunto role for a user viewing a specific
 * conjunto. Mirrors the server-side logic in `requireConjuntoAccess`:
 *
 *   1. SUPER_ADMIN → always ADMIN (internal support).
 *   2. ADMIN with `isOrgOwner === true` and matching org → ADMIN
 *      (implicit owner access to all conjuntos of the org).
 *   3. Otherwise → the role from the active conjuntoMembership, or
 *      `null` if there is no active membership (which should not
 *      happen if the user reached this page at all — the backend
 *      guard would have blocked them).
 *
 * Returning `null` is treated by UI gates as "no access" — render
 * nothing / redirect.
 */
export function getEffectiveConjuntoRole(
  user: UserForRole,
  conjunto: Pick<Doc<'conjuntos'>, 'organizationId'>,
  membership: MembershipForRole | null,
): ConjuntoRole | null {
  if (user.orgRole === 'SUPER_ADMIN') return 'ADMIN'

  if (
    user.isOrgOwner === true &&
    user.organizationId === conjunto.organizationId
  ) {
    return 'ADMIN'
  }

  if (membership && membership.active) return membership.role

  return null
}

/**
 * Convenience helper: `true` if the user can perform ADMIN-only actions
 * in this conjunto (create/edit/delete inventory, change configuration,
 * invite staff, etc.).
 */
export function isConjuntoAdmin(
  user: UserForRole,
  conjunto: Pick<Doc<'conjuntos'>, 'organizationId'>,
  membership: MembershipForRole | null,
): boolean {
  return getEffectiveConjuntoRole(user, conjunto, membership) === 'ADMIN'
}

// ---------------------------------------------------------------------------
// React hook — use inside any route under /admin/c/$conjuntoId/*
// ---------------------------------------------------------------------------

const authenticatedRoute = getRouteApi('/_authenticated')
const conjuntoRoute = getRouteApi('/_authenticated/admin/c/$conjuntoId')

/**
 * Hook that returns the current user's effective role in the active
 * conjunto. Reads user identity from the `_authenticated` route loader
 * and the conjunto + membership from the cached `getById` query the
 * parent route already prefetched. Zero extra network hits.
 *
 * Must be called inside a component rendered under
 * `/admin/c/$conjuntoId/*`.
 */
export function useEffectiveConjuntoRole(): ConjuntoRole | null {
  const { convexUser } = authenticatedRoute.useLoaderData()
  const { conjuntoId } = conjuntoRoute.useParams()

  const { data } = useSuspenseQuery(
    convexQuery(api.conjuntos.queries.getById, {
      conjuntoId: conjuntoId as Id<'conjuntos'>,
    }),
  )

  return getEffectiveConjuntoRole(
    convexUser,
    data.conjunto,
    data.membership ?? null,
  )
}

export function useIsConjuntoAdmin(): boolean {
  return useEffectiveConjuntoRole() === 'ADMIN'
}
