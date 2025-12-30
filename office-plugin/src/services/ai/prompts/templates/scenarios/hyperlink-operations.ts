/**
 * 超链接操作场景提示词
 */

import type { PromptTemplate } from '../../types'

export const hyperlinkOperationsPrompt: PromptTemplate = {
  id: 'hyperlink-operations',
  priority: 60,
  content: `超链接操作包括：
- 插入链接：为文本添加超链接
- 编辑链接：修改链接地址或显示文本
- 删除链接：移除超链接但保留文本
- 链接类型：网页链接、邮件链接、文档内链接`
}
