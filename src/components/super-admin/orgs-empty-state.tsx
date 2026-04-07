import { Building2, Plus } from 'lucide-react'

import { Button } from '#/components/ui/button'

interface OrgsEmptyStateProps {
  onCreate: () => void
  showInactive: boolean
}

export function OrgsEmptyState({
  onCreate,
  showInactive,
}: OrgsEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed py-12 px-6 text-center">
      <div className="inline-flex size-12 items-center justify-center rounded-lg bg-muted">
        <Building2 className="size-6 text-muted-foreground" />
      </div>
      <div className="space-y-1">
        <h3 className="text-sm font-medium">
          {showInactive
            ? 'No hay organizaciones'
            : 'No hay organizaciones activas'}
        </h3>
        <p className="max-w-sm text-sm text-muted-foreground">
          {showInactive
            ? 'Aún no se ha creado ninguna organización en el sistema.'
            : 'Crea tu primera organización o activa el toggle para ver las inactivas.'}
        </p>
      </div>
      <Button onClick={onCreate}>
        <Plus className="size-4" />
        Nueva organización
      </Button>
    </div>
  )
}
