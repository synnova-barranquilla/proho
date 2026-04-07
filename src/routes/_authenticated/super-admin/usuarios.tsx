import { Suspense, useMemo, useState } from 'react'

import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'

import { convexQuery } from '@convex-dev/react-query'
import { UserPlus } from 'lucide-react'

import { InviteAdminDialog } from '#/components/super-admin/invite-admin-dialog'
import { UsersTableSkeleton } from '#/components/super-admin/skeletons/users-table-skeleton'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select'
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
import { getFullName } from '#/lib/user'
import { api } from '../../../../convex/_generated/api'
import type { Doc, Id } from '../../../../convex/_generated/dataModel'

const ALL_ORGS_VALUE = 'all'

export const Route = createFileRoute('/_authenticated/super-admin/usuarios')({
  loader: ({ context: { queryClient } }) => {
    void queryClient.prefetchQuery(
      convexQuery(api.users.queries.listAllWithOrg, {}),
    )
    void queryClient.prefetchQuery(
      convexQuery(api.invitations.queries.listAllPendingWithOrg, {}),
    )
    void queryClient.prefetchQuery(
      convexQuery(api.organizations.queries.listAll, {
        includeInactive: false,
      }),
    )
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
              <SelectValue placeholder="Organización" />
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

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead>Email</TableHead>
            <TableHead className="hidden md:table-cell">Organización</TableHead>
            <TableHead className="hidden sm:table-cell">Rol</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.map((u) => (
            <UserRow key={u._id} user={u} />
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

function UserRow({ user }: { user: ActiveUserWithOrg }) {
  return (
    <TableRow>
      <TableCell className="font-medium">{getFullName(user)}</TableCell>
      <TableCell className="text-muted-foreground">{user.email}</TableCell>
      <TableCell className="hidden md:table-cell">
        {user.organization?.name ?? '—'}
      </TableCell>
      <TableCell className="hidden sm:table-cell">
        <Badge variant="outline" className="text-xs">
          {user.orgRole}
        </Badge>
      </TableCell>
    </TableRow>
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

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead>Email</TableHead>
            <TableHead className="hidden md:table-cell">Organización</TableHead>
            <TableHead className="hidden lg:table-cell">Expira</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.map((inv) => (
            <InvitationRow key={inv._id} inv={inv} />
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

function InvitationRow({ inv }: { inv: PendingInvitationWithOrg }) {
  return (
    <TableRow>
      <TableCell className="font-medium">{getFullName(inv)}</TableCell>
      <TableCell className="text-muted-foreground">{inv.email}</TableCell>
      <TableCell className="hidden md:table-cell">
        {inv.organization?.name ?? '—'}
      </TableCell>
      <TableCell className="hidden lg:table-cell">
        <Tooltip>
          <TooltipTrigger>
            <Badge variant="outline" className="text-xs">
              {formatRelative(inv.expiresAt)}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>{formatAbsolute(inv.expiresAt)}</TooltipContent>
        </Tooltip>
      </TableCell>
    </TableRow>
  )
}

function EmptyRow({ text }: { text: string }) {
  return (
    <div className="rounded-md border border-dashed py-8 text-center text-sm text-muted-foreground">
      {text}
    </div>
  )
}
