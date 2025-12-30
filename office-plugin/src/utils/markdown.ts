/**
 * Markdown 渲染工具
 * 使用 markdown-it 和 highlight.js
 */

import hljs from 'highlight.js'
import MarkdownIt from 'markdown-it'
import type Token from 'markdown-it/lib/token.mjs'
import type Renderer from 'markdown-it/lib/renderer.mjs'

import Logger from './logger'

const logger = new Logger('Markdown')

// markdown-it 选项类型
type MdOptions = MarkdownIt['options']

/**
 * Markdown 渲染器配置
 */
export interface MarkdownRendererOptions {
  /**
   * 是否启用 HTML 标签
   * @default false
   */
  html?: boolean

  /**
   * 是否自动将 URL 转换为链接
   * @default true
   */
  linkify?: boolean

  /**
   * 是否启用排版优化
   * @default true
   */
  typographer?: boolean

  /**
   * 是否启用代码高亮
   * @default true
   */
  highlight?: boolean

  /**
   * 是否在新标签页打开链接
   * @default true
   */
  targetBlank?: boolean
}

/**
 * 创建 Markdown 渲染器
 */
export function createMarkdownRenderer(options: MarkdownRendererOptions = {}): MarkdownIt {
  const { html = false, linkify = true, typographer = true, highlight = true, targetBlank = true } = options

  const md: MarkdownIt = new MarkdownIt({
    html,
    linkify,
    typographer,
    highlight: highlight
      ? (str: string, lang: string): string => {
          if (lang && hljs.getLanguage(lang)) {
            try {
              return `<pre class="hljs"><code class="language-${lang}">${hljs.highlight(str, { language: lang, ignoreIllegals: true }).value}</code></pre>`
            } catch (error) {
              logger.error('Highlight error', { error, lang })
            }
          }
          return `<pre class="hljs"><code>${md.utils.escapeHtml(str)}</code></pre>`
        }
      : undefined
  })

  // 自定义链接渲染规则（在新标签页打开）
  if (targetBlank) {
    const defaultRender =
      md.renderer.rules.link_open ||
      function (tokens: Token[], idx: number, options: MdOptions, _env: unknown, self: Renderer) {
        return self.renderToken(tokens, idx, options)
      }

    md.renderer.rules.link_open = function (tokens: Token[], idx: number, options: MdOptions, env: unknown, self: Renderer) {
      const aIndex = tokens[idx].attrIndex('target')

      if (aIndex < 0) {
        tokens[idx].attrPush(['target', '_blank'])
      } else {
        tokens[idx].attrs![aIndex][1] = '_blank'
      }

      // 添加 rel="noopener noreferrer" 以提高安全性
      const relIndex = tokens[idx].attrIndex('rel')
      if (relIndex < 0) {
        tokens[idx].attrPush(['rel', 'noopener noreferrer'])
      } else {
        tokens[idx].attrs![relIndex][1] = 'noopener noreferrer'
      }

      return defaultRender(tokens, idx, options, env, self)
    }
  }

  return md
}

/**
 * 默认 Markdown 渲染器实例
 */
export const markdownRenderer = createMarkdownRenderer()

/**
 * 渲染 Markdown 文本为 HTML
 */
export function renderMarkdown(text: string, options?: MarkdownRendererOptions): string {
  if (!text) {
    return ''
  }

  try {
    if (options) {
      const customRenderer = createMarkdownRenderer(options)
      return customRenderer.render(text)
    }
    return markdownRenderer.render(text)
  } catch (error) {
    logger.error('Markdown render error', { error })
    return text
  }
}

/**
 * 渲染 Markdown 文本为 HTML（内联模式，不包含 <p> 标签）
 */
export function renderMarkdownInline(text: string, options?: MarkdownRendererOptions): string {
  if (!text) {
    return ''
  }

  try {
    if (options) {
      const customRenderer = createMarkdownRenderer(options)
      return customRenderer.renderInline(text)
    }
    return markdownRenderer.renderInline(text)
  } catch (error) {
    logger.error('Markdown inline render error', { error })
    return text
  }
}

/**
 * 从 HTML 中提取纯文本
 */
export function extractTextFromHTML(html: string): string {
  const div = document.createElement('div')
  div.innerHTML = html
  return div.textContent || div.innerText || ''
}

/**
 * 检测文本是否包含 Markdown 语法
 */
export function hasMarkdownSyntax(text: string): boolean {
  if (!text) {
    return false
  }

  // 检测常见的 Markdown 语法
  const markdownPatterns = [
    /^#{1,6}\s/, // 标题
    /\*\*.*\*\*/, // 粗体
    /\*.*\*/, // 斜体
    /\[.*\]\(.*\)/, // 链接
    /!\[.*\]\(.*\)/, // 图片
    /^```/, // 代码块
    /`.*`/, // 行内代码
    /^[-*+]\s/, // 无序列表
    /^\d+\.\s/, // 有序列表
    /^>\s/, // 引用
    /\|.*\|/, // 表格
    /^---$/, // 分隔线
    /~~.*~~/ // 删除线
  ]

  return markdownPatterns.some((pattern) => pattern.test(text))
}

/**
 * 从 Markdown 文本中提取代码块
 */
export function extractCodeBlocks(text: string): Array<{ lang: string; code: string }> {
  const codeBlocks: Array<{ lang: string; code: string }> = []
  const regex = /```(\w+)?\n([\s\S]*?)```/g
  let match

  while ((match = regex.exec(text)) !== null) {
    codeBlocks.push({
      lang: match[1] || 'text',
      code: match[2].trim()
    })
  }

  return codeBlocks
}

/**
 * 高亮代码
 */
export function highlightCode(code: string, lang: string): string {
  if (!code) {
    return ''
  }

  try {
    if (lang && hljs.getLanguage(lang)) {
      return hljs.highlight(code, { language: lang, ignoreIllegals: true }).value
    }
    return hljs.highlightAuto(code).value
  } catch (error) {
    logger.error('Code highlight error', { error, lang })
    return code
  }
}

/**
 * 获取支持的语言列表
 */
export function getSupportedLanguages(): string[] {
  return hljs.listLanguages()
}

/**
 * 检测代码语言
 */
export function detectLanguage(code: string): string {
  if (!code) {
    return 'text'
  }

  try {
    const result = hljs.highlightAuto(code)
    return result.language || 'text'
  } catch (error) {
    logger.error('Language detection error', { error })
    return 'text'
  }
}

/**
 * 清理 HTML（移除危险标签和属性）
 */
export function sanitizeHTML(html: string): string {
  const div = document.createElement('div')
  div.innerHTML = html

  // 移除 script 标签
  const scripts = div.querySelectorAll('script')
  scripts.forEach((script) => script.remove())

  // 移除 iframe 标签
  const iframes = div.querySelectorAll('iframe')
  iframes.forEach((iframe) => iframe.remove())

  // 移除 on* 事件属性
  const allElements = div.querySelectorAll('*')
  allElements.forEach((element) => {
    Array.from(element.attributes).forEach((attr) => {
      if (attr.name.startsWith('on')) {
        element.removeAttribute(attr.name)
      }
    })
  })

  return div.innerHTML
}
