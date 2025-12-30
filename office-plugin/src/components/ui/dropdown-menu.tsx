/**
 * DropdownMenu 组件
 * 使用原生 HTML + CSS 实现，保持 shadcn/ui 兼容 API
 * 
 * @updated 2025-12-30 - 从 Radix UI 迁移到原生实现
 */

import * as React from 'react'
import { CheckmarkRegular, ChevronRightRegular, CircleRegular } from '@fluentui/react-icons'
import { cn } from '@/lib/utils'

// ==================== Context ====================

interface DropdownMenuContextValue {
  open: boolean
  setOpen: (open: boolean) => void
}

const DropdownMenuContext = React.createContext<DropdownMenuContextValue>({
  open: false,
  setOpen: () => {},
})

// ==================== Root ====================

interface DropdownMenuProps {
  children: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
  defaultOpen?: boolean
}

function DropdownMenu({
  children,
  open: controlledOpen,
  onOpenChange,
  defaultOpen = false,
}: DropdownMenuProps) {
  const [internalOpen, setInternalOpen] = React.useState(defaultOpen)
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen

  const setOpen = React.useCallback((value: boolean) => {
    if (controlledOpen === undefined) {
      setInternalOpen(value)
    }
    onOpenChange?.(value)
  }, [controlledOpen, onOpenChange])

  // 点击外部关闭
  React.useEffect(() => {
    if (!open) return

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest('[data-dropdown-menu]')) {
        setOpen(false)
      }
    }

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [open, setOpen])

  return (
    <DropdownMenuContext.Provider value={{ open, setOpen }}>
      <div data-dropdown-menu className="relative inline-block">
        {children}
      </div>
    </DropdownMenuContext.Provider>
  )
}

// ==================== Trigger ====================

interface DropdownMenuTriggerProps {
  children: React.ReactElement
  asChild?: boolean
}

function DropdownMenuTrigger({ children, asChild }: DropdownMenuTriggerProps) {
  const { open, setOpen } = React.useContext(DropdownMenuContext)

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setOpen(!open)
  }

  // Clone the child element and add click handler
  return React.cloneElement(children, {
    onClick: (e: React.MouseEvent) => {
      handleClick(e)
      // Call the original onClick if it exists
      if (children.props.onClick) {
        children.props.onClick(e)
      }
    },
    'aria-expanded': open,
    'data-state': open ? 'open' : 'closed',
  })
}

// ==================== Portal (no-op) ====================

function DropdownMenuPortal({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

// ==================== Content ====================

interface DropdownMenuContentProps {
  children: React.ReactNode
  className?: string
  sideOffset?: number
  align?: 'start' | 'center' | 'end'
  side?: 'top' | 'bottom' | 'left' | 'right'
}

function DropdownMenuContent({
  children,
  className,
  align = 'start',
  sideOffset = 4,
  ...props
}: DropdownMenuContentProps) {
  const { open } = React.useContext(DropdownMenuContext)

  if (!open) return null

  const alignmentClass = {
    start: 'left-0',
    center: 'left-1/2 -translate-x-1/2',
    end: 'right-0',
  }[align]

  return (
    <div
      data-state={open ? 'open' : 'closed'}
      className={cn(
        'absolute z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md',
        'animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
        alignmentClass,
        className,
      )}
      style={{ top: `calc(100% + ${sideOffset}px)` }}
      {...props}
    >
      {children}
    </div>
  )
}

// ==================== Group ====================

interface DropdownMenuGroupProps {
  children: React.ReactNode
}

function DropdownMenuGroup({ children }: DropdownMenuGroupProps) {
  return <div role="group">{children}</div>
}

// ==================== Item ====================

interface DropdownMenuItemProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  className?: string
  disabled?: boolean
  inset?: boolean
  variant?: 'default' | 'destructive'
}

function DropdownMenuItem({
  children,
  className,
  disabled,
  onClick,
  inset,
  variant = 'default',
  ...props
}: DropdownMenuItemProps) {
  const { setOpen } = React.useContext(DropdownMenuContext)

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (disabled) return
    onClick?.(e)
    setOpen(false)
  }

  return (
    <div
      role="menuitem"
      tabIndex={disabled ? -1 : 0}
      data-disabled={disabled}
      data-variant={variant}
      onClick={handleClick}
      className={cn(
        "relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none select-none transition-colors",
        "hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
        variant === 'destructive' && "text-destructive hover:bg-destructive/10 focus:bg-destructive/10 focus:text-destructive",
        disabled && "pointer-events-none opacity-50",
        inset && "pl-8",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}

// ==================== CheckboxItem ====================

interface DropdownMenuCheckboxItemProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  className?: string
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
  disabled?: boolean
}

function DropdownMenuCheckboxItem({
  children,
  className,
  checked,
  onCheckedChange,
  disabled,
  ...props
}: DropdownMenuCheckboxItemProps) {
  return (
    <div
      role="menuitemcheckbox"
      aria-checked={checked}
      tabIndex={disabled ? -1 : 0}
      data-disabled={disabled}
      data-state={checked ? 'checked' : 'unchecked'}
      onClick={() => !disabled && onCheckedChange?.(!checked)}
      className={cn(
        "relative flex cursor-default items-center gap-2 rounded-sm py-1.5 pr-2 pl-8 text-sm outline-none select-none transition-colors",
        "hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
        disabled && "pointer-events-none opacity-50",
        className,
      )}
      {...props}
    >
      <span className="pointer-events-none absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
        {checked && <CheckmarkRegular className="h-4 w-4" />}
      </span>
      {children}
    </div>
  )
}

// ==================== RadioGroup ====================

interface DropdownMenuRadioGroupProps {
  children: React.ReactNode
  value?: string
  onValueChange?: (value: string) => void
}

const RadioGroupContext = React.createContext<{
  value?: string
  onValueChange?: (value: string) => void
}>({})

function DropdownMenuRadioGroup({
  children,
  value,
  onValueChange,
}: DropdownMenuRadioGroupProps) {
  return (
    <RadioGroupContext.Provider value={{ value, onValueChange }}>
      <div role="group">{children}</div>
    </RadioGroupContext.Provider>
  )
}

// ==================== RadioItem ====================

interface DropdownMenuRadioItemProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  className?: string
  value: string
  disabled?: boolean
}

function DropdownMenuRadioItem({
  children,
  className,
  value,
  disabled,
  ...props
}: DropdownMenuRadioItemProps) {
  const { value: selectedValue, onValueChange } = React.useContext(RadioGroupContext)
  const isSelected = selectedValue === value

  return (
    <div
      role="menuitemradio"
      aria-checked={isSelected}
      tabIndex={disabled ? -1 : 0}
      data-disabled={disabled}
      data-state={isSelected ? 'checked' : 'unchecked'}
      onClick={() => !disabled && onValueChange?.(value)}
      className={cn(
        "relative flex cursor-default items-center gap-2 rounded-sm py-1.5 pr-2 pl-8 text-sm outline-none select-none transition-colors",
        "hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
        disabled && "pointer-events-none opacity-50",
        className,
      )}
      {...props}
    >
      <span className="pointer-events-none absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
        {isSelected && <CircleRegular className="h-2 w-2 fill-current" />}
      </span>
      {children}
    </div>
  )
}

// ==================== Label ====================

interface DropdownMenuLabelProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  className?: string
  inset?: boolean
}

function DropdownMenuLabel({
  children,
  className,
  inset,
  ...props
}: DropdownMenuLabelProps) {
  return (
    <div
      className={cn(
        'px-2 py-1.5 text-sm font-medium',
        inset && 'pl-8',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}

// ==================== Separator ====================

interface DropdownMenuSeparatorProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string
}

function DropdownMenuSeparator({ className, ...props }: DropdownMenuSeparatorProps) {
  return (
    <div
      role="separator"
      className={cn('bg-border -mx-1 my-1 h-px', className)}
      {...props}
    />
  )
}

// ==================== Shortcut ====================

interface DropdownMenuShortcutProps extends React.HTMLAttributes<HTMLSpanElement> {
  className?: string
}

function DropdownMenuShortcut({
  className,
  ...props
}: DropdownMenuShortcutProps) {
  return (
    <span
      className={cn(
        'text-muted-foreground ml-auto text-xs tracking-widest',
        className,
      )}
      {...props}
    />
  )
}

// ==================== Sub Menu (简化实现) ====================

interface DropdownMenuSubProps {
  children: React.ReactNode
}

function DropdownMenuSub({ children }: DropdownMenuSubProps) {
  return <>{children}</>
}

interface DropdownMenuSubTriggerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  className?: string
  inset?: boolean
}

function DropdownMenuSubTrigger({
  children,
  className,
  inset,
  ...props
}: DropdownMenuSubTriggerProps) {
  return (
    <div
      className={cn(
        "flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none select-none",
        "hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
        inset && "pl-8",
        className,
      )}
      {...props}
    >
      {children}
      <ChevronRightRegular className="ml-auto h-4 w-4" />
    </div>
  )
}

interface DropdownMenuSubContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  className?: string
}

function DropdownMenuSubContent({
  children,
  className,
  ...props
}: DropdownMenuSubContentProps) {
  return (
    <div
      className={cn(
        'bg-popover text-popover-foreground z-50 min-w-[8rem] overflow-hidden rounded-md border p-1 shadow-lg',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export {
  DropdownMenu,
  DropdownMenuPortal,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
}
