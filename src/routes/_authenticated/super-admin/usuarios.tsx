import { Suspense, useMemo, useState } from 'react'

import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import type { ColumnDef } from '@tanstack/react-table'

import { convexQuery } from '@convex-dev/react-query'
import { UserPlus } from 'lucide-react'

import { InviteAdminDialog } from '#/components/super-admin/invite-admin-dialog'
import { UsersTableSkeleton } from '#/components/super-admin/skeletons/users-table-skeleton'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { DataTable } from '#/components/ui/data-table'
import { Input } from '#/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '#/components/ui/tooltip'
import { prefetchAuthenticatedQuery } from '#/lib/convex-loader'
import { formatAbsolute, formatRelative } from '#/lib/date'
import { getFullName } from '#/lib/user'
import { api } from '../../../../convex/_generated/api'
import type { Doc, Id } from '../../../../convex/_generated/dataModel'

const ALL_ORGS_VALUE = 'all'

export const Route = createFileRoute('/_authenticated/super-admin/usuarios')({
  loader: async ({ context: { queryClient } }) => {
    await Promise.all([
      prefetchAuthenticatedQuery(
        queryClient,
        api.users.queries.listAllWithOrg,
        {},
      ),
      prefetchAuthenticatedQuery(
        queryClient,
        api.invitations.queries.listAllPendingWithOrg,
        {},
      ),
      prefetchAuthenticatedQuery(
        queryClient,
        api.organizations.queries.listAll,
        { includeInactive: false },
      ),
    ])
    return null
  },
  component: UsuariosPage,
})

function UsuariosPage() {
  const [orgFilter, setOrgFilter] = useState<string>(ALL_ORGS_VALUE)
  const [search, setSearch] = useState('')
  const [inviteOpen, setInviteOpen] = useState(false)

  // Orgs for the filter dropdown (non-blocking client query, used by
  // multiple sections)
  const orgsQuery = useSuspenseQuery(
    convexQuery(api.organizations.queries.listAll, {
      includeInactive: false,
    }),
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Usuarios</h1>
          <p className="text-sm text-muted-foreground">
            Usuarios activos e invitaciones pendientes del sistema.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Select
            value={orgFilter}
            onValueChange={(v) => setOrgFilter(v ?? ALL_ORGS_VALUE)}
          >
            <SelectTrigger className="w-full sm:w-[220px]">
              <SelectValue placeholder="Organización">
                {(value: string) => {
                  if (value === ALL_ORGS_VALUE)
                    return 'Todas las organizaciones'
                  const org = orgsQuery.data.find((o) => o._id === value)
                  return org ? org.name : null
                }}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_ORGS_VALUE}>
                Todas las organizaciones
              </SelectItem>
              {orgsQuery.data.map((org) => (
                <SelectItem key={org._id} value={org._id}>
                  {org.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            placeholder="Buscar por email o nombre..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:w-[280px]"
          />
          <Button onClick={() => setInviteOpen(true)}>
            <UserPlus className="size-4" />
            Invitar admin
          </Button>
        </div>
      </div>

      <section className="space-y-2">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          Activos
        </h2>
        <Suspense fallback={<UsersTableSkeleton />}>
          <ActiveUsersTable orgFilter={orgFilter} search={search} />
        </Suspense>
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          Pendientes
        </h2>
        <Suspense fallback={<UsersTableSkeleton />}>
          <PendingInvitationsTable orgFilter={orgFilter} search={search} />
        </Suspense>
      </section>

      <InviteAdminDialog open={inviteOpen} onOpenChange={setInviteOpen} />
    </div>
  )
}

type ActiveUserWithOrg = Doc<'users'> & {
  organization: Doc<'organizations'> | null
}

function ActiveUsersTable({
  orgFilter,
  search,
}: {
  orgFilter: string
  search: string
}) {
  const { data: users } = useSuspenseQuery(
    convexQuery(api.users.queries.listAllWithOrg, {}),
  )

  const filtered = useMemo(() => {
    return users.filter((u) => {
      if (
        orgFilter !== ALL_ORGS_VALUE &&
        u.organizationId !== (orgFilter as Id<'organizations'>)
      )
        return false
      if (search) {
        const q = search.toLowerCase()
        return (
          u.email.toLowerCase().includes(q) ||
          getFullName(u).toLowerCase().includes(q)
        )
      }
      return true
    })
  }, [users, orgFilter, search])

  if (filtered.length === 0) {
    return <EmptyRow text="No hay usuarios activos que coincidan." />
  }

  const columns: ColumnDef<ActiveUserWithOrg>[] = [
    {
      id: 'nombre',
      header: 'Nombre',
      accessorFn: (u) => getFullName(u),
      cell: ({ row }) => (
        <span className="font-medium">{getFullName(row.original)}</span>
      ),
    },
    {
      id: 'email',
      header: 'Email',
      accessorKey: 'email',
      cell: ({ row }) => (
        <span className="text-muted-foreground">{row.original.email}</span>
      ),
    },
    {
      id: 'organizacion',
      header: 'Organización',
      accessorFn: (u) => u.organization?.name ?? '',
      meta: {
        headClassName: 'hidden md:table-cell',
        cellClassName: 'hidden md:table-cell',
      },
      cell: ({ row }) => row.original.organization?.name ?? '—',
    },
    {
      id: 'rol',
      header: 'Rol',
      accessorKey: 'orgRole',
      meta: {
        headClassName: 'hidden sm:table-cell',
        cellClassName: 'hidden sm:table-cell',
      },
      cell: ({ row }) => (
        <Badge variant="outline" className="text-xs">
          {row.original.orgRole}
        </Badge>
      ),
    },
  ]

  return (
    <div className="rounded-md border">
      <DataTable columns={columns} data={filtered} />
    </div>
  )
}

type PendingInvitationWithOrg = Doc<'invitations'> & {
  organization: Doc<'organizations'> | null
  invitedByUser: Doc<'users'> | null
}

function PendingInvitationsTable({
  orgFilter,
  search,
}: {
  orgFilter: string
  search: string
}) {
  const { data: invitations } = useSuspenseQuery(
    convexQuery(api.invitations.queries.listAllPendingWithOrg, {}),
  )

  const filtered = useMemo(() => {
    return invitations.filter((inv) => {
      if (
        orgFilter !== ALL_ORGS_VALUE &&
        inv.organizationId !== (orgFilter as Id<'organizations'>)
      )
        return false
      if (search) {
        const q = search.toLowerCase()
        return (
          inv.email.toLowerCase().includes(q) ||
          getFullName(inv).toLowerCase().includes(q)
        )
      }
      return true
    })
  }, [invitations, orgFilter, search])

  if (filtered.length === 0) {
    return <EmptyRow text="No hay invitaciones pendientes que coincidan." />
  }

  const columns: ColumnDef<PendingInvitationWithOrg>[] = [
    {
      id: 'nombre',
      header: 'Nombre',
      accessorFn: (inv) => getFullName(inv),
      cell: ({ row }) => (
        <span className="font-medium">{getFullName(row.original)}</span>
      ),
    },
    {
      id: 'email',
      header: 'Email',
      accessorKey: 'email',
      cell: ({ row }) => (
        <span className="text-muted-foreground">{row.original.email}</span>
      ),
    },
    {
      id: 'organizacion',
      header: 'Organización',
      accessorFn: (inv) => inv.organization?.name ?? '',
      meta: {
        headClassName: 'hidden md:table-cell',
        cellClassName: 'hidden md:table-cell',
      },
      cell: ({ row }) => row.original.organization?.name ?? '—',
    },
    {
      id: 'expira',
      header: 'Expira',
      accessorFn: (inv) => inv.expiresAt,
      meta: {
        headClassName: 'hidden lg:table-cell',
        cellClassName: 'hidden lg:table-cell',
      },
      cell: ({ row }) => (
        <Tooltip>
          <TooltipTrigger>
            <Badge variant="outline" className="text-xs">
              {formatRelative(row.original.expiresAt)}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            {formatAbsolute(row.original.expiresAt)}
          </TooltipContent>
        </Tooltip>
      ),
    },
  ]

  return (
    <div className="rounded-md border">
      <DataTable columns={columns} data={filtered} />
    </div>
  )
}

function EmptyRow({ text }: { text: string }) {
  return (
    <div className="rounded-md border border-dashed py-8 text-center text-sm text-muted-foreground">
      {text}
    </div>
  )
}
