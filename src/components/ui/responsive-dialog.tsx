import { createContext, use, type ReactElement, type ReactNode } from 'react'

import { Drawer } from '@base-ui/react/drawer'

import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '#/components/ui/dialog'
import { useIsMobile } from '#/hooks/use-mobile'
import { cn } from '#/lib/utils'

const MobileContext = createContext(false)

function ResponsiveDialog({
  open,
  onOpenChange,
  children,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: ReactNode
}) {
  const isMobile = useIsMobile()

  return (
    <MobileContext value={isMobile}>
      {isMobile ? (
        <Drawer.Root open={open} onOpenChange={onOpenChange}>
          {children}
        </Drawer.Root>
      ) : (
        <Dialog open={open} onOpenChange={onOpenChange}>
          {children}
        </Dialog>
      )}
    </MobileContext>
  )
}

function ResponsiveDialogContent({
  className,
  children,
  showCloseButton,
  ...props
}: {
  className?: string
  children: ReactNode
  showCloseButton?: boolean
} & Record<string, unknown>) {
  const isMobile = use(MobileContext)

  if (isMobile) {
    return (
      <Drawer.Portal>
        <Drawer.Backdrop className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs" />
        <Drawer.Viewport className="fixed inset-0 z-50">
          <Drawer.Popup
            className={cn(
              'fixed inset-x-0 bottom-0 flex max-h-[85vh] flex-col rounded-t-xl border-t bg-popover text-sm text-popover-foreground shadow-lg',
              className,
            )}
          >
            <div className="mx-auto mt-3 h-1 w-[100px] shrink-0 rounded-full bg-muted" />
            <Drawer.Content className="flex flex-1 flex-col overflow-hidden">
              {children}
            </Drawer.Content>
          </Drawer.Popup>
        </Drawer.Viewport>
      </Drawer.Portal>
    )
  }

  return (
    <DialogContent
      className={className}
      showCloseButton={showCloseButton}
      {...props}
    >
      {children}
    </DialogContent>
  )
}

function ResponsiveDialogHeader({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  const isMobile = use(MobileContext)

  if (isMobile) {
    return (
      <div
        className={cn('flex flex-col gap-0.5 p-4 text-left', className)}
        {...props}
      />
    )
  }

  return <DialogHeader className={className} {...props} />
}

function ResponsiveDialogFooter({
  className,
  children,
  showCloseButton,
  ...props
}: React.ComponentProps<'div'> & { showCloseButton?: boolean }) {
  const isMobile = use(MobileContext)

  if (isMobile) {
    return (
      <div
        className={cn('mt-auto flex flex-col gap-2 p-4', className)}
        {...props}
      >
        {children}
      </div>
    )
  }

  return (
    <DialogFooter
      className={className}
      showCloseButton={showCloseButton}
      {...props}
    >
      {children}
    </DialogFooter>
  )
}

function ResponsiveDialogTitle({
  className,
  ...props
}: React.ComponentProps<'h2'> & { children: ReactNode }) {
  const isMobile = use(MobileContext)

  if (isMobile) {
    return (
      <Drawer.Title
        className={cn(
          'font-heading text-base font-medium text-foreground',
          className,
        )}
        {...props}
      />
    )
  }

  return <DialogTitle className={className} {...props} />
}

function ResponsiveDialogDescription({
  className,
  ...props
}: React.ComponentProps<'p'> & { children: ReactNode }) {
  const isMobile = use(MobileContext)

  if (isMobile) {
    return (
      <Drawer.Description
        className={cn('text-sm text-muted-foreground', className)}
        {...props}
      />
    )
  }

  return <DialogDescription className={className} {...props} />
}

function ResponsiveDialogBody({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  const isMobile = use(MobileContext)

  if (isMobile) {
    return (
      <div className={cn('overflow-y-auto px-4 pb-2', className)} {...props} />
    )
  }

  return <DialogBody className={className} {...props} />
}

function ResponsiveDialogClose({
  render,
  children,
  ...props
}: {
  render?: ReactElement
  children?: ReactNode
} & Record<string, unknown>) {
  const isMobile = use(MobileContext)

  if (isMobile) {
    return (
      <Drawer.Close render={render} {...props}>
        {children}
      </Drawer.Close>
    )
  }

  return (
    <DialogClose render={render} {...props}>
      {children}
    </DialogClose>
  )
}

export {
  ResponsiveDialog,
  ResponsiveDialogBody,
  ResponsiveDialogClose,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
}
