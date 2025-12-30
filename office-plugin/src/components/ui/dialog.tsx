/**
 * Dialog 组件
 * 
 * @migrated 2025-12-30 - 从 Radix UI 迁移到 Fluent UI 实现
 */
import * as React from 'react'
import {
  Dialog as FluentDialog,
  DialogSurface,
  DialogBody,
  DialogTitle as FluentDialogTitle,
  DialogContent as FluentDialogContent,
  DialogActions,
  DialogTrigger as FluentDialogTrigger,
} from '@fluentui/react-components'
import { DismissRegular } from '@fluentui/react-icons'

import { cn } from '@/lib/utils'

// Dialog Root
interface DialogProps {
  children: React.ReactNode
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
}

function Dialog({ children, open, defaultOpen, onOpenChange }: DialogProps) {
  return (
    <FluentDialog 
      open={open} 
      defaultOpen={defaultOpen}
      onOpenChange={(_, data) => onOpenChange?.(data.open)}
    >
      {children as React.ReactElement}
    </FluentDialog>
  )
}

// DialogTrigger
interface DialogTriggerProps {
  children: React.ReactNode
  asChild?: boolean
}

function DialogTrigger({ children, asChild }: DialogTriggerProps) {
  // 确保 children 是有效的 React 元素
  if (!React.isValidElement(children)) {
    return <button type="button">{children}</button>
  }
  
  return (
    <FluentDialogTrigger disableButtonEnhancement>
      {children}
    </FluentDialogTrigger>
  )
}

// DialogPortal - Fluent UI 自动处理 portal
function DialogPortal({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

// DialogOverlay - Fluent UI DialogSurface 包含 overlay
interface DialogOverlayProps extends React.HTMLAttributes<HTMLDivElement> {}

const DialogOverlay = React.forwardRef<HTMLDivElement, DialogOverlayProps>(
  ({ className, ...props }, ref) => {
    // Fluent UI 自动处理 overlay，此组件仅用于兼容性
    return null
  }
)
DialogOverlay.displayName = 'DialogOverlay'

// DialogClose
interface DialogCloseProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

const DialogClose = React.forwardRef<HTMLButtonElement, DialogCloseProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <FluentDialogTrigger action="close">
        <button
          ref={ref}
          type="button"
          className={cn(
            'absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none',
            className
          )}
          {...props}
        >
          {children || <DismissRegular className="h-4 w-4" />}
          {!children && <span className="sr-only">Close</span>}
        </button>
      </FluentDialogTrigger>
    )
  }
)
DialogClose.displayName = 'DialogClose'

// DialogContent
interface DialogContentProps extends React.HTMLAttributes<HTMLDivElement> {}

const DialogContent = React.forwardRef<HTMLDivElement, DialogContentProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <DialogSurface
        ref={ref}
        className={cn(
          'fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 sm:rounded-lg',
          className
        )}
        {...props}
      >
        <DialogBody>
          {children}
          <DialogClose />
        </DialogBody>
      </DialogSurface>
    )
  }
)
DialogContent.displayName = 'DialogContent'

// DialogHeader
interface DialogHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}

const DialogHeader = ({ className, ...props }: DialogHeaderProps) => (
  <div
    className={cn(
      'flex flex-col space-y-1.5 text-center sm:text-left',
      className
    )}
    {...props}
  />
)
DialogHeader.displayName = 'DialogHeader'

// DialogFooter
interface DialogFooterProps extends React.HTMLAttributes<HTMLDivElement> {}

const DialogFooter = ({ className, ...props }: DialogFooterProps) => (
  <DialogActions
    className={cn(
      'flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2',
      className
    )}
    {...props}
  />
)
DialogFooter.displayName = 'DialogFooter'

// DialogTitle
interface DialogTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {}

const DialogTitle = React.forwardRef<HTMLHeadingElement, DialogTitleProps>(
  ({ className, ...props }, ref) => (
    <FluentDialogTitle
      ref={ref}
      className={cn(
        'text-lg font-semibold leading-none tracking-tight',
        className
      )}
      {...props}
    />
  )
)
DialogTitle.displayName = 'DialogTitle'

// DialogDescription
interface DialogDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {}

const DialogDescription = React.forwardRef<HTMLParagraphElement, DialogDescriptionProps>(
  ({ className, ...props }, ref) => (
    <FluentDialogContent
      ref={ref}
      className={cn('text-sm text-muted-foreground', className)}
      {...props}
    />
  )
)
DialogDescription.displayName = 'DialogDescription'

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
}
