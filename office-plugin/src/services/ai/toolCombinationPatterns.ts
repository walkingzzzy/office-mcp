/**
 * 🎯 方案2：工具组合模式识别
 * 智能识别用户需求中的工具组合模式，提升多工具调用准确性
 */

export interface ToolCombinationPattern {
  name: string
  keywords: string[]
  tools: string[]
  priority: 'high' | 'medium' | 'low'
  description: string
}

/**
 * 预定义的工具组合模式
 */
export const TOOL_COMBINATION_PATTERNS: ToolCombinationPattern[] = [
  {
    name: '图片格式化',
    keywords: ['图片', '居中', '边框', '对齐', '图像', 'image', 'picture'],
    tools: ['align_images', 'apply_paragraph_formatting'],
    priority: 'high',
    description: '图片居中对齐和边框设置'
  },
  {
    name: '标题格式化',
    keywords: ['标题', '加粗', '居中', '颜色', '字体', 'heading', 'title'],
    tools: ['apply_font_formatting', 'apply_paragraph_formatting'],
    priority: 'high',
    description: '标题字体和段落格式化'
  },
  {
    name: '文本查找替换格式化',
    keywords: ['查找', '替换', '改成', '修改', '格式', 'find', 'replace'],
    tools: ['find_and_replace_text', 'apply_font_formatting'],
    priority: 'high',
    description: '查找替换文本并调整格式'
  },
  {
    name: '表格创建格式化',
    keywords: ['表格', '插入', '边框', '格式', 'table', 'insert'],
    tools: ['word_insert_table', 'word_format_table'],
    priority: 'high',
    description: '插入表格并设置格式'
  },
  {
    name: '表格单元格填写',
    keywords: ['表格', '写入', '填入', '填充', '行', '列', '单元格', 'cell', 'write'],
    tools: ['word_set_cell_value'],
    priority: 'high',
    description: '向已有表格的单元格中写入内容'
  },
  {
    name: '批注管理',
    keywords: ['批注', '删除', '清除', '评论', 'comment', 'delete'],
    tools: ['delete_comments', 'apply_paragraph_formatting'],
    priority: 'medium',
    description: '删除批注并调整段落格式'
  },
  {
    name: '列表格式化',
    keywords: ['列表', '编号', '项目符号', '缩进', 'list', 'bullet'],
    tools: ['create_list', 'apply_paragraph_formatting'],
    priority: 'medium',
    description: '创建列表并调整段落格式'
  },
  {
    name: '样式应用格式化',
    keywords: ['样式', '标题1', '标题2', '正文', 'style', 'heading'],
    tools: ['apply_style', 'apply_paragraph_formatting'],
    priority: 'medium',
    description: '应用样式并调整段落格式'
  }
]

/**
 * 检测用户输入中的工具组合模式
 */
export function detectToolCombinationPatterns(userInput: string): ToolCombinationPattern[] {
  const normalizedInput = userInput.toLowerCase()
  const matchedPatterns: ToolCombinationPattern[] = []

  for (const pattern of TOOL_COMBINATION_PATTERNS) {
    // 计算关键词匹配度
    const matchedKeywords = pattern.keywords.filter(keyword =>
      normalizedInput.includes(keyword.toLowerCase())
    )

    // 如果匹配到2个或以上关键词，认为是该模式
    if (matchedKeywords.length >= 2) {
      matchedPatterns.push(pattern)
    }
    // 如果只匹配到1个关键词，但是高优先级模式，也加入候选
    else if (matchedKeywords.length === 1 && pattern.priority === 'high') {
      matchedPatterns.push(pattern)
    }
  }

  // 按优先级排序
  return matchedPatterns.sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 }
    return priorityOrder[b.priority] - priorityOrder[a.priority]
  })
}

/**
 * 获取组合模式推荐的工具列表
 */
export function getRecommendedToolsFromPatterns(patterns: ToolCombinationPattern[]): string[] {
  const recommendedTools = new Set<string>()

  patterns.forEach(pattern => {
    pattern.tools.forEach(tool => recommendedTools.add(tool))
  })

  return Array.from(recommendedTools)
}

// 保持向后兼容的旧格式
export const LEGACY_TOOL_COMBINATION_PATTERNS: Record<string, string[]> = {
  '格式化图片': ['align_images', 'adjust_images_size'],
  '图片居中': ['align_images', 'apply_paragraph_formatting'],
  '综合格式化': ['apply_font_formatting', 'apply_paragraph_formatting'],
  '格式化文字': ['apply_font_formatting', 'apply_paragraph_formatting'],
  '插入批注': ['insert_comment'],
  '删除批注': ['delete_comments', 'apply_paragraph_formatting'],
  '查找替换': ['find_and_replace_text', 'apply_font_formatting'],
  '表格排版': ['insert_table', 'format_table'],
  '列表整理': ['create_list', 'apply_paragraph_formatting'],
  '版式优化': ['set_page_margins', 'insert_page_break', 'set_page_orientation']
}
