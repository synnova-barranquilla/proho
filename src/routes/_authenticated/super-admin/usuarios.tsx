import { Suspense, useMemo, useState } from 'react'

import { useMutation, useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, getRouteApi } from '@tanstack/react-router'
import type { ColumnDef } from '@tanstack/react-table'

import { convexQuery, useConvexMutation } from '@convex-dev/react-query'
import { ConvexError } from 'convex/values'
import { UserPlus } from 'lucide-react'
import { toast } from 'sonner'

import { InviteAdminDialog } from '#/components/super-admin/invite-admin-dialog'
import { UsersTableSkeleton } from '#/components/super-admin/skeletons/users-table-skeleton'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { DataTable } from '#/components/ui/data-table'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { SearchableSelect } from '#/components/ui/searchable-select'
import { Switch } from '#/components/ui/switch'
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

const authenticatedRoute = getRouteApi('/_authenticated')

function UsuariosPage() {
  const [orgFilter, setOrgFilter] = useState<string>(ALL_ORGS_VALUE)
  const [search, setSearch] = useState('')
  const [inviteOpen, setInviteOpen] = useState(false)
  const [showInactive, setShowInactive] = useState(false)

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
          <SearchableSelect
            value={orgFilter}
            onValueChange={(v) => setOrgFilter(v || ALL_ORGS_VALUE)}
            options={[
              { value: ALL_ORGS_VALUE, label: 'Todas las organizaciones' },
              ...orgsQuery.data.map((org) => ({
                value: org._id,
                label: org.name,
              })),
            ]}
            placeholder="Organización"
            searchPlaceholder="Buscar organización..."
            className="w-full sm:w-[220px]"
          />
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
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Usuarios
          </h2>
          <div className="flex items-center gap-2">
            <Switch
              id="showInactive"
              checked={showInactive}
              onCheckedChange={setShowInactive}
            />
            <Label htmlFor="showInactive" className="text-xs">
              Mostrar inactivos
            </Label>
          </div>
        </div>
        <Suspense fallback={<UsersTableSkeleton />}>
          <ActiveUsersTable
            orgFilter={orgFilter}
            search={search}
            showInactive={showInactive}
          />
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
  showInactive,
}: {
  orgFilter: string
  search: string
  showInactive: boolean
}) {
  const { data: users } = useSuspenseQuery(
    convexQuery(api.users.queries.listAllWithOrg, {
      includeInactive: showInactive,
    }),
  )
  const { convexUser } = authenticatedRoute.useLoaderData()

  const setActiveFn = useConvexMutation(api.users.mutations.setUserActive)
  const setActiveMut = useMutation({ mutationFn: setActiveFn })
  const handleToggleActive = async (
    userId: (typeof users)[0]['_id'],
    active: boolean,
  ) => {
    try {
      await setActiveMut.mutateAsync({ userId, active })
      toast.success(active ? 'Usuario reactivado' : 'Usuario desactivado')
    } catch (err) {
      if (err instanceof ConvexError) {
        const d = err.data as { message?: string }
        toast.error(d.message ?? 'Error')
      } else {
        toast.error('Error inesperado')
      }
    }
  }

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
    ...(showInactive
      ? [
          {
            id: 'estado',
            header: 'Estado',
            accessorFn: (u: ActiveUserWithOrg) =>
              u.active ? 'Activo' : 'Inactivo',
            cell: ({ row }: { row: { original: ActiveUserWithOrg } }) =>
              row.original.active ? (
                <Badge variant="outline" className="text-xs">
                  Activo
                </Badge>
              ) : (
                <Badge variant="secondary" className="text-xs">
                  Inactivo
                </Badge>
              ),
          } satisfies ColumnDef<ActiveUserWithOrg>,
        ]
      : []),
    {
      id: 'acciones',
      header: () => <span className="sr-only">Acciones</span>,
      enableSorting: false,
      meta: { headClassName: 'text-right', cellClassName: 'text-right' },
      cell: ({ row }) => {
        const isSelf = row.original._id === convexUser._id
        if (isSelf) return null
        return row.original.active ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleToggleActive(row.original._id, false)}
            disabled={setActiveMut.isPending}
          >
            Desactivar
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleToggleActive(row.original._id, true)}
            disabled={setActiveMut.isPending}
          >
            Reactivar
          </Button>
        )
      },
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
