/**
 * Word 应用适配器
 *
 * 实现 Word 特定的选区检测、文档操作和提示词生成
 *
 * @architecture Core + Adapters 分层架构中的 Word 适配器
 * - 包含 Word 特定的 Agent 提示词模板
 * - 实现 Word 特定的工具过滤逻辑
 * - 提供 Word 特定的选区检测和文档操作
 */

import type { WordService } from '../WordService'
import type { FormattingFunction, SelectionContext } from '../ai/types'
import { BaseOfficeAppAdapter } from './BaseAdapter'
import type {
  AdapterCreateOptions,
  AgentPromptTemplates,
  ClarificationPolicy,
  DocumentContextInfo,
  PromptContext,
  RetryPromptContext,
  SelectionInfo,
  SelectionType,
  ToolFilterContext
} from './types'

/**
 * Word Agent 提示词模板（从 AgentPromptManager 迁移）
 * 这是 Word 应用的完整 Agent 模式提示词
 */
const WORD_AGENT_PROMPTS: AgentPromptTemplates = {
  base: `你是 Word 文档编辑助手。你必须使用工具来完成用户的请求，而不是仅仅描述如何操作。

你可以帮助用户：
- 编辑和格式化文本（字体、段落、样式）
- 插入和管理内容（表格、图片、列表）
- 处理文档结构（标题、目录、页眉页脚）
- 执行批量操作（查找替换、批量格式化）`,

  selectionHint: `
【重要】用户可能已在文档中选中了内容。当用户说"这段文字"、"这张图片"、"选中的内容"时，指的是当前选区。

📌 **选区操作规则**：
- 对于文本格式化（设置标题、加粗、颜色等），直接调用工具，无需提供 searchText 或 paragraphIndex 参数
- word_set_heading: 设置标题级别，只需提供 level 参数
- word_set_bold、word_set_italic、word_set_underline: 设置文本格式
- word_set_font_color: 设置字体颜色，使用 rgb 或 themeColor 参数`,

  toolGuide: `
📋 **常用工具**：
- word_insert_text: 插入文本（position: "cursor"|"start"|"end"）
- word_replace_text: 替换文本
- word_set_heading: 设置标题级别
- word_set_bold/italic/underline: 文本格式

⚠️ **表格操作指南**：
- word_insert_table: 仅用于创建新表格
- word_set_cell_value: 向已有表格单元格写入内容（tableIndex, rowIndex, columnIndex 从 0 开始）
- word_add_row: 添加行（position="end" 在末尾添加）

📍 **位置参数**：
- "start": 文档开头
- "end": 文档末尾
- "cursor": 当前光标位置`,

  selectionTypePrompts: {
    text: '用户当前选中了文本，请直接对选中内容进行操作。',
    image: '用户当前选中了图片，请使用图片相关工具进行操作。',
    table: '用户当前选中了表格，请使用表格相关工具进行操作。'
  },

  scenarioPrompts: {
    education: `
【教育场景专用功能】
- 课件制作：标题层级、知识点列表、重点标注
- 文档美化：统一样式、专业排版
- 表格处理：成绩表格式化、数据表格插入`
  }
}

/**
 * Word 关键词到工具映射
 */
const WORD_KEYWORD_TOOL_MAPPINGS: Record<string, string[]> = {
  // 标题相关
  '标题': ['word_set_heading', 'word_insert_text'],
  '一级标题': ['word_set_heading'],
  '二级标题': ['word_set_heading'],

  // 格式相关
  '加粗': ['word_set_bold'],
  '斜体': ['word_set_italic'],
  '下划线': ['word_set_underline'],
  '颜色': ['word_set_font_color', 'word_set_highlight'],
  '字体': ['word_set_font'],
  '字号': ['word_set_font_size'],

  // 表格相关
  '表格': ['word_insert_table', 'word_set_cell_value', 'word_add_row', 'word_delete_row'],
  '插入表格': ['word_insert_table'],
  '添加行': ['word_add_row'],
  '删除行': ['word_delete_row'],

  // 内容相关
  '插入': ['word_insert_text', 'word_insert_image', 'word_insert_table'],
  '替换': ['word_replace_text'],
  '删除': ['word_delete_text', 'word_delete_paragraph'],

  // 图片相关
  '图片': ['word_insert_image', 'word_resize_image'],

  // 列表相关
  '列表': ['word_set_bullet_list', 'word_set_numbered_list'],
  '项目符号': ['word_set_bullet_list'],
  '编号': ['word_set_numbered_list']
}

export class WordAdapter extends BaseOfficeAppAdapter {
  /**
   * @deprecated WordService 实例不再直接使用，仅保留用于向后兼容
   */
  private wordService?: WordService

  constructor(options: AdapterCreateOptions = {}) {
    super('word', options)
  }

  /**
   * 设置 WordService 实例
   * @deprecated 请使用 setAvailable(true) 替代。此方法仅保留用于向后兼容。
   */
  setWordService(service: WordService): void {
    this.wordService = service
    this.setAvailable(true)
  }

  /**
   * 检测 Word 选区类型
   */
  async detectSelectionType(): Promise<SelectionType> {
    try {
      const result = await this.executeTool('word_detect_selection_type', {})
      const data = result.data as Record<string, unknown> | undefined
      
      if (result.success && data?.selectionType) {
        this.logger.debug('Word selection type detected:', data.selectionType)
        return data.selectionType as SelectionType
      }
      
      return 'none'
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      this.logger.error('Failed to detect Word selection type', { error: errorMessage })
      return 'none'
    }
  }

  /**
   * 获取工具前缀
   */
  getToolPrefix(): string {
    return 'word_'
  }

  /**
   * 获取 Word 特定的系统提示词片段（简化版，用于非 Agent 模式）
   */
  getSystemPromptFragment(context: PromptContext): string {
    const templates = this.getAgentPromptTemplates()
    const parts: string[] = [templates.base]

    if (context.hasSelection) {
      const typePrompt = templates.selectionTypePrompts?.[context.selectionType]
      if (typePrompt) {
        parts.push(typePrompt)
      } else {
        parts.push(templates.selectionHint)
      }
    }

    // 检查是否涉及教育场景
    if (context.userMessage && templates.scenarioPrompts?.education) {
      const educationKeywords = ['课件', '教案', '讲义', '作业', '试卷', '知识点']
      if (educationKeywords.some(kw => context.userMessage?.includes(kw))) {
        parts.push(templates.scenarioPrompts.education)
      }
    }

    return parts.join('\n\n')
  }

  // ==================== 🆕 Agent 提示词相关 ====================

  /**
   * 获取 Agent 模式提示词模板
   */
  override getAgentPromptTemplates(): AgentPromptTemplates {
    return WORD_AGENT_PROMPTS
  }

  /**
   * 构建完整的 Agent 系统提示词（Word 特定增强）
   */
  override buildAgentSystemPrompt(context: PromptContext, policy?: ClarificationPolicy): string {
    // 使用基类的构建逻辑
    let prompt = super.buildAgentSystemPrompt(context, policy)

    // Word 特定增强：教育场景检测
    if (this.detectEducationScenario(context.userMessage)) {
      const eduPrompt = WORD_AGENT_PROMPTS.scenarioPrompts?.education
      if (eduPrompt) {
        prompt += '\n' + eduPrompt
      }
    }

    return prompt
  }

  /**
   * 生成重试强化提示词（Word 特定增强）
   */
  override buildRetryPrompt(context: RetryPromptContext): string {
    let prompt = super.buildRetryPrompt(context)

    // Word 特定：添加选区操作提示
    prompt += `\n\n📌 Word 选区提示：对于格式化操作，直接调用工具即可，无需指定 searchText 或 paragraphIndex。`

    return prompt
  }

  // ==================== 🆕 工具过滤相关 ====================

  /**
   * 根据意图过滤工具（Word 特定逻辑）
   */
  override filterToolsByIntent(tools: FormattingFunction[], context: ToolFilterContext): FormattingFunction[] {
    // 首先过滤出 Word 工具
    const wordTools = tools.filter(tool => this.isToolForThisApp(tool.name))

    // 如果有关键词，进一步过滤
    if (context.keywords && context.keywords.length > 0) {
      const matchedToolNames = new Set<string>()

      for (const keyword of context.keywords) {
        const mappedTools = WORD_KEYWORD_TOOL_MAPPINGS[keyword]
        if (mappedTools) {
          mappedTools.forEach(name => matchedToolNames.add(name))
        }
      }

      // 如果有匹配的工具，优先返回这些工具
      if (matchedToolNames.size > 0) {
        const priorityTools = wordTools.filter(tool => matchedToolNames.has(tool.name))
        if (priorityTools.length > 0) {
          return priorityTools
        }
      }
    }

    // 根据选区类型过滤
    if (context.selectionType === 'table') {
      // 优先返回表格相关工具
      const tableTools = wordTools.filter(tool =>
        tool.name.includes('table') || tool.name.includes('cell') || tool.name.includes('row')
      )
      if (tableTools.length > 0) {
        return tableTools
      }
    } else if (context.selectionType === 'image') {
      // 优先返回图片相关工具
      const imageTools = wordTools.filter(tool =>
        tool.name.includes('image') || tool.name.includes('picture')
      )
      if (imageTools.length > 0) {
        return imageTools
      }
    }

    return wordTools
  }

  /**
   * 获取 Word 特定的关键词到工具映射
   */
  override getKeywordToolMappings(): Record<string, string[]> {
    return WORD_KEYWORD_TOOL_MAPPINGS
  }

  /**
   * 获取 Word 选区上下文（增强版）
   * 🚀 性能优化：并行获取选区类型、图片和表格信息
   */
  async getSelectionContext(): Promise<SelectionContext> {
    try {
      // 并行执行所有检测操作
      const [selectionType, hasImages, hasTables] = await Promise.all([
        this.detectSelectionType(),
        this.checkDocumentHasImages(),
        this.checkDocumentHasTables()
      ])
      
      const hasSelection = selectionType !== 'none'

      const context: SelectionContext = {
        hasSelection,
        selectionType,
        documentType: 'word',
        hasImages,
        hasTables
      }

      // 更新缓存
      if (this.options.enableCache) {
        this.selectionContextCache = {
          data: context,
          timestamp: Date.now()
        }
      }

      this.logger.info('Word selection context retrieved (parallel)', { context })
      return context
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      this.logger.error('Failed to get Word selection context', { error: errorMessage })
      return this.getDefaultSelectionContext()
    }
  }

  /**
   * 获取选区信息（包含选中的文本内容）
   */
  async getSelectionInfo(): Promise<SelectionInfo> {
    const selectionType = await this.detectSelectionType()
    const hasSelection = selectionType !== 'none'

    let selectedText: string | undefined
    if (hasSelection && selectionType === 'text') {
      try {
        const result = await this.executeTool('word_get_selected_text', {})
        const data = result.data as Record<string, unknown> | undefined
        if (result.success && data?.text) {
          selectedText = data.text as string
        }
      } catch (error) {
        this.logger.warn('Failed to get selected text', { error })
      }
    }

    return {
      hasSelection,
      selectionType,
      selectedText,
      rangeDescription: hasSelection ? '选中区域' : undefined
    }
  }

  /**
   * 获取文档上下文
   */
  async getDocumentContext(): Promise<DocumentContextInfo> {
    if (!this._isAvailable) {
      return { hasDocument: false }
    }

    try {
      // 尝试获取文档信息
      const result = await this.executeTool('word_get_document_info', {})
      const data = result.data as Record<string, unknown> | undefined
      
      if (result.success && data) {
        return {
          hasDocument: true,
          title: (data.title || data.filename) as string | undefined,
          itemCount: data.paragraphCount as number | undefined,
          metadata: {
            wordCount: data.wordCount,
            pageCount: data.pageCount
          }
        }
      }

      return { hasDocument: true }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      this.logger.warn('Failed to get document context', { error: errorMessage })
      return { hasDocument: this._isAvailable }
    }
  }

  /**
   * 读取文档内容
   */
  async readDocumentContent(options?: {
    maxLength?: number
    includeFormatting?: boolean
  }): Promise<string> {
    try {
      const result = await this.executeTool('word_get_document_content', {
        maxLength: options?.maxLength,
        includeFormatting: options?.includeFormatting
      })
      const data = result.data as Record<string, unknown> | undefined

      if (result.success && data?.content) {
        return data.content as string
      }

      return ''
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      this.logger.error('Failed to read document content', { error: errorMessage })
      return ''
    }
  }

  /**
   * 获取 Word 支持的工具类别
   */
  getSupportedToolCategories(): string[] {
    return [
      'paragraph',
      'font',
      'style',
      'table',
      'image',
      'list',
      'layout',
      'reference',
      'comment',
      'smart'
    ]
  }

  /**
   * 获取工具使用提示
   */
  getToolUsageHints(toolNames: string[]): string {
    const wordTools = toolNames.filter(name => name.startsWith('word_'))
    if (wordTools.length === 0) {
      return ''
    }

    const hints: string[] = ['Word 工具使用提示:']

    // 按类别分组
    const categories = {
      text: wordTools.filter(t => t.includes('text') || t.includes('paragraph')),
      format: wordTools.filter(t => t.includes('font') || t.includes('style') || t.includes('format')),
      table: wordTools.filter(t => t.includes('table')),
      image: wordTools.filter(t => t.includes('image') || t.includes('picture')),
      document: wordTools.filter(t => t.includes('document') || t.includes('page'))
    }

    if (categories.text.length > 0) {
      hints.push(`- 文本操作: ${categories.text.slice(0, 3).join(', ')}`)
    }
    if (categories.format.length > 0) {
      hints.push(`- 格式化: ${categories.format.slice(0, 3).join(', ')}`)
    }
    if (categories.table.length > 0) {
      hints.push(`- 表格: ${categories.table.slice(0, 3).join(', ')}`)
    }

    return hints.join('\n')
  }

  /**
   * 初始化 Word 适配器
   */
  async initialize(): Promise<void> {
    await super.initialize()
    
    // 检查 Word 是否可用
    try {
      const result = await this.executeTool('word_detect_selection_type', {})
      const errorStr = typeof result.error === 'string' ? result.error : ''
      this._isAvailable = result.success || !errorStr.includes('not available')
    } catch (error) {
      this._isAvailable = false
    }

    this.logger.info('Word adapter initialized', { isAvailable: this._isAvailable })
  }

  // ==================== Word 特定的辅助方法 ====================

  /**
   * 获取 Word 特定的教育场景关键词
   */
  protected override getEducationKeywords(): string[] {
    return ['课件', '教案', '讲义', '作业', '试卷', '知识点']
  }

  /**
   * 检查文档是否有图片
   */
  private async checkDocumentHasImages(): Promise<boolean> {
    try {
      const result = await this.executeTool('word_check_document_has_images', {})
      const data = result.data as Record<string, unknown> | undefined
      return result.success && Boolean(data?.hasImages)
    } catch (error) {
      return false
    }
  }

  /**
   * 检查文档是否有表格
   */
  private async checkDocumentHasTables(): Promise<boolean> {
    try {
      const result = await this.executeTool('word_check_document_has_tables', {})
      const data = result.data as Record<string, unknown> | undefined
      return result.success && Boolean(data?.hasTables)
    } catch (error) {
      return false
    }
  }
}

// 导出单例
export const wordAdapter = new WordAdapter()
