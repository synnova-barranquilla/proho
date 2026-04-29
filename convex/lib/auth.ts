import type { Doc, Id } from '../_generated/dataModel'
import type { MutationCtx, QueryCtx } from '../_generated/server'
import { ERROR_CODES, throwConvexError } from './errors'

type OrgRole = Doc<'users'>['orgRole']
type ComplexRole = Doc<'complexMemberships'>['role']

/**
 * Returns the currently authenticated user from Convex (looked up by the
 * WorkOS `sub` claim in the JWT). Returns null if unauthenticated or if the
 * user has not been created yet in Convex.
 */
export async function getCurrentUser(
  ctx: QueryCtx | MutationCtx,
): Promise<Doc<'users'> | null> {
  const identity = await ctx.auth.getUserIdentity()
  if (!identity) return null

  return await ctx.db
    .query('users')
    .withIndex('by_workos_user_id', (q) =>
      q.eq('workosUserId', identity.subject),
    )
    .unique()
}

/**
 * Requires an authenticated, active user whose organization is also active.
 * Throws if the user or their org is missing or inactive. Provides
 * defense-in-depth for all mutations/queries without changing call sites.
 */
export async function requireUser(
  ctx: QueryCtx | MutationCtx,
): Promise<Doc<'users'>> {
  const user = await getCurrentUser(ctx)
  if (!user) {
    throwConvexError(
      ERROR_CODES.UNAUTHENTICATED,
      'Unauthenticated: user not found in Convex',
    )
  }
  if (!user.active) {
    throwConvexError(ERROR_CODES.FORBIDDEN, 'User is inactive')
  }

  const organization = await ctx.db.get(user.organizationId)
  if (!organization) {
    throwConvexError(ERROR_CODES.ORG_NOT_FOUND, 'Organization not found')
  }
  if (!organization.active) {
    throwConvexError(ERROR_CODES.ORG_INACTIVE, 'User organization is inactive')
  }

  return user
}

/**
 * Requires the authenticated user to have one of the allowed org roles.
 */
export async function requireOrgRole(
  ctx: QueryCtx | MutationCtx,
  allowedRoles: Array<OrgRole>,
): Promise<Doc<'users'>> {
  const user = await requireUser(ctx)
  if (!allowedRoles.includes(user.orgRole)) {
    throwConvexError(
      ERROR_CODES.FORBIDDEN,
      `Requires role ${allowedRoles.join(' or ')} (user has ${user.orgRole})`,
    )
  }
  return user
}

/**
 * Enforces access to a specific complex. Logic:
 *
 *   1. SUPER_ADMIN -> full access (internal support).
 *   2. ADMIN with `isOrgOwner === true` and `complex.organizationId === user.organizationId`
 *      -> automatic access, no complexMemberships needed.
 *   3. Any other case -> requires active complexMemberships for that user/complex.
 *      If `allowedRoles` is passed, the membership role must be included.
 *
 * Returns the user, the complex and (when applicable) the specific membership.
 */
export async function requireComplexAccess(
  ctx: QueryCtx | MutationCtx,
  complexId: Id<'complexes'>,
  options?: { allowedRoles?: Array<ComplexRole> },
): Promise<{
  user: Doc<'users'>
  complex: Doc<'complexes'>
  membership?: Doc<'complexMemberships'>
}> {
  const user = await requireUser(ctx)
  const complex = await ctx.db.get(complexId)
  if (!complex) {
    throwConvexError(ERROR_CODES.COMPLEX_NOT_FOUND, 'Complex not found')
  }
  if (!complex.active) {
    throwConvexError(ERROR_CODES.COMPLEX_INACTIVE, 'Complex is inactive')
  }

  // Case 1: SUPER_ADMIN
  if (user.orgRole === 'SUPER_ADMIN') {
    return { user, complex }
  }

  // Case 2: ADMIN owner with automatic access to their org's complexes
  if (
    user.isOrgOwner === true &&
    complex.organizationId === user.organizationId
  ) {
    if (options?.allowedRoles && !options.allowedRoles.includes('ADMIN')) {
      throwConvexError(
        ERROR_CODES.FORBIDDEN,
        `Requires role ${options.allowedRoles.join(' or ')} (you have access as owner)`,
      )
    }
    return { user, complex }
  }

  // Case 3: requires explicit and active membership
  const membership = await ctx.db
    .query('complexMemberships')
    .withIndex('by_user_and_complex', (q) =>
      q.eq('userId', user._id).eq('complexId', complexId),
    )
    .filter((q) => q.eq(q.field('active'), true))
    .first()

  if (!membership) {
    throwConvexError(ERROR_CODES.FORBIDDEN, 'No access to this complex')
  }

  if (
    options?.allowedRoles &&
    !options.allowedRoles.includes(membership.role)
  ) {
    throwConvexError(
      ERROR_CODES.FORBIDDEN,
      `Requires role ${options.allowedRoles.join(' or ')} (you have ${membership.role})`,
    )
  }

  return { user, complex, membership }
}

/**
 * Like requireComplexAccess but with two additional constraints for the
 * communications module:
 *
 *   1. Org owners with implicit access (no membership) are DENIED.
 *      They must have an explicit ADMIN membership on the complex.
 *   2. SUPER_ADMINs are still allowed (internal support).
 *
 * This enforces the privacy rule: org owners (company managers) don't
 * see resident↔admin conversations by default.
 */
export async function requireCommsAccess(
  ctx: QueryCtx | MutationCtx,
  complexId: Id<'complexes'>,
  options?: { allowedRoles?: Array<ComplexRole> },
): Promise<{
  user: Doc<'users'>
  complex: Doc<'complexes'>
  membership?: Doc<'complexMemberships'>
}> {
  const user = await requireUser(ctx)
  const complex = await ctx.db.get(complexId)
  if (!complex) {
    throwConvexError(ERROR_CODES.COMPLEX_NOT_FOUND, 'Complex not found')
  }
  if (!complex.active) {
    throwConvexError(ERROR_CODES.COMPLEX_INACTIVE, 'Complex is inactive')
  }

  if (user.orgRole === 'SUPER_ADMIN') {
    return { user, complex }
  }

  const membership = await ctx.db
    .query('complexMemberships')
    .withIndex('by_user_and_complex', (q) =>
      q.eq('userId', user._id).eq('complexId', complexId),
    )
    .filter((q) => q.eq(q.field('active'), true))
    .first()

  if (!membership) {
    throwConvexError(
      ERROR_CODES.FORBIDDEN,
      'No access to communications for this complex',
    )
  }

  if (
    options?.allowedRoles &&
    !options.allowedRoles.includes(membership.role)
  ) {
    throwConvexError(
      ERROR_CODES.FORBIDDEN,
      `Requires role ${options.allowedRoles.join(' or ')} (you have ${membership.role})`,
    )
  }

  return { user, complex, membership }
}

/**
 * Validates whether `inviter` can invite a user with `targetRole` to
 * `targetOrgId`. Rules:
 *
 * - Nobody can invite SUPER_ADMINs (they come from seed bootstrap only).
 * - SUPER_ADMIN can invite ADMINs to any org.
 * - ADMIN with `isOrgOwner === true` can invite ADMINs **to their own org**.
 */
export function canInvite(
  inviter: Doc<'users'>,
  targetRole: OrgRole,
  targetOrgId: Id<'organizations'>,
): boolean {
  if (targetRole === 'SUPER_ADMIN') return false

  if (inviter.orgRole === 'SUPER_ADMIN') return true

  if (inviter.isOrgOwner === true && inviter.organizationId === targetOrgId) {
    return true
  }

  return false
}
