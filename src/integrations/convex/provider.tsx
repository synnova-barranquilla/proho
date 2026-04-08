import { useCallback } from 'react'

import { isServer, QueryClient } from '@tanstack/react-query'

import { ConvexQueryClient } from '@convex-dev/react-query'
import { useAccessToken } from '@workos/authkit-tanstack-react-start/client'
import { ConvexProviderWithAuth } from 'convex/react'

const CONVEX_URL = (import.meta as any).env.VITE_CONVEX_URL
if (!CONVEX_URL) {
  console.error('missing envar VITE_CONVEX_URL')
}

// Single ConvexQueryClient instance shared only on the browser side. It
// wraps a Convex client with a websocket for reactive subscriptions — the
// server never needs it because SSR does one-shot HTTP fetches via
// `prefetchAuthenticatedQuery` (ConvexHttpClient created per call).
const convexQueryClient = new ConvexQueryClient(CONVEX_URL)

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        queryKeyHashFn: convexQueryClient.hashFn(),
        queryFn: convexQueryClient.queryFn(),
      },
    },
  })
}

let browserQueryClient: QueryClient | undefined

/**
 * Returns a QueryClient appropriate for the execution context.
 *
 * **Server (SSR)**: a fresh QueryClient per request. This is critical —
 * Nitro/Vercel serverless reuse warm function instances across requests,
 * and a module-level singleton on the server would leak dehydrated state
 * between users. Concretely: a prior super-admin request would leave
 * `organizations.listAll` cached, then a subsequent ADMIN request would
 * dehydrate that stale entry into the HTML, the client would rehydrate
 * and `ConvexQueryClient` would reactively re-fetch it with the wrong
 * auth token, producing FORBIDDEN errors. It is also a real data-leak
 * security concern (another user's cached data shipped to your HTML).
 *
 * **Browser**: a singleton reused across navigations so we don't recreate
 * the client if React suspends during the initial render (which would
 * blow away the cache and put `useSuspenseQuery` into an infinite
 * refetch loop — see TanStack Query #6116). Convex reactive subscriptions
 * are connected here exactly once.
 *
 * This mirrors the canonical pattern from TanStack Query's "Advanced
 * Server Rendering" guide.
 */
export function getQueryClient() {
  if (isServer) {
    return makeQueryClient()
  }
  if (!browserQueryClient) {
    browserQueryClient = makeQueryClient()
    convexQueryClient.connect(browserQueryClient)
  }
  return browserQueryClient
}

/**
 * Bridges WorkOS access tokens into Convex's `ConvexProviderWithAuth`.
 * Convex calls `fetchAccessToken` on every request that needs auth; we
 * delegate to WorkOS's `useAccessToken` hook which manages refresh for us.
 */
function useAuthFromWorkOS() {
  const { accessToken, loading, getAccessToken } = useAccessToken()

  const fetchAccessToken = useCallback(
    async ({ forceRefreshToken }: { forceRefreshToken: boolean }) => {
      if (forceRefreshToken) {
        return (await getAccessToken()) ?? null
      }
      return accessToken ?? null
    },
    [accessToken, getAccessToken],
  )

  return {
    isLoading: loading,
    isAuthenticated: !!accessToken,
    fetchAccessToken,
  }
}

export default function AppConvexProvider({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ConvexProviderWithAuth
      client={convexQueryClient.convexClient}
      useAuth={useAuthFromWorkOS}
    >
      {children}
    </ConvexProviderWithAuth>
  )
}
