/**
 * 懒加载路由配置
 * 使用代码分割优化首屏加载性能
 */

import { lazyLoad } from '../utils/lazyLoad'

// 懒加载主要页面组件
export const SettingsPanel = lazyLoad(
  () => import('../components/settings/SettingsPanel')
)

export const ProviderConfig = lazyLoad(
  () => import('../components/settings/ProviderConfig')
)

export const KnowledgeBaseConfig = lazyLoad(
  () => import('../components/settings/KnowledgeBaseConfig')
)

export const RAGConfig = lazyLoad(
  () => import('../components/settings/RAGConfig')
)

// 预加载关键组件（在用户可能访问前）
export function preloadCriticalComponents() {
  // 预加载设置面板（用户很可能会访问）
  SettingsPanel.preload()
}

// 在应用启动时调用
if (typeof window !== 'undefined') {
  // 延迟预加载，避免影响首屏
  setTimeout(() => {
    preloadCriticalComponents()
  }, 2000)
}
