import { createFileRoute } from '@tanstack/react-router'

import { handleCallbackRoute } from '@workos/authkit-tanstack-react-start'

/**
 * Handles the OAuth callback from WorkOS. This is intentionally a pass-through:
 * no onSuccess hook. The Convex sync (handleLogin mutation) runs in the `/`
 * loader where TanStack `redirect()` works natively and errors propagate
 * cleanly to error pages.
 */
export const Route = createFileRoute('/api/auth/callback')({
  server: {
    handlers: {
      GET: handleCallbackRoute(),
    },
  },
})
