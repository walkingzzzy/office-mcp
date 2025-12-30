/**
 * ConversationAnalyzer
 * 基于最近的对话内容预测可能需要的工具类别
 */

import type { ChatMessage } from '../../types/ai'
import { FunctionCategory } from './types'

const CATEGORY_KEYWORDS: Record<FunctionCategory, string[]> = {
  [FunctionCategory.IMAGE]: ['图片', '图', 'image', 'picture', 'photo', '截图'],
  [FunctionCategory.TABLE]: ['表格', 'table', '行列', '单元格'],
  [FunctionCategory.FONT]: ['字体', 'font', '加粗', '颜色', '颜色', 'bold', 'italic'],
  [FunctionCategory.PARAGRAPH]: ['段落', '对齐', '居中', '缩进', '行距', 'alignment'],
  [FunctionCategory.STYLE]: ['样式', '标题', 'heading', 'style'],
  [FunctionCategory.SMART]: ['优化', '整理', '批量', '全部', 'standardize'],
  [FunctionCategory.COMMENT]: ['批注', 'comment', '注释'],
  [FunctionCategory.LIST]: ['列表', 'list', 'bullet', 'numbered'],
  [FunctionCategory.LAYOUT]: ['页面', '页边距', 'margins', '方向', 'orientation'],
  [FunctionCategory.REFERENCE]: ['目录', 'toc', 'reference']
}

export class ConversationAnalyzer {
  constructor(private lookBackMessages = 3) {}

  analyzeIntent(messages?: ChatMessage[]): FunctionCategory[] {
    if (!messages || messages.length === 0) {
      return []
    }

    const categories = new Set<FunctionCategory>()
    const candidates = messages
      .filter(message => message.role === 'user')
      .slice(-this.lookBackMessages)

    candidates.forEach(message => {
      const messageContent = message.content || ''
      const normalized = messageContent.toLowerCase()

      Object.entries(CATEGORY_KEYWORDS).forEach(([category, keywords]) => {
        if (keywords.some(keyword => normalized.includes(keyword))) {
          categories.add(category as FunctionCategory)
        }
      })
    })

    return Array.from(categories)
  }
}
