import { getRouteApi, Link, useLocation } from '@tanstack/react-router'

import {
  ArrowLeft,
  Building2,
  Car,
  Home,
  MessageSquare,
  Settings,
  Shield,
  ShieldCheck,
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
import { isComplexAdmin } from '#/lib/complex-role'
import type { Doc } from '../../../convex/_generated/dataModel'

interface ComplexSidebarProps {
  complex: Doc<'complexes'> | null
  membership: Doc<'complexMemberships'> | null
  fromComplex?: Doc<'complexes'> | null
  activeModules?: string[]
}

const authenticatedRoute = getRouteApi('/_authenticated')

export function ComplexSidebar({
  complex,
  membership,
  fromComplex,
  activeModules = [],
}: ComplexSidebarProps) {
  const location = useLocation()
  const pathname = location.pathname
  const { convexUser, organization } = authenticatedRoute.useLoaderData()
  const isOrgOwner = convexUser.isOrgOwner === true
  const isSuperAdmin = convexUser.orgRole === 'SUPER_ADMIN'

  if (complex === null) {
    return (
      <OrgLevelSidebar
        orgName={organization.name}
        pathname={pathname}
        fromComplex={fromComplex ?? null}
        isOrgOwner={isOrgOwner}
        isSuperAdmin={isSuperAdmin}
      />
    )
  }

  // Complex-scoped: derive the effective role to decide which items
  // to show. The backend already enforces these checks on every
  // mutation; this is front-end gating for UX clarity.
  const isAdmin = isComplexAdmin(convexUser, complex, membership)
  const hasControlAcceso = activeModules.includes('access_control')
  const hasCommunications =
    activeModules.includes('communications') || isSuperAdmin

  return (
    <ComplexScopedSidebar
      complex={complex}
      pathname={pathname}
      isAdmin={isAdmin}
      isOrgOwner={isOrgOwner}
      isSuperAdmin={isSuperAdmin}
      hasControlAcceso={hasControlAcceso}
      hasCommunications={hasCommunications}
    />
  )
}

// ---------------------------------------------------------------------------
// Org-level sidebar (used by /admin/equipo and other future org-scoped routes)
// ---------------------------------------------------------------------------

function OrgLevelSidebar({
  orgName,
  pathname,
  fromComplex,
  isOrgOwner,
  isSuperAdmin,
}: {
  orgName: string
  pathname: string
  fromComplex: Doc<'complexes'> | null
  isOrgOwner: boolean
  isSuperAdmin: boolean
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
              {isSuperAdmin ? (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    render={
                      <Link to="/super-admin/conjuntos">
                        <ArrowLeft />
                        <span>Volver a super admin</span>
                      </Link>
                    }
                  />
                </SidebarMenuItem>
              ) : null}
              {fromComplex ? (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    render={
                      <Link
                        to="/c/$complexSlug"
                        params={{ complexSlug: fromComplex.slug }}
                      >
                        <ArrowLeft />
                        <span className="truncate">
                          Volver a {fromComplex.name}
                        </span>
                      </Link>
                    }
                  />
                </SidebarMenuItem>
              ) : null}
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

        {isOrgOwner ? (
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
        ) : null}
      </SidebarContent>
    </Sidebar>
  )
}

// ---------------------------------------------------------------------------
// Complex-scoped sidebar (used by /c/$complexSlug/*)
// ---------------------------------------------------------------------------

function ComplexScopedSidebar({
  complex,
  pathname,
  isAdmin,
  isOrgOwner,
  isSuperAdmin,
  hasControlAcceso,
  hasCommunications,
}: {
  complex: Doc<'complexes'>
  pathname: string
  isAdmin: boolean
  isOrgOwner: boolean
  isSuperAdmin: boolean
  hasControlAcceso: boolean
  hasCommunications: boolean
}) {
  const base = `/c/${complex.slug}`

  const isActive = (path: string) =>
    pathname === path || pathname.startsWith(path + '/')

  // The "Gestión" group collapses entirely if the user has no items to
  // see — non-admin non-owner users (e.g. a raw VIGILANTE) get just
  // Resumen + Inventario.
  const showGestionGroup = isAdmin || isOrgOwner

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="px-2 py-1.5">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">
              <Building2 className="h-4 w-4" />
            </div>
            <div className="flex flex-col overflow-hidden">
              <h2 className="truncate text-sm font-semibold">{complex.name}</h2>
              <p className="truncate text-xs text-muted-foreground">
                {complex.city}
              </p>
            </div>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        {isSuperAdmin ? (
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    render={
                      <Link to="/super-admin/conjuntos">
                        <ArrowLeft />
                        <span>Volver a super admin</span>
                      </Link>
                    }
                  />
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ) : null}

        <SidebarGroup>
          <SidebarGroupLabel>Resumen</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={pathname === base}
                  render={
                    <Link
                      to="/c/$complexSlug"
                      params={{ complexSlug: complex.slug }}
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
              {isAdmin ? (
                <>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      isActive={isActive(`${base}/unidades`)}
                      render={
                        <Link
                          to="/c/$complexSlug/unidades"
                          params={{ complexSlug: complex.slug }}
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
                          to="/c/$complexSlug/residentes"
                          params={{ complexSlug: complex.slug }}
                        >
                          <UsersRound />
                          <span>Residentes</span>
                        </Link>
                      }
                    />
                  </SidebarMenuItem>
                </>
              ) : null}
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={isActive(`${base}/vehiculos`)}
                  render={
                    <Link
                      to="/c/$complexSlug/vehiculos"
                      params={{ complexSlug: complex.slug }}
                    >
                      <Car />
                      <span>Vehículos</span>
                    </Link>
                  }
                />
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {hasControlAcceso || hasCommunications ? (
          <SidebarGroup>
            <SidebarGroupLabel>Operación</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {hasControlAcceso ? (
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      isActive={isActive(`${base}/control-acceso`)}
                      render={
                        <Link
                          to="/c/$complexSlug/control-acceso"
                          params={{ complexSlug: complex.slug }}
                        >
                          <ShieldCheck />
                          <span>Control de acceso</span>
                        </Link>
                      }
                    />
                  </SidebarMenuItem>
                ) : null}
                {hasCommunications ? (
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      isActive={isActive(`${base}/communications`)}
                      render={
                        <Link
                          to="/c/$complexSlug/communications"
                          params={{ complexSlug: complex.slug }}
                        >
                          <MessageSquare />
                          <span>Comunicaciones</span>
                        </Link>
                      }
                    />
                  </SidebarMenuItem>
                ) : null}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ) : null}

        {showGestionGroup ? (
          <SidebarGroup>
            <SidebarGroupLabel>Gestión</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {isAdmin ? (
                  <>
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        isActive={isActive(`${base}/usuarios`)}
                        render={
                          <Link
                            to="/c/$complexSlug/usuarios"
                            params={{ complexSlug: complex.slug }}
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
                            to="/c/$complexSlug/configuracion"
                            params={{ complexSlug: complex.slug }}
                          >
                            <Settings />
                            <span>Configuración</span>
                          </Link>
                        }
                      />
                    </SidebarMenuItem>
                  </>
                ) : null}
                {isOrgOwner ? (
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      isActive={pathname === '/admin/equipo'}
                      render={
                        <Link
                          to="/admin/equipo"
                          search={{ from: complex.slug }}
                        >
                          <Shield />
                          <span>Equipo de la org</span>
                        </Link>
                      }
                    />
                  </SidebarMenuItem>
                ) : null}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ) : null}
      </SidebarContent>
    </Sidebar>
  )
}
