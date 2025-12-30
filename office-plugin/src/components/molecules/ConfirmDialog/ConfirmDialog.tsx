/**
 * 确认对话框组件
 * 已迁移到 Tailwind + Radix Dialog
 * 用于 Function Calling 中的用户确认机制
 */

import React from 'react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

export interface ConfirmDialogProps {
  /** 是否显示对话框 */
  open: boolean
  /** 对话框标题 */
  title?: string
  /** 确认消息内容 */
  message: string
  /** 确认按钮文本 */
  confirmText?: string
  /** 取消按钮文本 */
  cancelText?: string
  /** 确认回调 */
  onConfirm: () => void
  /** 取消回调 */
  onCancel: () => void
  /** 是否正在处理 */
  loading?: boolean
  /** 对话框类型 */
  type?: 'info' | 'warning' | 'error'
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  title = '确认操作',
  message,
  confirmText = '确认',
  cancelText = '取消',
  onConfirm,
  onCancel,
  loading = false,
  type = 'info'
}) => {
  const handleConfirm = () => {
    if (!loading) {
      onConfirm()
    }
  }

  const handleCancel = () => {
    if (!loading) {
      onCancel()
    }
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen: boolean) => !isOpen && onCancel()}>
      <DialogContent className="min-w-[400px] max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="mb-4">{title}</DialogTitle>
          <DialogDescription className="mb-6 leading-relaxed">
            {message}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex gap-3 justify-end">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={loading}
          >
            {cancelText}
          </Button>
          <Button
            variant={type === 'error' ? 'destructive' : 'default'}
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading ? '处理中...' : confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}