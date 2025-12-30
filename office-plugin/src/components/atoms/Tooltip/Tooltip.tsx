/**
 * Tooltip 工具提示组件
 * 已迁移到 Tailwind + Fluent UI
 */

export {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider
} from '@/components/ui/tooltip'

// 导出 TooltipProps 类型
export interface TooltipProps {
  children: React.ReactNode
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  delayDuration?: number
}
