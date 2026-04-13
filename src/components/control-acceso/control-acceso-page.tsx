import { Suspense, useState } from 'react'

import { Skeleton } from '#/components/ui/skeleton'
import { useIsConjuntoAdmin } from '#/lib/conjunto-role'
import { cn } from '#/lib/utils'
import type { Id } from '../../../convex/_generated/dataModel'
import { AuditoriaTab } from './auditoria-tab'
import { DashboardTab } from './dashboard-tab'
import { HistoricoTab } from './historico-tab'
import { NovedadesTab } from './novedades-tab'
import { OperacionTab } from './operacion-tab'

type Tab = 'operacion' | 'dashboard' | 'historico' | 'novedades' | 'auditoria'

interface TabDef {
  id: Tab
  label: string
  adminOnly: boolean
}

const TABS: TabDef[] = [
  { id: 'operacion', label: 'Operación', adminOnly: false },
  { id: 'dashboard', label: 'Dashboard', adminOnly: true },
  { id: 'historico', label: 'Histórico', adminOnly: true },
  { id: 'novedades', label: 'Novedades', adminOnly: true },
  { id: 'auditoria', label: 'Auditoría', adminOnly: true },
]

interface ControlAccesoPageProps {
  conjuntoId: Id<'conjuntos'>
}

export function ControlAccesoPage({ conjuntoId }: ControlAccesoPageProps) {
  const [activeTab, setActiveTab] = useState<Tab>('operacion')
  const isAdmin = useIsConjuntoAdmin()

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
        <div className="mb-6 flex gap-1 rounded-lg border bg-muted/50 p-1">
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

      <Suspense fallback={<TabSkeleton />}>
        {activeTab === 'operacion' && <OperacionTab conjuntoId={conjuntoId} />}
        {activeTab === 'dashboard' && <DashboardTab conjuntoId={conjuntoId} />}
        {activeTab === 'historico' && <HistoricoTab conjuntoId={conjuntoId} />}
        {activeTab === 'novedades' && <NovedadesTab conjuntoId={conjuntoId} />}
        {activeTab === 'auditoria' && <AuditoriaTab conjuntoId={conjuntoId} />}
      </Suspense>
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
