/**
 * ConversationSidebar 样式 - 已迁移到 Tailwind
 */

export const conversationSidebarStyles = {
  root: 'flex flex-col h-full bg-background',
  header: 'flex flex-row justify-between items-center py-3 px-4 border-b border-border',
  headerTitle: 'text-base font-semibold text-foreground',
  body: 'flex-1 overflow-y-auto p-2',
  conversationItem: 'flex flex-row items-center py-2 px-4 my-0.5 rounded-md cursor-pointer bg-background hover:bg-muted',
  conversationItemActive: 'bg-primary/10 hover:bg-primary/15',
  conversationIcon: 'mr-2 text-muted-foreground',
  conversationContent: 'flex-1 min-w-0',
  conversationTitle: 'text-sm font-normal text-foreground whitespace-nowrap overflow-hidden text-ellipsis',
  conversationMeta: 'text-xs text-muted-foreground mt-0.5',
  conversationActions: 'flex gap-0.5',
  emptyState: 'flex flex-col items-center justify-center h-full p-6 text-muted-foreground',
  emptyIcon: 'text-5xl mb-4 text-muted-foreground/50',
  emptyText: 'text-sm text-center'
}

// 兼容旧代码
export const useConversationSidebarStyles = () => conversationSidebarStyles
