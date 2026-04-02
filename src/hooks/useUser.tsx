import { useAuth } from '@workos/authkit-tanstack-react-start/client'

export const useUser = () => {
  const { user, loading } = useAuth()
  return { user, loading }
}
