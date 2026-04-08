import { Suspense, useState } from 'react'

import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'

import { convexQuery } from '@convex-dev/react-query'
import { Plus } from 'lucide-react'

import { ResidenteDialog } from '#/components/admin/residentes/residente-dialog'
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
import { prefetchAuthenticatedQuery } from '#/lib/convex-loader'
import { api } from '../../../../../../../convex/_generated/api'
import type { Doc, Id } from '../../../../../../../convex/_generated/dataModel'

export const Route = createFileRoute(
  '/_authenticated/admin/c/$conjuntoId/residentes/',
)({
  loader: async ({ context: { queryClient }, params }) => {
    const conjuntoId = params.conjuntoId as Id<'conjuntos'>
    await Promise.all([
      prefetchAuthenticatedQuery(
        queryClient,
        api.residentes.queries.listByConjunto,
        { conjuntoId },
      ),
      prefetchAuthenticatedQuery(
        queryClient,
        api.unidades.queries.listByConjunto,
        { conjuntoId },
      ),
    ])
    return null
  },
  component: ResidentesPage,
})

type ResidenteRow = Doc<'residentes'> & { unidad: Doc<'unidades'> | null }

function ResidentesPage() {
  const { conjuntoId } = Route.useParams()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<ResidenteRow | null>(null)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Residentes</h1>
          <p className="text-sm text-muted-foreground">
            Personas vinculadas a las unidades del conjunto.
          </p>
        </div>
        <Button
          onClick={() => {
            setEditing(null)
            setDialogOpen(true)
          }}
        >
          <Plus />
          Nuevo residente
        </Button>
      </div>

      <Suspense fallback={<Skeleton className="h-40 w-full" />}>
        <ResidentesTable
          conjuntoId={conjuntoId as Id<'conjuntos'>}
          onEdit={(r) => {
            setEditing(r)
            setDialogOpen(true)
          }}
        />
      </Suspense>

      <ResidenteDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) setEditing(null)
        }}
        conjuntoId={conjuntoId as Id<'conjuntos'>}
        residente={editing}
      />
    </div>
  )
}

function ResidentesTable({
  conjuntoId,
  onEdit,
}: {
  conjuntoId: Id<'conjuntos'>
  onEdit: (r: ResidenteRow) => void
}) {
  const { data: residentes } = useSuspenseQuery(
    convexQuery(api.residentes.queries.listByConjunto, { conjuntoId }),
  )

  if (residentes.length === 0) {
    return (
      <div className="rounded-md border border-dashed py-12 text-center text-sm text-muted-foreground">
        No hay residentes. Crea el primero con el botón "Nuevo residente".
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nombre</TableHead>
          <TableHead>Documento</TableHead>
          <TableHead>Unidad</TableHead>
          <TableHead>Tipo</TableHead>
          <TableHead>Contacto</TableHead>
          <TableHead className="text-right">Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {residentes.map((r) => (
          <TableRow key={r._id}>
            <TableCell className="font-medium">
              {r.nombres} {r.apellidos}
            </TableCell>
            <TableCell className="text-xs">
              {r.tipoDocumento} {r.numeroDocumento}
            </TableCell>
            <TableCell>
              {r.unidad ? `${r.unidad.torre}-${r.unidad.numero}` : '—'}
            </TableCell>
            <TableCell>
              <Badge variant="outline" className="text-xs">
                {r.tipo}
              </Badge>
            </TableCell>
            <TableCell className="text-xs text-muted-foreground">
              {r.telefono || r.email || '—'}
            </TableCell>
            <TableCell className="text-right">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(r as ResidenteRow)}
              >
                Editar
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
