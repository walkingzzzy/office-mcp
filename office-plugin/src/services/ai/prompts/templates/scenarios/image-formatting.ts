/**
 * 图片格式化场景提示词
 */

import type { PromptTemplate } from '../../types'

export const imageFormattingPrompt: PromptTemplate = {
  id: 'image-formatting',
  priority: 60,
  content: `图片操作包括：
- 插入图片：从文件或URL插入
- 调整大小：设置宽度和高度
- 位置调整：移动和对齐图片
- 图片样式：边框、阴影、效果`
}
