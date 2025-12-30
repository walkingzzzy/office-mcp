/**
 * Select 组件
 * 使用 Fluent UI Dropdown 组件实现
 * 
 * @updated 2025-12-30 - 从 Radix UI 迁移到 Fluent UI
 */

import * as React from 'react'
import {
  Dropdown,
  Option,
  OptionGroup,
} from '@fluentui/react-components'
import { CheckmarkRegular, ChevronDownRegular, ChevronUpRegular } from '@fluentui/react-icons'
import { cn } from '@/lib/utils'

// ==================== Context ====================

interface SelectContextValue {
  value?: string
  onValueChange?: (value: string) => void
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

const SelectContext = React.createContext<SelectContextValue>({})

// ==================== Root ====================

interface SelectProps {
  children: React.ReactNode
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  disabled?: boolean
}

function Select({
  children,
  value,
  defaultValue,
  onValueChange,
  open,
  defaultOpen,
  onOpenChange,
  disabled,
}: SelectProps) {
  const [internalValue, setInternalValue] = React.useState(defaultValue || '')
  const [internalOpen, setInternalOpen] = React.useState(defaultOpen || false)

  const currentValue = value !== undefined ? value : internalValue
  const currentOpen = open !== undefined ? open : internalOpen

  const handleValueChange = (newValue: string) => {
    if (value === undefined) {
      setInternalValue(newValue)
    }
    onValueChange?.(newValue)
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (open === undefined) {
      setInternalOpen(newOpen)
    }
    onOpenChange?.(newOpen)
  }

  return (
    <SelectContext.Provider
      value={{
        value: currentValue,
        onValueChange: handleValueChange,
        open: currentOpen,
        onOpenChange: handleOpenChange,
      }}
    >
      {children}
    </SelectContext.Provider>
  )
}

// ==================== Group ====================

interface SelectGroupProps {
  children: React.ReactNode
}

function SelectGroup({ children }: SelectGroupProps) {
  return <div className="py-1">{children}</div>
}

// ==================== Value ====================

interface SelectValueProps {
  placeholder?: string
}

function SelectValue({ placeholder }: SelectValueProps) {
  const { value } = React.useContext(SelectContext)
  return <span>{value || placeholder}</span>
}

// ==================== Trigger ====================

interface SelectTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode
  className?: string
}

const SelectTrigger = React.forwardRef<HTMLButtonElement, SelectTriggerProps>(
  ({ className, children, ...props }, ref) => {
    const { open, onOpenChange } = React.useContext(SelectContext)

    return (
      <button
        ref={ref}
        type="button"
        onClick={() => onOpenChange?.(!open)}
        className={cn(
          "flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background",
          "placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "[&>span]:line-clamp-1",
          className
        )}
        {...props}
      >
        {children}
        <ChevronDownRegular className="h-4 w-4 opacity-50" />
      </button>
    )
  }
)
SelectTrigger.displayName = 'SelectTrigger'

// ==================== ScrollButton (placeholder) ====================

const SelectScrollUpButton = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "flex cursor-default items-center justify-center py-1",
        className
      )}
      {...props}
    >
      <ChevronUpRegular className="h-4 w-4" />
    </div>
  )
)
SelectScrollUpButton.displayName = 'SelectScrollUpButton'

const SelectScrollDownButton = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "flex cursor-default items-center justify-center py-1",
        className
      )}
      {...props}
    >
      <ChevronDownRegular className="h-4 w-4" />
    </div>
  )
)
SelectScrollDownButton.displayName = 'SelectScrollDownButton'

// ==================== Content ====================

interface SelectContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  className?: string
  position?: 'popper' | 'item-aligned'
}

const SelectContent = React.forwardRef<HTMLDivElement, SelectContentProps>(
  ({ className, children, position = 'popper', ...props }, ref) => {
    const { open } = React.useContext(SelectContext)

    if (!open) return null

    return (
      <div
        ref={ref}
        className={cn(
          "relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md",
          "animate-in fade-in-0 zoom-in-95",
          position === 'popper' && "translate-y-1",
          className
        )}
        {...props}
      >
        <div className="p-1">
          {children}
        </div>
      </div>
    )
  }
)
SelectContent.displayName = 'SelectContent'

// ==================== Label ====================

interface SelectLabelProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  className?: string
}

const SelectLabel = React.forwardRef<HTMLDivElement, SelectLabelProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("px-2 py-1.5 text-sm font-semibold", className)}
      {...props}
    />
  )
)
SelectLabel.displayName = 'SelectLabel'

// ==================== Item ====================

interface SelectItemProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  className?: string
  value: string
  disabled?: boolean
}

const SelectItem = React.forwardRef<HTMLDivElement, SelectItemProps>(
  ({ className, children, value, disabled, ...props }, ref) => {
    const { value: selectedValue, onValueChange, onOpenChange } = React.useContext(SelectContext)
    const isSelected = selectedValue === value

    return (
      <div
        ref={ref}
        role="option"
        aria-selected={isSelected}
        data-disabled={disabled}
        onClick={() => {
          if (!disabled) {
            onValueChange?.(value)
            onOpenChange?.(false)
          }
        }}
        className={cn(
          "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-2 pr-8 text-sm outline-none",
          "hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
          disabled && "pointer-events-none opacity-50",
          isSelected && "bg-accent/50",
          className
        )}
        {...props}
      >
        {isSelected && (
          <span className="absolute right-2 flex h-3.5 w-3.5 items-center justify-center">
            <CheckmarkRegular className="h-4 w-4" />
          </span>
        )}
        <span>{children}</span>
      </div>
    )
  }
)
SelectItem.displayName = 'SelectItem'

// ==================== Separator ====================

interface SelectSeparatorProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string
}

const SelectSeparator = React.forwardRef<HTMLDivElement, SelectSeparatorProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("-mx-1 my-1 h-px bg-muted", className)}
      {...props}
    />
  )
)
SelectSeparator.displayName = 'SelectSeparator'

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
}
