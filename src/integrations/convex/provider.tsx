import { useCallback } from 'react'

import { QueryClient } from '@tanstack/react-query'

import { ConvexQueryClient } from '@convex-dev/react-query'
import { useAccessToken } from '@workos/authkit-tanstack-react-start/client'
import { ConvexProviderWithAuth } from 'convex/react'

const CONVEX_URL = (import.meta as any).env.VITE_CONVEX_URL
if (!CONVEX_URL) {
  console.error('missing envar VITE_CONVEX_URL')
}

const convexQueryClient = new ConvexQueryClient(CONVEX_URL)

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryKeyHashFn: convexQueryClient.hashFn(),
      queryFn: convexQueryClient.queryFn(),
    },
  },
})

convexQueryClient.connect(queryClient)

export function getQueryClient() {
  return queryClient
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
