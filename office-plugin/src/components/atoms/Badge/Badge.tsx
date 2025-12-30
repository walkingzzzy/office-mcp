/**
 * Badge 徽章组件
 * 已迁移到 Tailwind - 导出 ui/badge
 */

import type { VariantProps } from 'class-variance-authority'
import { badgeVariants } from '@/components/ui/badge'

export { Badge, badgeVariants } from '@/components/ui/badge'
export type { VariantProps } from 'class-variance-authority'

// 导出 BadgeProps 类型
export type BadgeProps = React.ComponentProps<'span'> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }
