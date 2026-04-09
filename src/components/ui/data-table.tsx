import { useState } from 'react'

import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type RowData,
  type SortingState,
} from '@tanstack/react-table'

import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '#/components/ui/table'
import { cn } from '#/lib/utils'

/**
 * Generic DataTable wrapper over @tanstack/react-table.
 *
 * - Multi-sort enabled by default (click header to sort, shift+click to
 *   add a secondary key). Sort state is component-local (memory-only;
 *   not persisted to URL or localStorage).
 * - Prepends a `#` row-index column reflecting the current *sorted* order.
 * - Consumers define columns with `ColumnDef<T>` from @tanstack/react-table.
 *   Set `enableSorting: false` on columns that shouldn't be sortable
 *   (e.g. actions column).
 */

interface DataTableProps<T> {
  columns: ColumnDef<T, any>[]
  data: T[]
  emptyMessage?: string
}

export function DataTable<T>({
  columns,
  data,
  emptyMessage = 'Sin resultados.',
}: DataTableProps<T>) {
  const [sorting, setSorting] = useState<SortingState>([])

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    enableMultiSort: true,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  return (
    <Table>
      <TableHeader>
        {table.getHeaderGroups().map((hg) => (
          <TableRow key={hg.id}>
            <TableHead className="w-10 text-muted-foreground">#</TableHead>
            {hg.headers.map((header) => {
              const canSort = header.column.getCanSort()
              const sortDir = header.column.getIsSorted()
              return (
                <TableHead
                  key={header.id}
                  className={header.column.columnDef.meta?.headClassName}
                >
                  {header.isPlaceholder ? null : canSort ? (
                    <button
                      type="button"
                      onClick={header.column.getToggleSortingHandler()}
                      className={cn(
                        'inline-flex items-center gap-1 font-medium',
                        'hover:text-foreground',
                      )}
                    >
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                      {sortDir === 'asc' ? (
                        <ArrowUp className="h-3 w-3" />
                      ) : sortDir === 'desc' ? (
                        <ArrowDown className="h-3 w-3" />
                      ) : (
                        <ChevronsUpDown className="h-3 w-3 opacity-40" />
                      )}
                    </button>
                  ) : (
                    flexRender(
                      header.column.columnDef.header,
                      header.getContext(),
                    )
                  )}
                </TableHead>
              )
            })}
          </TableRow>
        ))}
      </TableHeader>
      <TableBody>
        {table.getRowModel().rows.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={columns.length + 1}
              className="py-8 text-center text-sm text-muted-foreground"
            >
              {emptyMessage}
            </TableCell>
          </TableRow>
        ) : (
          table.getRowModel().rows.map((row, i) => (
            <TableRow key={row.id}>
              <TableCell className="text-muted-foreground tabular-nums">
                {i + 1}
              </TableCell>
              {row.getVisibleCells().map((cell) => (
                <TableCell
                  key={cell.id}
                  className={cell.column.columnDef.meta?.cellClassName}
                >
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  )
}

// Augment TanStack Table's meta for typed className props
declare module '@tanstack/react-table' {
  interface ColumnMeta<TData extends RowData, TValue> {
    headClassName?: string
    cellClassName?: string
  }
}
