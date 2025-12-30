/**
 * DocumentPreprocessingBanner - 文档预处理状态横幅 - 已注销
 * 显示文档加载和 AI 预处理的状态
 * 注意：此组件已被注销，目前用不上
 */

import {
  Button,
  makeStyles,
  MessageBar,
  MessageBarBody,
  MessageBarTitle,
  Spinner,
  tokens
} from '@fluentui/react-components'
import {
  DismissRegular,
  DocumentCheckmarkRegular,
  DocumentErrorRegular,
  SparkleRegular} from '@fluentui/react-icons'
import { FC } from 'react'

const useStyles = makeStyles({
  banner: {
    marginBottom: tokens.spacingVerticalM
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXS
  },
  analysis: {
    marginTop: tokens.spacingVerticalS,
    padding: tokens.spacingVerticalS,
    backgroundColor: tokens.colorNeutralBackground3,
    borderRadius: tokens.borderRadiusSmall,
    fontSize: tokens.fontSizeBase200,
    lineHeight: '1.5'
  },
  stats: {
    display: 'flex',
    gap: tokens.spacingHorizontalM,
    marginTop: tokens.spacingVerticalXS,
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3
  },
  actions: {
    display: 'flex',
    gap: tokens.spacingHorizontalS,
    marginTop: tokens.spacingVerticalS
  }
})

export interface DocumentPreprocessingBannerProps {
  /** 文档是否已加载 */
  documentLoaded: boolean
  /** 预处理中 */
  preprocessing: boolean
  /** 预处理完成 */
  preprocessed: boolean
  /** AI 分析结果 */
  analysis: string | null
  /** 错误信息 */
  error: string | null
  /** 文档统计 */
  stats: {
    characterCount: number
    paragraphCount: number
    wordCount: number
  } | null
  /** 重新处理回调 */
  onReprocess?: () => void
  /** 关闭回调 */
  onDismiss?: () => void
}

export const DocumentPreprocessingBanner: FC<DocumentPreprocessingBannerProps> = ({
  documentLoaded,
  preprocessing,
  preprocessed,
  analysis,
  error,
  stats,
  onReprocess,
  onDismiss
}) => {
  const styles = useStyles()

  // 不显示横幅的情况
  if (!documentLoaded && !preprocessing && !error) {
    return null
  }

  // 错误状态
  if (error) {
    return (
      <MessageBar
        intent="error"
        className={styles.banner}
        icon={<DocumentErrorRegular />}
      >
        <MessageBarBody>
          <MessageBarTitle>文档分析失败</MessageBarTitle>
          <div className={styles.content}>
            {error}
            {onReprocess && (
              <div className={styles.actions}>
                <Button size="small" onClick={onReprocess}>
                  重试
                </Button>
              </div>
            )}
          </div>
        </MessageBarBody>
      </MessageBar>
    )
  }

  // 预处理中
  if (preprocessing) {
    return (
      <MessageBar
        intent="info"
        className={styles.banner}
        icon={<Spinner size="tiny" />}
      >
        <MessageBarBody>
          <MessageBarTitle>正在分析文档...</MessageBarTitle>
          <div className={styles.content}>
            AI 正在阅读和理解您的文档内容，请稍候...
            {stats && (
              <div className={styles.stats}>
                <span>{stats.characterCount} 字符</span>
                <span>{stats.paragraphCount} 段落</span>
                <span>约 {stats.wordCount} 词</span>
              </div>
            )}
          </div>
        </MessageBarBody>
      </MessageBar>
    )
  }

  // 预处理完成
  if (preprocessed && analysis) {
    return (
      <MessageBar
        intent="success"
        className={styles.banner}
        icon={<SparkleRegular />}
      >
        <MessageBarBody>
          <MessageBarTitle>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>✨ 文档已分析</span>
              {onDismiss && (
                <Button
                  appearance="subtle"
                  icon={<DismissRegular />}
                  size="small"
                  onClick={onDismiss}
                  aria-label="关闭"
                />
              )}
            </div>
          </MessageBarTitle>
          <div className={styles.content}>
            <div className={styles.analysis}>
              {analysis}
            </div>
            {stats && (
              <div className={styles.stats}>
                <span>{stats.characterCount} 字符</span>
                <span>{stats.paragraphCount} 段落</span>
                <span>约 {stats.wordCount} 词</span>
              </div>
            )}
            {onReprocess && (
              <div className={styles.actions}>
                <Button size="small" appearance="subtle" onClick={onReprocess}>
                  重新分析
                </Button>
              </div>
            )}
          </div>
        </MessageBarBody>
      </MessageBar>
    )
  }

  // 仅加载文档但未预处理
  if (documentLoaded && !preprocessed) {
    return (
      <MessageBar
        intent="info"
        className={styles.banner}
        icon={<DocumentCheckmarkRegular />}
      >
        <MessageBarBody>
          <MessageBarTitle>文档已加载</MessageBarTitle>
          <div className={styles.content}>
            {stats && (
              <div className={styles.stats}>
                <span>{stats.characterCount} 字符</span>
                <span>{stats.paragraphCount} 段落</span>
                <span>约 {stats.wordCount} 词</span>
              </div>
            )}
          </div>
        </MessageBarBody>
      </MessageBar>
    )
  }

  return null
}
