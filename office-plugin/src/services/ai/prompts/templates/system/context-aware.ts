/**
 * 上下文感知提示词模板
 */

import type { PromptTemplate } from '../../types'

export const contextAwarePrompt: PromptTemplate = {
  id: 'context-aware',
  priority: 80,
  content: `请注意用户当前选中的内容，并根据选区类型提供相应的操作建议。
如果用户选中了文本，优先考虑文本相关的操作。
如果用户选中了表格，优先考虑表格相关的操作。
如果用户选中了图片，优先考虑图片相关的操作。`
}
