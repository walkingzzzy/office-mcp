import { tokens, Button } from '@fluentui/react-components'
import {
  CheckmarkRegular,
  CopyRegular,
  EditRegular
} from '@fluentui/react-icons'
import React from 'react'

import type { Message } from '../../../types/messageBlock'
import { MessageBlockType } from '../../../types/messageBlock'
import Logger from '../../../utils/logger'

const logger = new Logger('EditSuggestionMessage')

interface EditSuggestionMessageProps {
  /** 消息内容 */
  message: Message
  /** 应用到文档的回调 */
  onApplyToDocument?: (messageId: string) => void
  /** 复制文本的回调 */
  onCopyText?: (text: string) => void
}

/**
 * 编辑建议消息组件
 *
 * 用于显示 AI 改写建议，提供应用到文档的选项
 */
export const EditSuggestionMessage: React.FC<EditSuggestionMessageProps> = ({
  message,
  onApplyToDocument,
  onCopyText
}) => {
  // 提取主文本内容
  const getSuggestionText = (): string => {
    const mainTextBlock = message.blocks.find(
      block => block.type === MessageBlockType.MAIN_TEXT
    ) as any
    return mainTextBlock?.content || ''
  }

  // 获取建议的摘要
  const getSuggestionSummary = (): string => {
    const text = getSuggestionText()
    if (text.length <= 100) {
      return text
    }
    return text.substring(0, 100) + '...'
  }

  // 处理应用到文档
  const handleApplyToDocument = () => {
    logger.info('Apply to document requested', {
      messageId: message.id,
      textLength: getSuggestionText().length
    })
    onApplyToDocument?.(message.id)
  }

  // 处理复制文本
  const handleCopyText = () => {
    const text = getSuggestionText()
    logger.info('Copy text requested', {
      messageId: message.id,
      textLength: text.length
    })
    onCopyText?.(text)
  }

  const suggestionText = getSuggestionText()
  const summary = getSuggestionSummary()

  return (
    <div
      className="edit-suggestion-message"
      style={{
        backgroundColor: tokens.colorNeutralBackground2,
        border: `1px solid ${tokens.colorNeutralStroke2}`,
        borderRadius: tokens.borderRadiusMedium,
        padding: tokens.spacingVerticalM,
        margin: `${tokens.spacingVerticalS} 0`
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: tokens.spacingHorizontalM }}>
        {/* 建议图标 */}
        <div style={{ flexShrink: 0 }}>
          <EditRegular
            style={{
              width: 16,
              height: 16,
              color: tokens.colorBrandForeground1
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
            改写建议
          </div>

          <div style={{
            fontSize: tokens.fontSizeBase200,
            color: tokens.colorNeutralForeground2,
            lineHeight: tokens.lineHeightBase300
          }}>
            {summary}
          </div>

          {/* 完整文本展示 */}
          {suggestionText.length > 100 && (
            <details style={{ marginTop: tokens.spacingVerticalS }}>
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
                查看完整建议
              </summary>
              <div
                style={{
                  marginTop: tokens.spacingVerticalXS,
                  padding: tokens.spacingVerticalS,
                  backgroundColor: tokens.colorNeutralBackground1,
                  borderRadius: tokens.borderRadiusSmall,
                  border: `1px solid ${tokens.colorNeutralStroke1}`,
                  fontSize: tokens.fontSizeBase200,
                  lineHeight: tokens.lineHeightBase300,
                  maxHeight: '300px',
                  overflowY: 'auto'
                }}
              >
                {suggestionText}
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
            appearance="primary"
            icon={<CheckmarkRegular style={{ width: 16, height: 16 }} />}
            onClick={handleApplyToDocument}
            style={{ fontSize: tokens.fontSizeBase200 }}
          >
            应用到文档
          </Button>

          <Button
            size="small"
            appearance="subtle"
            icon={<CopyRegular style={{ width: 16, height: 16 }} />}
            onClick={handleCopyText}
            style={{ fontSize: tokens.fontSizeBase200 }}
          >
            复制文本
          </Button>
        </div>
      </div>
    </div>
  )
}

export default EditSuggestionMessage
