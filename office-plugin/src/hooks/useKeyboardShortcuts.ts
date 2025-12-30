/**
 * useKeyboardShortcuts Hook
 * 处理全局键盘快捷键
 */

import { useCallback, useEffect } from 'react'

export interface KeyboardShortcut {
  key: string
  ctrl?: boolean
  shift?: boolean
  alt?: boolean
  meta?: boolean
  handler: () => void
  description: string
}

export interface UseKeyboardShortcutsOptions {
  /**
   * 快捷键列表
   */
  shortcuts: KeyboardShortcut[]

  /**
   * 是否启用快捷键
   */
  enabled?: boolean

  /**
   * 是否阻止默认行为
   */
  preventDefault?: boolean
}

/**
 * 检查快捷键是否匹配
 */
function matchesShortcut(event: KeyboardEvent, shortcut: KeyboardShortcut): boolean {
  // 检查主键
  if (event.key.toLowerCase() !== shortcut.key.toLowerCase()) {
    return false
  }

  // 检查修饰键
  if (shortcut.ctrl !== undefined && event.ctrlKey !== shortcut.ctrl) {
    return false
  }

  if (shortcut.shift !== undefined && event.shiftKey !== shortcut.shift) {
    return false
  }

  if (shortcut.alt !== undefined && event.altKey !== shortcut.alt) {
    return false
  }

  if (shortcut.meta !== undefined && event.metaKey !== shortcut.meta) {
    return false
  }

  return true
}

/**
 * 格式化快捷键显示
 */
export function formatShortcut(shortcut: KeyboardShortcut): string {
  const parts: string[] = []

  if (shortcut.ctrl) parts.push('Ctrl')
  if (shortcut.shift) parts.push('Shift')
  if (shortcut.alt) parts.push('Alt')
  if (shortcut.meta) parts.push('Cmd')

  parts.push(shortcut.key.toUpperCase())

  return parts.join(' + ')
}

/**
 * 使用键盘快捷键
 */
export function useKeyboardShortcuts(options: UseKeyboardShortcutsOptions) {
  const { shortcuts, enabled = true, preventDefault = true } = options

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return

      // 如果焦点在输入框中，只处理特定的快捷键（如 Ctrl+Enter）
      const target = event.target as HTMLElement
      const isInputElement = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable

      for (const shortcut of shortcuts) {
        if (matchesShortcut(event, shortcut)) {
          // 如果在输入框中，只允许带修饰键的快捷键
          if (isInputElement && !shortcut.ctrl && !shortcut.meta && !shortcut.alt) {
            continue
          }

          if (preventDefault) {
            event.preventDefault()
          }

          shortcut.handler()
          break
        }
      }
    },
    [shortcuts, enabled, preventDefault]
  )

  useEffect(() => {
    if (!enabled) return

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleKeyDown, enabled])
}

/**
 * 常用快捷键配置
 */
export const CommonShortcuts = {
  /**
   * 发送消息 (Ctrl/Cmd + Enter)
   */
  sendMessage: (handler: () => void): KeyboardShortcut => ({
    key: 'Enter',
    ctrl: true,
    handler,
    description: '发送消息'
  }),

  /**
   * 新建对话 (Ctrl/Cmd + N)
   */
  newConversation: (handler: () => void): KeyboardShortcut => ({
    key: 'n',
    ctrl: true,
    handler,
    description: '新建对话'
  }),

  /**
   * 打开知识库选择器 (Ctrl/Cmd + K)
   */
  openKnowledgeSelector: (handler: () => void): KeyboardShortcut => ({
    key: 'k',
    ctrl: true,
    handler,
    description: '打开知识库选择器'
  }),

  /**
   * 打开 MCP 工具选择器 (Ctrl/Cmd + M)
   */
  openMCPSelector: (handler: () => void): KeyboardShortcut => ({
    key: 'm',
    ctrl: true,
    handler,
    description: '打开 MCP 工具选择器'
  }),

  /**
   * 打开对话列表 (Ctrl/Cmd + L)
   */
  openConversationList: (handler: () => void): KeyboardShortcut => ({
    key: 'l',
    ctrl: true,
    handler,
    description: '打开对话列表'
  }),

  /**
   * 关闭弹窗 (Escape)
   */
  closeDialog: (handler: () => void): KeyboardShortcut => ({
    key: 'Escape',
    handler,
    description: '关闭弹窗'
  }),

  /**
   * 停止生成 (Ctrl/Cmd + .)
   */
  stopGeneration: (handler: () => void): KeyboardShortcut => ({
    key: '.',
    ctrl: true,
    handler,
    description: '停止生成'
  }),

  /**
   * 聚焦输入框 (/)
   */
  focusInput: (handler: () => void): KeyboardShortcut => ({
    key: '/',
    handler,
    description: '聚焦输入框'
  })
}

export default useKeyboardShortcuts
