import { useEffect, useState } from 'react'

import { useMutation, useSuspenseQuery } from '@tanstack/react-query'

import { convexQuery, useConvexMutation } from '@convex-dev/react-query'
import { ConvexError } from 'convex/values'
import { toast } from 'sonner'

import { Button } from '#/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '#/components/ui/card'
import { Input } from '#/components/ui/input'
import { Switch } from '#/components/ui/switch'
import { Textarea } from '#/components/ui/textarea'
import { api } from '../../../convex/_generated/api'
import type { Id } from '../../../convex/_generated/dataModel'
import { defaultBusinessHours } from '../../../convex/complexConfig/validators'

// --- Types ---

type DayKey = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun'

interface DaySchedule {
  start: number
  end: number
  open: boolean
}

type BusinessHours = Record<DayKey, DaySchedule>

// --- Helpers ---

const DAY_ORDER: { key: DayKey; label: string }[] = [
  { key: 'mon', label: 'Lunes' },
  { key: 'tue', label: 'Martes' },
  { key: 'wed', label: 'Miércoles' },
  { key: 'thu', label: 'Jueves' },
  { key: 'fri', label: 'Viernes' },
  { key: 'sat', label: 'Sábado' },
  { key: 'sun', label: 'Domingo' },
]

function minutesToHHMM(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

function hhmmToMinutes(hhmm: string): number {
  const parts = hhmm.split(':').map(Number)
  return (parts[0] || 0) * 60 + (parts[1] || 0)
}

function hoursAreEqual(a: BusinessHours, b: BusinessHours): boolean {
  for (const { key } of DAY_ORDER) {
    const da = a[key]
    const db = b[key]
    if (da.start !== db.start || da.end !== db.end || da.open !== db.open) {
      return false
    }
  }
  return true
}

// --- Props ---

interface CommsConfigPageProps {
  complexId: Id<'complexes'>
}

// --- Component ---

export function CommsConfigPage({ complexId }: CommsConfigPageProps) {
  const { data: config } = useSuspenseQuery(
    convexQuery(api.complexConfig.queries.getByComplex, { complexId }),
  )

  // ---- Regulations state ----
  const [regulations, setRegulations] = useState(config?.regulations ?? '')

  useEffect(() => {
    setRegulations(config?.regulations ?? '')
  }, [config?.regulations])

  const updateRegFn = useConvexMutation(
    api.complexConfig.mutations.updateRegulations,
  )
  const updateRegMut = useMutation({ mutationFn: updateRegFn })

  const regDirty = regulations !== (config?.regulations ?? '')

  const handleSaveRegulations = async () => {
    try {
      await updateRegMut.mutateAsync({ complexId, regulations })
      toast.success('Normativas guardadas')
    } catch (err) {
      if (err instanceof ConvexError) {
        const d = err.data as { message?: string }
        toast.error(d.message ?? 'Error al guardar')
      } else {
        toast.error('Error inesperado')
      }
    }
  }

  // ---- Business hours state ----
  const serverHours: BusinessHours =
    (config?.businessHours as BusinessHours | undefined) ?? defaultBusinessHours

  const [hours, setHours] = useState<BusinessHours>(serverHours)

  useEffect(() => {
    const next =
      (config?.businessHours as BusinessHours | undefined) ??
      defaultBusinessHours
    setHours(next)
  }, [config?.businessHours])

  const updateHoursFn = useConvexMutation(
    api.complexConfig.mutations.updateBusinessHours,
  )
  const updateHoursMut = useMutation({ mutationFn: updateHoursFn })

  const hoursDirty = !hoursAreEqual(hours, serverHours)

  const setDayField = (
    day: DayKey,
    field: keyof DaySchedule,
    value: boolean | number,
  ) => {
    setHours((prev) => ({
      ...prev,
      [day]: { ...prev[day], [field]: value },
    }))
  }

  const handleSaveHours = async () => {
    try {
      await updateHoursMut.mutateAsync({ complexId, businessHours: hours })
      toast.success('Horario guardado')
    } catch (err) {
      if (err instanceof ConvexError) {
        const d = err.data as { message?: string }
        toast.error(d.message ?? 'Error al guardar')
      } else {
        toast.error('Error inesperado')
      }
    }
  }

  return (
    <div className="space-y-6">
      {/* Section 1: Normativas */}
      <Card>
        <CardHeader>
          <CardTitle>Normativas del Conjunto</CardTitle>
          <CardDescription>
            Información que el asistente virtual usará como contexto para
            responder a los residentes.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            rows={10}
            placeholder="Ej: El horario de la piscina es de 8am a 6pm de lunes a sábado..."
            value={regulations}
            onChange={(e) => setRegulations(e.target.value)}
          />
          <Button
            onClick={handleSaveRegulations}
            disabled={updateRegMut.isPending || !regDirty}
          >
            {updateRegMut.isPending ? 'Guardando...' : 'Guardar'}
          </Button>
        </CardContent>
      </Card>

      {/* Section 2: Business hours */}
      <Card>
        <CardHeader>
          <CardTitle>Horario de atención</CardTitle>
          <CardDescription>
            Configura los días y horarios en que el equipo administrativo está
            disponible.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            {DAY_ORDER.map(({ key, label }) => {
              const day = hours[key]
              return (
                <div key={key} className="flex items-center gap-4">
                  <span className="w-24 text-sm font-medium">{label}</span>
                  <Switch
                    checked={day.open}
                    onCheckedChange={(checked: boolean) =>
                      setDayField(key, 'open', checked)
                    }
                    aria-label={`${label} ${day.open ? 'abierto' : 'cerrado'}`}
                  />
                  <Input
                    type="time"
                    className="w-32"
                    value={minutesToHHMM(day.start)}
                    disabled={!day.open}
                    onChange={(e) =>
                      setDayField(key, 'start', hhmmToMinutes(e.target.value))
                    }
                    aria-label={`${label} hora inicio`}
                  />
                  <span className="text-sm text-muted-foreground">a</span>
                  <Input
                    type="time"
                    className="w-32"
                    value={minutesToHHMM(day.end)}
                    disabled={!day.open}
                    onChange={(e) =>
                      setDayField(key, 'end', hhmmToMinutes(e.target.value))
                    }
                    aria-label={`${label} hora fin`}
                  />
                </div>
              )
            })}
          </div>
          <Button
            onClick={handleSaveHours}
            disabled={updateHoursMut.isPending || !hoursDirty}
          >
            {updateHoursMut.isPending ? 'Guardando...' : 'Guardar'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
