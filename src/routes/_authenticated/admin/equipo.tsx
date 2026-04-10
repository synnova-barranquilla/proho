import { Suspense, useState } from 'react'

import { useMutation, useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, redirect } from '@tanstack/react-router'

import { convexQuery, useConvexMutation } from '@convex-dev/react-query'
import { getAuth } from '@workos/authkit-tanstack-react-start'
import { ConvexHttpClient } from 'convex/browser'
import { ConvexError } from 'convex/values'
import { Check, Plus, Shield, UserMinus, UserPlus, X } from 'lucide-react'
import { toast } from 'sonner'
import { z } from 'zod'

import { InviteOrgAdminDialog } from '#/components/admin/equipo/invite-org-admin-dialog'
import { ManageAccessDialog } from '#/components/admin/equipo/manage-access-dialog'
import { AdminLayout } from '#/components/admin/layout'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '#/components/ui/card'
import { Skeleton } from '#/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '#/components/ui/table'
import { prefetchAuthenticatedQuery } from '#/lib/convex-loader'
import { api } from '../../../../convex/_generated/api'
import type { Doc, Id } from '../../../../convex/_generated/dataModel'

const CONVEX_URL = (import.meta as any).env.VITE_CONVEX_URL

// Optional `from` search param: the conjunto id the user was visiting
// before navigating to /admin/equipo. The sidebar uses it to render a
// "Volver al conjunto <nombre>" shortcut so the user lands back where
// they came from instead of going through the selector.
const equipoSearchSchema = z.object({
  from: z.string().optional(),
})

export const Route = createFileRoute('/_authenticated/admin/equipo')({
  validateSearch: equipoSearchSchema,
  loaderDeps: ({ search }) => ({ from: search.from }),
  loader: async ({ context: { queryClient }, deps }) => {
    // Guard: solo org owners pueden entrar
    const auth = await getAuth()
    if (!auth.user) throw redirect({ to: '/login' })
    const client = new ConvexHttpClient(CONVEX_URL)
    client.setAuth(auth.accessToken)
    const context = await client.query(api.users.queries.getCurrentContext, {})
    if (!context || context.user.isOrgOwner !== true) {
      throw redirect({ to: '/seleccionar-conjunto' })
    }

    await Promise.all([
      prefetchAuthenticatedQuery(
        queryClient,
        api.users.queries.listAdminsByOrg,
        {},
      ),
      prefetchAuthenticatedQuery(
        queryClient,
        api.conjuntos.queries.listForCurrentUser,
        {},
      ),
      prefetchAuthenticatedQuery(
        queryClient,
        api.invitations.queries.listPendingOrgAdminInvitations,
        {},
      ),
    ])

    // If a `from` conjunto slug was passed, resolve it so the sidebar
    // can render a back link with the conjunto's display name. If the
    // fetch fails (invalid slug, revoked access, etc.) we silently drop
    // the back link — the user can still use "Volver al selector".
    let fromConjunto: Doc<'conjuntos'> | null = null
    if (deps.from) {
      try {
        const result = await client.query(api.conjuntos.queries.getBySlug, {
          slug: deps.from,
        })
        fromConjunto = result?.conjunto ?? null
      } catch {
        fromConjunto = null
      }
    }

    return { fromConjunto }
  },
  component: EquipoPage,
})

function EquipoPage() {
  const { fromConjunto } = Route.useLoaderData()
  const [inviteOpen, setInviteOpen] = useState(false)
  // Store only the id of the admin being edited. The dialog re-derives
  // the live admin row from the `listAdminsByOrg` query on every render
  // so Convex reactive updates flow through without stale local state.
  const [manageAccessForId, setManageAccessForId] =
    useState<Id<'users'> | null>(null)

  return (
    <AdminLayout conjunto={null} fromConjunto={fromConjunto}>
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Equipo de la organización
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Gestiona los administradores de tu organización y sus accesos a
              cada conjunto.
            </p>
          </div>
          <Button onClick={() => setInviteOpen(true)}>
            <UserPlus />
            Invitar admin
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Administradores</CardTitle>
            <CardDescription>
              Los owners ven todos los conjuntos automáticamente. Los ADMINs
              no-owner solo ven los conjuntos que les asignes.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<AdminsTableSkeleton />}>
              <AdminsTable
                onManageAccess={(adminId) => setManageAccessForId(adminId)}
              />
            </Suspense>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Invitaciones pendientes</CardTitle>
            <CardDescription>
              Invitaciones enviadas que aún no han sido aceptadas. Puedes
              revocarlas en cualquier momento.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<AdminsTableSkeleton />}>
              <PendingInvitationsTable />
            </Suspense>
          </CardContent>
        </Card>
      </div>

      <InviteOrgAdminDialog open={inviteOpen} onOpenChange={setInviteOpen} />
      <ManageAccessDialog
        adminId={manageAccessForId}
        onOpenChange={(open) => {
          if (!open) setManageAccessForId(null)
        }}
      />
    </AdminLayout>
  )
}

type AdminRow = Doc<'users'> & {
  memberships: Array<Doc<'conjuntoMemberships'>>
}

function AdminsTable({
  onManageAccess,
}: {
  onManageAccess: (adminId: Id<'users'>) => void
}) {
  const { data: admins } = useSuspenseQuery(
    convexQuery(api.users.queries.listAdminsByOrg, {}),
  )
  const { data: conjuntos } = useSuspenseQuery(
    convexQuery(api.conjuntos.queries.listForCurrentUser, {}),
  )

  const setActiveFn = useConvexMutation(api.users.mutations.setUserActive)
  const setActive = useMutation({ mutationFn: setActiveFn })

  const conjuntoMap = new Map(conjuntos.map((c) => [c._id, c]))

  const handleToggleActive = async (admin: AdminRow) => {
    try {
      await setActive.mutateAsync({
        userId: admin._id,
        active: !admin.active,
      })
      toast.success(
        admin.active ? 'Administrador desactivado' : 'Administrador reactivado',
      )
    } catch (err) {
      if (err instanceof ConvexError) {
        const data = err.data as { message?: string }
        toast.error(data.message ?? 'Error')
      } else {
        toast.error('Error inesperado')
      }
    }
  }

  if (admins.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-muted-foreground">
        No hay administradores aún. Invita al primero con el botón de arriba.
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-10 text-muted-foreground">#</TableHead>
          <TableHead>Administrador</TableHead>
          <TableHead>Acceso</TableHead>
          <TableHead>Estado</TableHead>
          <TableHead className="text-right">Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {admins.map((admin, i) => {
          const isOwner = admin.isOrgOwner === true
          return (
            <TableRow key={admin._id}>
              <TableCell className="text-muted-foreground tabular-nums">
                {i + 1}
              </TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <span className="font-medium">
                    {admin.firstName}
                    {admin.lastName ? ` ${admin.lastName}` : ''}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {admin.email}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                {isOwner ? (
                  <Badge variant="default" className="gap-1">
                    <Shield className="h-3 w-3" />
                    Todos los conjuntos (owner)
                  </Badge>
                ) : admin.memberships.length === 0 ? (
                  <span className="text-xs text-muted-foreground">
                    Sin conjuntos asignados
                  </span>
                ) : (
                  <div className="flex flex-wrap gap-1">
                    {admin.memberships.map((m) => {
                      const c = conjuntoMap.get(m.conjuntoId)
                      return (
                        <Badge key={m._id} variant="outline">
                          {c?.nombre ?? m.conjuntoId.slice(0, 6)}
                        </Badge>
                      )
                    })}
                  </div>
                )}
              </TableCell>
              <TableCell>
                {admin.active ? (
                  <Badge variant="outline" className="gap-1">
                    <Check className="h-3 w-3" />
                    Activo
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="gap-1">
                    <X className="h-3 w-3" />
                    Inactivo
                  </Badge>
                )}
              </TableCell>
              <TableCell className="text-right">
                {!isOwner ? (
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onManageAccess(admin._id)}
                    >
                      <Plus />
                      Accesos
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleActive(admin as AdminRow)}
                      disabled={setActive.isPending}
                    >
                      <UserMinus />
                      {admin.active ? 'Desactivar' : 'Reactivar'}
                    </Button>
                  </div>
                ) : null}
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}

function AdminsTableSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  )
}

function PendingInvitationsTable() {
  const { data: invitations } = useSuspenseQuery(
    convexQuery(api.invitations.queries.listPendingOrgAdminInvitations, {}),
  )

  const revokeFn = useConvexMutation(api.invitations.mutations.revoke)
  const revoke = useMutation({ mutationFn: revokeFn })

  const handleRevoke = async (invitationId: Id<'invitations'>) => {
    try {
      await revoke.mutateAsync({ invitationId })
      toast.success('Invitación revocada')
    } catch (err) {
      if (err instanceof ConvexError) {
        const data = err.data as { message?: string }
        toast.error(data.message ?? 'Error al revocar')
      } else {
        toast.error('Error inesperado')
      }
    }
  }

  if (invitations.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-muted-foreground">
        No hay invitaciones pendientes.
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-10 text-muted-foreground">#</TableHead>
          <TableHead>Invitado</TableHead>
          <TableHead>Enviada</TableHead>
          <TableHead>Expira</TableHead>
          <TableHead className="text-right">Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {invitations.map((inv, i) => {
          const fullName = inv.lastName
            ? `${inv.firstName} ${inv.lastName}`
            : inv.firstName
          const invitedAt = new Date(inv.invitedAt).toLocaleDateString('es-CO')
          const expiresAt = new Date(inv.expiresAt).toLocaleDateString('es-CO')
          const expired = inv.expiresAt < Date.now()
          return (
            <TableRow key={inv._id}>
              <TableCell className="text-muted-foreground tabular-nums">
                {i + 1}
              </TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <span className="font-medium">{fullName}</span>
                  <span className="text-xs text-muted-foreground">
                    {inv.email}
                  </span>
                </div>
              </TableCell>
              <TableCell className="text-xs text-muted-foreground">
                {invitedAt}
              </TableCell>
              <TableCell>
                {expired ? (
                  <Badge variant="secondary">Expirada</Badge>
                ) : (
                  <span className="text-xs text-muted-foreground">
                    {expiresAt}
                  </span>
                )}
              </TableCell>
              <TableCell className="text-right">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRevoke(inv._id)}
                  disabled={revoke.isPending}
                >
                  <X />
                  Revocar
                </Button>
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}
