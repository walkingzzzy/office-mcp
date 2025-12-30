import { tokens, Button } from '@fluentui/react-components'
import {
  CopyRegular,
  InfoRegular
} from '@fluentui/react-icons'
import React from 'react'

import type { Message } from '../../../types/messageBlock'
import Logger from '../../../utils/logger'

const logger = new Logger('QueryResultMessage')

interface QueryResultMessageProps {
  /** 消息内容 */
  message: Message
  /** 复制文本的回调 */
  onCopyText?: (text: string) => void
}

/**
 * 查询结果消息组件
 *
 * 用于显示 AI 查询结果，提供复制功能
 */
export const QueryResultMessage: React.FC<QueryResultMessageProps> = ({
  message,
  onCopyText
}) => {
  // 提取主文本内容
  const getQueryResultText = (): string => {
    const mainTextBlock = message.blocks.find(
      block => (block.type as any) === 'MAIN_TEXT'
    )
    return (mainTextBlock as any)?.content || ''
  }

  // 获取结果的摘要
  const getResultSummary = (): string => {
    const text = getQueryResultText()
    if (text.length <= 150) {
      return text
    }
    return text.substring(0, 150) + '...'
  }

  // 处理复制文本
  const handleCopyText = () => {
    const text = getQueryResultText()
    logger.info('Copy query result requested', {
      messageId: message.id,
      textLength: text.length
    })
    onCopyText?.(text)
  }

  const resultText = getQueryResultText()
  const summary = getResultSummary()

  return (
    <div
      className="query-result-message"
      style={{
        backgroundColor: tokens.colorNeutralBackground1,
        border: `1px solid ${tokens.colorNeutralStroke2}`,
        borderRadius: tokens.borderRadiusMedium,
        padding: tokens.spacingVerticalM,
        margin: `${tokens.spacingVerticalS} 0`
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: tokens.spacingHorizontalM }}>
        {/* 信息图标 */}
        <div style={{ flexShrink: 0 }}>
          <InfoRegular
            style={{
              width: 16,
              height: 16,
              color: tokens.colorNeutralForeground3
            }}
          />
        </div>

        {/* 消息内容 */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: tokens.fontSizeBase300,
            fontWeight: tokens.fontWeightSemibold,
            color: tokens.colorNeutralForeground1,
            marginBottom: tokens.spacingVerticalXS
          }}>
            查询结果
          </div>

          <div style={{
            fontSize: tokens.fontSizeBase200,
            color: tokens.colorNeutralForeground2,
            lineHeight: tokens.lineHeightBase300
          }}>
            {summary}
          </div>

          {/* 完整结果展示 */}
          {resultText.length > 150 && (
            <details style={{ marginTop: tokens.spacingVerticalS }}>
              <summary
                style={{
                  cursor: 'pointer',
                  fontSize: tokens.fontSizeBase200,
                  color: tokens.colorNeutralForeground3
                }}
              >
                查看完整结果
              </summary>
              <div
                style={{
                  marginTop: tokens.spacingVerticalXS,
                  padding: tokens.spacingVerticalS,
                  backgroundColor: tokens.colorNeutralBackground2,
                  borderRadius: tokens.borderRadiusSmall,
                  border: `1px solid ${tokens.colorNeutralStroke1}`,
                  fontSize: tokens.fontSizeBase200,
                  lineHeight: tokens.lineHeightBase300,
                  maxHeight: '400px',
                  overflowY: 'auto'
                }}
              >
                {resultText}
              </div>
            </details>
          )}
        </div>

        {/* 操作按钮 */}
        <div style={{
          flexShrink: 0,
          display: 'flex',
          gap: tokens.spacingHorizontalS,
          alignItems: 'flex-start'
        }}>
          <Button
            size="small"
            appearance="subtle"
            icon={<CopyRegular style={{ width: 16, height: 16 }} />}
            onClick={handleCopyText}
            style={{ fontSize: tokens.fontSizeBase200 }}
          >
            复制结果
          </Button>
        </div>
      </div>
    </div>
  )
}

export default QueryResultMessage
