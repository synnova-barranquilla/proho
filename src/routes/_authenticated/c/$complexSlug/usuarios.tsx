import { Suspense, useEffect, useState } from 'react'

import { useMutation, useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'

import { convexQuery, useConvexMutation } from '@convex-dev/react-query'
import { ConvexError } from 'convex/values'
import { UserPlus } from 'lucide-react'
import { toast } from 'sonner'

import { InviteComplexUserDialog } from '#/components/admin/users/invite-complex-user-dialog'
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
import { useIsComplexAdmin } from '#/lib/complex-role'
import { prefetchAuthenticatedQuery } from '#/lib/convex-loader'
import { api } from '../../../../../convex/_generated/api'
import type { Doc, Id } from '../../../../../convex/_generated/dataModel'

export const Route = createFileRoute('/_authenticated/c/$complexSlug/usuarios')(
  {
    loader: async ({ context: { queryClient, complexId } }) => {
      await prefetchAuthenticatedQuery(
        queryClient,
        api.complexMemberships.queries.listByComplex,
        { complexId },
      )
      return null
    },
    component: UsuariosComplexPage,
  },
)

function UsuariosComplexPage() {
  const { complexId, complexSlug } = Route.useRouteContext()
  const navigate = useNavigate()
  const isAdmin = useIsComplexAdmin()
  const [inviteOpen, setInviteOpen] = useState(false)

  useEffect(() => {
    if (!isAdmin) {
      void navigate({
        to: '/c/$complexSlug',
        params: { complexSlug },
      })
    }
  }, [isAdmin, navigate, complexSlug])

  if (!isAdmin) return null

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Usuarios del conjunto
          </h1>
          <p className="text-sm text-muted-foreground">
            Vigilantes y otros usuarios con acceso a este conjunto.
          </p>
        </div>
        <Button onClick={() => setInviteOpen(true)}>
          <UserPlus />
          Invitar usuario
        </Button>
      </div>

      <Suspense fallback={<Skeleton className="h-40 w-full" />}>
        <MembershipsTable complexId={complexId} />
      </Suspense>

      <InviteComplexUserDialog
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        complexId={complexId}
      />
    </div>
  )
}

type MembershipRow = Doc<'complexMemberships'> & {
  user: Doc<'users'> | null
}

function MembershipsTable({ complexId }: { complexId: Id<'complexes'> }) {
  const { data: memberships } = useSuspenseQuery(
    convexQuery(api.complexMemberships.queries.listByComplex, {
      complexId,
    }),
  )

  const setActiveFn = useConvexMutation(
    api.complexMemberships.mutations.setActive,
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

  // ADMINs are managed separately at /admin/equipo
  const rows = memberships.filter((m) => m.role !== 'ADMIN')

  if (rows.length === 0) {
    return (
      <div className="rounded-md border border-dashed py-12 text-center text-sm text-muted-foreground">
        No hay usuarios del conjunto aún. Invita al primer vigilante.
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-10 text-muted-foreground">#</TableHead>
          <TableHead>Usuario</TableHead>
          <TableHead>Rol</TableHead>
          <TableHead>Estado</TableHead>
          <TableHead className="text-right">Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((m, i) => (
          <TableRow key={m._id}>
            <TableCell className="text-muted-foreground tabular-nums">
              {i + 1}
            </TableCell>
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
