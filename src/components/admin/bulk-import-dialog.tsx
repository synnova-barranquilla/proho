import { useCallback, useState } from 'react'

import { AlertCircle, CheckCircle2, FileUp, Upload } from 'lucide-react'
import Papa from 'papaparse'
import { toast } from 'sonner'

import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '#/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '#/components/ui/table'

export interface ValidatedRow<T> {
  rowIndex: number
  valid: boolean
  data?: T
  error?: string
  raw: Record<string, string>
}

export interface ImportResult {
  created: number
  updated: number
  errors?: Array<{ row: number; message: string }>
  total: number
}

interface BulkImportDialogProps<T> {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  expectedColumns: string[]
  validateRow: (
    row: Record<string, string>,
    rowIndex: number,
  ) => ValidatedRow<T>
  onImport: (rows: T[]) => Promise<ImportResult>
}

type Step = 'upload' | 'preview' | 'result'

export function BulkImportDialog<T>({
  open,
  onOpenChange,
  title,
  expectedColumns,
  validateRow,
  onImport,
}: BulkImportDialogProps<T>) {
  const [step, setStep] = useState<Step>('upload')
  const [rows, setRows] = useState<ValidatedRow<T>[]>([])
  const [result, setResult] = useState<ImportResult | null>(null)
  const [isPending, setIsPending] = useState(false)

  const reset = useCallback(() => {
    setStep('upload')
    setRows([])
    setResult(null)
    setIsPending(false)
  }, [])

  const handleOpenChange = useCallback(
    (v: boolean) => {
      if (!v) reset()
      onOpenChange(v)
    },
    [onOpenChange, reset],
  )

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return

      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          if (results.data.length === 0) {
            toast.error('El archivo está vacío')
            return
          }
          const validated = (results.data as Record<string, string>[]).map(
            (row, i) => validateRow(row, i),
          )
          setRows(validated)
          setStep('preview')
        },
        error: () => {
          toast.error('Error al leer el archivo')
        },
      })

      e.target.value = ''
    },
    [validateRow],
  )

  const validRows = rows.filter((r) => r.valid)
  const invalidRows = rows.filter((r) => !r.valid)

  const handleImport = useCallback(async () => {
    const data = validRows.map((r) => r.data).filter((d): d is T => d != null)
    if (data.length === 0) return

    setIsPending(true)
    try {
      const res = await onImport(data)
      setResult(res)
      setStep('result')
      toast.success(`${res.created} creados, ${res.updated} actualizados`)
    } catch {
      toast.error('Error al importar')
    } finally {
      setIsPending(false)
    }
  }, [validRows, onImport])

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <DialogBody>
          {step === 'upload' && (
            <div className="flex flex-col items-center gap-4 py-8">
              <FileUp className="h-10 w-10 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Formato CSV con columnas:{' '}
                <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                  {expectedColumns.join(', ')}
                </code>
              </p>
              <Button
                variant="outline"
                onClick={() =>
                  document.getElementById('bulk-import-file')?.click()
                }
              >
                <Upload className="mr-2 h-4 w-4" />
                Seleccionar archivo
              </Button>
              <input
                id="bulk-import-file"
                type="file"
                accept=".csv,.txt"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          )}

          {step === 'preview' && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3 text-sm">
                <Badge variant="default">{validRows.length} válidos</Badge>
                {invalidRows.length > 0 && (
                  <Badge variant="destructive">
                    {invalidRows.length} con errores
                  </Badge>
                )}
              </div>
              <div className="max-h-72 overflow-auto rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-8">#</TableHead>
                      {expectedColumns.map((col) => (
                        <TableHead key={col}>{col}</TableHead>
                      ))}
                      <TableHead>Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((row) => (
                      <TableRow key={row.rowIndex}>
                        <TableCell className="tabular-nums text-muted-foreground">
                          {row.rowIndex + 1}
                        </TableCell>
                        {expectedColumns.map((col) => (
                          <TableCell key={col} className="text-sm">
                            {row.raw[col] ?? '—'}
                          </TableCell>
                        ))}
                        <TableCell>
                          {row.valid ? (
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                          ) : (
                            <span className="flex items-center gap-1 text-xs text-destructive">
                              <AlertCircle className="h-3.5 w-3.5" />
                              {row.error}
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {step === 'result' && result && (
            <div className="flex flex-col gap-3 py-4">
              <div className="flex items-center gap-3 text-sm">
                <Badge variant="default">{result.created} creados</Badge>
                <Badge variant="secondary">{result.updated} actualizados</Badge>
                {result.errors && result.errors.length > 0 && (
                  <Badge variant="destructive">
                    {result.errors.length} errores
                  </Badge>
                )}
              </div>
              {result.errors && result.errors.length > 0 && (
                <div className="max-h-40 overflow-auto rounded-md border p-3">
                  <ul className="flex flex-col gap-1 text-xs text-destructive">
                    {result.errors.map((e, i) => (
                      <li key={i}>
                        Fila {e.row}: {e.message}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </DialogBody>
        <DialogFooter>
          {step === 'preview' && (
            <>
              <Button variant="outline" onClick={reset}>
                Volver
              </Button>
              <Button
                onClick={handleImport}
                disabled={isPending || validRows.length === 0}
              >
                {isPending
                  ? 'Importando...'
                  : `Importar ${validRows.length} registros`}
              </Button>
            </>
          )}
          {step === 'result' && (
            <DialogClose render={<Button>Cerrar</Button>} />
          )}
          {step === 'upload' && (
            <DialogClose render={<Button variant="outline">Cancelar</Button>} />
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
