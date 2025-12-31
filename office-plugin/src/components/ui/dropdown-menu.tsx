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
  triggerRef: React.RefObject<HTMLElement> | null
  setTriggerRef: (ref: React.RefObject<HTMLElement>) => void
}

const DropdownMenuContext = React.createContext<DropdownMenuContextValue>({
  open: false,
  setOpen: () => {},
  triggerRef: null,
  setTriggerRef: () => {},
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
  const [triggerRef, setTriggerRef] = React.useState<React.RefObject<HTMLElement> | null>(null)
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
      if (!target.closest('[data-dropdown-menu]') && !target.closest('[data-dropdown-content]')) {
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
    <DropdownMenuContext.Provider value={{ open, setOpen, triggerRef, setTriggerRef }}>
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
  const { open, setOpen, setTriggerRef } = React.useContext(DropdownMenuContext)
  const triggerRef = React.useRef<HTMLElement>(null)

  React.useEffect(() => {
    setTriggerRef(triggerRef)
  }, [setTriggerRef])

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setOpen(!open)
  }

  // Clone the child element and add click handler and ref
  return React.cloneElement(children, {
    ref: triggerRef,
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

// ==================== Portal ====================

import { createPortal } from 'react-dom'

function DropdownMenuPortal({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = React.useState(false)
  
  React.useEffect(() => {
    setMounted(true)
  }, [])
  
  if (!mounted) return null
  
  // 渲染到 portal-root 或 body
  const portalRoot = document.getElementById('portal-root') || document.body
  return createPortal(children, portalRoot)
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
  sideOffset = 8,
  ...props
}: DropdownMenuContentProps) {
  const { open, triggerRef } = React.useContext(DropdownMenuContext)
  const contentRef = React.useRef<HTMLDivElement>(null)
  const [style, setStyle] = React.useState<React.CSSProperties>({})
  const [isPositioned, setIsPositioned] = React.useState(false)

  // 计算下拉菜单位置
  React.useEffect(() => {
    if (!open || !triggerRef?.current) {
      setIsPositioned(false)
      return
    }

    const updatePosition = () => {
      const triggerRect = triggerRef.current!.getBoundingClientRect()
      const contentEl = contentRef.current
      
      // 获取内容尺寸
      const contentWidth = contentEl?.offsetWidth || 288
      const contentHeight = contentEl?.offsetHeight || 200

      // 计算水平位置
      let left = triggerRect.left
      if (align === 'end') {
        left = triggerRect.right - contentWidth
      } else if (align === 'center') {
        left = triggerRect.left + (triggerRect.width - contentWidth) / 2
      }

      // 确保不超出视口边界
      const maxLeft = window.innerWidth - contentWidth - 8
      left = Math.min(left, maxLeft)
      left = Math.max(8, left)

      // 智能定位：根据可用空间决定向上还是向下弹出
      const spaceAbove = triggerRect.top
      const spaceBelow = window.innerHeight - triggerRect.bottom
      
      let newStyle: React.CSSProperties
      
      // 如果上方空间足够，或者上方空间比下方大，则向上弹出
      if (spaceAbove >= contentHeight + sideOffset || spaceAbove > spaceBelow) {
        // 向上弹出：菜单底部对齐到触发器顶部
        const bottom = window.innerHeight - triggerRect.top + sideOffset
        // 确保不超出视口顶部（弹窗顶部位置 = viewportHeight - bottom - contentHeight）
        const popupTop = window.innerHeight - bottom - contentHeight
        if (popupTop < 8) {
          // 如果向上弹出会超出顶部，改为向下弹出
          const top = triggerRect.bottom + sideOffset
          newStyle = { position: 'fixed', top, left, bottom: 'unset' }
        } else {
          newStyle = { position: 'fixed', bottom, left, top: 'unset' }
        }
      } else {
        // 向下弹出：菜单顶部对齐到触发器底部
        const top = triggerRect.bottom + sideOffset
        newStyle = { position: 'fixed', top, left, bottom: 'unset' }
      }
      
      setStyle(newStyle)
      
      setIsPositioned(true)
    }

    // 使用 RAF 确保 DOM 渲染后再计算
    let rafId1: number
    let rafId2: number
    
    rafId1 = requestAnimationFrame(() => {
      updatePosition()
      // 再次计算以获取准确的内容尺寸
      rafId2 = requestAnimationFrame(updatePosition)
    })

    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)

    return () => {
      cancelAnimationFrame(rafId1)
      cancelAnimationFrame(rafId2)
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
    }
  }, [open, align, sideOffset, triggerRef])

  if (!open) return null

  return (
    <DropdownMenuPortal>
      <div
        ref={contentRef}
        data-state={open ? 'open' : 'closed'}
        data-dropdown-content
        className={cn(
          'fixed z-[9999] min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md',
          'animate-in fade-in-0',
          !isPositioned && 'opacity-0 pointer-events-none',
          className,
        )}
        style={style}
        {...props}
      >
        {children}
      </div>
    </DropdownMenuPortal>
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
