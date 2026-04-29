import { useSuspenseQuery } from '@tanstack/react-query'

import { convexQuery } from '@convex-dev/react-query'
import { MessageSquare, Zap } from 'lucide-react'

import { Button } from '#/components/ui/button'
import { api } from '../../../convex/_generated/api'
import type { Id } from '../../../convex/_generated/dataModel'

interface ResidentChatProps {
  complexId: Id<'complexes'>
}

export function ResidentChat({ complexId }: ResidentChatProps) {
  const { data: quickActions } = useSuspenseQuery(
    convexQuery(api.communications.queries.listQuickActions, { complexId }),
  )

  return (
    <div className="flex flex-col gap-6">
      {quickActions.length > 0 && (
        <div className="flex flex-col gap-3">
          <h2 className="text-sm font-medium text-muted-foreground">
            Acciones rápidas
          </h2>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {quickActions.map((action) => (
              <Button
                key={action._id}
                variant="outline"
                className="h-auto justify-start gap-2 px-3 py-3 text-left"
                disabled
              >
                <Zap className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="text-sm">{action.label}</span>
              </Button>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border py-16 text-center">
        <MessageSquare className="h-10 w-10 text-muted-foreground/50" />
        <div>
          <p className="font-medium text-muted-foreground">
            Próximamente: chat con asistente virtual
          </p>
          <p className="mt-1 text-sm text-muted-foreground/80">
            Podrás realizar solicitudes, reportar novedades y consultar
            información del conjunto directamente desde aquí.
          </p>
        </div>
      </div>
    </div>
  )
}
