import { Suspense, useEffect, useState } from 'react'

import { useMutation, useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'

import { convexQuery, useConvexMutation } from '@convex-dev/react-query'
import { ConvexError } from 'convex/values'
import { UserPlus } from 'lucide-react'
import { toast } from 'sonner'

import { InviteConjuntoUserDialog } from '#/components/admin/usuarios/invite-conjunto-user-dialog'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { Skeleton } from '#/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '#/components/ui/table'
import { useIsConjuntoAdmin } from '#/lib/conjunto-role'
import { prefetchAuthenticatedQuery } from '#/lib/convex-loader'
import { api } from '../../../../../../convex/_generated/api'
import type { Doc, Id } from '../../../../../../convex/_generated/dataModel'

export const Route = createFileRoute(
  '/_authenticated/admin/c/$conjuntoId/usuarios',
)({
  loader: async ({ context: { queryClient }, params }) => {
    await prefetchAuthenticatedQuery(
      queryClient,
      api.conjuntoMemberships.queries.listByConjunto,
      { conjuntoId: params.conjuntoId as Id<'conjuntos'> },
    )
    return null
  },
  component: UsuariosConjuntoPage,
})

function UsuariosConjuntoPage() {
  const { conjuntoId } = Route.useParams()
  const navigate = useNavigate()
  const isAdmin = useIsConjuntoAdmin()
  const [inviteOpen, setInviteOpen] = useState(false)

  useEffect(() => {
    if (!isAdmin) {
      void navigate({
        to: '/admin/c/$conjuntoId',
        params: { conjuntoId },
      })
    }
  }, [isAdmin, navigate, conjuntoId])

  if (!isAdmin) return null

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Usuarios del conjunto
          </h1>
          <p className="text-sm text-muted-foreground">
            Vigilantes, asistentes y otros usuarios con acceso a este conjunto.
          </p>
        </div>
        <Button onClick={() => setInviteOpen(true)}>
          <UserPlus />
          Invitar usuario
        </Button>
      </div>

      <Suspense fallback={<Skeleton className="h-40 w-full" />}>
        <MembershipsTable conjuntoId={conjuntoId as Id<'conjuntos'>} />
      </Suspense>

      <InviteConjuntoUserDialog
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        conjuntoId={conjuntoId as Id<'conjuntos'>}
      />
    </div>
  )
}

type MembershipRow = Doc<'conjuntoMemberships'> & {
  user: Doc<'users'> | null
}

function MembershipsTable({ conjuntoId }: { conjuntoId: Id<'conjuntos'> }) {
  const { data: memberships } = useSuspenseQuery(
    convexQuery(api.conjuntoMemberships.queries.listByConjunto, {
      conjuntoId,
    }),
  )

  const setActiveFn = useConvexMutation(
    api.conjuntoMemberships.mutations.setActive,
  )
  const setActive = useMutation({ mutationFn: setActiveFn })

  const handleToggleActive = async (m: MembershipRow) => {
    try {
      await setActive.mutateAsync({
        membershipId: m._id,
        active: !m.active,
      })
      toast.success(m.active ? 'Acceso revocado' : 'Acceso reactivado')
    } catch (err) {
      if (err instanceof ConvexError) {
        const d = err.data as { message?: string }
        toast.error(d.message ?? 'Error')
      } else {
        toast.error('Error inesperado')
      }
    }
  }

  // Filtrar los ADMINs (esos se gestionan en /admin/equipo)
  const rows = memberships.filter((m) => m.role !== 'ADMIN')

  if (rows.length === 0) {
    return (
      <div className="rounded-md border border-dashed py-12 text-center text-sm text-muted-foreground">
        No hay usuarios del conjunto aún. Invita al primer vigilante o
        asistente.
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Usuario</TableHead>
          <TableHead>Rol</TableHead>
          <TableHead>Estado</TableHead>
          <TableHead className="text-right">Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((m) => (
          <TableRow key={m._id}>
            <TableCell>
              {m.user ? (
                <div className="flex flex-col">
                  <span className="font-medium">
                    {m.user.firstName}
                    {m.user.lastName ? ` ${m.user.lastName}` : ''}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {m.user.email}
                  </span>
                </div>
              ) : (
                <span className="text-xs text-muted-foreground">—</span>
              )}
            </TableCell>
            <TableCell>
              <Badge variant="outline">{m.role}</Badge>
            </TableCell>
            <TableCell>
              {m.active ? (
                <Badge variant="outline">Activo</Badge>
              ) : (
                <Badge variant="secondary">Revocado</Badge>
              )}
            </TableCell>
            <TableCell className="text-right">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleToggleActive(m as MembershipRow)}
              >
                {m.active ? 'Revocar' : 'Reactivar'}
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
