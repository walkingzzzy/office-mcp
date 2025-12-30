/**
 * 键盘快捷键常量
 */

export const KEYBOARD_SHORTCUTS = {
  NEW_CONVERSATION: 'Ctrl+N',
  OPEN_CONVERSATION_LIST: 'Ctrl+K',
  FOCUS_INPUT: 'Ctrl+/',
  SEND_MESSAGE: 'Ctrl+Enter',
  CLOSE_DIALOG: 'Escape',
} as const

// Mac 平台快捷键
export const MAC_KEYBOARD_SHORTCUTS = {
  NEW_CONVERSATION: 'Cmd+N',
  OPEN_CONVERSATION_LIST: 'Cmd+K',
  FOCUS_INPUT: 'Cmd+/',
  SEND_MESSAGE: 'Cmd+Enter',
  CLOSE_DIALOG: 'Escape',
} as const
