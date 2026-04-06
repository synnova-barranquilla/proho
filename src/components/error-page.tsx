import { Link } from '@tanstack/react-router'

import { buttonVariants } from './ui/button'

interface ErrorPageProps {
  title: string
  message: string
  primaryAction?: {
    label: string
    to: string
  }
  showLogout?: boolean
}

export function ErrorPage({
  title,
  message,
  primaryAction,
  showLogout = true,
}: ErrorPageProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 text-center">
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
        {title}
      </h1>
      <p className="max-w-md text-muted-foreground">{message}</p>
      <div className="flex flex-col gap-3 sm:flex-row">
        {primaryAction && (
          <Link to={primaryAction.to} className={buttonVariants()}>
            {primaryAction.label}
          </Link>
        )}
        {showLogout && (
          <Link to="/logout" className={buttonVariants({ variant: 'outline' })}>
            Cerrar sesión
          </Link>
        )}
      </div>
    </div>
  )
}
