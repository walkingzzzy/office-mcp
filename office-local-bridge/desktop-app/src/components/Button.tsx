/**
 * 按钮组件 - AI 科技感设计（主题感知）
 */

import { ReactNode, ButtonHTMLAttributes } from 'react'
import clsx from 'clsx'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'cyber'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  className,
  disabled,
  style,
  ...props
}: ButtonProps) {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-300 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed'

  const sizeStyles = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-5 py-2.5 text-sm',
    lg: 'px-8 py-3.5 text-base',
  }

  // 使用 CSS 变量的动态样式
  const variantDynamicStyles: Record<string, React.CSSProperties> = {
    primary: {
      background: `linear-gradient(135deg, rgba(var(--color-primary), 1), rgba(var(--color-primary), 0.85))`,
      color: 'white',
      boxShadow: `0 4px 15px rgba(var(--color-primary), 0.3)`,
      border: `1px solid rgba(var(--color-primary), 0.3)`,
    },
    secondary: {
      background: `rgba(var(--color-surface), 0.6)`,
      color: `rgb(var(--color-text-secondary))`,
      border: `1px solid rgba(var(--color-primary), 0.2)`,
      backdropFilter: 'blur(12px)',
    },
    danger: {
      background: `linear-gradient(135deg, #dc2626, #b91c1c)`,
      color: 'white',
      boxShadow: `0 4px 15px rgba(220, 38, 38, 0.3)`,
      border: `1px solid rgba(220, 38, 38, 0.3)`,
    },
    ghost: {
      background: 'transparent',
      color: `rgb(var(--color-text-secondary))`,
      border: '1px solid transparent',
    },
    cyber: {
      background: `linear-gradient(135deg, rgba(var(--color-primary), 1), rgba(var(--color-accent), 1), rgba(var(--color-primary), 1))`,
      backgroundSize: '200% 100%',
      color: 'white',
      boxShadow: `0 4px 15px rgba(var(--color-accent), 0.3)`,
      border: `1px solid rgba(var(--color-accent), 0.3)`,
    },
  }

  const hoverClass = {
    primary: 'hover:shadow-xl hover:scale-[1.03] hover:-translate-y-0.5 active:scale-[0.98] active:translate-y-0',
    secondary: 'hover:text-theme hover:border-theme-primary/50 hover:bg-theme-primary-soft hover:shadow-md active:scale-[0.98]',
    danger: 'hover:shadow-xl hover:scale-[1.03] hover:-translate-y-0.5 active:scale-[0.98] active:translate-y-0',
    ghost: 'hover:text-theme hover:bg-white/10 hover:shadow-sm active:scale-[0.98]',
    cyber: 'hover:bg-right hover:shadow-xl hover:scale-[1.03] hover:-translate-y-0.5 active:scale-[0.98] active:translate-y-0',
  }

  return (
    <button
      className={clsx(baseStyles, sizeStyles[size], hoverClass[variant], className)}
      style={{ ...variantDynamicStyles[variant], ...style }}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg
          className="animate-spin -ml-1 mr-2 h-4 w-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {children}
    </button>
  )
}
