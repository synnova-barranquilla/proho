import { getRouteApi, Link, useLocation } from '@tanstack/react-router'

import {
  ArrowLeft,
  BarChart3,
  Building2,
  CalendarDays,
  Car,
  FileText,
  Headset,
  Home,
  MessageSquare,
  Settings,
  Shield,
  ShieldCheck,
  SquareStack,
  Tags,
  Users,
  UsersRound,
  Zap,
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

  const isAdmin = isComplexAdmin(convexUser, complex, membership)
  const hasControlAcceso = activeModules.includes('access_control')
  const hasCommunications =
    activeModules.includes('communications') || isSuperAdmin
  const hasReservas = activeModules.includes('reservas') || isSuperAdmin
  const complexRole = membership?.role ?? null

  return (
    <ComplexScopedSidebar
      complex={complex}
      pathname={pathname}
      isAdmin={isAdmin}
      isOrgOwner={isOrgOwner}
      isSuperAdmin={isSuperAdmin}
      hasControlAcceso={hasControlAcceso}
      hasCommunications={hasCommunications}
      hasReservas={hasReservas}
      complexRole={complexRole}
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
  hasReservas,
  complexRole,
}: {
  complex: Doc<'complexes'>
  pathname: string
  isAdmin: boolean
  isOrgOwner: boolean
  isSuperAdmin: boolean
  hasControlAcceso: boolean
  hasCommunications: boolean
  hasReservas: boolean
  complexRole: string | null
}) {
  const base = `/c/${complex.slug}`
  const slug = complex.slug

  const isActive = (path: string) =>
    pathname === path || pathname.startsWith(path + '/')

  const showGestionGroup = isAdmin || isOrgOwner

  const isVigilante = complexRole === 'GUARD'
  const isStaff =
    complexRole === 'ADMIN' || complexRole === 'AUXILIAR' || isSuperAdmin

  const showParqueadero =
    hasControlAcceso && (isVigilante || isAdmin || isSuperAdmin)
  const showComunicacion = hasCommunications && !isVigilante
  const showZonasSociales =
    hasReservas && !isVigilante && complexRole !== 'AUXILIAR'

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
                    <Link to="/c/$complexSlug" params={{ complexSlug: slug }}>
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
                          params={{ complexSlug: slug }}
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
                          params={{ complexSlug: slug }}
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
                      params={{ complexSlug: slug }}
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

        {showParqueadero ? (
          <SidebarGroup>
            <SidebarGroupLabel>Parqueadero</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    isActive={isActive(`${base}/parqueadero/control-de-acceso`)}
                    render={
                      <Link
                        to="/c/$complexSlug/parqueadero/control-de-acceso"
                        params={{ complexSlug: slug }}
                      >
                        <ShieldCheck />
                        <span>Control de acceso</span>
                      </Link>
                    }
                  />
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    isActive={isActive(`${base}/parqueadero/dashboard`)}
                    render={
                      <Link
                        to="/c/$complexSlug/parqueadero/dashboard"
                        params={{ complexSlug: slug }}
                      >
                        <BarChart3 />
                        <span>Dashboard</span>
                      </Link>
                    }
                  />
                </SidebarMenuItem>
                {isAdmin ? (
                  <>
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        isActive={isActive(`${base}/parqueadero/historico`)}
                        render={
                          <Link
                            to="/c/$complexSlug/parqueadero/historico"
                            params={{ complexSlug: slug }}
                          >
                            <Car />
                            <span>Histórico</span>
                          </Link>
                        }
                      />
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        isActive={isActive(`${base}/parqueadero/novedades`)}
                        render={
                          <Link
                            to="/c/$complexSlug/parqueadero/novedades"
                            params={{ complexSlug: slug }}
                          >
                            <FileText />
                            <span>Novedades</span>
                          </Link>
                        }
                      />
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        isActive={isActive(`${base}/parqueadero/configuracion`)}
                        render={
                          <Link
                            to="/c/$complexSlug/parqueadero/configuracion"
                            params={{ complexSlug: slug }}
                          >
                            <Settings />
                            <span>Configuración</span>
                          </Link>
                        }
                      />
                    </SidebarMenuItem>
                  </>
                ) : null}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ) : null}

        {showComunicacion ? (
          <SidebarGroup>
            <SidebarGroupLabel>Comunicación</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    isActive={isActive(`${base}/comunicacion/soporte`)}
                    render={
                      <Link
                        to="/c/$complexSlug/comunicacion/soporte"
                        params={{ complexSlug: slug }}
                      >
                        <Headset />
                        <span>Soporte</span>
                      </Link>
                    }
                  />
                </SidebarMenuItem>
                {isStaff ? (
                  <>
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        isActive={isActive(
                          `${base}/comunicacion/conversaciones`,
                        )}
                        render={
                          <Link
                            to="/c/$complexSlug/comunicacion/conversaciones"
                            params={{ complexSlug: slug }}
                          >
                            <MessageSquare />
                            <span>Conversaciones</span>
                          </Link>
                        }
                      />
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        isActive={isActive(`${base}/comunicacion/adjuntos`)}
                        render={
                          <Link
                            to="/c/$complexSlug/comunicacion/adjuntos"
                            params={{ complexSlug: slug }}
                          >
                            <FileText />
                            <span>Adjuntos</span>
                          </Link>
                        }
                      />
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        isActive={isActive(`${base}/comunicacion/categorias`)}
                        render={
                          <Link
                            to="/c/$complexSlug/comunicacion/categorias"
                            params={{ complexSlug: slug }}
                          >
                            <Tags />
                            <span>Categorías</span>
                          </Link>
                        }
                      />
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        isActive={isActive(`${base}/comunicacion/acciones`)}
                        render={
                          <Link
                            to="/c/$complexSlug/comunicacion/acciones"
                            params={{ complexSlug: slug }}
                          >
                            <Zap />
                            <span>Acciones rápidas</span>
                          </Link>
                        }
                      />
                    </SidebarMenuItem>
                  </>
                ) : null}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ) : null}

        {showZonasSociales ? (
          <SidebarGroup>
            <SidebarGroupLabel>Zonas Sociales</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    isActive={isActive(`${base}/zonas-sociales/reservas`)}
                    render={
                      <Link
                        to="/c/$complexSlug/zonas-sociales/reservas"
                        params={{ complexSlug: slug }}
                      >
                        <CalendarDays />
                        <span>Reservas</span>
                      </Link>
                    }
                  />
                </SidebarMenuItem>
                {isAdmin ? (
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      isActive={isActive(
                        `${base}/zonas-sociales/configuracion`,
                      )}
                      render={
                        <Link
                          to="/c/$complexSlug/zonas-sociales/configuracion"
                          params={{ complexSlug: slug }}
                        >
                          <Settings />
                          <span>Configuración</span>
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
                            params={{ complexSlug: slug }}
                          >
                            <Users />
                            <span>Usuarios del conjunto</span>
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
