import {
  customAction,
  customCtx,
  customMutation,
  customQuery,
} from 'convex-helpers/server/customFunctions'

import { action, mutation, query } from '../_generated/server'
import { getCurrentUser, requireUser } from './auth'

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
