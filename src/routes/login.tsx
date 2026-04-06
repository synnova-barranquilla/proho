import { createFileRoute, redirect } from '@tanstack/react-router'

import { getAuth, getSignInUrl } from '@workos/authkit-tanstack-react-start'

export const Route = createFileRoute('/login')({
  loader: async () => {
    const { user } = await getAuth()

    if (user) {
      // Already authenticated — let the home route decide where to redirect
      // based on the user's role.
      throw redirect({ to: '/' })
    }

    const signInUrl = await getSignInUrl()
    throw redirect({ href: signInUrl })
  },
})
