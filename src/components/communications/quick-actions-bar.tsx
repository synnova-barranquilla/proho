import { useState } from 'react'

import { useSuspenseQuery } from '@tanstack/react-query'

import { convexQuery } from '@convex-dev/react-query'
import { Info, Zap } from 'lucide-react'

import { Button } from '#/components/ui/button'
import { api } from '../../../convex/_generated/api'
import type { Id } from '../../../convex/_generated/dataModel'

interface QuickActionsBarProps {
  complexId: Id<'complexes'>
  onAction: (label: string, quickActionId: Id<'quickActions'>) => void
}

export function QuickActionsBar({ complexId, onAction }: QuickActionsBarProps) {
  const [infoResponse, setInfoResponse] = useState<string | null>(null)

  const { data: quickActions } = useSuspenseQuery(
    convexQuery(api.communications.queries.listQuickActions, { complexId }),
  )

  if (quickActions.length === 0) return null

  const handleClick = (action: (typeof quickActions)[number]) => {
    if (action.isInfoOnly && action.response) {
      setInfoResponse(infoResponse === action.response ? null : action.response)
    } else {
      onAction(action.label, action._id as Id<'quickActions'>)
    }
  }

  return (
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
            onClick={() => handleClick(action)}
          >
            {action.isInfoOnly ? (
              <Info className="h-4 w-4 shrink-0 text-blue-500" />
            ) : (
              <Zap className="h-4 w-4 shrink-0 text-muted-foreground" />
            )}
            <span className="text-sm">{action.label}</span>
          </Button>
        ))}
      </div>

      {infoResponse && (
        <div className="rounded-md border bg-muted/50 px-4 py-3 text-sm">
          {infoResponse}
        </div>
      )}
    </div>
  )
}
