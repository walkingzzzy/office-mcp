/**
 * UI 组件统一导出
 * 基于 shadcn/ui 风格，适配 Vite + React 18
 */

// 基础组件
export { Button, buttonVariants } from './button'
export { Input } from './input'
export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
} from './card'

// Radix UI 封装组件
export { Avatar, AvatarImage, AvatarFallback } from './avatar'
export {
  DropdownMenu,
  DropdownMenuPortal,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from './dropdown-menu'
export { ScrollArea, ScrollBar } from './scroll-area'
export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from './tooltip'
export { Separator } from './separator'
export { Badge, badgeVariants } from './badge'

// Toast 组件已迁移到 components/molecules/ToastNotifications
// 使用 toastManager 而不是 Radix Toast
