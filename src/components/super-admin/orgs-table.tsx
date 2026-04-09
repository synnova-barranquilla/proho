import { useState } from 'react'

import { useSuspenseQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import type { ColumnDef } from '@tanstack/react-table'

import { convexQuery } from '@convex-dev/react-query'

import { Badge } from '#/components/ui/badge'
import { DataTable } from '#/components/ui/data-table'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '#/components/ui/tooltip'
import { formatAbsolute, formatRelative } from '#/lib/date'
import { MODULE_LABELS } from '#/lib/modules'
import { isInternalOrgSlug } from '#/lib/organizations'
import { api } from '../../../convex/_generated/api'
import type { Doc, Id } from '../../../convex/_generated/dataModel'
import { OrgRowActions } from './org-row-actions'
import { OrgsEmptyState } from './orgs-empty-state'
import { RowDetailsDialog, type RowDetailItem } from './row-details-dialog'

interface OrgsTableProps {
  showInactive: boolean
  onCreate: () => void
  onInviteAdmin: (org: Doc<'organizations'>) => void
  onDeactivate: (org: Doc<'organizations'>) => void
  onReactivate: (org: Doc<'organizations'>) => void
}

export function OrgsTable({
  showInactive,
  onCreate,
  onInviteAdmin,
  onDeactivate,
  onReactivate,
}: OrgsTableProps) {
  const { data: orgs } = useSuspenseQuery(
    convexQuery(api.organizations.queries.listAll, {
      includeInactive: showInactive,
    }),
  )

  const [detailsOrgId, setDetailsOrgId] = useState<Id<'organizations'> | null>(
    null,
  )
  const detailsOrg = detailsOrgId
    ? orgs.find((o) => o._id === detailsOrgId)
    : null

  if (orgs.length === 0) {
    return <OrgsEmptyState onCreate={onCreate} showInactive={showInactive} />
  }

  const columns: ColumnDef<Doc<'organizations'>>[] = [
    {
      id: 'nombre',
      header: 'Nombre',
      accessorKey: 'name',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Link
            to="/super-admin/organizaciones/$orgId"
            params={{ orgId: row.original._id }}
            className="font-medium hover:underline"
          >
            {row.original.name}
          </Link>
          {isInternalOrgSlug(row.original.slug) && (
            <Badge variant="secondary" className="text-xs">
              Interno
            </Badge>
          )}
        </div>
      ),
    },
    {
      id: 'slug',
      header: 'Slug',
      accessorKey: 'slug',
      meta: {
        headClassName: 'hidden sm:table-cell',
        cellClassName: 'hidden sm:table-cell',
      },
      cell: ({ row }) => (
        <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
          {row.original.slug}
        </code>
      ),
    },
    {
      id: 'estado',
      header: 'Estado',
      accessorFn: (o) => (o.active ? 'Activa' : 'Inactiva'),
      cell: ({ row }) => (
        <Badge
          variant={row.original.active ? 'default' : 'secondary'}
          className="text-xs"
        >
          {row.original.active ? 'Activa' : 'Inactiva'}
        </Badge>
      ),
    },
    {
      id: 'modulos',
      header: 'Módulos',
      enableSorting: false,
      meta: {
        headClassName: 'hidden md:table-cell',
        cellClassName: 'hidden md:table-cell',
      },
      cell: ({ row }) =>
        row.original.activeModules.length === 0 ? (
          <span className="text-xs text-muted-foreground">Ninguno</span>
        ) : (
          <div className="flex flex-wrap gap-1">
            {row.original.activeModules.map((m) => (
              <Badge key={m} variant="outline" className="text-xs">
                {MODULE_LABELS[m]}
              </Badge>
            ))}
          </div>
        ),
    },
    {
      id: 'creada',
      header: 'Creada',
      accessorFn: (o) => o._creationTime,
      meta: {
        headClassName: 'hidden lg:table-cell',
        cellClassName: 'hidden lg:table-cell',
      },
      cell: ({ row }) => (
        <Tooltip>
          <TooltipTrigger className="text-xs text-muted-foreground">
            {formatRelative(row.original._creationTime)}
          </TooltipTrigger>
          <TooltipContent>
            {formatAbsolute(row.original._creationTime)}
          </TooltipContent>
        </Tooltip>
      ),
    },
    {
      id: 'acciones',
      header: () => <span className="sr-only">Acciones</span>,
      enableSorting: false,
      meta: { headClassName: 'w-10' },
      cell: ({ row }) => (
        <OrgRowActions
          org={row.original}
          onSeeDetails={() => setDetailsOrgId(row.original._id)}
          onInviteAdmin={() => onInviteAdmin(row.original)}
          onDeactivate={() => onDeactivate(row.original)}
          onReactivate={() => onReactivate(row.original)}
        />
      ),
    },
  ]

  return (
    <>
      <div className="rounded-md border">
        <DataTable columns={columns} data={orgs} />
      </div>

      {detailsOrg && (
        <RowDetailsDialog
          open={true}
          onOpenChange={(open) => !open && setDetailsOrgId(null)}
          title={detailsOrg.name}
          items={buildOrgDetailsItems(detailsOrg)}
        />
      )}
    </>
  )
}

function buildOrgDetailsItems(org: Doc<'organizations'>): Array<RowDetailItem> {
  return [
    {
      label: 'Nombre',
      value: org.name,
    },
    {
      label: 'Slug',
      value: <code className="font-mono text-xs">{org.slug}</code>,
    },
    {
      label: 'Estado',
      value: (
        <Badge variant={org.active ? 'default' : 'secondary'}>
          {org.active ? 'Activa' : 'Inactiva'}
        </Badge>
      ),
    },
    {
      label: 'Módulos activos',
      value:
        org.activeModules.length === 0 ? (
          <span className="text-muted-foreground">Ninguno</span>
        ) : (
          <div className="flex flex-wrap gap-1">
            {org.activeModules.map((m) => (
              <Badge key={m} variant="outline" className="text-xs">
                {MODULE_LABELS[m]}
              </Badge>
            ))}
          </div>
        ),
    },
    {
      label: 'Creada',
      value: formatAbsolute(org._creationTime),
    },
  ]
}
