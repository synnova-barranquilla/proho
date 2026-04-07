import { getRouteApi } from '@tanstack/react-router'

import { Avatar, AvatarFallback } from '#/components/ui/avatar'
import { Button } from '#/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '#/components/ui/dropdown-menu'
import { getFullName, getInitials } from '#/lib/user'

const authenticatedRoute = getRouteApi('/_authenticated')

export function UserMenu() {
  const { convexUser } = authenticatedRoute.useLoaderData()
  const fullName = getFullName(convexUser)
  const initials = getInitials(convexUser)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="sm"
            className="flex items-center gap-2"
          />
        }
      >
        <Avatar className="size-7">
          <AvatarFallback className="text-xs">{initials}</AvatarFallback>
        </Avatar>
        <span className="hidden text-sm font-medium sm:inline">{fullName}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex flex-col gap-0.5">
          <span className="text-sm font-medium">{fullName}</span>
          <span className="text-xs text-muted-foreground truncate">
            {convexUser.email}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem render={<a href="/logout">Cerrar sesión</a>} />
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
