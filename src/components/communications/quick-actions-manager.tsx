import { useState } from 'react'

import { useMutation, useSuspenseQuery } from '@tanstack/react-query'

import { convexQuery, useConvexMutation } from '@convex-dev/react-query'
import { ConvexError } from 'convex/values'
import { Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '#/components/ui/card'
import { Field, FieldGroup, FieldLabel } from '#/components/ui/field'
import { Input } from '#/components/ui/input'
import {
  ResponsiveDialog,
  ResponsiveDialogBody,
  ResponsiveDialogClose,
  ResponsiveDialogContent,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from '#/components/ui/responsive-dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select'
import { Switch } from '#/components/ui/switch'
import { Textarea } from '#/components/ui/textarea'
import { cn } from '#/lib/utils'
import { api } from '../../../convex/_generated/api'
import type { Id } from '../../../convex/_generated/dataModel'

const PRIORITY_LABELS: Record<string, string> = {
  high: 'Alta',
  medium: 'Media',
  low: 'Baja',
}

interface QuickActionsManagerProps {
  complexId: Id<'complexes'>
}

export function QuickActionsManager({ complexId }: QuickActionsManagerProps) {
  const [createOpen, setCreateOpen] = useState(false)
  const [editingId, setEditingId] = useState<Id<'quickActions'> | null>(null)

  const { data } = useSuspenseQuery(
    convexQuery(api.communications.queries.listAllQuickActions, { complexId }),
  )

  const { data: categories } = useSuspenseQuery(
    convexQuery(api.communications.queries.listCategories, { complexId }),
  )

  const toggleFn = useConvexMutation(
    api.communications.categoryMutations.toggleQuickAction,
  )
  const toggleMut = useMutation({ mutationFn: toggleFn })

  const deleteFn = useConvexMutation(
    api.communications.categoryMutations.deleteQuickAction,
  )
  const deleteMut = useMutation({ mutationFn: deleteFn })

  const handleToggle = async (
    quickActionId: Id<'quickActions'>,
    isEnabled: boolean,
  ) => {
    try {
      await toggleMut.mutateAsync({ quickActionId, isEnabled })
      toast.success(isEnabled ? 'Acción activada' : 'Acción desactivada')
    } catch (err) {
      if (err instanceof ConvexError) {
        const d = err.data as { message?: string }
        toast.error(d.message ?? 'Error')
      } else {
        toast.error('Error inesperado')
      }
    }
  }

  const handleDelete = async (quickActionId: Id<'quickActions'>) => {
    try {
      await deleteMut.mutateAsync({ quickActionId })
      toast.success('Acción eliminada')
    } catch (err) {
      if (err instanceof ConvexError) {
        const d = err.data as { message?: string }
        toast.error(d.message ?? 'Error')
      } else {
        toast.error('Error inesperado')
      }
    }
  }

  const editingAction = editingId
    ? [...data.platform, ...data.custom].find((a) => a._id === editingId)
    : null

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-semibold">Acciones rápidas</h2>
          <p className="text-sm text-muted-foreground">
            Botones de acceso rápido que los residentes ven al iniciar una
            conversación.
          </p>
        </div>
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" />
          Nueva acción
        </Button>
      </div>

      {data.platform.length > 0 && (
        <Card size="sm">
          <CardHeader>
            <CardTitle className="text-sm">
              Acciones de plataforma
              <span className="ml-2 text-xs font-normal text-muted-foreground">
                (solo se pueden activar/desactivar)
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col divide-y">
              {data.platform.map((action) => (
                <ActionRow
                  key={action._id}
                  action={action}
                  isSystem
                  categories={categories}
                  onToggle={(enabled) => handleToggle(action._id, enabled)}
                  onClick={() => setEditingId(action._id)}
                  onDelete={() => {}}
                  isToggling={toggleMut.isPending}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card size="sm">
        <CardHeader>
          <CardTitle className="text-sm">
            Acciones del conjunto
            {data.custom.length === 0 && (
              <span className="ml-2 text-xs font-normal text-muted-foreground">
                (ninguna creada aún)
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.custom.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              No hay acciones personalizadas.
            </p>
          ) : (
            <div className="flex flex-col divide-y">
              {data.custom.map((action) => (
                <ActionRow
                  key={action._id}
                  action={action}
                  isSystem={false}
                  categories={categories}
                  onToggle={(enabled) => handleToggle(action._id, enabled)}
                  onClick={() => setEditingId(action._id)}
                  onDelete={() => handleDelete(action._id)}
                  isToggling={toggleMut.isPending}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <ActionDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        complexId={complexId}
        action={null}
        categories={categories}
      />

      {editingAction && (
        <ActionDialog
          open={!!editingId}
          onOpenChange={(open) => {
            if (!open) setEditingId(null)
          }}
          complexId={complexId}
          action={editingAction}
          categories={categories}
        />
      )}
    </div>
  )
}

interface ActionDoc {
  _id: Id<'quickActions'>
  label: string
  response?: string
  isInfoOnly: boolean
  suggestedCategory?: string
  suggestedPriority?: string
  isSystem: boolean
  isEnabled: boolean
}

interface CategoryItem {
  key: string
  label: string
}

function ActionRow({
  action,
  isSystem,
  categories,
  onToggle,
  onClick,
  onDelete,
  isToggling,
}: {
  action: ActionDoc
  isSystem: boolean
  categories: CategoryItem[]
  onToggle: (enabled: boolean) => void
  onClick: () => void
  onDelete: () => void
  isToggling: boolean
}) {
  const categoryLabel = action.suggestedCategory
    ? (categories.find((c) => c.key === action.suggestedCategory)?.label ??
      action.suggestedCategory)
    : null

  return (
    <div
      className={cn(
        'flex items-center gap-3 py-3',
        !action.isEnabled && 'opacity-50',
      )}
    >
      <button
        type="button"
        onClick={onClick}
        className="flex flex-1 min-w-0 cursor-pointer items-start text-left hover:opacity-80"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{action.label}</span>
            {action.isInfoOnly ? (
              <Badge variant="secondary" className="text-[10px]">
                Info
              </Badge>
            ) : (
              <>
                {categoryLabel && (
                  <Badge variant="outline" className="text-[10px]">
                    {categoryLabel}
                  </Badge>
                )}
                {action.suggestedPriority && (
                  <Badge variant="outline" className="text-[10px]">
                    {PRIORITY_LABELS[action.suggestedPriority]}
                  </Badge>
                )}
              </>
            )}
          </div>
          {action.isInfoOnly && action.response && (
            <p className="mt-0.5 text-xs text-muted-foreground truncate">
              {action.response}
            </p>
          )}
        </div>
      </button>

      <div className="flex shrink-0 items-center gap-1">
        {!isSystem && (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={(e) => {
              e.stopPropagation()
              onDelete()
            }}
            title="Eliminar"
          >
            <Trash2 className="h-3.5 w-3.5 text-destructive" />
          </Button>
        )}
        <Switch
          checked={action.isEnabled}
          onCheckedChange={onToggle}
          disabled={isToggling}
        />
      </div>
    </div>
  )
}

function ActionDialog({
  open,
  onOpenChange,
  complexId,
  action,
  categories,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  complexId: Id<'complexes'>
  action: ActionDoc | null
  categories: CategoryItem[]
}) {
  const isEdit = action !== null && !action.isSystem
  const isReadOnly = action !== null && action.isSystem

  const [label, setLabel] = useState(action?.label ?? '')
  const [isInfoOnly, setIsInfoOnly] = useState(action?.isInfoOnly ?? false)
  const [response, setResponse] = useState(action?.response ?? '')
  const [suggestedCategory, setSuggestedCategory] = useState(
    action?.suggestedCategory ?? '',
  )
  const [suggestedPriority, setSuggestedPriority] = useState(
    action?.suggestedPriority ?? '',
  )

  const createFn = useConvexMutation(
    api.communications.categoryMutations.createQuickAction,
  )
  const createMut = useMutation({ mutationFn: createFn })

  const updateFn = useConvexMutation(
    api.communications.categoryMutations.updateQuickAction,
  )
  const updateMut = useMutation({ mutationFn: updateFn })

  const isPending = createMut.isPending || updateMut.isPending

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      if (isEdit) {
        await updateMut.mutateAsync({
          quickActionId: action._id,
          label: label.trim(),
          isInfoOnly,
          response: isInfoOnly ? response.trim() || undefined : undefined,
          suggestedCategory: !isInfoOnly
            ? suggestedCategory || undefined
            : undefined,
          suggestedPriority: !isInfoOnly
            ? ((suggestedPriority || undefined) as
                | 'high'
                | 'medium'
                | 'low'
                | undefined)
            : undefined,
        })
        toast.success('Acción actualizada')
      } else {
        await createMut.mutateAsync({
          complexId,
          label: label.trim(),
          isInfoOnly,
          response: isInfoOnly ? response.trim() || undefined : undefined,
          suggestedCategory: !isInfoOnly
            ? suggestedCategory || undefined
            : undefined,
          suggestedPriority: !isInfoOnly
            ? ((suggestedPriority || undefined) as
                | 'high'
                | 'medium'
                | 'low'
                | undefined)
            : undefined,
        })
        toast.success('Acción creada')
      }
      onOpenChange(false)
    } catch (err) {
      if (err instanceof ConvexError) {
        const d = err.data as { message?: string }
        toast.error(d.message ?? 'Error')
      } else {
        toast.error('Error inesperado')
      }
    }
  }

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className="max-w-md">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>
            {isReadOnly
              ? 'Detalle de acción rápida'
              : isEdit
                ? 'Editar acción rápida'
                : 'Nueva acción rápida'}
          </ResponsiveDialogTitle>
        </ResponsiveDialogHeader>
        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <ResponsiveDialogBody>
            <FieldGroup>
              <Field>
                <FieldLabel>Etiqueta del botón</FieldLabel>
                <Input
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="Ej: Reportar fuga de agua"
                  required
                  disabled={isReadOnly}
                />
              </Field>

              <Field>
                <FieldLabel>Tipo</FieldLabel>
                <div className="flex items-center gap-3">
                  <Switch
                    checked={isInfoOnly}
                    onCheckedChange={setIsInfoOnly}
                    disabled={isReadOnly}
                  />
                  <span className="text-sm">
                    {isInfoOnly
                      ? 'Solo informativo (respuesta predefinida, sin ticket)'
                      : 'Acelerador de intención (sugiere categoría al bot)'}
                  </span>
                </div>
              </Field>

              {isInfoOnly ? (
                <Field>
                  <FieldLabel>Respuesta predefinida</FieldLabel>
                  <Textarea
                    value={response}
                    onChange={(e) => setResponse(e.target.value)}
                    placeholder="Texto que se mostrará al residente al presionar el botón..."
                    className="min-h-20"
                    disabled={isReadOnly}
                  />
                </Field>
              ) : (
                <>
                  <Field>
                    <FieldLabel>Categoría sugerida</FieldLabel>
                    {isReadOnly ? (
                      <Input
                        value={
                          categories.find((c) => c.key === suggestedCategory)
                            ?.label ?? suggestedCategory
                        }
                        disabled
                      />
                    ) : (
                      <Select
                        value={suggestedCategory}
                        onValueChange={(v) =>
                          v !== null && setSuggestedCategory(v)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar categoría">
                            {suggestedCategory
                              ? (categories.find(
                                  (c) => c.key === suggestedCategory,
                                )?.label ?? suggestedCategory)
                              : 'Seleccionar categoría'}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((cat) => (
                            <SelectItem key={cat.key} value={cat.key}>
                              {cat.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </Field>
                  <Field>
                    <FieldLabel>Prioridad sugerida</FieldLabel>
                    {isReadOnly ? (
                      <Input
                        value={
                          PRIORITY_LABELS[suggestedPriority] ??
                          suggestedPriority
                        }
                        disabled
                      />
                    ) : (
                      <Select
                        value={suggestedPriority}
                        onValueChange={(v) =>
                          v !== null && setSuggestedPriority(v)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar prioridad">
                            {suggestedPriority
                              ? PRIORITY_LABELS[suggestedPriority]
                              : 'Seleccionar prioridad'}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="high">Alta</SelectItem>
                          <SelectItem value="medium">Media</SelectItem>
                          <SelectItem value="low">Baja</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  </Field>
                </>
              )}
            </FieldGroup>
          </ResponsiveDialogBody>
          <ResponsiveDialogFooter>
            {isReadOnly ? (
              <ResponsiveDialogClose
                render={<Button variant="outline">Cerrar</Button>}
              />
            ) : (
              <>
                <ResponsiveDialogClose
                  render={<Button variant="outline">Cancelar</Button>}
                />
                <Button type="submit" disabled={isPending || !label.trim()}>
                  {isPending ? 'Guardando...' : isEdit ? 'Guardar' : 'Crear'}
                </Button>
              </>
            )}
          </ResponsiveDialogFooter>
        </form>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}
