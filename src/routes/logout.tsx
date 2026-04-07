import { createFileRoute } from '@tanstack/react-router'

import { signOut } from '@workos/authkit-tanstack-react-start'

export const Route = createFileRoute('/logout')({
  loader: async () => {
    // WorkOS signOut clears the session cookie and redirects to WorkOS's
    // logout endpoint, which then redirects the browser to `returnTo`.
    // Without returnTo, WorkOS falls back to its own hosted login page,
    // not our landing.
    await signOut({ data: { returnTo: '/' } })
  },
})
