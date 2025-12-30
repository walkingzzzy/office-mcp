/**
 * Office 插件兼容的确认对话框 Hook
 * 使用 Fluent UI Dialog 替代 window.confirm
 */

import {
  Button,
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle} from '@fluentui/react-components'
import { useCallback,useState } from 'react'

interface ConfirmDialogOptions {
  title?: string
  message: string
  confirmText?: string
  cancelText?: string
}

interface ConfirmDialogState {
  isOpen: boolean
  options: ConfirmDialogOptions
  resolver?: (value: boolean) => void
}

export function useConfirmDialog() {
  const [state, setState] = useState<ConfirmDialogState>({
    isOpen: false,
    options: { message: '' }
  })

  const confirm = useCallback((options: ConfirmDialogOptions | string): Promise<boolean> => {
    return new Promise<boolean>((resolve) => {
      const dialogOptions: ConfirmDialogOptions = typeof options === 'string'
        ? { message: options }
        : options

      setState({
        isOpen: true,
        options: {
          title: dialogOptions.title || '确认',
          message: dialogOptions.message,
          confirmText: dialogOptions.confirmText || '确定',
          cancelText: dialogOptions.cancelText || '取消'
        },
        resolver: resolve
      })
    })
  }, [])

  const handleConfirm = useCallback(() => {
    state.resolver?.(true)
    setState(prev => ({ ...prev, isOpen: false, resolver: undefined }))
  }, [state.resolver])

  const handleCancel = useCallback(() => {
    state.resolver?.(false)
    setState(prev => ({ ...prev, isOpen: false, resolver: undefined }))
  }, [state.resolver])

  const ConfirmDialog = useCallback(() => (
    <Dialog
      open={state.isOpen}
      onOpenChange={(_, data) => {
        if (!data.open) {
          handleCancel()
        }
      }}
    >
      <DialogSurface>
        <DialogBody>
          <DialogTitle>{state.options.title}</DialogTitle>
          <DialogContent>
            {state.options.message}
          </DialogContent>
          <DialogActions>
            <Button appearance="secondary" onClick={handleCancel}>
              {state.options.cancelText}
            </Button>
            <Button appearance="primary" onClick={handleConfirm}>
              {state.options.confirmText}
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  ), [state, handleConfirm, handleCancel])

  return {
    confirm,
    ConfirmDialog
  }
}
