import { Suspense, useState } from 'react'

import { Skeleton } from '#/components/ui/skeleton'
import { useIsComplexAdmin } from '#/lib/complex-role'
import { cn } from '#/lib/utils'
import type { Id } from '../../../convex/_generated/dataModel'
import { DashboardTab } from './dashboard-tab'
import { HistoricoTab } from './historico-tab'
import { NovedadesTab } from './novedades-tab'
import { OperacionTab } from './operacion-tab'

type Tab = 'operacion' | 'dashboard' | 'historico' | 'novedades'

interface TabDef {
  id: Tab
  label: string
  adminOnly: boolean
}

const TABS: TabDef[] = [
  { id: 'operacion', label: 'Operación', adminOnly: false },
  { id: 'dashboard', label: 'Dashboard', adminOnly: false },
  { id: 'historico', label: 'Histórico', adminOnly: true },
  { id: 'novedades', label: 'Novedades', adminOnly: true },
]

interface ControlAccesoPageProps {
  complexId: Id<'complexes'>
}

export function ControlAccesoPage({ complexId }: ControlAccesoPageProps) {
  const [activeTab, setActiveTab] = useState<Tab>('operacion')
  const isAdmin = useIsComplexAdmin()

  const visibleTabs = TABS.filter((t) => !t.adminOnly || isAdmin)

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">
          Control de acceso
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Registro de ingresos y salidas vehiculares.
        </p>
      </div>

      {visibleTabs.length > 1 && (
        <div className="flex gap-1 rounded-t-lg border border-b-0 bg-muted/60 p-1">
          {visibleTabs.map((tab) => (
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
      )}

      <div
        className={cn(
          'flex flex-1 flex-col bg-muted/30 p-4 sm:p-6',
          visibleTabs.length > 1 ? 'rounded-b-lg border' : 'rounded-lg border',
        )}
      >
        <Suspense fallback={<TabSkeleton />}>
          {activeTab === 'operacion' && <OperacionTab complexId={complexId} />}
          {activeTab === 'dashboard' && <DashboardTab complexId={complexId} />}
          {activeTab === 'historico' && <HistoricoTab complexId={complexId} />}
          {activeTab === 'novedades' && <NovedadesTab complexId={complexId} />}
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
