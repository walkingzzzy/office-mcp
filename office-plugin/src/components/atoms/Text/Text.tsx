/**
 * Text 文本组件
 * 已迁移到 Tailwind
 */

import { FC, ReactNode } from 'react'

import { cn } from '@/lib/utils'

export interface TextProps {
  children?: ReactNode
  /** 字体大小 */
  size?: 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 | 1000
  /** 字体粗细 */
  weight?: 'regular' | 'medium' | 'semibold' | 'bold'
  /** 是否斜体 */
  italic?: boolean
  /** 是否删除线 */
  strikethrough?: boolean
  /** 是否下划线 */
  underline?: boolean
  /** 是否截断 */
  truncate?: boolean
  /** 是否换行 */
  wrap?: boolean
  /** 文本对齐 */
  align?: 'start' | 'center' | 'end' | 'justify'
  /** 是否块级显示 */
  block?: boolean
  /** 自定义类名 */
  className?: string
}

const sizeMap: Record<number, string> = {
  100: 'text-[10px]',
  200: 'text-xs',
  300: 'text-sm',
  400: 'text-base',
  500: 'text-lg',
  600: 'text-xl',
  700: 'text-2xl',
  800: 'text-3xl',
  900: 'text-4xl',
  1000: 'text-5xl',
}

const weightMap: Record<string, string> = {
  regular: 'font-normal',
  medium: 'font-medium',
  semibold: 'font-semibold',
  bold: 'font-bold',
}

const alignMap: Record<string, string> = {
  start: 'text-left',
  center: 'text-center',
  end: 'text-right',
  justify: 'text-justify',
}

export const Text: FC<TextProps> = ({
  children,
  size = 300,
  weight = 'regular',
  italic = false,
  strikethrough = false,
  underline = false,
  truncate = false,
  wrap = true,
  align = 'start',
  block = false,
  className,
}) => {
  return (
    <span
      className={cn(
        sizeMap[size],
        weightMap[weight],
        alignMap[align],
        italic && 'italic',
        strikethrough && 'line-through',
        underline && 'underline',
        truncate && 'truncate',
        !wrap && 'whitespace-nowrap',
        block && 'block',
        className
      )}
    >
      {children}
    </span>
  )
}
