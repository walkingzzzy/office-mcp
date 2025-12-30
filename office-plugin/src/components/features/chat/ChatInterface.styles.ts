/**
 * ChatInterface 样式
 * 已迁移到 Tailwind - 使用类名映射
 */

// Tailwind 类名映射，替代 Fluent makeStyles
export const chatInterfaceStyles = {
  root: 'flex flex-col h-full w-full bg-transparent overflow-hidden relative',
  header: 'shrink-0 border-b border-border',
  messageList: 'flex-1 min-h-0 overflow-auto',
  inputArea: 'shrink-0',
}

// 兼容性钩子 - 返回相同的样式对象
export const useChatInterfaceStyles = () => chatInterfaceStyles
