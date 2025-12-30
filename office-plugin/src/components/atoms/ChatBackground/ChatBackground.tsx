/**
 * ChatBackground - 聊天背景组件
 * 已迁移到 Tailwind
 * 
 * 用于: 聊天界面空白区域
 */

import React from 'react'

import { cn } from '@/lib/utils'
import { BrandAvatar } from '../BrandAvatar'
import { BrandIcon } from '../BrandIcon'

export interface ChatBackgroundProps {
  /** 子元素 - 通常不需要，保持兼容性 */
  children?: React.ReactNode
  /** 是否显示水印 */
  showWatermark?: boolean
  /** 自定义样式类名 */
  className?: string
}

/**
 * 动画背景层 - 渐变背景和浮动装饰元素
 */
const AnimatedBackgroundLayer: React.FC = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* 渐变背景 */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-slate-50 to-indigo-50 dark:from-slate-950 dark:via-blue-950/30 dark:to-indigo-950/20 [theme-mode='dark']:from-slate-950 [theme-mode='dark']:via-blue-950/30 [theme-mode='dark']:to-indigo-950/20" />

      {/* 浮动装饰元素 */}
      <div className="absolute -left-20 -top-20 h-80 w-80 rounded-full bg-blue-200/30 blur-3xl animate-float dark:bg-blue-800/15 [theme-mode='dark']:bg-blue-800/15" />
      <div className="absolute -right-20 top-1/4 h-96 w-96 rounded-full bg-indigo-200/25 blur-3xl animate-float-delay dark:bg-indigo-800/10 [theme-mode='dark']:bg-indigo-800/10" />
      <div className="absolute -bottom-20 left-1/3 h-72 w-72 rounded-full bg-sky-200/30 blur-3xl animate-pulse-soft dark:bg-sky-800/15 [theme-mode='dark']:bg-sky-800/15" />
      <div
        className="absolute right-1/4 bottom-1/4 h-64 w-64 rounded-full bg-slate-200/20 blur-3xl animate-float dark:bg-slate-700/10 [theme-mode='dark']:bg-slate-700/10"
        style={{ animationDelay: '1s' }}
      />

      {/* 点阵背景 */}
      <div
        className="absolute inset-0 opacity-[0.015] dark:opacity-[0.04] [theme-mode='dark']:opacity-[0.04]"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
          backgroundSize: '40px 40px',
        }}
      />
    </div>
  )
}

export const ChatBackground: React.FC<ChatBackgroundProps> = ({
  children,
  showWatermark = true,
  className
}) => {
  return (
    <div className={cn('relative h-full w-full', className)}>
      {/* 动画背景层 */}
      <AnimatedBackgroundLayer />
      
      {/* 内容层 */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full w-full p-4">
        {children ? (
          children
        ) : (
          <div className="flex flex-col items-center justify-center gap-4 max-w-[85%] text-center animate-fade-up">
            {/* 品牌头像 - 带光晕效果 */}
            <div className="animate-logo-glow rounded-full">
              <BrandAvatar size={64} isAI />
            </div>
            
            {/* 欢迎文案 */}
            <div className="flex flex-col items-center gap-1">
              <span className="text-lg font-semibold text-foreground">
                欢迎使用武汉问津
              </span>
              <span className="text-sm text-muted-foreground">
                您的智能学习助手
              </span>
            </div>
            
            {/* 提示文案 */}
            <div className="flex items-center gap-2 glass rounded-full px-4 py-2 mt-2 text-xs text-muted-foreground">
              <BrandIcon size={14} className="text-muted-foreground" />
              <span>试着问我任何问题...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ChatBackground
