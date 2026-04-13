import { getRouteApi } from '@tanstack/react-router'

import { Moon, Sun } from 'lucide-react'

import { Avatar, AvatarFallback } from '#/components/ui/avatar'
import { Button } from '#/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '#/components/ui/dropdown-menu'
import { useTheme } from '#/hooks/use-theme'
import { getFullName, getInitials } from '#/lib/user'

const authenticatedRoute = getRouteApi('/_authenticated')

export function UserMenu() {
  const { convexUser } = authenticatedRoute.useLoaderData()
  const fullName = getFullName(convexUser)
  const initials = getInitials(convexUser)
  const isOwner = convexUser.isOrgOwner === true
  const { mode, toggle } = useTheme()

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
        <DropdownMenuGroup>
          <DropdownMenuLabel className="flex flex-col gap-0.5">
            <span className="text-sm font-medium">{fullName}</span>
            <span className="text-xs text-muted-foreground truncate">
              {convexUser.email}
            </span>
            {isOwner ? (
              <span className="mt-1 inline-flex w-fit rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-primary">
                Owner
              </span>
            ) : null}
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={toggle}>
          {mode === 'light' ? (
            <Moon className="mr-2 h-4 w-4" />
          ) : (
            <Sun className="mr-2 h-4 w-4" />
          )}
          {mode === 'light' ? 'Modo oscuro' : 'Modo claro'}
        </DropdownMenuItem>
        <DropdownMenuItem render={<a href="/logout" />}>
          Cerrar sesión
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
