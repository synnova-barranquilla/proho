import { Link, useLocation } from '@tanstack/react-router'

import { Building2, Users } from 'lucide-react'

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '#/components/ui/sidebar'

const NAV_ITEMS = [
  {
    title: 'Organizaciones',
    to: '/super-admin',
    icon: Building2,
    isActive: (pathname: string) =>
      pathname === '/super-admin' ||
      pathname.startsWith('/super-admin/organizaciones'),
  },
  {
    title: 'Usuarios',
    to: '/super-admin/usuarios',
    icon: Users,
    isActive: (pathname: string) => pathname === '/super-admin/usuarios',
  },
] as const

export function SuperAdminSidebar() {
  const location = useLocation()
  const pathname = location.pathname

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="px-2 py-1.5">
          <h2 className="text-base font-semibold tracking-tight">Synnova</h2>
          <p className="text-xs text-muted-foreground">Super admin</p>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon
                return (
                  <SidebarMenuItem key={item.to}>
                    <SidebarMenuButton
                      isActive={item.isActive(pathname)}
                      render={
                        <Link to={item.to}>
                          <Icon />
                          <span>{item.title}</span>
                        </Link>
                      }
                    />
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
