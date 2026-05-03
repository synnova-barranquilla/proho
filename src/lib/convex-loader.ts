import type { QueryClient } from '@tanstack/react-query'

import { convexQuery } from '@convex-dev/react-query'
import { getAuth } from '@workos/authkit-tanstack-react-start'
import { ConvexHttpClient } from 'convex/browser'
import type { FunctionReference, FunctionReturnType } from 'convex/server'

const CONVEX_URL = import.meta.env.VITE_CONVEX_URL

/**
 * Prefetches a Convex query with an authenticated HTTP client and populates
 * the TanStack Query cache so that a subsequent `useSuspenseQuery` (using
 * the same `convexQuery(...)` key) resolves immediately without a
 * client-side fetch.
 *
 * Use this in TanStack Router loaders for routes under `_authenticated/`
 * that depend on authenticated Convex queries.
 *
 * Why this exists: `queryClient.prefetchQuery(convexQuery(...))` does NOT
 * work for auth-required queries because `@convex-dev/react-query` uses
 * an unauthenticated `ConvexHttpClient` when running server-side (during
 * SSR or navigation prefetch). The WorkOS access token lives in the
 * server-side session cookie and must be read via `getAuth()` + attached
 * to the client explicitly.
 */
export async function prefetchAuthenticatedQuery<
  TQuery extends FunctionReference<'query'>,
>(
  queryClient: QueryClient,
  query: TQuery,
  args: TQuery['_args'],
): Promise<FunctionReturnType<TQuery>> {
  const auth = await getAuth()
  if (!auth.user) {
    throw new Error(
      'prefetchAuthenticatedQuery requires an authenticated WorkOS session',
    )
  }

  const httpClient = new ConvexHttpClient(CONVEX_URL)
  httpClient.setAuth(auth.accessToken)

  const data = (await httpClient.query(
    query,
    args,
  )) as FunctionReturnType<TQuery>

  queryClient.setQueryData(convexQuery(query, args).queryKey, data)
  return data
}
