import { createFileRoute, Link, redirect } from '@tanstack/react-router'

import { getAuth } from '@workos/authkit-tanstack-react-start'
import { ConvexHttpClient } from 'convex/browser'
import { ConvexError } from 'convex/values'

import { api } from '../../convex/_generated/api'
import { buttonVariants } from '../components/ui/button'
import { getDashboardPathForRole } from '../lib/routes'

const CONVEX_URL = (import.meta as any).env.VITE_CONVEX_URL

export const Route = createFileRoute('/')({
  loader: async () => {
    const auth = await getAuth()

    if (!auth.user) {
      return { authenticated: false as const }
    }

    // TEMP DIAGNOSTIC: decode JWT payload to see real issuer/audience claims.
    // Once convex/auth.config.ts matches the real values, this log can be removed.
    try {
      const [, payloadB64] = auth.accessToken.split('.')
      const payloadJson = Buffer.from(payloadB64, 'base64url').toString('utf-8')
      const payload = JSON.parse(payloadJson) as Record<string, unknown>
      console.log('[/] Decoded JWT payload for auth.config.ts alignment', {
        iss: payload.iss,
        aud: payload.aud,
        sub: payload.sub,
        email: payload.email,
        org_id: payload.org_id,
        allClaims: Object.keys(payload),
      })
    } catch (decodeErr) {
      console.error('[/] Failed to decode JWT for diagnostic', decodeErr)
    }

    const client = new ConvexHttpClient(CONVEX_URL)
    client.setAuth(auth.accessToken)

    let result
    try {
      result = await client.mutation(api.auth.mutations.handleLogin, {})
    } catch (err) {
      // Log every detail so we can diagnose JWT / Convex auth problems.
      const asConvex = err instanceof ConvexError ? err.data : null
      console.error('[/] handleLogin failed', {
        workosUserId: auth.user.id,
        email: auth.user.email,
        errName: (err as { constructor?: { name?: string } } | undefined)
          ?.constructor?.name,
        errMessage: err instanceof Error ? err.message : String(err),
        convexErrorData: asConvex,
      })
      throw redirect({ to: '/error-auth' })
    }

    switch (result.status) {
      case 'not_registered':
        throw redirect({ to: '/no-registrado' })
      case 'invitation_expired':
        throw redirect({ to: '/invitacion-expirada' })
      case 'invitation_revoked':
        throw redirect({ to: '/invitacion-revocada' })
      case 'cuenta_desactivada':
        throw redirect({ to: '/cuenta-desactivada' })
      case 'existing':
      case 'accepted':
        throw redirect({ to: getDashboardPathForRole(result.orgRole) })
    }
  },
  component: HomePage,
})

function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 text-center">
      <div className="flex flex-col gap-3">
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
          Synnova
        </h1>
        <p className="text-lg text-muted-foreground sm:text-xl">
          Gestión integral para conjuntos residenciales
        </p>
        <p className="max-w-md text-sm text-muted-foreground">
          Control de acceso vehicular, convivencia, reservas y mucho más.
        </p>
      </div>
      <Link to="/login" className={buttonVariants({ size: 'lg' })}>
        Iniciar sesión
      </Link>
    </main>
  )
}
