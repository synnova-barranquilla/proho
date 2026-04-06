import AppConvexProvider from './convex/provider'
import AppWorkOSProvider from './workos/provider'

/**
 * Combined app providers used as the router's `Wrap` component.
 *
 * Order matters: WorkOS must wrap Convex because the Convex provider's
 * `useAuthFromWorkOS` hook reads `useAccessToken()` from WorkOS context.
 */
export default function AppProviders({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AppWorkOSProvider>
      <AppConvexProvider>{children}</AppConvexProvider>
    </AppWorkOSProvider>
  )
}
