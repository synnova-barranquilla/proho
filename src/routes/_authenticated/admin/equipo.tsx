import { Suspense, useState } from 'react'

import { useMutation, useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, redirect } from '@tanstack/react-router'

import { convexQuery, useConvexMutation } from '@convex-dev/react-query'
import { getAuth } from '@workos/authkit-tanstack-react-start'
import { ConvexHttpClient } from 'convex/browser'
import { ConvexError } from 'convex/values'
import { Check, Plus, Shield, UserMinus, UserPlus, X } from 'lucide-react'
import { toast } from 'sonner'

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
import type { Doc } from '../../../../convex/_generated/dataModel'

const CONVEX_URL = (import.meta as any).env.VITE_CONVEX_URL

export const Route = createFileRoute('/_authenticated/admin/equipo')({
  loader: async ({ context: { queryClient } }) => {
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
    ])

    return null
  },
  component: EquipoPage,
})

function EquipoPage() {
  const [inviteOpen, setInviteOpen] = useState(false)
  const [manageAccessFor, setManageAccessFor] = useState<AdminRow | null>(null)

  return (
    <AdminLayout conjunto={null}>
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
                onManageAccess={(admin) => setManageAccessFor(admin)}
              />
            </Suspense>
          </CardContent>
        </Card>
      </div>

      <InviteOrgAdminDialog open={inviteOpen} onOpenChange={setInviteOpen} />
      <ManageAccessDialog
        admin={manageAccessFor}
        onOpenChange={(open) => {
          if (!open) setManageAccessFor(null)
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
  onManageAccess: (admin: AdminRow) => void
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
          <TableHead>Administrador</TableHead>
          <TableHead>Acceso</TableHead>
          <TableHead>Estado</TableHead>
          <TableHead className="text-right">Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {admins.map((admin) => {
          const isOwner = admin.isOrgOwner === true
          return (
            <TableRow key={admin._id}>
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
                      onClick={() => onManageAccess(admin as AdminRow)}
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
