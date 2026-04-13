import { useState } from 'react'

import { useMutation } from '@tanstack/react-query'

import { useConvexMutation } from '@convex-dev/react-query'
import { ConvexError } from 'convex/values'
import { toast } from 'sonner'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '#/components/ui/card'
import { Label } from '#/components/ui/label'
import { Switch } from '#/components/ui/switch'
import {
  MODULE_DESCRIPTIONS,
  MODULE_LABELS,
  type ModuleKey,
} from '#/lib/modules'
import { isInternalOrgSlug } from '#/lib/organizations'
import { api } from '../../../convex/_generated/api'
import type { Doc } from '../../../convex/_generated/dataModel'

/** Only show modules that are currently developed */
const VISIBLE_MODULES: ModuleKey[] = ['control_acceso']

interface OrgDetailModulesCardProps {
  org: Doc<'organizations'>
}

export function OrgDetailModulesCard({ org }: OrgDetailModulesCardProps) {
  const [pendingKey, setPendingKey] = useState<ModuleKey | null>(null)
  const mutationFn = useConvexMutation(
    api.organizations.mutations.setModuleActive,
  )
  const mutation = useMutation({ mutationFn })
  const isInternal = isInternalOrgSlug(org.slug)

  const handleToggle = async (moduleKey: ModuleKey, checked: boolean) => {
    setPendingKey(moduleKey)
    try {
      await toast.promise(
        mutation.mutateAsync({
          orgId: org._id,
          moduleKey,
          active: checked,
        }),
        {
          loading: checked
            ? `Activando ${MODULE_LABELS[moduleKey]}...`
            : `Desactivando ${MODULE_LABELS[moduleKey]}...`,
          success: checked
            ? `${MODULE_LABELS[moduleKey]} activado`
            : `${MODULE_LABELS[moduleKey]} desactivado`,
          error: (err) => {
            if (err instanceof ConvexError) {
              const data = err.data as { message?: string }
              return data.message ?? 'Error al actualizar módulo'
            }
            return 'Error inesperado'
          },
        },
      )
    } finally {
      setPendingKey(null)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Módulos</CardTitle>
        <CardDescription>
          {isInternal
            ? 'Los módulos no aplican para la organización interna de Synnova.'
            : 'Activa los módulos que esta organización tendrá disponibles.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {VISIBLE_MODULES.map((moduleKey) => {
          const isActive = org.activeModules.includes(moduleKey)
          const isPending = pendingKey === moduleKey
          return (
            <div
              key={moduleKey}
              className="flex items-start justify-between gap-4"
            >
              <div className="flex-1 space-y-0.5">
                <Label className="text-sm font-medium">
                  {MODULE_LABELS[moduleKey]}
                </Label>
                <p className="text-xs text-muted-foreground">
                  {MODULE_DESCRIPTIONS[moduleKey]}
                </p>
              </div>
              <Switch
                checked={isActive}
                disabled={isInternal || isPending}
                onCheckedChange={(checked) =>
                  handleToggle(moduleKey, checked === true)
                }
              />
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
