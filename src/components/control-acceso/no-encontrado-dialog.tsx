import { useState } from 'react'

import { useMutation, useSuspenseQuery } from '@tanstack/react-query'

import { convexQuery, useConvexMutation } from '@convex-dev/react-query'
import { ConvexError } from 'convex/values'
import { Building2, Car, CircleHelp, UserRound } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '#/components/ui/button'
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '#/components/ui/dialog'
import { SearchableSelect } from '#/components/ui/searchable-select'
import { formatPlaca } from '#/lib/formatters'
import { buildUnidadOptions } from '#/lib/unidad-search'
import { api } from '../../../convex/_generated/api'
import type { Id } from '../../../convex/_generated/dataModel'
import { RegistrarResidenteSheet } from './registrar-residente-sheet'

type SubScreen = 'OPTIONS' | 'VISITANTE' | 'RESIDENTE'

interface NoEncontradoDialogProps {
  open: boolean
  onClose: () => void
  conjuntoId: Id<'conjuntos'>
  placa: string
  placaRaw: string
}

export function NoEncontradoDialog({
  open,
  onClose,
  conjuntoId,
  placa,
  placaRaw,
}: NoEncontradoDialogProps) {
  const [subScreen, setSubScreen] = useState<SubScreen>('OPTIONS')
  const [selectedUnidadId, setSelectedUnidadId] = useState<string>('')
  const { data: unidadesData } = useSuspenseQuery(
    convexQuery(api.unidades.queries.listByConjunto, { conjuntoId }),
  )
  const unidades = unidadesData.torres.flatMap((t) => t.unidades)
  const unidadOptions = buildUnidadOptions(unidades)

  const registrarVisitanteFn = useConvexMutation(
    api.registrosAcceso.mutations.registrarVisitante,
  )
  const registrarVisitanteMut = useMutation({
    mutationFn: registrarVisitanteFn,
  })

  const handleVisitaAdmin = async () => {
    try {
      await registrarVisitanteMut.mutateAsync({
        conjuntoId,
        placaRaw,
        tipo: 'VISITA_ADMIN',
      })
      toast.success('Visita administrativa registrada')
      onClose()
    } catch (err) {
      if (err instanceof ConvexError) {
        const d = err.data as { message?: string }
        toast.error(d.message ?? 'Error')
      } else {
        toast.error('Error inesperado')
      }
    }
  }

  const handleVisitante = async () => {
    if (!selectedUnidadId) {
      toast.error('Selecciona una unidad de destino')
      return
    }
    try {
      await registrarVisitanteMut.mutateAsync({
        conjuntoId,
        placaRaw,
        tipo: 'VISITANTE',
        unidadId: selectedUnidadId as Id<'unidades'>,
      })
      toast.success('Visitante registrado')
      onClose()
    } catch (err) {
      if (err instanceof ConvexError) {
        const d = err.data as { message?: string }
        toast.error(d.message ?? 'Error')
      } else {
        toast.error('Error inesperado')
      }
    }
  }

  const isPending = registrarVisitanteMut.isPending

  const dialogOpen = open && subScreen !== 'RESIDENTE'
  const sheetOpen = open && subScreen === 'RESIDENTE'

  return (
    <>
      <Dialog
        open={dialogOpen}
        onOpenChange={(o) => {
          if (!o) {
            setSubScreen('OPTIONS')
            setSelectedUnidadId('')
            onClose()
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2 text-blue-600">
              <CircleHelp className="h-6 w-6" />
              <DialogTitle>Vehículo no registrado</DialogTitle>
            </div>
            <p className="mt-1 font-mono text-lg font-medium">
              {formatPlaca(placa)}
            </p>
          </DialogHeader>
          <DialogBody>
            {subScreen === 'OPTIONS' && (
              <div className="flex flex-col gap-3">
                <button
                  type="button"
                  className="flex min-h-14 items-center gap-3 rounded-lg border p-4 text-left transition-colors hover:bg-muted/50"
                  onClick={() => setSubScreen('VISITANTE')}
                >
                  <UserRound className="h-6 w-6 shrink-0 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Visitante</p>
                    <p className="text-sm text-muted-foreground">
                      Visita a una unidad específica
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  className="flex min-h-14 items-center gap-3 rounded-lg border p-4 text-left transition-colors hover:bg-muted/50"
                  onClick={handleVisitaAdmin}
                  disabled={isPending}
                >
                  <Building2 className="h-6 w-6 shrink-0 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Visita administrativa</p>
                    <p className="text-sm text-muted-foreground">
                      Proveedor, domicilio, etc.
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  className="flex min-h-14 items-center gap-3 rounded-lg border p-4 text-left transition-colors hover:bg-muted/50"
                  onClick={() => setSubScreen('RESIDENTE')}
                >
                  <Car className="h-6 w-6 shrink-0 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Registrar como residente</p>
                    <p className="text-sm text-muted-foreground">
                      Agregar vehículo permanente a una unidad
                    </p>
                  </div>
                </button>
              </div>
            )}

            {subScreen === 'VISITANTE' && (
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium">
                    Unidad de destino
                  </label>
                  <SearchableSelect
                    value={selectedUnidadId}
                    onValueChange={setSelectedUnidadId}
                    options={unidadOptions}
                    placeholder="Selecciona una unidad"
                    searchPlaceholder="Buscar por torre o número..."
                  />
                </div>
              </div>
            )}
          </DialogBody>
          <DialogFooter>
            {subScreen === 'OPTIONS' && (
              <Button variant="outline" onClick={onClose}>
                Cancelar
              </Button>
            )}
            {subScreen === 'VISITANTE' && (
              <>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSubScreen('OPTIONS')
                    setSelectedUnidadId('')
                  }}
                  disabled={isPending}
                >
                  Atrás
                </Button>
                <Button
                  onClick={handleVisitante}
                  disabled={isPending || !selectedUnidadId}
                >
                  {isPending ? 'Registrando...' : 'Confirmar visitante'}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <RegistrarResidenteSheet
        open={sheetOpen}
        onClose={() => setSubScreen('OPTIONS')}
        onSuccess={() => {
          setSubScreen('OPTIONS')
          onClose()
        }}
        conjuntoId={conjuntoId}
        placa={placa}
        placaRaw={placaRaw}
      />
    </>
  )
}
