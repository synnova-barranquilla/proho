import { SidebarInset, SidebarProvider } from '#/components/ui/sidebar'
import type { Doc } from '../../../convex/_generated/dataModel'
import { AdminHeader } from './header'
import { AdminSidebar } from './sidebar'

interface AdminLayoutProps {
  conjunto: Doc<'conjuntos'>
  children: React.ReactNode
}

export function AdminLayout({ conjunto, children }: AdminLayoutProps) {
  return (
    <SidebarProvider>
      <AdminSidebar conjunto={conjunto} />
      <SidebarInset>
        <AdminHeader conjunto={conjunto} />
        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  )
}
