import { MoreHorizontal } from 'lucide-react'

import { Button } from '#/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '#/components/ui/dropdown-menu'
import { isInternalOrgSlug } from '#/lib/organizations'

interface OrgRowActionsProps {
  org: {
    slug: string
    active: boolean
  }
  onSeeDetails: () => void
  onInviteAdmin: () => void
  onDeactivate: () => void
  onReactivate: () => void
}

export function OrgRowActions({
  org,
  onSeeDetails,
  onInviteAdmin,
  onDeactivate,
  onReactivate,
}: OrgRowActionsProps) {
  const isInternal = isInternalOrgSlug(org.slug)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" size="icon-sm">
            <MoreHorizontal className="size-4" />
            <span className="sr-only">Acciones</span>
          </Button>
        }
      />
      <DropdownMenuContent align="end">
        {/* Mobile-only "Ver detalles" — desktop columns already show this */}
        <DropdownMenuItem onClick={onSeeDetails} className="md:hidden">
          Ver detalles
        </DropdownMenuItem>

        {!isInternal && (
          <>
            <DropdownMenuItem onClick={onInviteAdmin}>
              Invitar administrador
            </DropdownMenuItem>
            <DropdownMenuSeparator className="md:hidden" />
            {org.active ? (
              <DropdownMenuItem onClick={onDeactivate} variant="destructive">
                Desactivar organización
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem onClick={onReactivate}>
                Reactivar organización
              </DropdownMenuItem>
            )}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
