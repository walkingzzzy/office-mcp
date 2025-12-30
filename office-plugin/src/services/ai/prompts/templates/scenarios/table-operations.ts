/**
 * 表格操作场景提示词
 */

import type { PromptTemplate } from '../../types'

export const tableOperationsPrompt: PromptTemplate = {
  id: 'table-operations',
  priority: 60,
  content: `表格操作包括：
- 创建表格：指定行数和列数
- 编辑单元格：修改内容、合并单元格
- 格式化表格：边框、背景色、对齐
- 表格结构：添加/删除行列`
}
