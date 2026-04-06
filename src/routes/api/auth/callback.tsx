import { createFileRoute, redirect } from '@tanstack/react-router'

import { handleCallbackRoute } from '@workos/authkit-tanstack-react-start'
import { ConvexHttpClient } from 'convex/browser'

import { api } from '../../../../convex/_generated/api'

const CONVEX_URL = (import.meta as any).env.VITE_CONVEX_URL

export const Route = createFileRoute('/api/auth/callback')({
  server: {
    handlers: {
      GET: handleCallbackRoute({
        onSuccess: async ({ user: workosUser, accessToken }) => {
          try {
            const client = new ConvexHttpClient(CONVEX_URL)
            client.setAuth(accessToken)

            const result = await client.mutation(
              api.auth.mutations.handleLogin,
              {},
            )

            switch (result.status) {
              case 'not_registered':
                throw redirect({ to: '/no-registrado' })
              case 'invitation_expired':
                throw redirect({ to: '/invitacion-expirada' })
              case 'invitation_revoked':
                throw redirect({ to: '/invitacion-revocada' })
              case 'cuenta_desactivada':
                throw redirect({ to: '/cuenta-desactivada' })
              case 'accepted':
              case 'existing':
                // Let handleCallbackRoute fall through to the default
                // redirect (which uses the OAuth state's returnPathname).
                return
            }
          } catch (err) {
            // Re-throw redirects so they propagate to handleCallbackRoute.
            if (err instanceof Response) throw err

            console.error('[auth/callback] Error en sync a Convex', {
              email: workosUser.email,
              workosUserId: workosUser.id,
              error: err instanceof Error ? err.message : String(err),
              stack: err instanceof Error ? err.stack : undefined,
            })

            throw redirect({ to: '/error-auth' })
          }
        },
      }),
    },
  },
})
