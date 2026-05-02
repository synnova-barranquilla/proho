import { Suspense, useState } from 'react'

import { Skeleton } from '#/components/ui/skeleton'
import { useEffectiveComplexRole } from '#/lib/complex-role'
import { cn } from '#/lib/utils'
import type { Id } from '../../../convex/_generated/dataModel'
import { CategoriesManager } from './categories-manager'
import { ResidentChat } from './resident-chat'
import { StaffConversationsTab } from './staff-conversations-tab'
import { StaffTicketsTab } from './staff-tickets-tab'

type Tab = 'tickets' | 'conversaciones' | 'categorias'

const TABS: { id: Tab; label: string }[] = [
  { id: 'tickets', label: 'Tickets' },
  { id: 'conversaciones', label: 'Conversaciones' },
  { id: 'categorias', label: 'Categorías' },
]

interface CommunicationsPageProps {
  complexId: Id<'complexes'>
}

export function CommunicationsPage({ complexId }: CommunicationsPageProps) {
  const role = useEffectiveComplexRole()
  const isStaff = role === 'ADMIN' || role === 'AUXILIAR'

  if (!isStaff) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight">
            Comunicaciones
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Centro de comunicaciones del conjunto.
          </p>
        </div>
        <Suspense fallback={<TabSkeleton />}>
          <ResidentChat complexId={complexId} />
        </Suspense>
      </div>
    )
  }

  return <StaffView complexId={complexId} />
}

function StaffView({ complexId }: { complexId: Id<'complexes'> }) {
  const [activeTab, setActiveTab] = useState<Tab>('tickets')

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">
          Comunicaciones
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Gestión de tickets y conversaciones del conjunto.
        </p>
      </div>

      <div className="flex gap-1 rounded-t-lg border border-b-0 bg-muted/60 p-1">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors',
              activeTab === tab.id
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex flex-1 flex-col rounded-b-lg border bg-muted/30 p-4 sm:p-6">
        <Suspense fallback={<TabSkeleton />}>
          {activeTab === 'tickets' && <StaffTicketsTab complexId={complexId} />}
          {activeTab === 'conversaciones' && (
            <StaffConversationsTab complexId={complexId} />
          )}
          {activeTab === 'categorias' && (
            <CategoriesManager complexId={complexId} />
          )}
        </Suspense>
      </div>
    </div>
  )
}

function TabSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-64 w-full" />
    </div>
  )
}
