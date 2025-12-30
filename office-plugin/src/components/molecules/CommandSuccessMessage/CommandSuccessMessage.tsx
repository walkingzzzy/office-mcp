import { tokens, Button } from '@fluentui/react-components'
import {
  ArrowUndoRegular,
  CheckmarkCircleRegular,
  InfoRegular
} from '@fluentui/react-icons'
import React from 'react'

import type { ToolMessageBlock } from '../../../types/messageBlock'
import { MessageBlockStatus } from '../../../types/messageBlock'
import Logger from '../../../utils/logger'

const logger = new Logger('CommandSuccessMessage')

interface CommandSuccessMessageProps {
  /** 工具调用结果 */
  toolBlocks: ToolMessageBlock[]
  /** 撤销操作回调 */
  onUndo?: () => void
  /** 查看详情回调 */
  onViewDetails?: () => void
}

/**
 * 命令执行成功消息组件
 *
 * 用于显示 AI 函数调用（如 find_and_replace_text）执行结果的简单提示
 * 提供撤销操作和查看详情的选项
 */
export const CommandSuccessMessage: React.FC<CommandSuccessMessageProps> = ({
  toolBlocks,
  onUndo,
  onViewDetails
}) => {
  // 提取工具执行结果摘要
  const getExecutionSummary = () => {
    const successfulTools = toolBlocks.filter(block => block.status === MessageBlockStatus.SUCCESS)
    const failedTools = toolBlocks.filter(block => block.status === MessageBlockStatus.ERROR)

    if (successfulTools.length === 0) {
      return {
        title: '执行失败',
        description: '工具调用执行失败',
        type: 'error' as const,
        details: failedTools.map(block => `${block.toolName}: ${block.content}`)
      }
    }

    // 根据工具类型生成不同的摘要
    const summaries: string[] = []
    const details: string[] = []

    successfulTools.forEach(block => {
      const { toolName, content } = block

      switch (toolName) {
        case 'find_and_replace_text':
          // 尝试从内容中提取替换信息
          let replaceMatch
          if (typeof content === 'string') {
            replaceMatch = content.match(/(\d+)\s*处?替换|替换了?\s*(\d+)/)
          }
          const count = replaceMatch ? replaceMatch[1] || replaceMatch[2] : '多'
          summaries.push(`成功替换 ${count} 处文本`)
          details.push(`查找替换: ${content}`)
          break

        case 'delete_text':
          summaries.push('成功删除指定内容')
          details.push(`删除操作: ${content}`)
          break

        case 'insert_text':
          summaries.push('成功插入文本')
          details.push(`插入操作: ${content}`)
          break

        case 'format_text':
          summaries.push('成功应用格式')
          details.push(`格式调整: ${content}`)
          break

        default:
          summaries.push(`${toolName} 执行完成`)
          details.push(`${toolName}: ${content}`)
          break
      }
    })

    // 如果有失败的执行，也包含在详情中
    failedTools.forEach(block => {
      details.push(`❌ ${block.toolName}: ${block.content}`)
    })

    return {
      title: '执行完成',
      description: summaries.join('；'),
      type: 'success' as const,
      details: details.length > 0 ? details : undefined
    }
  }

  const summary = getExecutionSummary()

  const handleUndo = () => {
    logger.info('Undo operation requested', {
      toolCount: toolBlocks.length,
      tools: toolBlocks.map(block => block.toolName)
    })
    onUndo?.()
  }

  const handleViewDetails = () => {
    logger.info('View details requested', {
      toolCount: toolBlocks.length,
      summary: summary.description
    })
    onViewDetails?.()
  }

  return (
    <div
      className="command-success-message"
      style={{
        backgroundColor: summary.type === 'success' ? tokens.colorPaletteGreenBackground1 : tokens.colorNeutralBackground2,
        border: `1px solid ${summary.type === 'success' ? tokens.colorPaletteGreenBorder1 : tokens.colorNeutralStroke2}`,
        borderRadius: tokens.borderRadiusMedium,
        padding: tokens.spacingVerticalM,
        margin: `${tokens.spacingVerticalS} 0`
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: tokens.spacingHorizontalM }}>
        {/* 成功图标 */}
        <div style={{ flexShrink: 0 }}>
          {summary.type === 'success' ? (
            <CheckmarkCircleRegular
              style={{
                width: 16,
                height: 16,
                color: tokens.colorPaletteGreenForeground1
              }}
            />
          ) : (
            <InfoRegular
              style={{
                width: 16,
                height: 16,
                color: tokens.colorNeutralForeground3
              }}
            />
          )}
        </div>

        {/* 消息内容 */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: tokens.fontSizeBase300,
            fontWeight: tokens.fontWeightSemibold,
            color: tokens.colorNeutralForeground1
          }}>
            {summary.title}
          </div>
          <div style={{
            fontSize: tokens.fontSizeBase200,
            color: tokens.colorNeutralForeground2,
            marginTop: tokens.spacingVerticalXS
          }}>
            {summary.description}
          </div>

          {/* 工具详情 */}
          {summary.details && summary.details.length > 0 && (
            <div style={{ marginTop: tokens.spacingVerticalS }}>
              <details>
                <summary
                  style={{
                    cursor: 'pointer',
                    fontSize: tokens.fontSizeBase200,
                    color: tokens.colorNeutralForeground3
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.color = tokens.colorNeutralForeground2
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.color = tokens.colorNeutralForeground3
                  }}
                >
                  查看执行详情
                </summary>
                <ul style={{
                  marginTop: tokens.spacingVerticalXS,
                  marginLeft: tokens.spacingHorizontalL,
                  fontSize: tokens.fontSizeBase200,
                  color: tokens.colorNeutralForeground3,
                  listStyle: 'disc',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: tokens.spacingVerticalXS
                }}>
                  {summary.details.map((detail, index) => (
                    <li key={index}>
                      {detail}
                    </li>
                  ))}
                </ul>
              </details>
            </div>
          )}
        </div>

        {/* 操作按钮 */}
        <div style={{
          flexShrink: 0,
          display: 'flex',
          gap: tokens.spacingHorizontalS,
          alignItems: 'flex-start'
        }}>
          {summary.type === 'success' && onUndo && (
            <Button
              size="small"
              appearance="subtle"
              icon={<ArrowUndoRegular style={{ width: 16, height: 16 }} />}
              onClick={handleUndo}
              style={{ fontSize: tokens.fontSizeBase200 }}
            >
              撤销
            </Button>
          )}

          {onViewDetails && (
            <Button
              size="small"
              appearance="subtle"
              onClick={handleViewDetails}
              style={{ fontSize: tokens.fontSizeBase200, color: tokens.colorBrandForeground1 }}
            >
              详情
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

export default CommandSuccessMessage
