/**
 * Spinner 加载指示器组件
 * 已迁移到 Tailwind
 */

import {
  SpinnerIosRegular
} from '@fluentui/react-icons'
import { FC } from 'react'

import { cn } from '@/lib/utils'

export interface SpinnerProps {
  /** 尺寸 */
  size?: 'tiny' | 'extra-small' | 'small' | 'medium' | 'large' | 'extra-large' | 'huge'
  /** 加载文本 */
  label?: string
  /** 自定义类名 */
  className?: string
}

const sizeMap = {
  tiny: 'h-3 w-3',
  'extra-small': 'h-4 w-4',
  small: 'h-5 w-5',
  medium: 'h-6 w-6',
  large: 'h-8 w-8',
  'extra-large': 'h-10 w-10',
  huge: 'h-12 w-12',
}

export const Spinner: FC<SpinnerProps> = ({ size = 'medium', label, className }) => {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <SpinnerIosRegular className={cn('animate-spin text-primary', sizeMap[size])} />
      {label && <span className="text-sm text-muted-foreground">{label}</span>}
    </div>
  )
}
