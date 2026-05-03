import { Suspense, useState } from 'react'

import { useMutation, useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import type { ColumnDef } from '@tanstack/react-table'

import { convexQuery, useConvexMutation } from '@convex-dev/react-query'
import { Plus, Upload } from 'lucide-react'

import {
  BulkImportDialog,
  type ImportResult,
  type ValidatedRow,
} from '#/components/admin/bulk-import-dialog'
import { VehicleDialog } from '#/components/admin/vehicles/vehicle-dialog'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { DataTable } from '#/components/ui/data-table'
import { Skeleton } from '#/components/ui/skeleton'
import { useIsComplexAdmin } from '#/lib/complex-role'
import { prefetchAuthenticatedQuery } from '#/lib/convex-loader'
import { formatPlaca } from '#/lib/formatters'
import { api } from '../../../../../../convex/_generated/api'
import type { Doc, Id } from '../../../../../../convex/_generated/dataModel'
import {
  detectPlateType,
  isValidPlate,
  normalizePlate,
} from '../../../../../../convex/lib/plate'
import type { VehicleTipo } from '../../../../../../convex/vehicles/validators'

export const Route = createFileRoute(
  '/_authenticated/c/$complexSlug/vehiculos/',
)({
  loader: async ({ context: { queryClient, complexId } }) => {
    await Promise.all([
      prefetchAuthenticatedQuery(
        queryClient,
        api.vehicles.queries.listByComplex,
        { complexId },
      ),
      prefetchAuthenticatedQuery(queryClient, api.units.queries.listByComplex, {
        complexId,
      }),
    ])
    return null
  },
  component: VehiculosPage,
})

type VehicleRow = Doc<'vehicles'> & { unit: Doc<'units'> | null }

type VehicleImportRow = {
  tower: string
  number: string
  plate: string
  type: VehicleTipo
  ownerName?: string
}

const VALID_VEHICLE_TYPES = new Set(['CAR', 'MOTORCYCLE', 'OTHER'])

function VehiculosPage() {
  const { complexId } = Route.useRouteContext()
  const isAdmin = useIsComplexAdmin()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const [editing, setEditing] = useState<VehicleRow | null>(null)

  const bulkImportFn = useConvexMutation(api.vehicles.mutations.bulkImport)
  const bulkImportMut = useMutation({ mutationFn: bulkImportFn })

  const validateVehicleRow = (
    row: Record<string, string>,
    rowIndex: number,
  ): ValidatedRow<VehicleImportRow> => {
    const tower = (row['torre'] || '').trim().toUpperCase()
    const number = (row['numero'] || '').trim()
    const plateRaw = (row['placa'] || '').trim()
    const typeRaw = (row['tipo'] || '').trim().toUpperCase()
    const ownerName = (row['propietarioNombre'] || '').trim() || undefined
    const raw = row

    if (!tower || !number) {
      return { rowIndex, valid: false, error: 'Torre y número requeridos', raw }
    }
    if (!plateRaw) {
      return { rowIndex, valid: false, error: 'Placa requerida', raw }
    }
    const plate = normalizePlate(plateRaw)
    if (!isValidPlate(plate)) {
      return {
        rowIndex,
        valid: false,
        error: `Placa inválida: ${plateRaw}`,
        raw,
      }
    }

    const detectedType = detectPlateType(plate)
    const vehicleType =
      typeRaw && VALID_VEHICLE_TYPES.has(typeRaw)
        ? (typeRaw as VehicleTipo)
        : (detectedType ?? 'CAR')

    return {
      rowIndex,
      valid: true,
      data: { tower, number, plate, type: vehicleType, ownerName },
      raw,
    }
  }

  const handleVehicleImport = async (
    rows: VehicleImportRow[],
  ): Promise<ImportResult> => {
    return await bulkImportMut.mutateAsync({ complexId, rows })
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Vehículos</h1>
          <p className="text-sm text-muted-foreground">
            Vehículos registrados en el conjunto, asociados a una unidad.
          </p>
        </div>
        {isAdmin ? (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setImportOpen(true)}>
              <Upload />
              Importar CSV
            </Button>
            <Button
              onClick={() => {
                setEditing(null)
                setDialogOpen(true)
              }}
            >
              <Plus />
              Nuevo vehículo
            </Button>
          </div>
        ) : null}
      </div>

      <Suspense fallback={<Skeleton className="h-40 w-full" />}>
        <VehiculosTable
          complexId={complexId}
          isAdmin={isAdmin}
          onEdit={(v) => {
            setEditing(v)
            setDialogOpen(true)
          }}
        />
      </Suspense>

      {isAdmin ? (
        <>
          <VehicleDialog
            open={dialogOpen}
            onOpenChange={(open) => {
              setDialogOpen(open)
              if (!open) setEditing(null)
            }}
            complexId={complexId}
            vehicle={editing}
          />
          <BulkImportDialog
            open={importOpen}
            onOpenChange={setImportOpen}
            title="Importar vehículos"
            expectedColumns={[
              'torre',
              'numero',
              'placa',
              'tipo',
              'propietarioNombre',
            ]}
            validateRow={validateVehicleRow}
            onImport={handleVehicleImport}
          />
        </>
      ) : null}
    </div>
  )
}

function VehiculosTable({
  complexId,
  isAdmin,
  onEdit,
}: {
  complexId: Id<'complexes'>
  isAdmin: boolean
  onEdit: (v: VehicleRow) => void
}) {
  const { data } = useSuspenseQuery(
    convexQuery(api.vehicles.queries.listByComplex, { complexId }),
  )

  const columns: ColumnDef<VehicleRow>[] = [
    {
      id: 'placa',
      header: 'Placa',
      accessorKey: 'plate',
      cell: ({ row }) => (
        <span className="font-mono font-medium">
          {formatPlaca(row.original.plate)}
        </span>
      ),
    },
    {
      id: 'tipo',
      header: 'Tipo',
      accessorKey: 'type',
      cell: ({ row }) => (
        <Badge variant="outline">
          {
            { CAR: 'Carro', MOTORCYCLE: 'Moto', OTHER: 'Otro' }[
              row.original.type
            ]
          }
        </Badge>
      ),
    },
    {
      id: 'unidad',
      header: 'Unidad',
      accessorFn: (v) => (v.unit ? `${v.unit.tower}-${v.unit.number}` : ''),
      cell: ({ row }) =>
        row.original.unit
          ? `${row.original.unit.tower}-${row.original.unit.number}`
          : '—',
    },
    {
      id: 'propietario',
      header: 'Propietario',
      accessorFn: (v) => v.ownerName ?? '',
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">
          {row.original.ownerName ?? '—'}
        </span>
      ),
    },
    {
      id: 'estado',
      header: 'Estado',
      accessorFn: (v) => (v.active ? 'Activo' : 'Inactivo'),
      cell: ({ row }) =>
        row.original.active ? (
          <Badge variant="outline">Activo</Badge>
        ) : (
          <Badge variant="secondary">Inactivo</Badge>
        ),
    },
    ...(isAdmin
      ? [
          {
            id: 'acciones',
            header: () => <span className="sr-only">Acciones</span>,
            enableSorting: false,
            meta: {
              headClassName: 'text-right',
              cellClassName: 'text-right',
            },
            cell: ({ row }: { row: { original: VehicleRow } }) => (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(row.original)}
              >
                Editar
              </Button>
            ),
          } satisfies ColumnDef<VehicleRow>,
        ]
      : []),
  ]

  return (
    <DataTable
      columns={columns}
      data={data as VehicleRow[]}
      emptyMessage={
        isAdmin
          ? 'No hay vehículos registrados. Crea el primero con "Nuevo vehículo".'
          : 'No hay vehículos registrados.'
      }
    />
  )
}
