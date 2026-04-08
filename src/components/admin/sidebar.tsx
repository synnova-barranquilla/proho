import { Link, useLocation } from '@tanstack/react-router'

import {
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
  conjunto: Doc<'conjuntos'>
}

export function AdminSidebar({ conjunto }: AdminSidebarProps) {
  const location = useLocation()
  const pathname = location.pathname
  const base = `/admin/c/${conjunto._id}`

  // NOTA: pasamos las rutas como strings. TanStack Router en mode type-safe
  // vería estas como dinámicas, pero al usar `Link` con `to` string acepta
  // cualquier string (TypeScript se queja — lo cubrimos con `as never` o con
  // el patrón de `resolve`). Usamos `<Link to={...} params={...}>` con el
  // route id estático donde sea posible.
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
