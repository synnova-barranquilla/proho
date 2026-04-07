import { useState } from 'react'

import { useSuspenseQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'

import { convexQuery } from '@convex-dev/react-query'

import { Badge } from '#/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '#/components/ui/table'
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

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead className="hidden sm:table-cell">Slug</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="hidden md:table-cell">Módulos</TableHead>
              <TableHead className="hidden lg:table-cell">Creada</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {orgs.map((org) => (
              <TableRow key={org._id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Link
                      to="/super-admin/organizaciones/$orgId"
                      params={{ orgId: org._id }}
                      className="font-medium hover:underline"
                    >
                      {org.name}
                    </Link>
                    {isInternalOrgSlug(org.slug) && (
                      <Badge variant="secondary" className="text-xs">
                        Interno
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
                    {org.slug}
                  </code>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={org.active ? 'default' : 'secondary'}
                    className="text-xs"
                  >
                    {org.active ? 'Activa' : 'Inactiva'}
                  </Badge>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  {org.activeModules.length === 0 ? (
                    <span className="text-xs text-muted-foreground">
                      Ninguno
                    </span>
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {org.activeModules.map((m) => (
                        <Badge key={m} variant="outline" className="text-xs">
                          {MODULE_LABELS[m]}
                        </Badge>
                      ))}
                    </div>
                  )}
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  <Tooltip>
                    <TooltipTrigger className="text-xs text-muted-foreground">
                      {formatRelative(org._creationTime)}
                    </TooltipTrigger>
                    <TooltipContent>
                      {formatAbsolute(org._creationTime)}
                    </TooltipContent>
                  </Tooltip>
                </TableCell>
                <TableCell>
                  <OrgRowActions
                    org={org}
                    onSeeDetails={() => setDetailsOrgId(org._id)}
                    onInviteAdmin={() => onInviteAdmin(org)}
                    onDeactivate={() => onDeactivate(org)}
                    onReactivate={() => onReactivate(org)}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
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
