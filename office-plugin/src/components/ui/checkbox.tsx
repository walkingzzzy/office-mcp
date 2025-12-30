/**
 * Checkbox 组件
 * 
 * @migrated 2025-12-30 - 从 Radix UI 迁移到 Fluent UI 实现
 */
import * as React from 'react'
import {
  Checkbox as FluentCheckbox,
  CheckboxProps as FluentCheckboxProps,
} from '@fluentui/react-components'

import { cn } from '@/lib/utils'

interface CheckboxProps extends Omit<FluentCheckboxProps, 'onChange'> {
  checked?: boolean
  defaultChecked?: boolean
  onCheckedChange?: (checked: boolean) => void
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, checked, defaultChecked, onCheckedChange, disabled, ...props }, ref) => {
    const handleChange: FluentCheckboxProps['onChange'] = (ev, data) => {
      onCheckedChange?.(data.checked === true)
    }

    return (
      <FluentCheckbox
        ref={ref}
        checked={checked}
        defaultChecked={defaultChecked}
        onChange={handleChange}
        disabled={disabled}
        className={cn(
          'peer shrink-0',
          className
        )}
        {...props}
      />
    )
  }
)
Checkbox.displayName = 'Checkbox'

export { Checkbox }
export type { CheckboxProps }
