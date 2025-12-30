/**
 * Toast 通知组件
 * 显示临时通知消息
 */

import React, { useEffect, useState, useCallback } from 'react'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface ToastMessage {
  id: string
  type: ToastType
  message: string
  duration?: number
}

interface ToastProps {
  toast: ToastMessage
  onClose: (id: string) => void
}

const typeStyles: Record<ToastType, { bg: string; icon: string }> = {
  success: { bg: 'bg-green-500', icon: '✓' },
  error: { bg: 'bg-red-500', icon: '✕' },
  warning: { bg: 'bg-yellow-500', icon: '⚠' },
  info: { bg: 'bg-blue-500', icon: 'ℹ' }
}

const Toast: React.FC<ToastProps> = ({ toast, onClose }) => {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)

    const timer = setTimeout(() => {
      setIsVisible(false)
      setTimeout(() => onClose(toast.id), 300)
    }, toast.duration || 3000)

    return () => clearTimeout(timer)
  }, [toast, onClose])

  const style = typeStyles[toast.type]

  return (
    <div
      className={`flex items-center gap-2 px-4 py-3 rounded-md shadow-lg text-white transition-all duration-300 ${
        style.bg
      } ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}
    >
      <span className="text-lg">{style.icon}</span>
      <span className="text-sm">{toast.message}</span>
      <button
        onClick={() => onClose(toast.id)}
        className="ml-2 opacity-70 hover:opacity-100"
      >
        ✕
      </button>
    </div>
  )
}

/**
 * Toast 容器组件
 */
interface ToastContainerProps {
  toasts: ToastMessage[]
  onClose: (id: string) => void
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'
}

export const ToastContainer: React.FC<ToastContainerProps> = ({
  toasts,
  onClose,
  position = 'top-right'
}) => {
  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4'
  }

  return (
    <div className={`fixed ${positionClasses[position]} z-50 space-y-2`}>
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onClose={onClose} />
      ))}
    </div>
  )
}

/**
 * Toast Hook
 */
export function useToast() {
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  const addToast = useCallback(
    (type: ToastType, message: string, duration?: number) => {
      const id = `toast_${Date.now()}_${Math.random().toString(36).slice(2)}`
      setToasts((prev) => [...prev, { id, type, message, duration }])
      return id
    },
    []
  )

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const success = useCallback(
    (message: string, duration?: number) => addToast('success', message, duration),
    [addToast]
  )

  const error = useCallback(
    (message: string, duration?: number) => addToast('error', message, duration),
    [addToast]
  )

  const warning = useCallback(
    (message: string, duration?: number) => addToast('warning', message, duration),
    [addToast]
  )

  const info = useCallback(
    (message: string, duration?: number) => addToast('info', message, duration),
    [addToast]
  )

  return {
    toasts,
    addToast,
    removeToast,
    success,
    error,
    warning,
    info
  }
}

export default ToastContainer
