import { useMutation, useSuspenseQuery } from '@tanstack/react-query'

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

interface ManageAccessDialogProps {
  /**
   * The id of the admin whose accesses we're editing, or `null` when the
   * dialog is closed. The dialog derives the live admin + memberships
   * from the `listAdminsByOrg` query on every render, so Convex reactive
   * updates (access granted / revoked elsewhere) flow through immediately
   * without stale local state.
   */
  adminId: Id<'users'> | null
  onOpenChange: (open: boolean) => void
}

/**
 * Matriz de accesos conjunto × admin. Por cada conjunto de la org muestra
 * un checkbox que, al tick/untick, llama a `conjuntoMemberships.create`
 * (si no existe), `setActive(false)` (revoca la activa) o `setActive(true)`
 * (reactiva una soft-deleted).
 *
 * Implementation note: this dialog reads both the conjuntos list and the
 * admins list directly from `useSuspenseQuery` each render. When a
 * mutation completes, Convex pushes the updated snapshots over the
 * websocket and the dialog re-renders with fresh state — no local copy,
 * no manual invalidation. This was the source of a visual bug in the
 * earlier implementation where toggling a checkbox appeared to have no
 * effect (the selected state was pinned to a stale local snapshot of
 * `admin.memberships` taken when the dialog opened).
 */
export function ManageAccessDialog({
  adminId,
  onOpenChange,
}: ManageAccessDialogProps) {
  const open = adminId !== null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        {open ? <ManageAccessDialogBody adminId={adminId} /> : null}
      </DialogContent>
    </Dialog>
  )
}

/**
 * Body component — split so the `useSuspenseQuery` calls below only run
 * when the dialog is actually open. Otherwise we'd be subscribing to
 * both queries on every page mount.
 */
function ManageAccessDialogBody({ adminId }: { adminId: Id<'users'> }) {
  const { data: admins } = useSuspenseQuery(
    convexQuery(api.users.queries.listAdminsByOrg, {}),
  )
  const { data: conjuntos } = useSuspenseQuery(
    convexQuery(api.conjuntos.queries.listForCurrentUser, {}),
  )

  // Derive the live admin from the query. If the admin was deleted
  // (unlikely mid-flow) we render an empty state.
  const admin = admins.find((a) => a._id === adminId) ?? null

  const createFn = useConvexMutation(api.conjuntoMemberships.mutations.create)
  const createMutation = useMutation({ mutationFn: createFn })
  const setActiveFn = useConvexMutation(
    api.conjuntoMemberships.mutations.setActive,
  )
  const setActiveMutation = useMutation({ mutationFn: setActiveFn })

  const handleToggle = async (conjuntoId: Id<'conjuntos'>) => {
    if (!admin) return
    const existing = admin.memberships.find((m) => m.conjuntoId === conjuntoId)

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
      // No manual invalidation needed — Convex pushes the updated
      // listAdminsByOrg snapshot over the websocket, which flows into
      // the useSuspenseQuery above on the next render tick.
    } catch (err) {
      if (err instanceof ConvexError) {
        const data = err.data as { message?: string }
        toast.error(data.message ?? 'Error al modificar acceso')
      } else {
        toast.error('Error inesperado')
      }
    }
  }

  return (
    <>
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
        ) : !admin ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            Este administrador ya no está disponible.
          </div>
        ) : (
          <ConjuntoAccessList
            admin={admin}
            conjuntos={conjuntos}
            onToggle={handleToggle}
            isPending={createMutation.isPending || setActiveMutation.isPending}
          />
        )}
      </DialogBody>

      <DialogFooter>
        <DialogClose render={<Button variant="outline">Cerrar</Button>} />
      </DialogFooter>
    </>
  )
}

function ConjuntoAccessList({
  admin,
  conjuntos,
  onToggle,
  isPending,
}: {
  admin: Doc<'users'> & {
    memberships: Array<Doc<'conjuntoMemberships'>>
  }
  conjuntos: Array<Doc<'conjuntos'>>
  onToggle: (id: Id<'conjuntos'>) => void
  isPending: boolean
}) {
  return (
    <div className="flex flex-col gap-2">
      {conjuntos.map((c) => {
        const membership = admin.memberships.find((m) => m.conjuntoId === c._id)
        const isActive = membership?.active === true
        return (
          <button
            key={c._id}
            type="button"
            onClick={() => onToggle(c._id)}
            disabled={isPending}
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
              <span className="truncate text-sm font-medium">{c.nombre}</span>
              <span className="truncate text-xs text-muted-foreground">
                {c.direccion}, {c.ciudad}
              </span>
            </div>
          </button>
        )
      })}
    </div>
  )
}
