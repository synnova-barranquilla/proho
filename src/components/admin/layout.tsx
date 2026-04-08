import { SidebarInset, SidebarProvider } from '#/components/ui/sidebar'
import type { Doc } from '../../../convex/_generated/dataModel'
import { AdminHeader } from './header'
import { AdminSidebar } from './sidebar'

interface AdminLayoutProps {
  /**
   * The currently selected conjunto, or `null` for organization-level admin
   * routes like `/admin/equipo` that are not scoped to a specific conjunto.
   * When `null`, the sidebar hides conjunto-specific items (Unidades,
   * Residentes, Vehículos, Parqueaderos, Configuración) and shows a
   * "Volver al selector" link; the header hides the ConjuntoSwitcher.
   */
  conjunto: Doc<'conjuntos'> | null
  children: React.ReactNode
}

export function AdminLayout({ conjunto, children }: AdminLayoutProps) {
  return (
    <SidebarProvider>
      <AdminSidebar conjunto={conjunto} />
      <SidebarInset>
        <AdminHeader conjunto={conjunto} />
        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  )
}
