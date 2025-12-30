/**
 * Button 组件
 * 与主应用 (office-local-bridge) 视觉统一
 * 
 * 新增变体: primary-gradient, cyber, glass
 * 
 * @migrated 2025-12-30 - 从 Radix UI Slot 迁移到原生 React 实现
 */

import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-300 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        // 默认主要按钮
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        // 危险操作按钮
        destructive:
          'bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60',
        // 边框样式按钮
        outline:
          'border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50',
        // 次要操作按钮
        secondary:
          'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        // 透明背景按钮（工具栏）
        ghost:
          'hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50',
        // 链接样式按钮
        link: 'text-primary underline-offset-4 hover:underline',
        // 主要操作按钮 - 渐变背景（发送按钮等）
        primary:
          'bg-gradient-to-r from-brand-500 to-brand-600 text-white shadow-lg hover:from-brand-600 hover:to-brand-700 hover:shadow-xl active:shadow-md',
        // 建议卡片按钮 - 卡片样式
        suggestion:
          'border border-border bg-card hover:border-brand-300 hover:shadow-md transition-all duration-200 text-left justify-start',
        // 模式切换按钮 - 特殊样式
        mode:
          'border bg-gradient-to-r from-brand-50 to-brand-100 hover:from-brand-100 hover:to-brand-200 text-brand-700 dark:from-brand-900/20 dark:to-brand-800/20 dark:text-brand-300',
        // 工具栏按钮 - 紧凑透明
        toolbar:
          'hover:bg-muted/50 text-muted-foreground hover:text-foreground rounded-lg',
        // 🆕 与主应用一致的渐变主按钮
        'primary-gradient': [
          'text-white',
          'shadow-[0_4px_15px_rgba(var(--color-primary-rgb),0.3)]',
          'border border-[rgba(var(--color-primary-rgb),0.3)]',
          'hover:shadow-[0_6px_20px_rgba(var(--color-primary-rgb),0.4)]',
          'hover:scale-[1.02] hover:-translate-y-0.5',
          'active:scale-[0.98] active:translate-y-0',
        ].join(' '),
        // 🆕 与主应用一致的 cyber 渐变按钮
        'cyber': [
          'bg-[length:200%_100%]',
          'text-white',
          'shadow-[0_4px_15px_rgba(var(--color-accent-rgb),0.3)]',
          'border border-[rgba(var(--color-accent-rgb),0.3)]',
          'hover:bg-right hover:shadow-xl hover:scale-[1.02] hover:-translate-y-0.5',
          'active:scale-[0.98] active:translate-y-0',
        ].join(' '),
        // 🆕 玻璃态按钮
        'glass': [
          'glass',
          'text-[rgb(var(--color-text-secondary-rgb))]',
          'hover:text-[rgb(var(--color-text-rgb))]',
          'hover:border-[rgba(var(--color-primary-rgb),0.3)]',
          'hover:shadow-md',
          'active:scale-[0.98]',
        ].join(' '),
      },
      size: {
        default: 'h-9 px-4 py-2 has-[>svg]:px-3',
        sm: 'h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5',
        lg: 'h-10 rounded-md px-6 has-[>svg]:px-4',
        icon: 'size-9',
        'icon-sm': 'size-8',
        'icon-lg': 'size-10',
        'icon-xs': 'size-7',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

// 使用 forwardRef 解决 "Function components cannot be given refs" 警告
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, style, children, ...props }, ref) => {
    // 为特殊变体添加内联样式
    const variantStyles: React.CSSProperties = {}
    if (variant === 'primary-gradient') {
      variantStyles.background = 'linear-gradient(135deg, rgb(var(--color-primary-rgb)), rgba(var(--color-primary-rgb), 0.85))'
    } else if (variant === 'cyber') {
      variantStyles.background = 'linear-gradient(135deg, rgb(var(--color-primary-rgb)), rgb(var(--color-accent-rgb)))'
    }

    // 为特定变体自动添加 btn-enhanced 类
    const shouldEnhance = variant === 'primary-gradient' || variant === 'cyber' || variant === 'primary'

    const combinedClassName = cn(
      buttonVariants({ variant, size, className }),
      shouldEnhance && 'btn-enhanced'
    )

    // asChild 模式：将样式和属性传递给子元素
    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children as React.ReactElement<{ className?: string; style?: React.CSSProperties; ref?: React.Ref<HTMLButtonElement> }>, {
        ...props,
        ref,
        className: cn(combinedClassName, (children as React.ReactElement<{ className?: string }>).props.className),
        style: { ...variantStyles, ...style, ...(children as React.ReactElement<{ style?: React.CSSProperties }>).props.style },
      })
    }

    return (
      <button
        ref={ref}
        data-slot="button"
        className={combinedClassName}
        style={{ ...variantStyles, ...style }}
        {...props}
      >
        {children}
      </button>
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
