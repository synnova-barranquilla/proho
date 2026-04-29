import { Separator } from '#/components/ui/separator'
import { SidebarTrigger } from '#/components/ui/sidebar'
import type { Doc } from '../../../convex/_generated/dataModel'
import { ComplexSwitcher } from './complex-switcher'
import { AdminUserMenu } from './user-menu'

interface ComplexHeaderProps {
  /**
   * The active complex, or `null` on organization-level admin routes
   * (e.g. `/admin/equipo`). When `null` the header hides the
   * ComplexSwitcher and shows a static "Gestión de organización" label.
   */
  complex: Doc<'complexes'> | null
}

export function ComplexHeader({ complex }: ComplexHeaderProps) {
  return (
    <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b bg-background px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator
        orientation="vertical"
        className="mr-2 data-[orientation=vertical]:h-4"
      />
      {complex ? (
        <ComplexSwitcher current={complex} />
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
