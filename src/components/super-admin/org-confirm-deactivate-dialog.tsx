import { useCallback, useEffect, useState } from 'react'

import { useMutation } from '@tanstack/react-query'

import { useConvexMutation } from '@convex-dev/react-query'
import { ConvexError } from 'convex/values'
import { toast } from 'sonner'

import { Button } from '#/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '#/components/ui/dialog'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { api } from '../../../convex/_generated/api'
import type { Doc } from '../../../convex/_generated/dataModel'

interface OrgConfirmDeactivateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  org: Doc<'organizations'>
}

/**
 * Typed confirmation dialog for deactivating an organization. The super
 * admin must type the org's slug exactly before the "Desactivar" button
 * is enabled.
 */
export function OrgConfirmDeactivateDialog({
  open,
  onOpenChange,
  org,
}: OrgConfirmDeactivateDialogProps) {
  const [confirmation, setConfirmation] = useState('')
  const mutationFn = useConvexMutation(api.organizations.mutations.setActive)
  const mutation = useMutation({ mutationFn })

  useEffect(() => {
    if (open) setConfirmation('')
  }, [open, org._id])

  const matches = confirmation === org.slug

  const handleConfirm = useCallback(async () => {
    try {
      await mutation.mutateAsync({ orgId: org._id, active: false })
      toast.success('Organización desactivada', {
        description: `${org.name} ya no puede recibir logins.`,
      })
      onOpenChange(false)
    } catch (err) {
      if (err instanceof ConvexError) {
        const data = err.data as { message?: string }
        toast.error(data.message ?? 'Error al desactivar')
      } else {
        toast.error('Error inesperado')
      }
    }
  }, [mutation, org._id, org.name, onOpenChange])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Desactivar &quot;{org.name}&quot;</DialogTitle>
          <DialogDescription>
            Esta acción bloqueará el login de todos los usuarios de esta
            organización. Puedes reactivarla después en cualquier momento.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="confirm-slug" className="text-sm">
            Para confirmar, escribe el slug de la organización:{' '}
            <code className="font-mono text-foreground">{org.slug}</code>
          </Label>
          <Input
            id="confirm-slug"
            value={confirmation}
            onChange={(e) => setConfirmation(e.target.value)}
            placeholder={org.slug}
            autoComplete="off"
          />
        </div>

        <DialogFooter>
          <DialogClose render={<Button variant="outline">Cancelar</Button>} />
          <Button
            variant="destructive"
            disabled={!matches || mutation.isPending}
            onClick={handleConfirm}
          >
            {mutation.isPending ? 'Desactivando...' : 'Desactivar organización'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
