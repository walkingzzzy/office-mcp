/**
 * 批量确认对话框组件
 * 已迁移到 Tailwind + Radix Dialog
 */

import {
  WarningRegular
} from '@fluentui/react-icons'
import React, { useCallback, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import type { ToolOperationPreview } from '../../../services/ai/types'

export interface BatchConfirmDialogProps {
  open: boolean
  title?: string
  operations: ToolOperationPreview[]
  totalEstimatedTime: number
  highRiskCount: number
  onConfirm: (selectedIds: string[]) => void
  onCancel: () => void
  isExecuting?: boolean
  progress?: {
    current: number
    total: number
    currentOperation?: string
  }
}

export const BatchConfirmDialog: React.FC<BatchConfirmDialogProps> = ({
  open,
  title = '确认执行操作',
  operations,
  highRiskCount,
  onConfirm,
  onCancel,
  isExecuting = false,
  progress
}) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    new Set(operations.map((op) => op.id))
  )

  const toggleOperation = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }, [])

  const selectAll = useCallback(() => {
    setSelectedIds(new Set(operations.map((op) => op.id)))
  }, [operations])

  const deselectAll = useCallback(() => {
    setSelectedIds(new Set())
  }, [])

  const handleConfirm = useCallback(() => {
    onConfirm(Array.from(selectedIds))
  }, [onConfirm, selectedIds])

  const formatTime = (ms: number): string => {
    if (ms < 1000) return ms + ' ms'
    const seconds = Math.round(ms / 1000)
    if (seconds < 60) return seconds + ' s'
    const minutes = Math.round(seconds / 60)
    return minutes + ' min'
  }

  const selectedEstimatedTime = operations
    .filter((op) => selectedIds.has(op.id))
    .reduce((sum, op) => sum + op.estimatedTime, 0)

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <DialogContent className="max-w-[700px] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Select operations to execute
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[400px] overflow-y-auto">
          {isExecuting && progress ? (
            <div className="p-4">
              <div className="h-2 bg-muted rounded-full overflow-hidden mb-2">
                <div
                  className="h-full bg-primary rounded-full transition-all"
                  style={{ width: (progress.current / progress.total) * 100 + '%' }}
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Executing: {progress.currentOperation || '...'}</span>
                <span>{progress.current} / {progress.total}</span>
              </div>
            </div>
          ) : (
            <>
              <div className="flex justify-between items-center px-3 py-2 bg-muted rounded text-sm mb-3">
                <span>Selected {selectedIds.size} / {operations.length} operations</span>
                <span>Est. time: {formatTime(selectedEstimatedTime)}</span>
                {highRiskCount > 0 && (
                  <span className="text-destructive font-semibold flex items-center gap-1">
                    <WarningRegular className="h-4 w-4" /> {highRiskCount} high risk
                  </span>
                )}
              </div>

              <div className="flex flex-col gap-2">
                {operations.map((operation) => (
                  <div
                    key={operation.id}
                    className={cn(
                      'flex items-start gap-3 p-3 bg-muted/50 rounded-md',
                      operation.isHighRisk && 'bg-destructive/10'
                    )}
                  >
                    <Checkbox
                      checked={selectedIds.has(operation.id)}
                      onCheckedChange={() => toggleOperation(operation.id)}
                    />
                    <div className="flex-1">
                      <div className="font-semibold text-sm mb-1">
                        {operation.toolName}
                        {operation.isHighRisk && (
                          <span className="text-[11px] px-1.5 py-0.5 rounded bg-destructive/20 text-destructive ml-2">
                            High Risk
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground mb-1">
                        {operation.description}
                      </div>
                      <div className="text-[11px] text-muted-foreground/70">
                        {operation.parametersSummary}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {!isExecuting && (
          <DialogFooter className="flex justify-between">
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={selectAll}>
                Select All
              </Button>
              <Button variant="ghost" size="sm" onClick={deselectAll}>
                Deselect All
              </Button>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button onClick={handleConfirm} disabled={selectedIds.size === 0}>
                Confirm ({selectedIds.size})
              </Button>
            </div>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default BatchConfirmDialog
