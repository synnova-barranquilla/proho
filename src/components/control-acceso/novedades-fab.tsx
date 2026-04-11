import { useState } from 'react'

import { NotebookPen } from 'lucide-react'

import { Button } from '#/components/ui/button'
import type { Id } from '../../../convex/_generated/dataModel'
import { NovedadesSheet } from './novedades-sheet'

interface NovedadesFabProps {
  conjuntoId: Id<'conjuntos'>
}

export function NovedadesFab({ conjuntoId }: NovedadesFabProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button
        size="icon"
        className="fixed bottom-6 right-6 z-40 h-14 w-14 rounded-full shadow-lg"
        onClick={() => setOpen(true)}
        title="Crear novedad"
      >
        <NotebookPen className="h-6 w-6" />
      </Button>
      <NovedadesSheet
        open={open}
        onClose={() => setOpen(false)}
        conjuntoId={conjuntoId}
      />
    </>
  )
}
