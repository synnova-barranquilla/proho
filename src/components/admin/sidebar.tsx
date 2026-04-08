import { getRouteApi, Link, useLocation } from '@tanstack/react-router'

import {
  ArrowLeft,
  Building2,
  Car,
  Home,
  ParkingSquare,
  Settings,
  Shield,
  SquareStack,
  Users,
  UsersRound,
} from 'lucide-react'

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '#/components/ui/sidebar'
import type { Doc } from '../../../convex/_generated/dataModel'

interface AdminSidebarProps {
  /**
   * The currently active conjunto, or `null` for org-level admin routes
   * like `/admin/equipo`. When `null` the sidebar renders a "back to
   * selector" link and only shows items that do not require a conjunto
   * context (Equipo de la org).
   */
  conjunto: Doc<'conjuntos'> | null
}

const authenticatedRoute = getRouteApi('/_authenticated')

export function AdminSidebar({ conjunto }: AdminSidebarProps) {
  const location = useLocation()
  const pathname = location.pathname
  const { organization } = authenticatedRoute.useLoaderData()

  if (conjunto === null) {
    return <OrgLevelSidebar orgName={organization.name} pathname={pathname} />
  }

  return <ConjuntoScopedSidebar conjunto={conjunto} pathname={pathname} />
}

// ---------------------------------------------------------------------------
// Org-level sidebar (used by /admin/equipo and other future org-scoped routes)
// ---------------------------------------------------------------------------

function OrgLevelSidebar({
  orgName,
  pathname,
}: {
  orgName: string
  pathname: string
}) {
  return (
    <Sidebar>
      <SidebarHeader>
        <div className="px-2 py-1.5">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">
              <Shield className="h-4 w-4" />
            </div>
            <div className="flex flex-col overflow-hidden">
              <h2 className="truncate text-sm font-semibold">{orgName}</h2>
              <p className="truncate text-xs text-muted-foreground">
                Gestión de organización
              </p>
            </div>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  render={
                    <Link to="/seleccionar-conjunto">
                      <ArrowLeft />
                      <span>Volver al selector</span>
                    </Link>
                  }
                />
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Gestión</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={pathname === '/admin/equipo'}
                  render={
                    <Link to="/admin/equipo">
                      <Shield />
                      <span>Equipo de la org</span>
                    </Link>
                  }
                />
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}

// ---------------------------------------------------------------------------
// Conjunto-scoped sidebar (used by /admin/c/$conjuntoId/*)
// ---------------------------------------------------------------------------

function ConjuntoScopedSidebar({
  conjunto,
  pathname,
}: {
  conjunto: Doc<'conjuntos'>
  pathname: string
}) {
  const base = `/admin/c/${conjunto._id}`

  const isActive = (path: string) =>
    pathname === path || pathname.startsWith(path + '/')

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="px-2 py-1.5">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">
              <Building2 className="h-4 w-4" />
            </div>
            <div className="flex flex-col overflow-hidden">
              <h2 className="truncate text-sm font-semibold">
                {conjunto.nombre}
              </h2>
              <p className="truncate text-xs text-muted-foreground">
                {conjunto.ciudad}
              </p>
            </div>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Resumen</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={pathname === base}
                  render={
                    <Link
                      to="/admin/c/$conjuntoId"
                      params={{ conjuntoId: conjunto._id }}
                    >
                      <Home />
                      <span>Inicio</span>
                    </Link>
                  }
                />
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Inventario</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={isActive(`${base}/unidades`)}
                  render={
                    <Link
                      to="/admin/c/$conjuntoId/unidades"
                      params={{ conjuntoId: conjunto._id }}
                    >
                      <SquareStack />
                      <span>Unidades</span>
                    </Link>
                  }
                />
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={isActive(`${base}/residentes`)}
                  render={
                    <Link
                      to="/admin/c/$conjuntoId/residentes"
                      params={{ conjuntoId: conjunto._id }}
                    >
                      <UsersRound />
                      <span>Residentes</span>
                    </Link>
                  }
                />
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={isActive(`${base}/vehiculos`)}
                  render={
                    <Link
                      to="/admin/c/$conjuntoId/vehiculos"
                      params={{ conjuntoId: conjunto._id }}
                    >
                      <Car />
                      <span>Vehículos</span>
                    </Link>
                  }
                />
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={isActive(`${base}/parqueaderos`)}
                  render={
                    <Link
                      to="/admin/c/$conjuntoId/parqueaderos"
                      params={{ conjuntoId: conjunto._id }}
                    >
                      <ParkingSquare />
                      <span>Parqueaderos</span>
                    </Link>
                  }
                />
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Gestión</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={isActive(`${base}/usuarios`)}
                  render={
                    <Link
                      to="/admin/c/$conjuntoId/usuarios"
                      params={{ conjuntoId: conjunto._id }}
                    >
                      <Users />
                      <span>Usuarios del conjunto</span>
                    </Link>
                  }
                />
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={isActive(`${base}/configuracion`)}
                  render={
                    <Link
                      to="/admin/c/$conjuntoId/configuracion"
                      params={{ conjuntoId: conjunto._id }}
                    >
                      <Settings />
                      <span>Configuración</span>
                    </Link>
                  }
                />
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={pathname === '/admin/equipo'}
                  render={
                    <Link to="/admin/equipo">
                      <Shield />
                      <span>Equipo de la org</span>
                    </Link>
                  }
                />
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
