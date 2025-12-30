/**
 * 搜索替换场景提示词
 */

import type { PromptTemplate } from '../../types'

export const searchReplacePrompt: PromptTemplate = {
  id: 'search-replace',
  priority: 60,
  content: `搜索替换操作包括：
- 简单搜索：查找指定文本
- 替换操作：将找到的文本替换为新内容
- 批量替换：一次性替换所有匹配项
- 高级搜索：支持正则表达式和格式匹配`
}
