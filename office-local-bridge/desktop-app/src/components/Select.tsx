/**
 * 选择框组件 - AI 科技感设计（主题感知）
 */

import { SelectHTMLAttributes, forwardRef } from 'react'
import clsx from 'clsx'

interface SelectOption {
  value: string
  label: string
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  hint?: string
  options: SelectOption[]
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, hint, options, className, style, ...props }, ref) => {
    return (
      <div className="space-y-2">
        {label && (
          <label className="block text-sm font-medium text-theme-secondary">
            {label}
            {props.required && <span className="text-red-400 ml-1">*</span>}
          </label>
        )}
        <select
          ref={ref}
          className={clsx(
            'w-full px-4 py-2.5 rounded-xl text-sm transition-all duration-300 appearance-none cursor-pointer',
            'focus:outline-none',
            'bg-[length:1.25rem] bg-[right_0.75rem_center] bg-no-repeat',
            error && 'border-red-500/50 bg-red-500/10',
            className
          )}
          style={{
            backgroundColor: `rgba(var(--color-surface), 0.5)`,
            borderWidth: '1px',
            borderColor: error ? 'rgba(239, 68, 68, 0.5)' : `rgba(var(--color-primary), 0.2)`,
            color: `rgb(var(--color-text))`,
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='rgb(var(--color-primary))'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
            ...style
          }}
          {...props}
        >
          {options.map((option) => (
            <option 
              key={option.value} 
              value={option.value} 
              style={{ 
                backgroundColor: `rgb(var(--color-surface))`,
                color: `rgb(var(--color-text))`
              }}
            >
              {option.label}
            </option>
          ))}
        </select>
        {error && <p className="text-sm text-red-400">{error}</p>}
        {hint && !error && <p className="text-sm text-theme-muted">{hint}</p>}
      </div>
    )
  }
)

Select.displayName = 'Select'

export default Select
