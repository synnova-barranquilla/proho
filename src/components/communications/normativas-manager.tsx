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
import { Textarea } from '#/components/ui/textarea'
import { api } from '../../../convex/_generated/api'
import type { Id } from '../../../convex/_generated/dataModel'

interface NormativasManagerProps {
  complexId: Id<'complexes'>
}

export function NormativasManager({ complexId }: NormativasManagerProps) {
  const { data: config } = useSuspenseQuery(
    convexQuery(api.complexConfig.queries.getByComplex, { complexId }),
  )

  const [regulations, setRegulations] = useState(config?.regulations ?? '')

  // Sync from server when config changes
  useEffect(() => {
    setRegulations(config?.regulations ?? '')
  }, [config?.regulations])

  const updateFn = useConvexMutation(
    api.complexConfig.mutations.updateRegulations,
  )
  const updateMut = useMutation({ mutationFn: updateFn })

  const isDirty = regulations !== (config?.regulations ?? '')

  const handleSave = async () => {
    try {
      await updateMut.mutateAsync({ complexId, regulations })
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Normativas del Conjunto</CardTitle>
        <CardDescription>
          Escribe aqui las reglas, horarios, politicas y cualquier informacion
          que quieras que el asistente virtual use para responder a los
          residentes.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea
          rows={10}
          placeholder="Ej: El horario de la piscina es de 8am a 6pm de lunes a sabado..."
          value={regulations}
          onChange={(e) => setRegulations(e.target.value)}
        />
        <Button onClick={handleSave} disabled={updateMut.isPending || !isDirty}>
          {updateMut.isPending ? 'Guardando...' : 'Guardar'}
        </Button>
      </CardContent>
    </Card>
  )
}
