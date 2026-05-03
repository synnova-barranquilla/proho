import { useCallback, useEffect, useRef, useState } from 'react'

import { useMutation, useSuspenseQuery } from '@tanstack/react-query'

import { convexQuery, useConvexMutation } from '@convex-dev/react-query'
import { ConvexError } from 'convex/values'
import { Minus, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '#/components/ui/card'
import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '#/components/ui/dialog'
import { Field, FieldGroup, FieldLabel } from '#/components/ui/field'
import { Input } from '#/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select'
import { Switch } from '#/components/ui/switch'
import { slugify } from '#/lib/slug'
import { cn } from '#/lib/utils'
import { api } from '../../../convex/_generated/api'
import type { Id } from '../../../convex/_generated/dataModel'

const PRIORITY_LABELS: Record<string, string> = {
  high: 'Alta',
  medium: 'Media',
  low: 'Baja',
}

const PRIORITY_VARIANTS: Record<string, string> = {
  high: 'bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400',
  medium:
    'bg-yellow-100 text-yellow-700 dark:bg-yellow-950/30 dark:text-yellow-400',
  low: 'bg-gray-100 text-gray-600 dark:bg-gray-800/30 dark:text-gray-400',
}

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Admin',
  AUXILIAR: 'Auxiliar Op.',
}

const PRIORITY_ORDER: Record<string, number> = { high: 0, medium: 1, low: 2 }

function sortCategories<T extends { priority: string; label: string }>(
  cats: T[],
): T[] {
  return [...cats].sort((a, b) => {
    const pa = PRIORITY_ORDER[a.priority] ?? 3
    const pb = PRIORITY_ORDER[b.priority] ?? 3
    if (pa !== pb) return pa - pb
    return a.label.localeCompare(b.label, 'es')
  })
}

interface CategoriesManagerProps {
  complexId: Id<'complexes'>
}

export function CategoriesManager({ complexId }: CategoriesManagerProps) {
  const [createOpen, setCreateOpen] = useState(false)
  const [editingId, setEditingId] = useState<Id<'categories'> | null>(null)

  const { data } = useSuspenseQuery(
    convexQuery(api.communications.queries.listAllCategories, { complexId }),
  )

  const toggleFn = useConvexMutation(
    api.communications.categoryMutations.toggleCategory,
  )
  const toggleMut = useMutation({ mutationFn: toggleFn })

  const deleteFn = useConvexMutation(
    api.communications.categoryMutations.deleteCategory,
  )
  const deleteMut = useMutation({ mutationFn: deleteFn })

  const handleToggle = async (
    categoryId: Id<'categories'>,
    isEnabled: boolean,
  ) => {
    try {
      await toggleMut.mutateAsync({ categoryId, isEnabled })
      toast.success(isEnabled ? 'Categoría activada' : 'Categoría desactivada')
    } catch (err) {
      if (err instanceof ConvexError) {
        const d = err.data as { message?: string }
        toast.error(d.message ?? 'Error')
      } else {
        toast.error('Error inesperado')
      }
    }
  }

  const handleDelete = async (categoryId: Id<'categories'>) => {
    try {
      await deleteMut.mutateAsync({ categoryId })
      toast.success('Categoría eliminada')
    } catch (err) {
      if (err instanceof ConvexError) {
        const d = err.data as { message?: string }
        toast.error(d.message ?? 'Error')
      } else {
        toast.error('Error inesperado')
      }
    }
  }

  const editingCategory = editingId
    ? [...data.platform, ...data.custom].find((c) => c._id === editingId)
    : null

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-semibold">Categorías</h2>
          <p className="text-sm text-muted-foreground">
            Categorías de tickets para clasificar los casos de soporte.
          </p>
        </div>
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" />
          Nueva categoría
        </Button>
      </div>

      {data.platform.length > 0 && (
        <Card size="sm">
          <CardHeader>
            <CardTitle className="text-sm">
              Categorías de plataforma
              <span className="ml-2 text-xs font-normal text-muted-foreground">
                (solo se pueden activar/desactivar)
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col divide-y">
              {sortCategories(data.platform).map((cat) => (
                <CategoryRow
                  key={cat._id}
                  category={cat}
                  isSystem
                  onToggle={(enabled) => handleToggle(cat._id, enabled)}
                  onClick={() => setEditingId(cat._id)}
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
            Categorías del conjunto
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
              No hay categorías personalizadas. Las categorías de plataforma
              cubren los casos más comunes.
            </p>
          ) : (
            <div className="flex flex-col divide-y">
              {sortCategories(data.custom).map((cat) => (
                <CategoryRow
                  key={cat._id}
                  category={cat}
                  isSystem={false}
                  onToggle={(enabled) => handleToggle(cat._id, enabled)}
                  onClick={() => setEditingId(cat._id)}
                  onDelete={() => handleDelete(cat._id)}
                  isToggling={toggleMut.isPending}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <CategoryDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        complexId={complexId}
        category={null}
      />

      {editingCategory && (
        <CategoryDialog
          open={!!editingId}
          onOpenChange={(open) => {
            if (!open) setEditingId(null)
          }}
          complexId={complexId}
          category={editingCategory}
        />
      )}
    </div>
  )
}

interface CategoryDoc {
  _id: Id<'categories'>
  key: string
  label: string
  priority: string
  assignedRole: string
  keywords: string[]
  isSystem: boolean
  isEnabled: boolean
}

function CategoryRow({
  category,
  isSystem,
  onToggle,
  onClick,
  onDelete,
  isToggling,
}: {
  category: CategoryDoc
  isSystem: boolean
  onToggle: (enabled: boolean) => void
  onClick: () => void
  onDelete: () => void
  isToggling: boolean
}) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 py-3',
        !category.isEnabled && 'opacity-50',
      )}
    >
      <button
        type="button"
        onClick={onClick}
        className="flex flex-1 min-w-0 cursor-pointer items-start text-left hover:opacity-80"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{category.label}</span>
            <span
              className={cn(
                'inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium',
                PRIORITY_VARIANTS[category.priority],
              )}
            >
              {PRIORITY_LABELS[category.priority]}
            </span>
            <Badge variant="outline" className="text-[10px]">
              {ROLE_LABELS[category.assignedRole] ?? category.assignedRole}
            </Badge>
          </div>
          {category.keywords.length > 0 && (
            <p className="mt-0.5 text-xs text-muted-foreground truncate">
              {category.keywords.join(', ')}
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
          checked={category.isEnabled}
          onCheckedChange={onToggle}
          disabled={isToggling}
          aria-label={category.isEnabled ? 'Desactivar' : 'Activar'}
        />
      </div>
    </div>
  )
}

function CategoryDialog({
  open,
  onOpenChange,
  complexId,
  category,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  complexId: Id<'complexes'>
  category: CategoryDoc | null
}) {
  const isEdit = category !== null && !category.isSystem
  const isReadOnly = category !== null && category.isSystem
  const isCreate = category === null

  const [label, setLabel] = useState(category?.label ?? '')
  const [priority, setPriority] = useState(category?.priority ?? 'medium')
  const [assignedRole, setAssignedRole] = useState(
    category?.assignedRole ?? 'ADMIN',
  )
  const [keywords, setKeywords] = useState<string[]>(
    category && category.keywords.length > 0 ? category.keywords : [''],
  )

  const generatedKey = slugify(label)

  const keywordInputsRef = useRef<Map<number, HTMLInputElement>>(new Map())
  const addButtonRef = useRef<HTMLButtonElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const setKeywordRef = useCallback(
    (index: number, el: HTMLInputElement | null) => {
      if (el) {
        keywordInputsRef.current.set(index, el)
      } else {
        keywordInputsRef.current.delete(index)
      }
    },
    [],
  )

  const handleKeywordChange = (index: number, value: string) => {
    setKeywords((prev) => prev.map((k, i) => (i === index ? value : k)))

    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      addButtonRef.current?.focus()
    }, 1000)
  }

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  const addKeyword = () => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    const newIndex = keywords.length
    setKeywords((prev) => [...prev, ''])
    requestAnimationFrame(() => {
      keywordInputsRef.current.get(newIndex)?.focus()
    })
  }

  const removeKeyword = (index: number) => {
    if (keywords.length <= 1) return
    if (debounceRef.current) clearTimeout(debounceRef.current)
    setKeywords((prev) => prev.filter((_, i) => i !== index))
  }

  const createFn = useConvexMutation(
    api.communications.categoryMutations.createCategory,
  )
  const createMut = useMutation({ mutationFn: createFn })

  const updateFn = useConvexMutation(
    api.communications.categoryMutations.updateCategory,
  )
  const updateMut = useMutation({ mutationFn: updateFn })

  const isPending = createMut.isPending || updateMut.isPending

  const cleanKeywords = keywords.map((k) => k.trim()).filter(Boolean)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (cleanKeywords.length === 0) {
      toast.error('Agrega al menos una palabra clave')
      return
    }

    try {
      if (isEdit) {
        await updateMut.mutateAsync({
          categoryId: category._id,
          label: label.trim(),
          priority: priority as 'high' | 'medium' | 'low',
          assignedRole: assignedRole as 'ADMIN' | 'AUXILIAR',
          keywords: cleanKeywords,
        })
        toast.success('Categoría actualizada')
      } else {
        await createMut.mutateAsync({
          complexId,
          key: generatedKey,
          label: label.trim(),
          priority: priority as 'high' | 'medium' | 'low',
          assignedRole: assignedRole as 'ADMIN' | 'AUXILIAR',
          keywords: cleanKeywords,
        })
        toast.success('Categoría creada')
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isReadOnly
              ? 'Detalle de categoría'
              : isEdit
                ? 'Editar categoría'
                : 'Nueva categoría'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <DialogBody>
            <FieldGroup>
              <Field>
                <FieldLabel>Nombre</FieldLabel>
                <Input
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="Ej: Ruido excesivo"
                  required
                  disabled={isReadOnly}
                />
              </Field>
              <Field>
                <FieldLabel>Clave</FieldLabel>
                <Input
                  value={isCreate ? generatedKey : category.key}
                  disabled
                  className="font-mono text-xs"
                />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field>
                  <FieldLabel>Prioridad</FieldLabel>
                  {isReadOnly ? (
                    <Input value={PRIORITY_LABELS[priority]} disabled />
                  ) : (
                    <Select
                      value={priority}
                      onValueChange={(v) => v && setPriority(v)}
                    >
                      <SelectTrigger>
                        <SelectValue>{PRIORITY_LABELS[priority]}</SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="high">Alta</SelectItem>
                        <SelectItem value="medium">Media</SelectItem>
                        <SelectItem value="low">Baja</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </Field>
                <Field>
                  <FieldLabel>Asignar a</FieldLabel>
                  {isReadOnly ? (
                    <Input
                      value={ROLE_LABELS[assignedRole] ?? assignedRole}
                      disabled
                    />
                  ) : (
                    <Select
                      value={assignedRole}
                      onValueChange={(v) => v && setAssignedRole(v)}
                    >
                      <SelectTrigger>
                        <SelectValue>{ROLE_LABELS[assignedRole]}</SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ADMIN">Admin</SelectItem>
                        <SelectItem value="AUXILIAR">Auxiliar Op.</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </Field>
              </div>
              <Field>
                <FieldLabel>Palabras clave</FieldLabel>
                <div className="flex flex-col gap-2">
                  {keywords.map((kw, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <Input
                        ref={(el) => setKeywordRef(i, el)}
                        value={kw}
                        onChange={(e) => handleKeywordChange(i, e.target.value)}
                        onFocus={() => {
                          if (debounceRef.current)
                            clearTimeout(debounceRef.current)
                        }}
                        placeholder={`Palabra clave ${i + 1}`}
                        disabled={isReadOnly}
                        className="flex-1"
                      />
                      {!isReadOnly && keywords.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => removeKeyword(i)}
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  ))}
                  {!isReadOnly && (
                    <Button
                      ref={addButtonRef}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addKeyword}
                      className="self-start"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Agregar palabra clave
                    </Button>
                  )}
                </div>
              </Field>
            </FieldGroup>
          </DialogBody>
          <DialogFooter>
            {isReadOnly ? (
              <DialogClose render={<Button variant="outline">Cerrar</Button>} />
            ) : (
              <>
                <DialogClose
                  render={<Button variant="outline">Cancelar</Button>}
                />
                <Button type="submit" disabled={isPending || !label.trim()}>
                  {isPending ? 'Guardando...' : isEdit ? 'Guardar' : 'Crear'}
                </Button>
              </>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
