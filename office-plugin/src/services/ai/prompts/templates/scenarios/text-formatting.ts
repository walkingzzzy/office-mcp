/**
 * 文本格式化场景提示词
 */

import type { PromptTemplate } from '../../types'

export const textFormattingPrompt: PromptTemplate = {
  id: 'text-formatting',
  priority: 60,
  content: `文本格式化操作包括：
- 字体样式：粗体、斜体、下划线、删除线
- 字体属性：字体名称、大小、颜色
- 段落格式：对齐方式、行距、缩进
- 列表格式：有序列表、无序列表`
}
