/**
 * MessageInput 消息输入框组件
 * 包含自适应高度的 Textarea 和工具栏
 */

import { FC, useRef } from 'react'
import TextareaAutosize from 'react-textarea-autosize'

import { useMessageInputStyles } from './MessageInput.styles'

export interface MessageInputProps {
  /**
   * 输入值
   */
  value: string
  /**
   * 值变化回调
   */
  onChange: (value: string) => void
  /**
   * 发送消息回调
   */
  onSubmit: () => void
  /**
   * 附件回调
   */
  onAttach?: () => void
  /**
   * 图片回调
   */
  onImage?: () => void
  /**
   * 是否禁用
   */
  disabled?: boolean
  /**
   * 占位符文本
   */
  placeholder?: string
  /**
   * 最小行数
   */
  minRows?: number
  /**
   * 最大行数
   */
  maxRows?: number
}

export const MessageInput: FC<MessageInputProps> = ({
  value,
  onChange,
  onSubmit,
  onAttach,
  onImage,
  disabled = false,
  placeholder = '输入消息...',
  minRows = 1,
  maxRows = 10
}) => {
  const styles = useMessageInputStyles()
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (value.trim() && !disabled) {
        onSubmit()
      }
    }
  }

  return (
    <div className={styles.root}>
      <div className={styles.inputContainer}>
        {/* 使用 InputArea 样式中定义的 textarea 样式 */}
        <div className={styles.inputWrapper}>
          <TextareaAutosize
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            minRows={minRows}
            maxRows={maxRows}
            disabled={disabled}
            className={styles.textarea}
          />
        </div>

        {/* 圆形发送按钮 */}
        <button
          className={styles.sendButton}
          onClick={onSubmit}
          disabled={disabled || !value.trim()}
          aria-label="发送消息"
          title="发送消息 (Enter)"
        >
          ➤
        </button>
      </div>
    </div>
  )
}
