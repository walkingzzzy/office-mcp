/**
 * 弹窗组件 - AI 科技感设计
 */

import { ReactNode, useEffect } from 'react'
import { X } from 'lucide-react'
import clsx from 'clsx'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
  footer?: ReactNode
}

export default function Modal({
  open,
  onClose,
  title,
  children,
  size = 'md',
  footer
}: ModalProps) {
  // ESC 键关闭弹窗
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (open) {
      document.addEventListener('keydown', handleEsc)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleEsc)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  const sizeStyles = {
    sm: 'max-w-sm',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 背景遮罩 - 降低透明度 */}
      <div
        className="absolute inset-0 modal-overlay backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* 弹窗内容 */}
      <div
        className={clsx(
          'relative glass border border-primary-500/20 rounded-2xl shadow-2xl shadow-primary-500/10 w-full mx-4 max-h-[90vh] flex flex-col',
          sizeStyles[size]
        )}
      >
        {/* 头部 */}
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'rgba(var(--color-primary), 0.1)' }}>
            <h2 className="text-lg font-semibold card-title flex items-center">
              <span className="w-1 h-5 rounded-full mr-3" style={{ background: 'linear-gradient(to bottom, rgb(var(--color-primary)), rgb(var(--color-accent)))' }} />
              {title}
            </h2>
            <button
              onClick={onClose}
              className="p-2 text-theme-muted hover:text-theme rounded-xl transition-all duration-300"
              style={{ backgroundColor: 'transparent' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(var(--color-surface), 0.5)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* 内容 */}
        <div className="flex-1 overflow-auto px-6 py-5">{children}</div>

        {/* 底部 */}
        {footer && (
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t rounded-b-2xl" style={{ borderColor: 'rgba(var(--color-primary), 0.1)', backgroundColor: 'rgba(var(--color-surface), 0.5)' }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
