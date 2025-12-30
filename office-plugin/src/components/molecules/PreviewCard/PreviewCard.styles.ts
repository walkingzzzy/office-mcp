/**
 * 预览卡片样式
 * 已迁移到 Tailwind
 */

export const previewCardStyles = {
  card: 'p-4 rounded-lg bg-card shadow-md max-w-full my-2',
  headerIcon: 'text-primary',
  headerContent: 'flex items-center gap-2',
  headerText: 'text-foreground',
  descriptionText: 'text-muted-foreground',
  undoWarning: 'text-yellow-600',
  warningsSummary: 'flex flex-col gap-1 px-3 py-2 rounded-md bg-yellow-50 my-3',
  warningItem: 'flex items-center gap-2 text-xs text-yellow-700',
  warningIcon: 'text-base text-yellow-600 shrink-0',
  operationList: 'flex flex-col gap-2 mt-3',
  stepWrapper: 'flex gap-3',
  stepNumber: 'flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-semibold shrink-0',
  operationItem: 'flex-1 p-3 rounded-md bg-muted/50 flex flex-col gap-2',
  operationHeader: 'flex justify-between items-center gap-2',
  operationDescription: 'text-sm text-foreground flex-1',
  operationMeta: 'flex items-center gap-3 text-xs text-muted-foreground',
  metaItem: 'flex items-center gap-1',
  metaIcon: 'text-sm',
  changesSection: 'flex flex-col gap-1 p-2 rounded bg-muted',
  changeItem: 'flex items-center gap-2 text-xs',
  changeProperty: 'text-muted-foreground min-w-[60px]',
  changeValue: 'flex items-center gap-1',
  originalValue: 'text-destructive line-through',
  arrow: 'text-muted-foreground',
  newValue: 'text-green-600 font-semibold',
  changeScope: 'text-muted-foreground text-[10px]',
  warningsSection: 'flex flex-col gap-1 mt-1',
  actions: 'flex justify-end gap-2 mt-4 pt-3 border-t border-border',
}

export const usePreviewCardStyles = () => previewCardStyles
