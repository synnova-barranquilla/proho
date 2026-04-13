import { SidebarInset, SidebarProvider } from '#/components/ui/sidebar'
import type { Doc } from '../../../convex/_generated/dataModel'
import { ConjuntoHeader } from './header'
import { ConjuntoSidebar } from './sidebar'

interface ConjuntoLayoutProps {
  /**
   * The currently selected conjunto, or `null` for organization-level admin
   * routes like `/admin/equipo` that are not scoped to a specific conjunto.
   * When `null`, the sidebar hides conjunto-specific items (Unidades,
   * Residentes, Vehículos, Parqueaderos, Configuración) and shows a
   * "Volver al selector" link; the header hides the ConjuntoSwitcher.
   */
  conjunto: Doc<'conjuntos'> | null
  /**
   * The current user's membership for the active conjunto, if any.
   * - `null` for owners and SUPER_ADMINs (they don't need a membership).
   * - Contains the role (ADMIN / ASISTENTE / VIGILANTE / RESIDENTE) for
   *   everyone else.
   * The sidebar uses this to gate "admin-only" items (Usuarios,
   * Configuración) when rendering inside a conjunto.
   */
  membership?: Doc<'conjuntoMemberships'> | null
  /**
   * When an org-level page (e.g. `/admin/equipo`) was opened from a
   * conjunto-scoped page, pass the source conjunto here so the sidebar
   * can render a "Volver a <nombre>" shortcut back to it. Ignored when
   * `conjunto` is not `null`.
   */
  fromConjunto?: Doc<'conjuntos'> | null
  children: React.ReactNode
}

export function ConjuntoLayout({
  conjunto,
  membership,
  fromConjunto,
  children,
}: ConjuntoLayoutProps) {
  return (
    <SidebarProvider>
      <ConjuntoSidebar
        conjunto={conjunto}
        membership={membership ?? null}
        fromConjunto={fromConjunto}
      />
      <SidebarInset>
        <ConjuntoHeader conjunto={conjunto} />
        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  )
}
