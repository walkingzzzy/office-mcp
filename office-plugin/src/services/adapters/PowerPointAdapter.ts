/**
 * PowerPoint 应用适配器
 *
 * 实现 PowerPoint 特定的选区检测、文档操作和提示词生成
 *
 * @architecture Core + Adapters 分层架构中的 PowerPoint 适配器
 * - 包含 PowerPoint 特定的 Agent 提示词模板
 * - 实现 PowerPoint 特定的工具过滤逻辑
 * - 提供 PowerPoint 特定的选区检测和文档操作
 */

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
 * PowerPoint Agent 提示词模板（从 AgentPromptManager 迁移）
 */
const POWERPOINT_AGENT_PROMPTS: AgentPromptTemplates = {
  base: `你是 PowerPoint 演示文稿编辑助手。你必须使用工具来完成用户的请求，而不是仅仅描述如何操作。

你可以帮助用户：
- 幻灯片管理（新建、删除、复制、移动）
- 内容编辑（文本框、形状、图片）
- 设计美化（布局、主题、动画）
- 媒体集成（视频、音频、超链接）
- 演示准备（演讲者备注、放映设置）`,

  selectionHint: `
【重要】用户可能已在幻灯片中选中了形状或文本框。

📌 **选区操作规则**：
- 对于形状操作，可直接应用于当前选中的形状
- ppt_set_text_format: 设置文本格式
- ppt_set_shape_fill: 设置形状填充`,

  toolGuide: `
📋 **常用工具**：
- ppt_add_slide: 添加幻灯片
- ppt_add_text_box: 添加文本框
- ppt_add_shape: 添加形状
- ppt_insert_image: 插入图片
- ppt_set_slide_layout: 设置幻灯片布局
- ppt_add_animation: 添加动画

📍 **幻灯片索引**：
- slideIndex 从 0 开始（0 = 第一张幻灯片）`,

  selectionTypePrompts: {
    text: '用户当前选中了文本框，可以进行文本编辑和格式化。',
    image: '用户当前选中了图片或形状，请使用相关工具进行编辑。',
    table: '用户当前选中了表格。'
  },

  scenarioPrompts: {
    education: `
【教育场景专用功能】
- 课件制作：知识点展示、流程图、思维导图
- 互动设计：问答幻灯片、选择题、闪卡
- 演示增强：动画效果、切换效果、计时器`
  }
}

/**
 * PowerPoint 关键词到工具映射
 */
const POWERPOINT_KEYWORD_TOOL_MAPPINGS: Record<string, string[]> = {
  // 幻灯片相关
  '幻灯片': ['ppt_add_slide', 'ppt_delete_slide', 'ppt_duplicate_slide'],
  '新建': ['ppt_add_slide'],
  '删除': ['ppt_delete_slide', 'ppt_delete_shape'],
  '复制': ['ppt_duplicate_slide'],

  // 内容相关
  '文本框': ['ppt_add_text_box', 'ppt_set_text'],
  '形状': ['ppt_add_shape', 'ppt_set_shape_fill'],
  '图片': ['ppt_insert_image'],

  // 格式相关
  '格式': ['ppt_set_text_format', 'ppt_set_shape_fill'],
  '颜色': ['ppt_set_shape_fill', 'ppt_set_text_format'],
  '布局': ['ppt_set_slide_layout'],

  // 动画相关
  '动画': ['ppt_add_animation'],
  '切换': ['ppt_set_transition'],

  // 备注相关
  '备注': ['ppt_set_notes'],
  '演讲者备注': ['ppt_set_notes']
}

export class PowerPointAdapter extends BaseOfficeAppAdapter {
  constructor(options: AdapterCreateOptions = {}) {
    super('powerpoint', options)
  }

  /**
   * 检测 PowerPoint 选区类型
   */
  async detectSelectionType(): Promise<SelectionType> {
    try {
      // 尝试调用 PPT 选区检测工具
      const result = await this.executeTool('ppt_detect_selection_type', {})
      const data = result.data as Record<string, unknown> | undefined
      
      if (result.success && data?.selectionType) {
        this.logger.debug('PowerPoint selection type detected:', data.selectionType)
        // PPT 的 selectionType 可能是 'text' | 'shape' | 'picture' | 'table' | 'slide' | 'none'
        const mapping: Record<string, SelectionType> = {
          'text': 'text',
          'shape': 'text',
          'picture': 'image',
          'table': 'table',
          'slide': 'none',
          'none': 'none'
        }
        return mapping[data.selectionType as string] || 'text'
      }
      
      // 如果工具不存在，尝试获取当前选中的形状
      const shapeResult = await this.executeTool('ppt_get_selected_shapes', {})
      const shapeData = shapeResult.data as Record<string, unknown> | undefined
      const shapes = shapeData?.shapes as Array<{ type: string }> | undefined
      if (shapeResult.success && shapes && shapes.length > 0) {
        const firstShape = shapes[0]
        this.logger.debug('PowerPoint has selected shape:', firstShape.type)
        // 根据形状类型映射
        if (firstShape.type === 'Picture') return 'image'
        if (firstShape.type === 'Table') return 'table'
        return 'text'
      }
      
      return 'none'
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      this.logger.warn('Failed to detect PowerPoint selection type, defaulting to none', { error: errorMessage })
      return 'none'
    }
  }

  /**
   * 获取工具前缀
   */
  getToolPrefix(): string {
    return 'ppt_'
  }

  /**
   * 获取 PowerPoint 特定的系统提示词片段（简化版）
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
      const educationKeywords = ['课件', '教案', '讲义', '测验', '问答', '知识点']
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
    return POWERPOINT_AGENT_PROMPTS
  }

  /**
   * 构建完整的 Agent 系统提示词（PowerPoint 特定增强）
   */
  override buildAgentSystemPrompt(context: PromptContext, policy?: ClarificationPolicy): string {
    let prompt = super.buildAgentSystemPrompt(context, policy)

    // PowerPoint 特定增强：教育场景检测
    if (this.detectEducationScenario(context.userMessage)) {
      const eduPrompt = POWERPOINT_AGENT_PROMPTS.scenarioPrompts?.education
      if (eduPrompt) {
        prompt += '\n' + eduPrompt
      }
    }

    return prompt
  }

  /**
   * 生成重试强化提示词（PowerPoint 特定增强）
   */
  override buildRetryPrompt(context: RetryPromptContext): string {
    let prompt = super.buildRetryPrompt(context)

    prompt += `\n\n📍 PowerPoint 索引提示：slideIndex 从 0 开始（0 = 第一张幻灯片）。`

    return prompt
  }

  // ==================== 🆕 工具过滤相关 ====================

  /**
   * 根据意图过滤工具（PowerPoint 特定逻辑）
   */
  override filterToolsByIntent(tools: FormattingFunction[], context: ToolFilterContext): FormattingFunction[] {
    const pptTools = tools.filter(tool => this.isToolForThisApp(tool.name))

    if (context.keywords && context.keywords.length > 0) {
      const matchedToolNames = new Set<string>()

      for (const keyword of context.keywords) {
        const mappedTools = POWERPOINT_KEYWORD_TOOL_MAPPINGS[keyword]
        if (mappedTools) {
          mappedTools.forEach(name => matchedToolNames.add(name))
        }
      }

      if (matchedToolNames.size > 0) {
        const priorityTools = pptTools.filter(tool => matchedToolNames.has(tool.name))
        if (priorityTools.length > 0) {
          return priorityTools
        }
      }
    }

    // 根据选区类型过滤
    if (context.selectionType === 'image') {
      const imageTools = pptTools.filter(tool =>
        tool.name.includes('image') || tool.name.includes('shape')
      )
      if (imageTools.length > 0) {
        return imageTools
      }
    }

    return pptTools
  }

  /**
   * 获取 PowerPoint 特定的关键词到工具映射
   */
  override getKeywordToolMappings(): Record<string, string[]> {
    return POWERPOINT_KEYWORD_TOOL_MAPPINGS
  }

  /**
   * 获取 PowerPoint 选区上下文
   */
  async getSelectionContext(): Promise<SelectionContext> {
    try {
      const selectionType = await this.detectSelectionType()
      const hasSelection = selectionType !== 'none'

      const context: SelectionContext = {
        hasSelection,
        selectionType,
        documentType: 'powerpoint'
      }

      // 更新缓存
      if (this.options.enableCache) {
        this.selectionContextCache = {
          data: context,
          timestamp: Date.now()
        }
      }

      this.logger.info('PowerPoint selection context retrieved', { context })
      return context
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      this.logger.error('Failed to get PowerPoint selection context', { error: errorMessage })
      return this.getDefaultSelectionContext()
    }
  }

  /**
   * 获取选区信息
   */
  async getSelectionInfo(): Promise<SelectionInfo> {
    const selectionType = await this.detectSelectionType()
    const hasSelection = selectionType !== 'none'

    let metadata: Record<string, unknown> | undefined
    if (hasSelection) {
      try {
        const result = await this.executeTool('ppt_get_selected_shapes', {})
        const data = result.data as Record<string, unknown> | undefined
        const shapes = data?.shapes as Array<{ type: string }> | undefined
        if (result.success && shapes) {
          metadata = {
            shapeCount: shapes.length,
            shapeTypes: shapes.map(s => s.type)
          }
        }
      } catch (error) {
        this.logger.warn('Failed to get selected shapes', { error })
      }
    }

    return {
      hasSelection,
      selectionType,
      metadata
    }
  }

  /**
   * 获取文档上下文
   */
  async getDocumentContext(): Promise<DocumentContextInfo> {
    try {
      const result = await this.executeTool('ppt_get_slides', {})
      const data = result.data as Record<string, unknown> | undefined
      const slides = data?.slides as unknown[] | undefined
      
      if (result.success && slides) {
        return {
          hasDocument: true,
          itemCount: slides.length,
          metadata: {
            slideCount: slides.length,
            currentSlide: data?.currentSlideIndex
          }
        }
      }

      return { hasDocument: true }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      this.logger.warn('Failed to get PowerPoint document context', { error: errorMessage })
      return { hasDocument: this._isAvailable }
    }
  }

  /**
   * 读取演示文稿内容
   */
  async readDocumentContent(options?: {
    maxLength?: number
    includeFormatting?: boolean
  }): Promise<string> {
    try {
      // 读取所有幻灯片的文本内容
      const result = await this.executeTool('ppt_get_slides', {})
      const data = result.data as Record<string, unknown> | undefined

      if (result.success && data?.slides) {
        const slides = data.slides as Array<{ title?: string; textContent?: string }>
        const content = slides
          .map((slide, index) => {
            const title = slide.title || `幻灯片 ${index + 1}`
            const text = slide.textContent || ''
            return `--- ${title} ---\n${text}`
          })
          .join('\n\n')
        
        return content.slice(0, options?.maxLength || 10000)
      }

      return ''
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      this.logger.error('Failed to read PowerPoint content', { error: errorMessage })
      return ''
    }
  }

  /**
   * 获取 PowerPoint 支持的工具类别
   */
  getSupportedToolCategories(): string[] {
    return [
      'slide',
      'shape',
      'text',
      'image',
      'animation',
      'media',
      'layout',
      'slideshow',
      'notes',
      'education'
    ]
  }

  /**
   * 获取工具使用提示
   */
  getToolUsageHints(toolNames: string[]): string {
    const pptTools = toolNames.filter(name => name.startsWith('ppt_'))
    if (pptTools.length === 0) {
      return ''
    }

    const hints: string[] = ['PowerPoint 工具使用提示:']

    // 按类别分组
    const categories = {
      slide: pptTools.filter(t => t.includes('slide')),
      shape: pptTools.filter(t => t.includes('shape') || t.includes('text')),
      media: pptTools.filter(t => t.includes('image') || t.includes('video') || t.includes('audio')),
      animation: pptTools.filter(t => t.includes('animation'))
    }

    if (categories.slide.length > 0) {
      hints.push(`- 幻灯片操作: ${categories.slide.slice(0, 3).join(', ')}`)
    }
    if (categories.shape.length > 0) {
      hints.push(`- 形状/文本: ${categories.shape.slice(0, 3).join(', ')}`)
    }
    if (categories.media.length > 0) {
      hints.push(`- 媒体: ${categories.media.slice(0, 3).join(', ')}`)
    }

    return hints.join('\n')
  }

  /**
   * 初始化 PowerPoint 适配器
   */
  async initialize(): Promise<void> {
    await super.initialize()
    
    // 检查 PowerPoint 是否可用
    try {
      const result = await this.executeTool('ppt_get_slides', {})
      this._isAvailable = result.success
    } catch (error) {
      this._isAvailable = false
    }

    this.logger.info('PowerPoint adapter initialized', { isAvailable: this._isAvailable })
  }

  // ==================== PowerPoint 特定的辅助方法 ====================

  /**
   * 获取 PowerPoint 特定的教育场景关键词
   */
  protected override getEducationKeywords(): string[] {
    return ['课件', '教案', '讲义', '测验', '问答', '知识点']
  }
}

// 导出单例
export const powerPointAdapter = new PowerPointAdapter()
