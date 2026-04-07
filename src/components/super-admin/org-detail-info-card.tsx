import { useState } from 'react'

import { useMutation } from '@tanstack/react-query'

import { useConvexMutation } from '@convex-dev/react-query'
import { ConvexError } from 'convex/values'
import { Pencil } from 'lucide-react'
import { toast } from 'sonner'

import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from '#/components/ui/card'
import { formatAbsolute } from '#/lib/date'
import { isInternalOrgSlug } from '#/lib/organizations'
import { api } from '../../../convex/_generated/api'
import type { Doc } from '../../../convex/_generated/dataModel'
import { OrgConfirmDeactivateDialog } from './org-confirm-deactivate-dialog'
import { OrgEditNameDialog } from './org-edit-name-dialog'

interface OrgDetailInfoCardProps {
  org: Doc<'organizations'>
}

export function OrgDetailInfoCard({ org }: OrgDetailInfoCardProps) {
  const [editOpen, setEditOpen] = useState(false)
  const [deactivateOpen, setDeactivateOpen] = useState(false)
  const isInternal = isInternalOrgSlug(org.slug)

  const setActiveFn = useConvexMutation(api.organizations.mutations.setActive)
  const reactivateMutation = useMutation({ mutationFn: setActiveFn })

  const handleReactivate = async () => {
    try {
      await reactivateMutation.mutateAsync({ orgId: org._id, active: true })
      toast.success('Organización reactivada')
    } catch (err) {
      if (err instanceof ConvexError) {
        const data = err.data as { message?: string }
        toast.error(data.message ?? 'Error al reactivar')
      } else {
        toast.error('Error inesperado')
      }
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Información</CardTitle>
          <CardAction>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditOpen(true)}
            >
              <Pencil className="size-3.5" />
              Editar
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent className="space-y-4">
          <InfoRow label="Nombre" value={org.name} />
          <InfoRow
            label="Slug"
            value={<code className="font-mono text-xs">{org.slug}</code>}
            hint="Permanente — no puede modificarse"
          />
          <InfoRow
            label="Estado"
            value={
              <div className="flex items-center gap-3">
                <Badge variant={org.active ? 'default' : 'secondary'}>
                  {org.active ? 'Activa' : 'Inactiva'}
                </Badge>
                {!isInternal &&
                  (org.active ? (
                    <Button
                      variant="outline"
                      size="xs"
                      onClick={() => setDeactivateOpen(true)}
                    >
                      Desactivar
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="xs"
                      onClick={handleReactivate}
                      disabled={reactivateMutation.isPending}
                    >
                      {reactivateMutation.isPending
                        ? 'Reactivando...'
                        : 'Reactivar'}
                    </Button>
                  ))}
              </div>
            }
          />
          <InfoRow
            label="Creada"
            value={
              <span className="text-sm text-muted-foreground">
                {formatAbsolute(org._creationTime)}
              </span>
            }
          />
        </CardContent>
      </Card>

      <OrgEditNameDialog open={editOpen} onOpenChange={setEditOpen} org={org} />
      <OrgConfirmDeactivateDialog
        open={deactivateOpen}
        onOpenChange={setDeactivateOpen}
        org={org}
      />
    </>
  )
}

function InfoRow({
  label,
  value,
  hint,
}: {
  label: string
  value: React.ReactNode
  hint?: string
}) {
  return (
    <div className="grid gap-1">
      <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        {label}
      </div>
      <div>{value}</div>
      {hint && <div className="text-xs text-muted-foreground">{hint}</div>}
    </div>
  )
}
