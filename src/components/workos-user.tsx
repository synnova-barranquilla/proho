import { useAuth } from '@workos/authkit-tanstack-react-start/client'

export default function SignInButton({ large }: { large?: boolean }) {
  const { user, loading, getAuth, signOut } = useAuth()

  const buttonClasses = `${
    large ? 'px-6 py-3 text-base' : 'px-4 py-2 text-sm'
  } bg-blue-600 hover:bg-blue-700 text-white font-medium rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed`

  if (user) {
    return (
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          {user.profilePictureUrl && (
            <img
              src={user.profilePictureUrl}
              alt={`Avatar of ${user.firstName} ${user.lastName}`}
              className="h-10 w-10 rounded-full"
            />
          )}
          {user.firstName} {user.lastName}
        </div>
        <button onClick={() => signOut()} className={buttonClasses}>
          Sign Out
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => getAuth({ ensureSignedIn: true })}
      className={buttonClasses}
      disabled={loading}
    >
      Sign In {large && 'with AuthKit'}
    </button>
  )
}
