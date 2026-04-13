import { Separator } from '#/components/ui/separator'
import { SidebarTrigger } from '#/components/ui/sidebar'
import type { Doc } from '../../../convex/_generated/dataModel'
import { ConjuntoSwitcher } from './conjunto-switcher'
import { AdminUserMenu } from './user-menu'

interface ConjuntoHeaderProps {
  /**
   * The active conjunto, or `null` on organization-level admin routes
   * (e.g. `/admin/equipo`). When `null` the header hides the
   * ConjuntoSwitcher and shows a static "Gestión de organización" label.
   */
  conjunto: Doc<'conjuntos'> | null
}

export function ConjuntoHeader({ conjunto }: ConjuntoHeaderProps) {
  return (
    <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b bg-background px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator
        orientation="vertical"
        className="mr-2 data-[orientation=vertical]:h-4"
      />
      {conjunto ? (
        <ConjuntoSwitcher current={conjunto} />
      ) : (
        <span className="text-sm font-medium text-muted-foreground">
          Gestión de organización
        </span>
      )}
      <div className="flex flex-1 items-center justify-end">
        <AdminUserMenu />
      </div>
    </header>
  )
}
