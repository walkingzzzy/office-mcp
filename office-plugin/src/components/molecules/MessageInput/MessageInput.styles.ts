/**
 * MessageInput 组件样式
 * 已迁移到 Tailwind
 */

export const messageInputStyles = {
  root: 'flex flex-col w-full',
  inputContainer: 'flex gap-2 items-end w-full',
  inputWrapper: 'flex-1 relative',
  textarea: 'w-full min-h-[44px] max-h-[200px] px-3 py-2.5 text-sm leading-relaxed bg-muted border border-border rounded-md resize-none transition-colors placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:bg-background disabled:opacity-50 disabled:cursor-not-allowed',
  sendButton: 'w-10 h-10 min-w-[40px] rounded-full bg-primary text-white border-none cursor-pointer flex items-center justify-center text-lg shrink-0 transition-all hover:bg-primary/90 hover:scale-105 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100',
}

export const useMessageInputStyles = () => messageInputStyles
