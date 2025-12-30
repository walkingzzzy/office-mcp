/**
 * 懒加载工具函数
 * 提供组件懒加载和预加载功能
 */

import React, { Suspense, ComponentType, lazy } from 'react'
import { LoadingSpinner } from '../components/common/LoadingSpinner'

/**
 * 懒加载选项
 */
interface LazyLoadOptions {
  fallback?: React.ReactNode
  preload?: boolean
}

/**
 * 创建懒加载组件
 */
export function lazyLoad<T extends ComponentType<unknown>>(
  importFn: () => Promise<{ default: T }>,
  options: LazyLoadOptions = {}
): React.LazyExoticComponent<T> & { preload: () => Promise<{ default: T }> } {
  const LazyComponent = lazy(importFn) as React.LazyExoticComponent<T> & {
    preload: () => Promise<{ default: T }>
  }

  // 添加预加载方法
  LazyComponent.preload = importFn

  // 如果需要预加载，立即开始加载
  if (options.preload) {
    importFn()
  }

  return LazyComponent
}

/**
 * 带 Suspense 的懒加载包装器
 */
export function withSuspense<P extends object>(
  Component: ComponentType<P>,
  fallback?: React.ReactNode
): React.FC<P> {
  const defaultFallback = (
    <div className="flex items-center justify-center p-4">
      <LoadingSpinner text="加载中..." />
    </div>
  )

  return function SuspenseWrapper(props: P) {
    return (
      <Suspense fallback={fallback || defaultFallback}>
        <Component {...props} />
      </Suspense>
    )
  }
}

/**
 * 预加载多个组件
 */
export function preloadComponents(
  components: Array<{ preload: () => Promise<unknown> }>
): void {
  components.forEach((component) => {
    if (typeof component.preload === 'function') {
      component.preload()
    }
  })
}

/**
 * 基于路由的预加载
 */
export function preloadOnHover(
  preloadFn: () => Promise<unknown>
): React.MouseEventHandler {
  let preloaded = false

  return () => {
    if (!preloaded) {
      preloaded = true
      preloadFn()
    }
  }
}

export default lazyLoad
