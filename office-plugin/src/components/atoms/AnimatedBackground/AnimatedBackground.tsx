import React from 'react'

import { cn } from '@/lib/utils'

export interface AnimatedBackgroundProps {
  className?: string
}

/**
 * AnimatedBackground - 聊天界面专用的渐变+光斑背景
 * 参考新设计的 animated-background.tsx，实现独立覆盖层
 */
export const AnimatedBackground: React.FC<AnimatedBackgroundProps> = ({ className }) => {
  return (
    <div className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)}>
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-slate-50 to-indigo-50 dark:from-slate-950 dark:via-blue-950/30 dark:to-indigo-950/20 [theme-mode='dark']:from-slate-950 [theme-mode='dark']:via-blue-950/30 [theme-mode='dark']:to-indigo-950/20" />

      <div className="absolute -left-20 -top-20 h-80 w-80 rounded-full bg-blue-200/30 blur-3xl animate-float dark:bg-blue-800/15 [theme-mode='dark']:bg-blue-800/15" />
      <div className="absolute -right-20 top-1/4 h-96 w-96 rounded-full bg-indigo-200/25 blur-3xl animate-float-delay dark:bg-indigo-800/10 [theme-mode='dark']:bg-indigo-800/10" />
      <div className="absolute -bottom-20 left-1/3 h-72 w-72 rounded-full bg-sky-200/30 blur-3xl animate-pulse-soft dark:bg-sky-800/15 [theme-mode='dark']:bg-sky-800/15" />
      <div
        className="absolute right-1/4 bottom-1/4 h-64 w-64 rounded-full bg-slate-200/20 blur-3xl animate-float dark:bg-slate-700/10 [theme-mode='dark']:bg-slate-700/10"
        style={{ animationDelay: '1s' }}
      />

      <div
        className="absolute inset-0 opacity-[0.015] dark:opacity-[0.04] [theme-mode='dark']:opacity-[0.04]"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)',
          backgroundSize: '40px 40px'
        }}
      />
    </div>
  )
}

export default AnimatedBackground
