/**
 * Markdown 渲染器组件
 * 已迁移到 Tailwind
 */

import 'highlight.js/styles/github-dark.css'

import hljs from 'highlight.js'
import MarkdownIt from 'markdown-it'
import React, { useMemo } from 'react'

import { cn } from '@/lib/utils'
import Logger from '../../../utils/logger'

const logger = new Logger('MarkdownRenderer')

// Tailwind markdown 样式类
const markdownStyles = `
  prose prose-sm max-w-none text-foreground
  prose-headings:text-foreground prose-headings:font-semibold
  prose-h1:text-xl prose-h1:mt-6 prose-h1:mb-3
  prose-h2:text-lg prose-h2:mt-5 prose-h2:mb-3
  prose-h3:text-base prose-h3:mt-4 prose-h3:mb-2
  prose-p:my-2 prose-p:leading-relaxed
  prose-ul:my-2 prose-ul:pl-6 prose-ol:my-2 prose-ol:pl-6
  prose-li:my-0.5
  prose-pre:bg-muted prose-pre:rounded-lg prose-pre:p-3 prose-pre:my-2 prose-pre:overflow-auto prose-pre:text-xs
  prose-code:font-mono prose-code:text-xs
  prose-code:bg-muted prose-code:rounded prose-code:px-1 prose-code:py-0.5 prose-code:text-primary
  prose-pre:prose-code:bg-transparent prose-pre:prose-code:p-0
  prose-blockquote:border-l-4 prose-blockquote:border-primary prose-blockquote:pl-4 prose-blockquote:my-2 prose-blockquote:text-muted-foreground
  prose-table:w-full prose-table:my-2
  prose-th:border prose-th:border-border prose-th:p-2 prose-th:text-left prose-th:bg-muted prose-th:font-semibold
  prose-td:border prose-td:border-border prose-td:p-2
  prose-a:text-primary prose-a:no-underline hover:prose-a:underline
  prose-hr:border-border prose-hr:my-4
`

/**
 * 组件属性
 */
export interface MarkdownRendererProps {
  /**
   * Markdown 内容
   */
  content: string

  /**
   * 自定义类名
   */
  className?: string

  /**
   * 是否启用代码高亮
   * @default true
   */
  enableHighlight?: boolean

  /**
   * 是否启用链接
   * @default true
   */
  enableLinks?: boolean

  /**
   * 是否启用 HTML
   * @default false
   */
  enableHtml?: boolean
}

/**
 * Markdown 渲染器组件
 */
export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  content,
  className,
  enableHighlight = true,
  enableLinks = true,
  enableHtml = false
}) => {

  /**
   * 配置 markdown-it 实例
   */
  const md = useMemo(() => {
    const instance = new MarkdownIt({
      html: enableHtml,
      linkify: enableLinks,
      typographer: true,
      highlight: enableHighlight
        ? (str: string, lang: string) => {
            if (lang && hljs.getLanguage(lang)) {
              try {
                return hljs.highlight(str, { language: lang }).value
              } catch (error) {
                console.warn('[MarkdownRenderer] Highlight error:', error)
              }
            }
            return '' // 使用默认转义
          }
        : undefined
    })

    // 自定义表格渲染，添加滚动容器
    instance.renderer.rules.table_open = () => {
      return '<div style="overflow-x: auto; max-width: 100%; margin-bottom: 1rem;"><table style="width: 100%; border-collapse: collapse;">'
    }
    instance.renderer.rules.table_close = () => {
      return '</table></div>'
    }

    return instance
  }, [enableHighlight, enableLinks, enableHtml])

  /**
   * 渲染 Markdown 内容
   */
  const htmlContent = useMemo(() => {
    try {
      return md.render(content)
    } catch (error) {
      logger.error('Render error', { error })
      return `<p>渲染错误: ${(error as Error).message}</p>`
    }
  }, [md, content])

  return (
    <div
      className={cn(markdownStyles, className)}
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  )
}

export default MarkdownRenderer

