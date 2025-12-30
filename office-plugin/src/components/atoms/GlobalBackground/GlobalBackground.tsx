/**
 * GlobalBackground - 全局背景组件
 * 覆盖整个应用的渐变背景和浮动装饰
 */

import React from 'react'

export const GlobalBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {/* 主渐变背景 */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/80 via-slate-50/60 to-indigo-50/70 dark:from-slate-950 dark:via-blue-950/30 dark:to-indigo-950/20" />

      {/* 浮动光斑装饰 */}
      <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-blue-200/40 blur-3xl animate-float" />
      <div className="absolute -right-32 top-1/4 h-[28rem] w-[28rem] rounded-full bg-indigo-200/35 blur-3xl animate-float-delay" />
      <div className="absolute -bottom-32 left-1/4 h-80 w-80 rounded-full bg-sky-200/40 blur-3xl animate-pulse-soft" />
      <div 
        className="absolute right-1/4 bottom-1/3 h-72 w-72 rounded-full bg-slate-200/30 blur-3xl animate-float"
        style={{ animationDelay: '1.5s' }}
      />
      <div 
        className="absolute left-1/2 top-1/3 h-64 w-64 rounded-full bg-purple-200/20 blur-3xl animate-float-delay"
        style={{ animationDelay: '0.5s' }}
      />

      {/* 点阵图案 */}
      <div
        className="absolute inset-0 opacity-[0.02] dark:opacity-[0.04]"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
          backgroundSize: '32px 32px',
        }}
      />
    </div>
  )
}

export default GlobalBackground
