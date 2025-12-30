import {
  tokens,
  Badge,
  Button,
  Dialog,
  DialogSurface,
  DialogBody,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip
} from '@fluentui/react-components'
import {
  ArrowExportRegular,
  ArrowImportRegular,
  ArrowResetRegular,
  CheckmarkCircleRegular,
  ClockRegular,
  DeleteRegular,
  DismissRegular,
  HistoryRegular,
  InfoRegular
} from '@fluentui/react-icons'
import React, { useMemo, useState } from 'react'

import type { OperationRecord,UndoManager } from '../../../services/UndoManager'
import Logger from '../../../utils/logger'

const logger = new Logger('OperationHistoryPanel')

interface OperationHistoryPanelProps {
  /** 撤销管理器实例 */
  undoManager: UndoManager
  /** 是否显示面板 */
  visible: boolean
  /** 关闭面板的回调 */
  onClose: () => void
}

/**
 * 操作历史记录面板组件
 *
 * 显示所有操作的详细历史，支持查看、删除、导出等操作
 */
export const OperationHistoryPanel: React.FC<OperationHistoryPanelProps> = ({
  undoManager,
  visible,
  onClose
}) => {
  const [selectedOperation, setSelectedOperation] = useState<OperationRecord | null>(null)
  const [exportModalVisible, setExportModalVisible] = useState(false)
  const [importModalVisible, setImportModalVisible] = useState(false)

  // 获取操作历史
  const operations = useMemo(() => {
    return undoManager.getOperationHistory()
  }, [undoManager])

  // 获取统计信息
  const statistics = useMemo(() => {
    return undoManager.getUndoStatistics()
  }, [undoManager])

  // 格式化时间
  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(date)
  }

  // 获取操作类型的中文名称
  const getOperationTypeName = (type: OperationRecord['operationType']) => {
    const typeNames: Record<OperationRecord['operationType'], string> = {
      'find_and_replace': '查找替换',
      'delete_text': '删除文本',
      'insert_text': '插入文本',
      'format_text': '格式化',
      'custom': '自定义操作'
    }
    return typeNames[type] || type
  }

  // 获取操作类型图标
  const getOperationTypeIcon = (type: OperationRecord['operationType']) => {
    const iconMap: Record<OperationRecord['operationType'], JSX.Element> = {
      'find_and_replace': <CheckmarkCircleRegular />,
      'delete_text': <DeleteRegular />,
      'insert_text': <CheckmarkCircleRegular />,
      'format_text': <CheckmarkCircleRegular />,
      'custom': <InfoRegular />
    }
    return iconMap[type] || <InfoRegular />
  }

  // 处理删除操作
  const handleDeleteOperation = (operationId: string) => {
    // 这里可以实现删除单个操作的逻辑
    logger.info('Delete operation requested', { operationId })
  }

  // 处理清空历史
  const handleClearHistory = () => {
    undoManager.clearHistory()
    setSelectedOperation(null)
    logger.info('Operation history cleared')
  }

  // 处理导出历史
  const handleExportHistory = () => {
    try {
      const historyData = undoManager.exportHistory()
      const blob = new Blob([historyData], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `operation-history-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      logger.info('Operation history exported successfully')
      setExportModalVisible(false)
    } catch (error) {
      logger.error('Failed to export operation history', { error })
    }
  }

  // 处理导入历史
  const handleImportHistory = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string
        const success = undoManager.importHistory(content)
        if (success) {
          logger.info('Operation history imported successfully')
        } else {
          logger.error('Failed to import operation history')
        }
        setImportModalVisible(false)
      } catch (error) {
        logger.error('Failed to parse imported history', { error })
      }
    }
    reader.readAsText(file)
  }

  return (
    <>
      <Dialog open={visible} onOpenChange={(_, data) => !data.open && onClose()}>
        <DialogSurface style={{ maxWidth: '800px', width: '90vw' }}>
          <DialogBody>
            <DialogTitle
              action={
                <Button
                  appearance="subtle"
                  icon={<DismissRegular />}
                  onClick={onClose}
                />
              }
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalS }}>
                <HistoryRegular style={{ fontSize: '20px' }} />
                操作历史记录
              </div>
            </DialogTitle>
            <DialogContent>

        <div style={{ padding: tokens.spacingVerticalM }}>
          {/* 统计信息 */}
          <div
            style={{
              display: 'flex',
              gap: tokens.spacingHorizontalM,
              marginBottom: tokens.spacingVerticalL,
              padding: tokens.spacingVerticalM,
              backgroundColor: tokens.colorNeutralBackground2,
              borderRadius: tokens.borderRadiusMedium,
              border: `1px solid ${tokens.colorNeutralStroke2}`
            }}
          >
            <div style={{ flex: 1, textAlign: 'center' }}>
              <div style={{
                fontSize: tokens.fontSizeBase200,
                color: tokens.colorNeutralForeground2
              }}>
                总操作数
              </div>
              <div style={{
                fontSize: tokens.fontSizeBase400,
                fontWeight: tokens.fontWeightSemibold,
                color: tokens.colorNeutralForeground1,
                margin: `${tokens.spacingVerticalXS} 0`
              }}>
                {statistics.total}
              </div>
            </div>
            <div style={{ flex: 1, textAlign: 'center' }}>
              <div style={{
                fontSize: tokens.fontSizeBase200,
                color: tokens.colorNeutralForeground2
              }}>
                可撤销
              </div>
              <div style={{
                fontSize: tokens.fontSizeBase400,
                fontWeight: tokens.fontWeightSemibold,
                color: tokens.colorNeutralForeground1,
                margin: `${tokens.spacingVerticalXS} 0`
              }}>
                {statistics.undoable}
              </div>
            </div>
            <div style={{ flex: 1, textAlign: 'center' }}>
              <div style={{
                fontSize: tokens.fontSizeBase200,
                color: tokens.colorNeutralForeground2
              }}>
                已撤销
              </div>
              <div style={{
                fontSize: tokens.fontSizeBase400,
                fontWeight: tokens.fontWeightSemibold,
                color: tokens.colorNeutralForeground1,
                margin: `${tokens.spacingVerticalXS} 0`
              }}>
                {statistics.undone}
              </div>
            </div>
          </div>

          {/* 操作列表 */}
          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {operations.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: tokens.spacingVerticalXL,
                  color: tokens.colorNeutralForeground3
                }}
              >
                <HistoryRegular style={{ fontSize: '48px', marginBottom: tokens.spacingVerticalM }} />
                <div style={{
                  fontSize: tokens.fontSizeBase300,
                  fontWeight: tokens.fontWeightSemibold,
                  color: tokens.colorNeutralForeground1,
                  marginBottom: tokens.spacingVerticalS
                }}>
                  暂无操作记录
                </div>
                <div style={{
                  fontSize: tokens.fontSizeBase200,
                  color: tokens.colorNeutralForeground2
                }}>
                  执行文档操作后，历史记录将显示在这里
                </div>
              </div>
            ) : (
              <div>
                {operations.map((operation, index) => (
                  <div
                    key={operation.id}
                    style={{
                      padding: tokens.spacingVerticalM,
                      borderBottom: `1px solid ${tokens.colorNeutralStroke1}`,
                      cursor: 'pointer',
                      ...(selectedOperation?.id === operation.id && {
                        backgroundColor: tokens.colorNeutralBackground2
                      })
                    }}
                    onClick={() => setSelectedOperation(operation)}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: tokens.spacingHorizontalM,
                        width: '100%'
                      }}
                    >
                      {/* 操作类型图标 */}
                      <div style={{
                        fontSize: '16px',
                        color: operation.canUndo ? tokens.colorBrandForeground1 : tokens.colorNeutralForeground3
                      }}>
                        {getOperationTypeIcon(operation.operationType)}
                      </div>

                      {/* 操作信息 */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: tokens.spacingHorizontalS,
                            marginBottom: tokens.spacingVerticalXS
                          }}
                        >
                          <div
                            style={{
                              fontSize: tokens.fontSizeBase300,
                              fontWeight: tokens.fontWeightSemibold,
                              color: tokens.colorNeutralForeground1,
                              margin: 0
                            }}
                          >
                            {getOperationTypeName(operation.operationType)}
                          </div>
                          <Badge
                            color={operation.canUndo ? 'success' : 'informative'}
                            appearance="filled"
                            size="small"
                          >
                            {operation.canUndo ? '可撤销' : '已撤销'}
                          </Badge>
                        </div>
                        <div
                          style={{
                            fontSize: tokens.fontSizeBase200,
                            color: tokens.colorNeutralForeground2,
                            marginBottom: tokens.spacingVerticalXS
                          }}
                        >
                          {operation.description}
                        </div>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: tokens.spacingHorizontalS,
                            fontSize: '12px',
                            color: tokens.colorNeutralForeground3
                          }}
                        >
                          <ClockRegular />
                          <span>{formatTime(operation.timestamp)}</span>
                          <span>•</span>
                          <span>消息ID: {operation.messageId.slice(-8)}</span>
                        </div>
                      </div>

                      {/* 操作按钮 */}
                      <div style={{ display: 'flex', gap: tokens.spacingHorizontalXS }}>
                        {operation.canUndo && (
                          <Tooltip content="撤销此操作" relationship="label" positioning="above">
                            <Button
                              size="small"
                              appearance="subtle"
                              icon={<ArrowResetRegular />}
                              onClick={(e: React.MouseEvent) => {
                                e.stopPropagation()
                                undoManager.undoOperation(operation.id)
                              }}
                            />
                          </Tooltip>
                        )}
                        <Tooltip content="删除记录" relationship="label" positioning="above">
                          <Button
                            size="small"
                            appearance="subtle"
                            icon={<DeleteRegular />}
                            onClick={(e: React.MouseEvent) => {
                              e.stopPropagation()
                              handleDeleteOperation(operation.id)
                            }}
                          />
                        </Tooltip>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
            </DialogContent>
            <DialogActions>
              <div style={{ display: 'flex', gap: tokens.spacingHorizontalS }}>
                <Button
                  size="small"
                  appearance="subtle"
                  icon={<ArrowImportRegular />}
                  onClick={() => setImportModalVisible(true)}
                >
                  导入
                </Button>
                <Button
                  size="small"
                  appearance="subtle"
                  icon={<ArrowExportRegular />}
                  onClick={() => setExportModalVisible(true)}
                  disabled={operations.length === 0}
                >
                  导出
                </Button>
                <Button
                  size="small"
                  appearance="subtle"
                  onClick={handleClearHistory}
                  disabled={operations.length === 0}
                >
                  清空
                </Button>
              </div>
              <Button
                appearance="primary"
                onClick={onClose}
              >
                关闭
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>

      {/* 导入文件输入 */}
      <input
        ref={(input) => {
          if (input && importModalVisible) {
            input.click()
            setImportModalVisible(false)
          }
        }}
        type="file"
        accept=".json"
        style={{ display: 'none' }}
        onChange={handleImportHistory}
      />
    </>
  )
}

export default OperationHistoryPanel