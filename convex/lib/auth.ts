import type { Doc, Id } from '../_generated/dataModel'
import type { MutationCtx, QueryCtx } from '../_generated/server'
import { ERROR_CODES, throwConvexError } from './errors'

type OrgRole = Doc<'users'>['orgRole']
type ConjuntoRole = Doc<'conjuntoMemberships'>['role']

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
 * F4: Enforces access to a specific conjunto. Lógica:
 *
 *   1. SUPER_ADMIN → acceso total (soporte interno).
 *   2. ADMIN con `isOrgOwner === true` y `conjunto.organizationId === user.organizationId`
 *      → acceso automático, sin necesidad de conjuntoMemberships.
 *   3. Cualquier otro caso → requiere conjuntoMemberships activa para ese user/conjunto.
 *      Si se pasa `allowedRoles`, el rol de la membership debe estar incluido.
 *
 * Retorna el user, el conjunto y (cuando aplica) la membership específica.
 */
export async function requireConjuntoAccess(
  ctx: QueryCtx | MutationCtx,
  conjuntoId: Id<'conjuntos'>,
  options?: { allowedRoles?: Array<ConjuntoRole> },
): Promise<{
  user: Doc<'users'>
  conjunto: Doc<'conjuntos'>
  membership?: Doc<'conjuntoMemberships'>
}> {
  const user = await requireUser(ctx)
  const conjunto = await ctx.db.get(conjuntoId)
  if (!conjunto) {
    throwConvexError(ERROR_CODES.CONJUNTO_NOT_FOUND, 'Conjunto no encontrado')
  }
  if (!conjunto.active) {
    throwConvexError(ERROR_CODES.CONJUNTO_INACTIVE, 'El conjunto está inactivo')
  }

  // Caso 1: SUPER_ADMIN
  if (user.orgRole === 'SUPER_ADMIN') {
    return { user, conjunto }
  }

  // Caso 2: ADMIN owner con acceso automático a los conjuntos de su org
  // (orgRole queda narrowed a 'ADMIN' aquí porque SUPER_ADMIN ya se manejó arriba)
  if (
    user.isOrgOwner === true &&
    conjunto.organizationId === user.organizationId
  ) {
    if (options?.allowedRoles && !options.allowedRoles.includes('ADMIN')) {
      throwConvexError(
        ERROR_CODES.FORBIDDEN,
        `Se requiere rol ${options.allowedRoles.join(' o ')} (tienes acceso como owner)`,
      )
    }
    return { user, conjunto }
  }

  // Caso 3: requiere membership explícita y activa
  const membership = await ctx.db
    .query('conjuntoMemberships')
    .withIndex('by_user_and_conjunto', (q) =>
      q.eq('userId', user._id).eq('conjuntoId', conjuntoId),
    )
    .filter((q) => q.eq(q.field('active'), true))
    .first()

  if (!membership) {
    throwConvexError(ERROR_CODES.FORBIDDEN, 'No tienes acceso a este conjunto')
  }

  if (
    options?.allowedRoles &&
    !options.allowedRoles.includes(membership.role)
  ) {
    throwConvexError(
      ERROR_CODES.FORBIDDEN,
      `Se requiere rol ${options.allowedRoles.join(' o ')} (tienes ${membership.role})`,
    )
  }

  return { user, conjunto, membership }
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
