import { createFileRoute, Link, redirect } from '@tanstack/react-router'

import { getAuth } from '@workos/authkit-tanstack-react-start'
import { ConvexHttpClient } from 'convex/browser'
import { ConvexError } from 'convex/values'

import { api } from '../../convex/_generated/api'
import { buttonVariants } from '../components/ui/button'
import { getDashboardPathForRole } from '../lib/routes'

const CONVEX_URL = import.meta.env.VITE_CONVEX_URL

export const Route = createFileRoute('/')({
  loader: async () => {
    const auth = await getAuth()

    if (!auth.user) {
      return { authenticated: false as const }
    }

    const client = new ConvexHttpClient(CONVEX_URL)
    client.setAuth(auth.accessToken)

    // WorkOS AuthKit access tokens don't include email/name — we pass them
    // from the decrypted session via getAuth(). The JWT still provides the
    // cryptographically-verified identity (workosUserId = sub).
    //
    // IMPORTANT: do NOT fall back to `auth.user.email` when WorkOS has no
    // firstName. Email-OTP signups through WorkOS don't collect a name,
    // so `auth.user.firstName` is commonly empty. If we fell back to the
    // email, `handleLogin` would (a) create the user with firstName =
    // email, and worse (b) overwrite a previously-correct firstName with
    // the email on every subsequent login. Send an empty string instead
    // so `handleLogin` falls back to `invitation.firstName` (the name the
    // inviter typed in the invite dialog) via its internal `||` check.
    const firstName = auth.user.firstName?.trim() ?? ''
    const lastName = auth.user.lastName?.trim() || undefined

    let result
    try {
      result = await client.mutation(api.auth.mutations.handleLogin, {
        email: auth.user.email,
        firstName,
        lastName,
      })
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
      case 'organizacion_inactiva':
        throw redirect({ to: '/organizacion-inactiva' })
      case 'existing':
      case 'accepted':
        throw redirect({
          to: getDashboardPathForRole(result.orgRole, result.complexSlug),
        })
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
