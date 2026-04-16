import { useEffect } from 'react'

import { useLocation } from '@tanstack/react-router'

import {
  SidebarInset,
  SidebarProvider,
  useSidebar,
} from '#/components/ui/sidebar'
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
  activeModules?: string[]
  children: React.ReactNode
}

export function ConjuntoLayout({
  conjunto,
  membership,
  fromConjunto,
  activeModules,
  children,
}: ConjuntoLayoutProps) {
  return (
    <SidebarProvider>
      <MobileAutoClose />
      <ConjuntoSidebar
        conjunto={conjunto}
        membership={membership ?? null}
        fromConjunto={fromConjunto}
        activeModules={activeModules}
      />
      <SidebarInset>
        <ConjuntoHeader conjunto={conjunto} />
        <main className="flex flex-1 flex-col p-4 sm:p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  )
}

function MobileAutoClose() {
  const pathname = useLocation({ select: (l) => l.pathname })
  const { setOpenMobile, isMobile } = useSidebar()

  useEffect(() => {
    if (isMobile) setOpenMobile(false)
  }, [pathname, isMobile, setOpenMobile])

  return null
}
