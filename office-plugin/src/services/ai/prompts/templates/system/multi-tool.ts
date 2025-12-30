/**
 * 多工具调用提示词模板
 */

import type { PromptTemplate } from '../../types'

export const multiToolPrompt: PromptTemplate = {
  id: 'multi-tool',
  priority: 70,
  content: `当需要完成复杂任务时，你可以组合使用多个工具。
请按照以下原则进行多工具调用：
1. 分析任务，确定需要的工具序列
2. 按照依赖关系顺序调用工具
3. 处理每个工具的返回结果
4. 在所有工具调用完成后，汇总结果给用户`
}
