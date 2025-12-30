/**
 * 详细示例提示词模板
 */

import type { PromptTemplate } from '../../types'

export const detailedExamplesPrompt: PromptTemplate = {
  id: 'detailed-examples',
  priority: 50,
  content: `以下是一些常见操作的示例：

1. 格式化文本为粗体：
   选中文本后，使用 formatText 工具，设置 bold: true

2. 插入表格：
   使用 insertTable 工具，指定 rows 和 columns 参数

3. 搜索替换：
   使用 searchAndReplace 工具，提供 searchText 和 replaceText 参数`
}
