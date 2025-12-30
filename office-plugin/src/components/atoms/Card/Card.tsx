/**
 * Card 卡片组件
 * 已迁移到 Tailwind - 导出 ui/card
 */

export { 
  Card, 
  CardHeader, 
  CardFooter, 
  CardTitle, 
  CardDescription, 
  CardContent 
} from '@/components/ui/card'

// 导出 CardProps 类型
export type CardProps = React.ComponentProps<'div'> & {
  /** 启用悬停增强效果（与主应用统一） */
  hover?: boolean
}
