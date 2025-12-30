/**
 * ToastNotifications - 通知组件
 * 已迁移到 Tailwind + Lucide
 */

import {
  CheckmarkCircleRegular,
  DismissRegular,
  ErrorCircleRegular,
  InfoRegular,
  SpinnerIosRegular,
  WarningRegular
} from '@fluentui/react-icons'
import React, { useCallback, useEffect, useState } from 'react'

import { cn } from '@/lib/utils'
import Logger from '../../../utils/logger'

const logger = new Logger('ToastNotifications')

export interface ToastMessage {
  id: string
  type: 'success' | 'error' | 'warning' | 'info' | 'loading'
  title: string
  description?: string
  duration?: number
  action?: {
    label: string
    onPress: () => void
  }
  persistent?: boolean
}

/**
 * Toast 通知管理器
 */
export class ToastManager {
  private listeners: ((toasts: ToastMessage[]) => void)[] = []
  private toasts: ToastMessage[] = []
  private idCounter = 0

  subscribe(listener: (toasts: ToastMessage[]) => void) {
    this.listeners.push(listener)
    listener([...this.toasts])
    return () => {
      const index = this.listeners.indexOf(listener)
      if (index > -1) {
        this.listeners.splice(index, 1)
      }
    }
  }

  private notify() {
    this.listeners.forEach(listener => listener([...this.toasts]))
  }

  addToast(toast: Omit<ToastMessage, 'id'>): string {
    const id = `toast-${++this.idCounter}-${Date.now()}`
    const newToast: ToastMessage = { ...toast, id }
    this.toasts.push(newToast)

    // 自动移除非持久化的通知
    if (!newToast.persistent && newToast.type !== 'loading') {
      const duration = newToast.duration || this.getDefaultDuration(newToast.type)
      setTimeout(() => {
        this.removeToast(id)
      }, duration)
    }

    this.notify()
    return id
  }

  removeToast(id: string) {
    this.toasts = this.toasts.filter(toast => toast.id !== id)
    this.notify()
  }

  clearAll() {
    this.toasts = []
    this.notify()
  }

  success(title: string, description?: string, options?: Partial<Omit<ToastMessage, 'id' | 'type' | 'title'>>) {
    return this.addToast({
      type: 'success',
      title,
      description,
      ...options
    })
  }

  error(title: string, description?: string, options?: Partial<Omit<ToastMessage, 'id' | 'type' | 'title'>>) {
    return this.addToast({
      type: 'error',
      title,
      description,
      persistent: true,
      duration: 8000,
      ...options
    })
  }

  warning(title: string, description?: string, options?: Partial<Omit<ToastMessage, 'id' | 'type' | 'title'>>) {
    return this.addToast({
      type: 'warning',
      title,
      description,
      duration: 6000,
      ...options
    })
  }

  info(title: string, description?: string, options?: Partial<Omit<ToastMessage, 'id' | 'type' | 'title'>>) {
    return this.addToast({
      type: 'info',
      title,
      description,
      duration: 5000,
      ...options
    })
  }

  loading(title: string, description?: string, options?: Partial<Omit<ToastMessage, 'id' | 'type' | 'title'>>) {
    return this.addToast({
      type: 'loading',
      title,
      description,
      persistent: true,
      ...options
    })
  }

  private getDefaultDuration(type: ToastMessage['type']): number {
    switch (type) {
      case 'success': return 3000
      case 'error': return 8000
      case 'warning': return 6000
      case 'info': return 5000
      case 'loading': return 0 // loading 通知需要手动移除
      default: return 4000
    }
  }
}

// 全局 Toast 管理器实例
const globalToastManager = new ToastManager()

/**
 * Toast 通知 Hook
 */
export function useToasts() {
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  useEffect(() => {
    return globalToastManager.subscribe(setToasts)
  }, [])

  const addToast = useCallback((toast: Omit<ToastMessage, 'id'>) => {
    return globalToastManager.addToast(toast)
  }, [])

  const removeToast = useCallback((id: string) => {
    globalToastManager.removeToast(id)
  }, [])

  const clearAll = useCallback(() => {
    globalToastManager.clearAll()
  }, [])

  const success = useCallback((title: string, description?: string, options?: Partial<Omit<ToastMessage, 'id' | 'type' | 'title'>>) => {
    return globalToastManager.success(title, description, options)
  }, [])

  const error = useCallback((title: string, description?: string, options?: Partial<Omit<ToastMessage, 'id' | 'type' | 'title'>>) => {
    return globalToastManager.error(title, description, options)
  }, [])

  const warning = useCallback((title: string, description?: string, options?: Partial<Omit<ToastMessage, 'id' | 'type' | 'title'>>) => {
    return globalToastManager.warning(title, description, options)
  }, [])

  const info = useCallback((title: string, description?: string, options?: Partial<Omit<ToastMessage, 'id' | 'type' | 'title'>>) => {
    return globalToastManager.info(title, description, options)
  }, [])

  const loading = useCallback((title: string, description?: string, options?: Partial<Omit<ToastMessage, 'id' | 'type' | 'title'>>) => {
    return globalToastManager.loading(title, description, options)
  }, [])

  return {
    toasts,
    addToast,
    removeToast,
    clearAll,
    success,
    error,
    warning,
    info,
    loading
  }
}

// Toast 样式映射
const toastStyles: Record<ToastMessage['type'], { bg: string; border: string; icon: string }> = {
  success: { bg: 'bg-green-50', border: 'border-green-200', icon: 'text-green-600' },
  error: { bg: 'bg-red-50', border: 'border-red-200', icon: 'text-red-600' },
  warning: { bg: 'bg-orange-50', border: 'border-orange-200', icon: 'text-orange-600' },
  info: { bg: 'bg-blue-50', border: 'border-blue-200', icon: 'text-blue-600' },
  loading: { bg: 'bg-gray-50', border: 'border-primary', icon: 'text-primary' },
}

/**
 * Toast 通知组件
 * 已迁移到 Tailwind
 */
export const ToastNotifications: React.FC = () => {
  const { toasts, removeToast } = useToasts()

  const getToastIcon = (type: ToastMessage['type']) => {
    const iconClass = cn('h-5 w-5', toastStyles[type].icon)
    switch (type) {
      case 'success':
        return <CheckmarkCircleRegular className={iconClass} />
      case 'error':
        return <ErrorCircleRegular className={iconClass} />
      case 'warning':
        return <WarningRegular className={iconClass} />
      case 'info':
        return <InfoRegular className={iconClass} />
      case 'loading':
        return <SpinnerIosRegular className={cn(iconClass, 'animate-spin')} />
      default:
        return <InfoRegular className={iconClass} />
    }
  }

  return (
    <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-2 max-w-[400px]">
      {toasts.map((toast) => {
        const style = toastStyles[toast.type]
        return (
          <div
            key={toast.id}
            className={cn(
              'flex items-start gap-3 p-4 rounded-lg border shadow-lg min-w-[300px] animate-in slide-in-from-right duration-300 relative overflow-hidden',
              style.bg,
              style.border
            )}
          >
            {/* 加载动画条 */}
            {toast.type === 'loading' && (
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary via-muted-foreground to-primary animate-pulse" />
            )}

            {/* 图标 */}
            <div className="shrink-0">{getToastIcon(toast.type)}</div>

            {/* 内容 */}
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-foreground mb-0.5">
                {toast.title}
              </div>
              {toast.description && (
                <div className="text-xs text-muted-foreground leading-relaxed">
                  {toast.description}
                </div>
              )}

              {/* 操作按钮 */}
              {toast.action && (
                <button
                  onClick={toast.action.onPress}
                  className="mt-2 px-3 py-1 text-xs bg-white border border-border rounded hover:bg-muted transition"
                >
                  {toast.action.label}
                </button>
              )}
            </div>

            {/* 关闭按钮 */}
            {!toast.persistent && toast.type !== 'loading' && (
              <button
                onClick={() => removeToast(toast.id)}
                className="shrink-0 p-1 text-muted-foreground hover:text-foreground rounded transition"
              >
                <DismissRegular className="h-4 w-4" />
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
}

// 全局样式
const style = document.createElement('style')
style.textContent = `
  @keyframes slideInRight {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }

  @keyframes loadingSlide {
    from {
      transform: translateX(-100%);
    }
    to {
      transform: translateX(100%);
    }
  }
`
document.head.appendChild(style)

// 导出全局 Toast 管理器
export { globalToastManager as toastManager }

export default ToastNotifications