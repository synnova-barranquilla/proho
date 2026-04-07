import { useRouter } from '@tanstack/react-router'

import { AlertCircle } from 'lucide-react'

import { Button } from '#/components/ui/button'

interface QueryErrorFallbackProps {
  error: Error
  reset?: () => void
}

/**
 * Reusable error fallback for route-level errorComponent or local
 * error boundaries. Offers a "Reintentar" button that invalidates the
 * router so queries re-run.
 */
export function QueryErrorFallback({ error, reset }: QueryErrorFallbackProps) {
  const router = useRouter()

  const handleRetry = () => {
    reset?.()
    void router.invalidate()
  }

  return (
    <div className="flex min-h-[200px] flex-col items-center justify-center gap-4 rounded-lg border border-dashed p-6 text-center">
      <div className="inline-flex size-10 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <AlertCircle className="size-5" />
      </div>
      <div className="space-y-1">
        <h3 className="text-sm font-medium">Algo salió mal</h3>
        <p className="max-w-sm text-sm text-muted-foreground">
          {error.message || 'No pudimos cargar esta sección.'}
        </p>
      </div>
      <Button variant="outline" size="sm" onClick={handleRetry}>
        Reintentar
      </Button>
    </div>
  )
}
