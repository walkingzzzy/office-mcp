/**
 * 应用全局 Providers 组合
 * 组合所有需要的 Context Providers
 */


import { FC, ReactNode } from 'react'

import { FluentProvider } from './FluentProvider'
import { QueryProvider } from './QueryProvider'

export interface AppProvidersProps {
  children: ReactNode
}

/**
 * 应用 Providers
 *
 * 嵌套顺序:
 * 1. QueryProvider - React Query 状态管理
 * 2. FluentProvider - Fluent UI 主题
 */
export const AppProviders: FC<AppProvidersProps> = ({ children }) => {
  return (
    <QueryProvider>
      <FluentProvider>{children}</FluentProvider>
    </QueryProvider>
  )
}

