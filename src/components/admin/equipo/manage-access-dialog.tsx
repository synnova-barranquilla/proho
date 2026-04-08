import { useEffect, useState } from 'react'

import { useMutation, useQueryClient } from '@tanstack/react-query'

import { convexQuery, useConvexMutation } from '@convex-dev/react-query'
import { ConvexError } from 'convex/values'
import { Building2, Check } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '#/components/ui/button'
import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '#/components/ui/dialog'
import { cn } from '#/lib/utils'
import { api } from '../../../../convex/_generated/api'
import type { Doc, Id } from '../../../../convex/_generated/dataModel'

type AdminRow = Doc<'users'> & {
  memberships: Array<Doc<'conjuntoMemberships'>>
}

interface ManageAccessDialogProps {
  admin: AdminRow | null
  onOpenChange: (open: boolean) => void
}

/**
 * Matriz de accesos conjunto × admin. Por cada conjunto de la org muestra un
 * checkbox que, al tick/untick, llama a `conjuntoMemberships.create` o
 * `setActive(false)` según el caso.
 *
 * Reglas implementadas:
 * - Si no existe membership → `create` (membership nueva, active=true).
 * - Si existe activa → `setActive(false)` (revoca).
 * - Si existe inactiva → `setActive(true)` (reactiva, preserva auditoría).
 */
export function ManageAccessDialog({
  admin,
  onOpenChange,
}: ManageAccessDialogProps) {
  const open = admin !== null
  const queryClient = useQueryClient()

  const conjuntosQuery = convexQuery(
    api.conjuntos.queries.listForCurrentUser,
    {},
  )
  const conjuntosData = queryClient.getQueryData(conjuntosQuery.queryKey)
  const conjuntos = conjuntosData ?? []

  // Copia local de las memberships del admin (para feedback inmediato)
  const [memberships, setMemberships] = useState<
    Array<Doc<'conjuntoMemberships'>>
  >([])

  useEffect(() => {
    setMemberships(admin?.memberships ?? [])
  }, [admin])

  const createFn = useConvexMutation(api.conjuntoMemberships.mutations.create)
  const createMutation = useMutation({ mutationFn: createFn })
  const setActiveFn = useConvexMutation(
    api.conjuntoMemberships.mutations.setActive,
  )
  const setActiveMutation = useMutation({ mutationFn: setActiveFn })

  const handleToggle = async (conjuntoId: Id<'conjuntos'>) => {
    if (!admin) return
    const existing = memberships.find((m) => m.conjuntoId === conjuntoId)

    try {
      if (!existing) {
        await createMutation.mutateAsync({
          userId: admin._id,
          conjuntoId,
          role: 'ADMIN',
        })
        toast.success('Acceso otorgado')
      } else {
        await setActiveMutation.mutateAsync({
          membershipId: existing._id,
          active: !existing.active,
        })
        toast.success(existing.active ? 'Acceso revocado' : 'Acceso reactivado')
      }
      // Invalidar para refrescar la lista del padre
      await queryClient.invalidateQueries({
        queryKey: convexQuery(api.users.queries.listAdminsByOrg, {}).queryKey,
      })
    } catch (err) {
      if (err instanceof ConvexError) {
        const data = err.data as { message?: string }
        toast.error(data.message ?? 'Error al modificar acceso')
      } else {
        toast.error('Error inesperado')
      }
    }
  }

  // Refrescar copia local cuando cambia el admin (desde la query invalidada)
  useEffect(() => {
    if (admin) setMemberships(admin.memberships)
  }, [admin?._id, admin?.memberships.length])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Gestionar accesos</DialogTitle>
          <DialogDescription>
            {admin ? (
              <>
                Selecciona los conjuntos a los que{' '}
                <strong>
                  {admin.firstName}
                  {admin.lastName ? ` ${admin.lastName}` : ''}
                </strong>{' '}
                tendrá acceso como ADMIN.
              </>
            ) : null}
          </DialogDescription>
        </DialogHeader>

        <DialogBody>
          {conjuntos.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No hay conjuntos en la organización aún.
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {conjuntos.map((c) => {
                const membership = memberships.find(
                  (m) => m.conjuntoId === c._id,
                )
                const isActive = membership?.active === true
                return (
                  <button
                    key={c._id}
                    type="button"
                    onClick={() => handleToggle(c._id)}
                    disabled={
                      createMutation.isPending || setActiveMutation.isPending
                    }
                    className={cn(
                      'flex items-center gap-3 rounded-md border px-3 py-2 text-left transition-colors',
                      isActive
                        ? 'border-primary/50 bg-primary/5'
                        : 'border-border hover:bg-accent/50',
                      'disabled:cursor-not-allowed disabled:opacity-50',
                    )}
                  >
                    <div
                      className={cn(
                        'flex h-5 w-5 shrink-0 items-center justify-center rounded border',
                        isActive
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-border',
                      )}
                    >
                      {isActive ? <Check className="h-3.5 w-3.5" /> : null}
                    </div>
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <div className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate text-sm font-medium">
                        {c.nombre}
                      </span>
                      <span className="truncate text-xs text-muted-foreground">
                        {c.direccion}, {c.ciudad}
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </DialogBody>

        <DialogFooter>
          <DialogClose render={<Button variant="outline">Cerrar</Button>} />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
