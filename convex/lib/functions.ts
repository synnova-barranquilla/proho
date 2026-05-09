import {
  customAction,
  customCtx,
  customMutation,
  customQuery,
} from 'convex-helpers/server/customFunctions'
import { v } from 'convex/values'

import { action, mutation, query } from '../_generated/server'
import {
  getCurrentUser,
  requireCommsAccess,
  requireComplexAccess,
  requireOrgRole,
  requireUser,
} from './auth'

export const authenticatedQuery = customQuery(
  query,
  customCtx(async (ctx) => {
    const user = await requireUser(ctx)
    return { user }
  }),
)

export const authenticatedMutation = customMutation(
  mutation,
  customCtx(async (ctx) => {
    const user = await requireUser(ctx)
    return { user }
  }),
)

export const authenticatedAction = customAction(
  action,
  customCtx(async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error('Unauthenticated')
    return { identity }
  }),
)

export const optionalAuthQuery = customQuery(
  query,
  customCtx(async (ctx) => {
    const user = await getCurrentUser(ctx)
    return { user }
  }),
)

export const superAdminQuery = customQuery(
  query,
  customCtx(async (ctx) => {
    const user = await requireOrgRole(ctx, ['SUPER_ADMIN'])
    return { user }
  }),
)

export const superAdminMutation = customMutation(
  mutation,
  customCtx(async (ctx) => {
    const user = await requireOrgRole(ctx, ['SUPER_ADMIN'])
    return { user }
  }),
)

export const complexQuery = customQuery(query, {
  args: { complexId: v.id('complexes') },
  input: async (ctx, { complexId }) => {
    const result = await requireComplexAccess(ctx, complexId)
    return { ctx: result, args: { complexId } }
  },
})

export const complexMutation = customMutation(mutation, {
  args: { complexId: v.id('complexes') },
  input: async (ctx, { complexId }) => {
    const result = await requireComplexAccess(ctx, complexId)
    return { ctx: result, args: { complexId } }
  },
})

export const commsQuery = customQuery(query, {
  args: { complexId: v.id('complexes') },
  input: async (ctx, { complexId }) => {
    const result = await requireCommsAccess(ctx, complexId)
    return { ctx: result, args: { complexId } }
  },
})

export const commsMutation = customMutation(mutation, {
  args: { complexId: v.id('complexes') },
  input: async (ctx, { complexId }) => {
    const result = await requireCommsAccess(ctx, complexId)
    return { ctx: result, args: { complexId } }
  },
})
