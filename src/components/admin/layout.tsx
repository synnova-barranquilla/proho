import { useEffect } from 'react'

import { useLocation } from '@tanstack/react-router'

import {
  SidebarInset,
  SidebarProvider,
  useSidebar,
} from '#/components/ui/sidebar'
import type { Doc } from '../../../convex/_generated/dataModel'
import { ComplexHeader } from './header'
import { ComplexSidebar } from './sidebar'

interface ComplexLayoutProps {
  /**
   * The currently selected complex, or `null` for organization-level admin
   * routes like `/admin/equipo` that are not scoped to a specific complex.
   * When `null`, the sidebar hides complex-specific items (Unidades,
   * Residentes, Vehículos, Parqueaderos, Configuración) and shows a
   * "Volver al selector" link; the header hides the ComplexSwitcher.
   */
  complex: Doc<'complexes'> | null
  /**
   * The current user's membership for the active complex, if any.
   * - `null` for owners and SUPER_ADMINs (they don't need a membership).
   * - Contains the role (ADMIN / VIGILANTE / PROPIETARIO / INQUILINO /
   *   ARRENDATARIO) for everyone else.
   * The sidebar uses this to gate "admin-only" items (Usuarios,
   * Configuración) when rendering inside a complex.
   */
  membership?: Doc<'complexMemberships'> | null
  /**
   * When an org-level page (e.g. `/admin/equipo`) was opened from a
   * complex-scoped page, pass the source complex here so the sidebar
   * can render a "Volver a <name>" shortcut back to it. Ignored when
   * `complex` is not `null`.
   */
  fromComplex?: Doc<'complexes'> | null
  activeModules?: string[]
  children: React.ReactNode
}

export function ComplexLayout({
  complex,
  membership,
  fromComplex,
  activeModules,
  children,
}: ComplexLayoutProps) {
  return (
    <SidebarProvider>
      <MobileAutoClose />
      <ComplexSidebar
        complex={complex}
        membership={membership ?? null}
        fromComplex={fromComplex}
        activeModules={activeModules}
      />
      <SidebarInset>
        <ComplexHeader complex={complex} />
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
