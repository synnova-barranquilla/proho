import { useQuery } from '@tanstack/react-query'

import { convexQuery } from '@convex-dev/react-query'
import { MessageSquare } from 'lucide-react'

import { api } from '../../../convex/_generated/api'
import type { Id } from '../../../convex/_generated/dataModel'

interface StaffConversationsTabProps {
  complexId: Id<'complexes'>
}

export function StaffConversationsTab({
  complexId,
}: StaffConversationsTabProps) {
  const { data: conversations = [] } = useQuery(
    convexQuery(api.communications.queries.listConversations, { complexId }),
  )

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
        <MessageSquare className="h-10 w-10 text-muted-foreground/50" />
        <div>
          <p className="font-medium text-muted-foreground">
            No hay conversaciones activas
          </p>
          <p className="mt-1 text-sm text-muted-foreground/80">
            Las conversaciones aparecerán aquí cuando los residentes usen el
            chat.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {conversations.map((conv) => (
        <div
          key={conv._id}
          className="flex items-center justify-between rounded-lg border p-3"
        >
          <div className="flex flex-col gap-0.5">
            <p className="text-sm font-medium">
              {conv.resident
                ? `${conv.resident.firstName} ${conv.resident.lastName}`
                : 'Residente desconocido'}
            </p>
            <p className="text-xs text-muted-foreground">{conv.status}</p>
          </div>
          <p className="text-xs text-muted-foreground">
            {new Date(conv.updatedAt).toLocaleDateString('es-CO')}
          </p>
        </div>
      ))}
    </div>
  )
}
