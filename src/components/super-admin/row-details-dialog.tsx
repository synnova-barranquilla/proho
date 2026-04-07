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

export interface RowDetailItem {
  label: string
  value: React.ReactNode
}

interface RowDetailsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  items: Array<RowDetailItem>
}

/**
 * Generic read-only dialog that displays a row's fields stacked vertically.
 *
 * Used as the "Ver detalles" action in mobile contexts, where several table
 * columns are hidden. Reusable across orgs, users, and invitations tables.
 */
export function RowDetailsDialog({
  open,
  onOpenChange,
  title,
  items,
}: RowDetailsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <dl className="grid gap-3">
            {items.map(({ label, value }) => (
              <div key={label} className="grid gap-1">
                <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {label}
                </dt>
                <dd className="text-sm">{value}</dd>
              </div>
            ))}
          </dl>
        </DialogBody>
        <DialogFooter>
          <DialogClose render={<Button variant="outline">Cerrar</Button>} />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
