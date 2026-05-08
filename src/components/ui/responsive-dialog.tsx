import { createContext, use, type ReactElement, type ReactNode } from 'react'

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
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '#/components/ui/drawer'
import { useIsMobile } from '#/hooks/use-mobile'
import { cn } from '#/lib/utils'

const MobileContext = createContext(false)

function ResponsiveDialog({
  children,
  ...props
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: ReactNode
}) {
  const isMobile = useIsMobile()

  return (
    <MobileContext value={isMobile}>
      {isMobile ? (
        <Drawer {...props}>{children}</Drawer>
      ) : (
        <Dialog {...props}>{children}</Dialog>
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
    return <DrawerContent className={className}>{children}</DrawerContent>
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
    return <DrawerHeader className={cn('text-left', className)} {...props} />
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
      <DrawerFooter className={className} {...props}>
        {children}
      </DrawerFooter>
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
    return <DrawerTitle className={className} {...props} />
  }

  return <DialogTitle className={className} {...props} />
}

function ResponsiveDialogDescription({
  className,
  ...props
}: React.ComponentProps<'p'> & { children: ReactNode }) {
  const isMobile = use(MobileContext)

  if (isMobile) {
    return <DrawerDescription className={className} {...props} />
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
      <div
        data-vaul-no-drag
        className={cn('overflow-y-auto px-4 pb-2', className)}
        {...props}
      />
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
    if (render) {
      return <DrawerClose asChild>{render}</DrawerClose>
    }
    return <DrawerClose asChild>{children}</DrawerClose>
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
