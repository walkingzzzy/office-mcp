/**
 * 输入框组件 - AI 科技感设计（主题感知）
 */

import { InputHTMLAttributes, forwardRef } from 'react'
import clsx from 'clsx'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className, style, ...props }, ref) => {
    return (
      <div className="space-y-2">
        {label && (
          <label className="block text-sm font-medium text-theme-secondary">
            {label}
            {props.required && <span className="text-red-400 ml-1">*</span>}
          </label>
        )}
        <input
          ref={ref}
          className={clsx(
            'w-full px-4 py-2.5 rounded-xl text-sm transition-all duration-300',
            'input-theme',
            'focus:outline-none',
            error && 'border-red-500/50 bg-red-500/10',
            className
          )}
          style={{
            backgroundColor: `rgba(var(--color-surface), 0.5)`,
            borderWidth: '1px',
            borderColor: error ? 'rgba(239, 68, 68, 0.5)' : `rgba(var(--color-primary), 0.2)`,
            color: `rgb(var(--color-text))`,
            ...style
          }}
          {...props}
        />
        {error && <p className="text-sm text-red-400">{error}</p>}
        {hint && !error && <p className="text-sm text-theme-muted">{hint}</p>}
      </div>
    )
  }
)

Input.displayName = 'Input'

export default Input
