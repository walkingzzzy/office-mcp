/**
 * BatchConfirmDialog 样式
 * 已迁移到 Tailwind
 */

export const batchConfirmDialogStyles = {
  surface: 'min-w-[500px] max-w-[700px] max-h-[80vh]',
  title: 'mb-4',
  content: 'max-h-[400px] overflow-y-auto mb-4',
  summary: 'flex justify-between items-center px-3 py-2 bg-muted rounded text-[13px] mb-3',
  highRiskBadge: 'text-destructive font-semibold',
  operationList: 'flex flex-col gap-2',
  operationItem: 'flex items-start gap-3 p-3 bg-muted/50 rounded-md',
  operationItemHighRisk: 'bg-destructive/10',
  operationContent: 'flex-1',
  operationName: 'font-semibold text-[13px] mb-1',
  operationBadge: 'text-[11px] px-1.5 py-0.5 rounded bg-destructive/20 text-destructive ml-2',
  operationDescription: 'text-xs text-muted-foreground mb-1',
  operationParams: 'text-[11px] text-muted-foreground/70',
  actions: 'flex justify-between gap-3',
  actionButtons: 'flex gap-2',
  selectActions: 'flex gap-2',
  progressContainer: 'p-4',
  progressBar: 'w-full mb-2',
  progressText: 'text-xs text-muted-foreground',
}

export const useBatchConfirmDialogStyles = () => batchConfirmDialogStyles
