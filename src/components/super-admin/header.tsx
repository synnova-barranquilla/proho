import { Separator } from '#/components/ui/separator'
import { SidebarTrigger } from '#/components/ui/sidebar'
import { UserMenu } from './user-menu'

export function SuperAdminHeader() {
  return (
    <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b bg-background px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator
        orientation="vertical"
        className="mr-2 data-[orientation=vertical]:h-4"
      />
      <div className="flex flex-1 items-center justify-end">
        <UserMenu />
      </div>
    </header>
  )
}
