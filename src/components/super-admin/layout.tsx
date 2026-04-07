import { SidebarInset, SidebarProvider } from '#/components/ui/sidebar'
import { SuperAdminHeader } from './header'
import { SuperAdminSidebar } from './sidebar'

export function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <SuperAdminSidebar />
      <SidebarInset>
        <SuperAdminHeader />
        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  )
}
