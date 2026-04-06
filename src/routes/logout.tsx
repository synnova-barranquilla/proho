import { createFileRoute } from '@tanstack/react-router'

import { signOut } from '@workos/authkit-tanstack-react-start'

export const Route = createFileRoute('/logout')({
  loader: async () => {
    // WorkOS signOut clears the session cookie and redirects to the
    // Sign-out redirect URL configured in the WorkOS Dashboard.
    await signOut()
  },
})
