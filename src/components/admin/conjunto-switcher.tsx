import { useQuery } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'

import { convexQuery } from '@convex-dev/react-query'
import { Building2, Check, ChevronsUpDown } from 'lucide-react'

import { Button } from '#/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '#/components/ui/dropdown-menu'
import { cn } from '#/lib/utils'
import { api } from '../../../convex/_generated/api'
import type { Doc } from '../../../convex/_generated/dataModel'

interface ConjuntoSwitcherProps {
  current: Doc<'conjuntos'>
}

export function ConjuntoSwitcher({ current }: ConjuntoSwitcherProps) {
  const navigate = useNavigate()
  const { data: conjuntos } = useQuery(
    convexQuery(api.conjuntos.queries.listForCurrentUser, {}),
  )

  const list = conjuntos ?? []
  const hasMultiple = list.length > 1

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="outline"
            size="sm"
            className="max-w-[220px] justify-between gap-2"
          />
        }
      >
        <div className="flex items-center gap-2 overflow-hidden">
          <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="truncate text-sm font-medium">{current.nombre}</span>
        </div>
        {hasMultiple ? (
          <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        ) : null}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[260px]">
        <DropdownMenuLabel>Cambiar de conjunto</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {list.map((c) => {
          const isCurrent = c._id === current._id
          return (
            <DropdownMenuItem
              key={c._id}
              onClick={() => {
                if (!isCurrent) {
                  navigate({
                    to: '/c/$conjuntoId',
                    params: { conjuntoId: c.slug },
                  })
                }
              }}
            >
              <Building2 className="mr-2 h-4 w-4 text-muted-foreground" />
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-sm font-medium">{c.nombre}</span>
                <span className="truncate text-xs text-muted-foreground">
                  {c.ciudad}
                </span>
              </div>
              <Check
                className={cn(
                  'ml-2 h-4 w-4',
                  isCurrent ? 'opacity-100' : 'opacity-0',
                )}
              />
            </DropdownMenuItem>
          )
        })}
        {list.length === 0 ? (
          <div className="px-2 py-1.5 text-xs text-muted-foreground">
            Sin conjuntos accesibles.
          </div>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
