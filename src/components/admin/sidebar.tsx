import { getRouteApi, Link, useLocation } from '@tanstack/react-router'

import {
  ArrowLeft,
  Building2,
  Car,
  Home,
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
import { isConjuntoAdmin } from '#/lib/conjunto-role'
import type { Doc } from '../../../convex/_generated/dataModel'

interface ConjuntoSidebarProps {
  /**
   * The currently active conjunto, or `null` for org-level admin routes
   * like `/admin/equipo`. When `null` the sidebar renders a "back to
   * selector" link and only shows items that do not require a conjunto
   * context (Equipo de la org).
   */
  conjunto: Doc<'conjuntos'> | null
  /**
   * The user's membership for `conjunto`, if any. `null` for owners,
   * SUPER_ADMINs, or any org-level rendering. Used to derive the
   * effective role which gates admin-only items.
   */
  membership: Doc<'conjuntoMemberships'> | null
  /**
   * When rendering the org-level variant and the user navigated here
   * from a specific conjunto, show a primary "Volver a <nombre>" link
   * back to that conjunto. Ignored when `conjunto` is set.
   */
  fromConjunto?: Doc<'conjuntos'> | null
}

const authenticatedRoute = getRouteApi('/_authenticated')

export function ConjuntoSidebar({
  conjunto,
  membership,
  fromConjunto,
}: ConjuntoSidebarProps) {
  const location = useLocation()
  const pathname = location.pathname
  const { convexUser, organization } = authenticatedRoute.useLoaderData()
  const isOrgOwner = convexUser.isOrgOwner === true
  const isSuperAdmin = convexUser.orgRole === 'SUPER_ADMIN'

  if (conjunto === null) {
    return (
      <OrgLevelSidebar
        orgName={organization.name}
        pathname={pathname}
        fromConjunto={fromConjunto ?? null}
        isOrgOwner={isOrgOwner}
        isSuperAdmin={isSuperAdmin}
      />
    )
  }

  // Conjunto-scoped: derive the effective role to decide which items
  // to show. The backend already enforces these checks on every
  // mutation; this is front-end gating for UX clarity.
  const isAdmin = isConjuntoAdmin(convexUser, conjunto, membership)

  return (
    <ConjuntoScopedSidebar
      conjunto={conjunto}
      pathname={pathname}
      isAdmin={isAdmin}
      isOrgOwner={isOrgOwner}
      isSuperAdmin={isSuperAdmin}
    />
  )
}

// ---------------------------------------------------------------------------
// Org-level sidebar (used by /admin/equipo and other future org-scoped routes)
// ---------------------------------------------------------------------------

function OrgLevelSidebar({
  orgName,
  pathname,
  fromConjunto,
  isOrgOwner,
  isSuperAdmin,
}: {
  orgName: string
  pathname: string
  fromConjunto: Doc<'conjuntos'> | null
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
              {fromConjunto ? (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    render={
                      <Link
                        to="/c/$conjuntoSlug"
                        params={{ conjuntoSlug: fromConjunto.slug }}
                      >
                        <ArrowLeft />
                        <span className="truncate">
                          Volver a {fromConjunto.nombre}
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
// Conjunto-scoped sidebar (used by /c/$conjuntoSlug/*)
// ---------------------------------------------------------------------------

function ConjuntoScopedSidebar({
  conjunto,
  pathname,
  isAdmin,
  isOrgOwner,
  isSuperAdmin,
}: {
  conjunto: Doc<'conjuntos'>
  pathname: string
  isAdmin: boolean
  isOrgOwner: boolean
  isSuperAdmin: boolean
}) {
  const base = `/c/${conjunto.slug}`

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
                      to="/c/$conjuntoSlug"
                      params={{ conjuntoSlug: conjunto.slug }}
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
                      to="/c/$conjuntoSlug/unidades"
                      params={{ conjuntoSlug: conjunto.slug }}
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
                      to="/c/$conjuntoSlug/residentes"
                      params={{ conjuntoSlug: conjunto.slug }}
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
                      to="/c/$conjuntoSlug/vehiculos"
                      params={{ conjuntoSlug: conjunto.slug }}
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

        <SidebarGroup>
          <SidebarGroupLabel>Operación</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={isActive(`${base}/control-acceso`)}
                  render={
                    <Link
                      to="/c/$conjuntoSlug/control-acceso"
                      params={{ conjuntoSlug: conjunto.slug }}
                    >
                      <ShieldCheck />
                      <span>Control de acceso</span>
                    </Link>
                  }
                />
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

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
                            to="/c/$conjuntoSlug/usuarios"
                            params={{ conjuntoSlug: conjunto.slug }}
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
                            to="/c/$conjuntoSlug/configuracion"
                            params={{ conjuntoSlug: conjunto.slug }}
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
                          search={{ from: conjunto.slug }}
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
