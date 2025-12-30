/**
 * ConnectionBanner 样式 - 已迁移到 Tailwind
 */

export const connectionBannerStyles = {
  root: 'flex items-center justify-between py-3 px-4 bg-red-50 border-b border-red-200 gap-4',
  content: 'flex flex-col gap-0.5 flex-1 min-w-0',
  errorText: 'text-red-600',
  actions: 'flex items-center gap-2 shrink-0',
}

// 兼容旧代码
export const useConnectionBannerStyles = () => connectionBannerStyles
