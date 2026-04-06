import type { Doc } from '../_generated/dataModel'
import type { MutationCtx, QueryCtx } from '../_generated/server'

type OrgRole = Doc<'users'>['orgRole']

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
 * Requires an authenticated, active user. Throws if not found or inactive.
 */
export async function requireUser(
  ctx: QueryCtx | MutationCtx,
): Promise<Doc<'users'>> {
  const user = await getCurrentUser(ctx)
  if (!user) {
    throw new Error('Unauthenticated: user not found in Convex')
  }
  if (!user.active) {
    throw new Error('Forbidden: user is inactive')
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
    throw new Error(
      `Forbidden: requires role ${allowedRoles.join(' or ')} (user has ${user.orgRole})`,
    )
  }
  return user
}

/**
 * Validates whether `inviter` can invite a user with `targetRole`.
 * In F2, only SUPER_ADMIN can invite ADMINs. Nobody can invite SUPER_ADMINs
 * (those are created via seed bootstrap only).
 */
export function canInvite(inviter: Doc<'users'>, targetRole: OrgRole): boolean {
  if (targetRole === 'SUPER_ADMIN') return false
  // targetRole is narrowed to 'ADMIN' here — only SUPER_ADMIN can invite ADMINs.
  return inviter.orgRole === 'SUPER_ADMIN'
}
