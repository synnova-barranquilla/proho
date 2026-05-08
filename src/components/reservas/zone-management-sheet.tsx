import { useCallback, useMemo, useState } from 'react'

import { useMutation, useSuspenseQuery } from '@tanstack/react-query'

import { convexQuery, useConvexMutation } from '@convex-dev/react-query'
import { ConvexError } from 'convex/values'
import { toast } from 'sonner'

import { Button } from '#/components/ui/button'
import { Field, FieldGroup, FieldLabel } from '#/components/ui/field'
import { Input } from '#/components/ui/input'
import { NumberInput } from '#/components/ui/number-input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '#/components/ui/sheet'
import { Switch } from '#/components/ui/switch'
import { api } from '../../../convex/_generated/api'
import type { Id } from '../../../convex/_generated/dataModel'
import {
  DAY_LABELS as SHARED_DAY_LABELS,
  ZONE_COLORS,
  type DayKey,
  type WeekdayAvailability,
} from '../../../convex/socialZones/validators'
import { formatTime12h } from './availability-utils'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ZoneManagementSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  complexId: Id<'complexes'>
}

type Tab = 'zones' | 'blocks'

interface ZoneFormState {
  name: string
  blockDurationMinutes: number
  maxConsecutiveBlocks: number
  weekdayAvailability: WeekdayAvailability
  depositAmount: number | null
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const DAY_ORDER: DayKey[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']

function generateTimeOptions(): Array<{ value: number; label: string }> {
  const options: Array<{ value: number; label: string }> = []
  for (let minutes = 0; minutes <= 23 * 60 + 30; minutes += 30) {
    options.push({ value: minutes, label: formatTime12h(minutes) })
  }
  return options
}

const TIME_OPTIONS = generateTimeOptions()

function handleConvexError(err: unknown, fallbackMsg: string) {
  if (err instanceof ConvexError) {
    const data = err.data as { code?: string; message?: string }
    toast.error(data.message ?? fallbackMsg)
  } else {
    toast.error(fallbackMsg)
  }
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function ZoneManagementSheet({
  open,
  onOpenChange,
  complexId,
}: ZoneManagementSheetProps) {
  const [tab, setTab] = useState<Tab>('zones')

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Gestión de zonas sociales</SheetTitle>
          {/* Tab toggle */}
          <div className="mt-2 flex gap-1 rounded-lg bg-muted p-1">
            <button
              type="button"
              className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                tab === 'zones'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => setTab('zones')}
            >
              Zonas
            </button>
            <button
              type="button"
              className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                tab === 'blocks'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => setTab('blocks')}
            >
              Bloqueos
            </button>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-4">
          {tab === 'zones' ? (
            <ZonesSection complexId={complexId} />
          ) : (
            <BlocksSection complexId={complexId} />
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}

// ===========================================================================
// Section 1: Zones CRUD
// ===========================================================================

function ZonesSection({ complexId }: { complexId: Id<'complexes'> }) {
  const { data: zones } = useSuspenseQuery(
    convexQuery(api.socialZones.queries.listByComplex, { complexId }),
  )

  const [editingId, setEditingId] = useState<Id<'socialZones'> | null>(null)
  const [showCreate, setShowCreate] = useState(false)

  return (
    <div className="flex flex-col gap-3">
      {zones.map((zone) => {
        const color = ZONE_COLORS[zone.colorIndex % ZONE_COLORS.length]
        if (editingId === zone._id) {
          return (
            <ZoneEditForm
              key={zone._id}
              zone={zone}
              onClose={() => setEditingId(null)}
            />
          )
        }
        return (
          <ZoneCard
            key={zone._id}
            zone={zone}
            color={color}
            onEdit={() => setEditingId(zone._id)}
          />
        )
      })}

      {showCreate ? (
        <ZoneCreateForm
          complexId={complexId}
          onClose={() => setShowCreate(false)}
        />
      ) : (
        <Button
          variant="outline"
          className="w-full"
          onClick={() => setShowCreate(true)}
        >
          Agregar zona
        </Button>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Zone card (read-only view)
// ---------------------------------------------------------------------------

function ZoneCard({
  zone,
  color,
  onEdit,
}: {
  zone: {
    _id: Id<'socialZones'>
    name: string
    blockDurationMinutes: number
    maxConsecutiveBlocks: number
    isPlatformDefault: boolean
    active: boolean
  }
  color: (typeof ZONE_COLORS)[number]
  onEdit: () => void
}) {
  const updateFn = useConvexMutation(api.socialZones.mutations.updateZone)
  const updateMutation = useMutation({ mutationFn: updateFn })

  const handleToggleActive = useCallback(
    async (checked: boolean) => {
      try {
        await updateMutation.mutateAsync({
          zoneId: zone._id,
          active: checked,
        })
        toast.success(checked ? 'Zona activada' : 'Zona desactivada')
      } catch (err) {
        handleConvexError(err, 'Error al cambiar estado de la zona')
      }
    },
    [updateMutation, zone._id],
  )

  return (
    <div className="flex flex-col gap-2 rounded-lg border p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span
            className={`inline-block size-3 rounded-full ${color.border} ${color.bg}`}
          />
          <span className="text-sm font-medium">{zone.name}</span>
          {zone.isPlatformDefault && (
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
              Predeterminada
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Switch
            size="sm"
            checked={zone.active}
            onCheckedChange={handleToggleActive}
            disabled={updateMutation.isPending}
          />
          <Button variant="ghost" size="xs" onClick={onEdit}>
            Editar
          </Button>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        Bloques de {zone.blockDurationMinutes}min &middot; Máx{' '}
        {zone.maxConsecutiveBlocks} consecutivos
      </p>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Zone edit form (inline)
// ---------------------------------------------------------------------------

function ZoneEditForm({
  zone,
  onClose,
}: {
  zone: {
    _id: Id<'socialZones'>
    name: string
    blockDurationMinutes: number
    maxConsecutiveBlocks: number
    weekdayAvailability: WeekdayAvailability
    depositAmount?: number
  }
  onClose: () => void
}) {
  const [form, setForm] = useState<ZoneFormState>({
    name: zone.name,
    blockDurationMinutes: zone.blockDurationMinutes,
    maxConsecutiveBlocks: zone.maxConsecutiveBlocks,
    weekdayAvailability: { ...zone.weekdayAvailability },
    depositAmount: zone.depositAmount ?? null,
  })

  const updateFn = useConvexMutation(api.socialZones.mutations.updateZone)
  const updateMutation = useMutation({ mutationFn: updateFn })

  const handleSave = useCallback(async () => {
    try {
      await updateMutation.mutateAsync({
        zoneId: zone._id,
        name: form.name,
        blockDurationMinutes: form.blockDurationMinutes,
        maxConsecutiveBlocks: form.maxConsecutiveBlocks,
        weekdayAvailability: form.weekdayAvailability,
        depositAmount: form.depositAmount ?? undefined,
      })
      toast.success('Zona actualizada')
      onClose()
    } catch (err) {
      handleConvexError(err, 'Error al actualizar zona')
    }
  }, [updateMutation, zone._id, form, onClose])

  return (
    <div className="flex flex-col gap-3 rounded-lg border bg-muted/30 p-3">
      <FieldGroup>
        <Field>
          <FieldLabel>Nombre</FieldLabel>
          <Input
            value={form.name}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, name: e.target.value }))
            }
          />
        </Field>

        <Field>
          <FieldLabel>Duración de bloque</FieldLabel>
          <Select
            value={String(form.blockDurationMinutes)}
            onValueChange={(val) =>
              setForm((prev) => ({
                ...prev,
                blockDurationMinutes: Number(val),
              }))
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="30">30 minutos</SelectItem>
              <SelectItem value="60">60 minutos</SelectItem>
            </SelectContent>
          </Select>
        </Field>

        <Field>
          <FieldLabel>Máx. bloques consecutivos</FieldLabel>
          <NumberInput
            value={form.maxConsecutiveBlocks}
            onChange={(v) =>
              setForm((prev) => ({
                ...prev,
                maxConsecutiveBlocks: v ?? 1,
              }))
            }
            min={1}
            max={12}
          />
        </Field>

        <Field>
          <FieldLabel>Depósito (opcional)</FieldLabel>
          <NumberInput
            value={form.depositAmount}
            onChange={(v) => setForm((prev) => ({ ...prev, depositAmount: v }))}
            min={0}
            placeholder="Sin depósito"
            format={{
              style: 'currency',
              currency: 'COP',
              maximumFractionDigits: 0,
            }}
          />
        </Field>

        {/* Weekday availability */}
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium">Disponibilidad semanal</span>
          {DAY_ORDER.map((day) => (
            <WeekdayRow
              key={day}
              day={day}
              slot={form.weekdayAvailability[day]}
              onChange={(slot) =>
                setForm((prev) => ({
                  ...prev,
                  weekdayAvailability: {
                    ...prev.weekdayAvailability,
                    [day]: slot,
                  },
                }))
              }
            />
          ))}
        </div>
      </FieldGroup>

      <div className="flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={onClose}>
          Cancelar
        </Button>
        <Button
          size="sm"
          onClick={handleSave}
          disabled={updateMutation.isPending || !form.name.trim()}
        >
          {updateMutation.isPending ? 'Guardando...' : 'Guardar'}
        </Button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Weekday availability row
// ---------------------------------------------------------------------------

function WeekdayRow({
  day,
  slot,
  onChange,
}: {
  day: DayKey
  slot: { start: number; end: number } | null
  onChange: (slot: { start: number; end: number } | null) => void
}) {
  const isClosed = slot === null

  return (
    <div className="flex items-center gap-2">
      <span className="w-10 text-xs font-medium">{SHARED_DAY_LABELS[day]}</span>
      <Switch
        size="sm"
        checked={!isClosed}
        onCheckedChange={(checked) => {
          if (checked) {
            onChange({ start: 420, end: 1320 })
          } else {
            onChange(null)
          }
        }}
      />
      {isClosed ? (
        <span className="text-xs text-muted-foreground">Cerrado</span>
      ) : (
        <div className="flex items-center gap-1">
          <Select
            value={String(slot.start)}
            onValueChange={(val) => onChange({ ...slot, start: Number(val) })}
          >
            <SelectTrigger size="sm" className="w-[72px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TIME_OPTIONS.filter((t) => t.value < slot.end).map((t) => (
                <SelectItem key={t.value} value={String(t.value)}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-xs text-muted-foreground">a</span>
          <Select
            value={String(slot.end)}
            onValueChange={(val) => onChange({ ...slot, end: Number(val) })}
          >
            <SelectTrigger size="sm" className="w-[72px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TIME_OPTIONS.filter((t) => t.value > slot.start).map((t) => (
                <SelectItem key={t.value} value={String(t.value)}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Zone create form
// ---------------------------------------------------------------------------

function ZoneCreateForm({
  complexId,
  onClose,
}: {
  complexId: Id<'complexes'>
  onClose: () => void
}) {
  const [name, setName] = useState('')
  const [blockDurationMinutes, setBlockDurationMinutes] = useState(60)
  const [maxConsecutiveBlocks, setMaxConsecutiveBlocks] = useState(4)

  const createFn = useConvexMutation(api.socialZones.mutations.createZone)
  const createMutation = useMutation({ mutationFn: createFn })

  const handleCreate = useCallback(async () => {
    try {
      await createMutation.mutateAsync({
        complexId,
        name: name.trim(),
        blockDurationMinutes,
        maxConsecutiveBlocks,
      })
      toast.success('Zona creada')
      onClose()
    } catch (err) {
      handleConvexError(err, 'Error al crear zona')
    }
  }, [
    createMutation,
    complexId,
    name,
    blockDurationMinutes,
    maxConsecutiveBlocks,
    onClose,
  ])

  return (
    <div className="flex flex-col gap-3 rounded-lg border bg-muted/30 p-3">
      <span className="text-sm font-medium">Nueva zona</span>
      <FieldGroup>
        <Field>
          <FieldLabel>Nombre</FieldLabel>
          <Input
            placeholder="Ej: Terraza"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </Field>

        <Field>
          <FieldLabel>Duración de bloque</FieldLabel>
          <Select
            value={String(blockDurationMinutes)}
            onValueChange={(val) => setBlockDurationMinutes(Number(val))}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="30">30 minutos</SelectItem>
              <SelectItem value="60">60 minutos</SelectItem>
            </SelectContent>
          </Select>
        </Field>

        <Field>
          <FieldLabel>Máx. bloques consecutivos</FieldLabel>
          <NumberInput
            value={maxConsecutiveBlocks}
            onChange={(v) => setMaxConsecutiveBlocks(v ?? 1)}
            min={1}
            max={12}
          />
        </Field>
      </FieldGroup>

      <div className="flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={onClose}>
          Cancelar
        </Button>
        <Button
          size="sm"
          onClick={handleCreate}
          disabled={createMutation.isPending || !name.trim()}
        >
          {createMutation.isPending ? 'Creando...' : 'Crear zona'}
        </Button>
      </div>
    </div>
  )
}

// ===========================================================================
// Section 2: Date Blocking
// ===========================================================================

function BlocksSection({ complexId }: { complexId: Id<'complexes'> }) {
  const { data: zones } = useSuspenseQuery(
    convexQuery(api.socialZones.queries.listByComplex, { complexId }),
  )

  // Build a broad date range to fetch existing blocks (next 8 weeks)
  const weekDates = useMemo(() => {
    const dates: string[] = []
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    for (let i = 0; i < 56; i++) {
      const d = new Date(today)
      d.setDate(d.getDate() + i)
      dates.push(d.toISOString().slice(0, 10))
    }
    return dates
  }, [])

  const { data: existingBlocks } = useSuspenseQuery(
    convexQuery(api.socialZones.queries.getDateBlocks, {
      complexId,
      weekDates,
    }),
  )

  const zoneMap = useMemo(() => new Map(zones.map((z) => [z._id, z])), [zones])

  // Block creation state
  const [blockDate, setBlockDate] = useState('')
  const [blockZoneId, setBlockZoneId] = useState<string>('all')
  const [blockReason, setBlockReason] = useState('')
  const [previewCount, setPreviewCount] = useState<number | null>(null)
  const [previewBookingIds, setPreviewBookingIds] = useState<
    Id<'socialZoneBookings'>[]
  >([])

  const previewFn = useConvexMutation(api.socialZones.mutations.getBlockPreview)
  const previewMutation = useMutation({ mutationFn: previewFn })

  const confirmFn = useConvexMutation(
    api.socialZones.mutations.confirmBlockDate,
  )
  const confirmMutation = useMutation({ mutationFn: confirmFn })

  const removeFn = useConvexMutation(api.socialZones.mutations.removeBlockDate)
  const removeMutation = useMutation({ mutationFn: removeFn })

  const handlePreview = useCallback(async () => {
    if (!blockDate) return
    try {
      const result = await previewMutation.mutateAsync({
        complexId,
        date: blockDate,
        zoneId:
          blockZoneId === 'all'
            ? undefined
            : (blockZoneId as Id<'socialZones'>),
      })
      setPreviewCount(result.count)
      setPreviewBookingIds(
        result.affectedBookings.map(
          (b: { _id: Id<'socialZoneBookings'> }) => b._id,
        ),
      )
    } catch (err) {
      handleConvexError(err, 'Error al obtener vista previa')
    }
  }, [previewMutation, complexId, blockDate, blockZoneId])

  const handleConfirm = useCallback(async () => {
    if (!blockDate) return
    try {
      await confirmMutation.mutateAsync({
        complexId,
        date: blockDate,
        zoneId:
          blockZoneId === 'all'
            ? undefined
            : (blockZoneId as Id<'socialZones'>),
        reason: blockReason || undefined,
        cancelBookingIds: previewBookingIds,
      })
      toast.success('Fecha bloqueada')
      setBlockDate('')
      setBlockZoneId('all')
      setBlockReason('')
      setPreviewCount(null)
      setPreviewBookingIds([])
    } catch (err) {
      handleConvexError(err, 'Error al bloquear fecha')
    }
  }, [
    confirmMutation,
    complexId,
    blockDate,
    blockZoneId,
    blockReason,
    previewBookingIds,
  ])

  const handleRemoveBlock = useCallback(
    async (blockId: Id<'socialZoneDateBlocks'>) => {
      try {
        await removeMutation.mutateAsync({ blockId })
        toast.success('Bloqueo eliminado')
      } catch (err) {
        handleConvexError(err, 'Error al eliminar bloqueo')
      }
    },
    [removeMutation],
  )

  return (
    <div className="flex flex-col gap-4">
      {/* Create block */}
      <div className="flex flex-col gap-3 rounded-lg border p-3">
        <span className="text-sm font-medium">Nuevo bloqueo</span>
        <FieldGroup>
          <Field>
            <FieldLabel>Fecha</FieldLabel>
            <Input
              type="date"
              value={blockDate}
              onChange={(e) => {
                setBlockDate(e.target.value)
                setPreviewCount(null)
              }}
            />
          </Field>

          <Field>
            <FieldLabel>Zona</FieldLabel>
            <Select
              value={blockZoneId}
              onValueChange={(val) => {
                setBlockZoneId(val ?? 'all')
                setPreviewCount(null)
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las zonas</SelectItem>
                {zones.map((z) => (
                  <SelectItem key={z._id} value={z._id}>
                    {z.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field>
            <FieldLabel>Razón (opcional)</FieldLabel>
            <Input
              placeholder="Ej: Mantenimiento"
              value={blockReason}
              onChange={(e) => setBlockReason(e.target.value)}
            />
          </Field>
        </FieldGroup>

        {previewCount !== null && previewCount > 0 && (
          <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            Se cancelarán {previewCount} reservas existentes
          </div>
        )}

        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePreview}
            disabled={!blockDate || previewMutation.isPending}
          >
            {previewMutation.isPending ? 'Consultando...' : 'Vista previa'}
          </Button>
          {previewCount !== null && (
            <Button
              size="sm"
              onClick={handleConfirm}
              disabled={confirmMutation.isPending}
            >
              {confirmMutation.isPending
                ? 'Bloqueando...'
                : 'Confirmar bloqueo'}
            </Button>
          )}
        </div>
      </div>

      {/* Existing blocks list */}
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium">Bloqueos existentes</span>
        {existingBlocks.length === 0 && (
          <p className="text-xs text-muted-foreground">
            No hay bloqueos configurados.
          </p>
        )}
        {existingBlocks.map((block) => {
          const zone = block.zoneId ? zoneMap.get(block.zoneId) : null
          return (
            <div
              key={block._id}
              className="flex items-center justify-between rounded-lg border px-3 py-2"
            >
              <div className="flex flex-col gap-0.5">
                <span className="text-sm">
                  {block.date} &middot; {zone ? zone.name : 'Todas las zonas'}
                </span>
                {block.reason && (
                  <span className="text-xs text-muted-foreground">
                    {block.reason}
                  </span>
                )}
              </div>
              <Button
                variant="destructive"
                size="xs"
                onClick={() =>
                  handleRemoveBlock(block._id as Id<'socialZoneDateBlocks'>)
                }
                disabled={removeMutation.isPending}
              >
                Eliminar
              </Button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
