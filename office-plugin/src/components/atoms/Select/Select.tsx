/**
 * Select 选择器组件
 * 已迁移到 Fluent UI - 导出 ui/select
 * 
 * @updated 2025-12-30 - 从 Radix UI 迁移到 Fluent UI
 */

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
} from '@/components/ui/select'

// 兼容旧接口的类型导出
export interface SelectOption {
  value: string
  label: string
  title?: string
}

// 导出 SelectProps 类型
export interface SelectProps {
  children: React.ReactNode
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  disabled?: boolean
}
