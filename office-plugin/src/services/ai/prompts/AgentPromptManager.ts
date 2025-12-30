/**
 * Agent 提示词管理器
 * 
 * 统一管理 Word/Excel/PowerPoint 的 Agent 模式系统提示词
 * 
 * 解决问题：
 * 1. 硬编码 Word 提示词 -> 按 officeApp 动态生成
 * 2. 重试提示作为 user 消息 -> 改为 system 消息
 * 3. 硬编码字段与 schema 不符 -> 基于工具 schema 动态生成
 * 4. 禁止澄清与多轮逻辑冲突 -> 提供可配置的澄清策略
 */

import Logger from '../../../utils/logger'
import { getAdapter, type IOfficeAppAdapter } from '../../adapters'
import type { FormattingFunction } from '../types'
import { documentContextExtractor, type DocumentContext } from '../DocumentContextExtractor'
import { IntentExtractor } from './IntentExtractor'
import { PromptBuilder } from './PromptBuilder'
import { PromptSelector } from './PromptSelector'
import type { IntentType, PromptSelectionContext, PromptTemplate } from './types'

const logger = new Logger('AgentPromptManager')

export type OfficeAppType = 'word' | 'excel' | 'powerpoint' | 'none'

/**
 * Agent 提示词生成上下文
 */
export interface AgentPromptContext {
  /** Office 应用类型 */
  officeApp: OfficeAppType
  /** 是否有选区 */
  hasSelection?: boolean
  /** 选区类型 */
  selectionType?: 'text' | 'image' | 'table' | 'none'
  /** 用户消息（用于意图分析） */
  userMessage?: string
  /** 可用工具列表 */
  availableTools?: FormattingFunction[]
  /** 澄清策略 */
  clarificationPolicy?: ClarificationPolicy
  /** 🆕 文档上下文（结构化信息） */
  documentContext?: DocumentContext
}

/**
 * 重试提示词上下文
 */
export interface RetryPromptContext {
  /** 用户原始消息 */
  userMessage: string
  /** 候选工具 */
  candidateTools: FormattingFunction[]
  /** 上一轮输出 */
  previousOutput?: string
  /** Office 应用类型 */
  officeApp: OfficeAppType
}

/**
 * 澄清策略配置
 */
export interface ClarificationPolicy {
  /** 是否允许模型询问用户 */
  allowAskingUser: boolean
  /** 允许询问的场景 */
  allowedScenarios: ('missing_params' | 'ambiguous_intent' | 'confirmation_needed')[]
  /** 是否优先使用默认值 */
  preferDefaults: boolean
}

/**
 * 默认澄清策略：允许在参数不足时询问
 */
const DEFAULT_CLARIFICATION_POLICY: ClarificationPolicy = {
  allowAskingUser: true,
  allowedScenarios: ['missing_params', 'ambiguous_intent'],
  preferDefaults: true
}

/**
 * 严格执行策略：不询问，直接使用默认值
 */
const STRICT_EXECUTION_POLICY: ClarificationPolicy = {
  allowAskingUser: false,
  allowedScenarios: [],
  preferDefaults: true
}

/**
 * 提示词模板结构（用于类型定义）
 *
 * 🆕 重构说明：
 * 实际的提示词模板已完全移至各 Adapter 实现中（WordAdapter、ExcelAdapter、PowerPointAdapter）
 * 此处只保留类型定义，通过 Adapter.getAgentPromptTemplates() 获取实际内容
 */
interface AppAgentPrompts {
  base: string
  selectionHint: string
  toolGuide: string
}

/**
 * Agent 提示词管理器
 */
export class AgentPromptManager {
  private intentExtractor: IntentExtractor
  private promptSelector: PromptSelector
  private promptBuilder: PromptBuilder

  constructor() {
    this.intentExtractor = new IntentExtractor()
    this.promptSelector = new PromptSelector()
    this.promptBuilder = new PromptBuilder()
  }

  /**
   * 生成 Agent 模式系统提示词
   *
   * 通过 Adapter 的 buildAgentSystemPrompt 方法生成
   * 如果 Adapter 方法失败，则使用 getAppPrompts() 获取模板手动构建
   */
  generateAgentSystemPrompt(context: AgentPromptContext): string {
    const {
      officeApp,
      hasSelection = false,
      selectionType = 'none',
      userMessage,
      availableTools = [],
      clarificationPolicy = DEFAULT_CLARIFICATION_POLICY,
      documentContext
    } = context

    // 优先使用 Adapter 的完整构建方法
    const adapter = getAdapter(officeApp)
    if (adapter) {
      try {
        const promptContext = {
          appType: officeApp,
          hasSelection,
          selectionType: selectionType as 'text' | 'image' | 'table' | 'none',
          userMessage,
          availableTools: availableTools.map(t => t.name)
        }

        let systemPrompt = adapter.buildAgentSystemPrompt(promptContext, clarificationPolicy)
        
        // 🆕 添加文档上下文信息
        if (documentContext) {
          const contextFragment = documentContextExtractor.formatContextForPrompt(documentContext)
          if (contextFragment) {
            systemPrompt = `${systemPrompt}\n\n${contextFragment}`
          }
        }
        
        // 🆕 添加 Few-shot 示例
        const fewShotExamples = this.getFewShotExamples(officeApp)
        if (fewShotExamples) {
          systemPrompt = `${systemPrompt}\n\n${fewShotExamples}`
        }

        logger.debug('Generated agent system prompt via Adapter', {
          officeApp,
          hasSelection,
          selectionType,
          promptLength: systemPrompt.length,
          hasFewShot: !!fewShotExamples,
          hasDocContext: !!documentContext
        })

        return systemPrompt
      } catch (error) {
        logger.warn('Adapter buildAgentSystemPrompt failed, using template fallback', { error, officeApp })
      }
    }

    // 回退：使用模板手动构建（模板仍从 Adapter 获取）
    const appPrompts = this.getAppPrompts(officeApp)

    const parts: string[] = []
    parts.push('[Agent 模式]')
    parts.push(appPrompts.base)

    if (hasSelection || selectionType !== 'none') {
      parts.push(appPrompts.selectionHint)
    }

    parts.push(appPrompts.toolGuide)
    
    // 🆕 添加文档上下文信息
    if (documentContext) {
      const contextFragment = documentContextExtractor.formatContextForPrompt(documentContext)
      if (contextFragment) {
        parts.push(contextFragment)
      }
    }
    
    // 🆕 添加 Few-shot 示例
    const fewShotExamples = this.getFewShotExamples(officeApp)
    if (fewShotExamples) {
      parts.push(fewShotExamples)
    }
    
    parts.push(this.buildClarificationInstruction(clarificationPolicy))
    parts.push('\n重要：你必须调用工具来完成操作，不能只回复文本。')

    const systemPrompt = parts.join('\n')

    logger.debug('Generated agent system prompt (fallback)', {
      officeApp,
      hasSelection,
      selectionType,
      promptLength: systemPrompt.length,
      clarificationPolicy: clarificationPolicy.allowAskingUser,
      hasDocContext: !!documentContext
    })

    return systemPrompt
  }

  /**
   * 生成高级系统提示词（使用 PromptSelector + PromptBuilder）
   */
  generateAdvancedSystemPrompt(context: AgentPromptContext): string {
    const {
      officeApp,
      hasSelection = false,
      selectionType = 'none',
      userMessage = '',
      availableTools = [],
      clarificationPolicy = DEFAULT_CLARIFICATION_POLICY
    } = context

    // 1. 使用 IntentExtractor 分析用户意图
    const userIntent = this.intentExtractor.extractUserIntent(userMessage)

    // 2. 构建选择上下文
    const selectionContext: PromptSelectionContext = {
      selectionType: selectionType as 'text' | 'image' | 'table' | 'none',
      toolCount: availableTools.length,
      userIntent: userIntent.detectedIntent,
      hasMultipleTasks: userIntent.detectedIntent === ('multi_task' as IntentType)
    }

    // 3. 使用 PromptSelector 选择合适的模板
    const selectedTemplates = this.promptSelector.selectPrompts(
      selectionContext,
      userIntent.requiredPromptLevel
    )

    // 4. 添加应用专属模板
    const appTemplate = this.createAppSpecificTemplate(officeApp)
    const allTemplates = [appTemplate, ...selectedTemplates]

    // 5. 使用 PromptBuilder 构建最终提示词
    const basePrompt = this.promptBuilder.buildSystemPrompt(allTemplates)

    // 6. 添加澄清策略
    const clarificationInstruction = this.buildClarificationInstruction(clarificationPolicy)

    const finalPrompt = `${basePrompt}\n\n${clarificationInstruction}`

    logger.info('Generated advanced system prompt', {
      officeApp,
      userIntent: userIntent.detectedIntent,
      templateCount: allTemplates.length,
      promptLevel: userIntent.requiredPromptLevel,
      promptLength: finalPrompt.length
    })

    return finalPrompt
  }

  /**
   * 生成重试强化提示词（作为 system 消息）
   *
   * 🆕 重构：优先使用 Adapter 的 buildRetryPrompt 方法
   */
  generateRetryPrompt(context: RetryPromptContext): string {
    const { userMessage, candidateTools, previousOutput, officeApp } = context

    // 🆕 优先使用 Adapter
    const adapter = getAdapter(officeApp)
    if (adapter) {
      try {
        const retryContext = {
          userMessage,
          candidateTools,
          previousOutput
        }

        const retryPrompt = adapter.buildRetryPrompt(retryContext)

        logger.debug('Generated retry prompt via Adapter', {
          officeApp,
          candidateToolCount: candidateTools.length,
          promptLength: retryPrompt.length
        })

        return retryPrompt
      } catch (error) {
        logger.warn('Adapter buildRetryPrompt failed, falling back to hardcoded', { error, officeApp })
      }
    }

    // 回退：使用硬编码逻辑
    const diagnosis = '【系统诊断】上一轮模型未执行任何工具调用，但用户请求需要直接修改文档。'

    const previousSection = previousOutput?.trim()
      ? `上一轮输出：${previousOutput.trim().slice(0, 100)}...`
      : ''

    const toolExamples = this.generateToolExamples(candidateTools.slice(0, 3), officeApp)

    const retryInstruction = `
请严格按照以下要求重新执行：
1. 必须返回至少一个 tool_calls，调用能完成任务的工具
2. 工具参数必须符合其 schema 定义（参考下方示例）
3. 完成工具调用后可给出简短说明

用户原始指令：${userMessage}

${toolExamples}`

    const sections = [diagnosis, previousSection, retryInstruction].filter(Boolean)

    logger.debug('Generated retry prompt (fallback)', {
      officeApp,
      candidateToolCount: candidateTools.length,
      promptLength: sections.join('\n').length
    })

    return sections.join('\n')
  }

  /**
   * 获取应用专属提示词模板
   *
   * 🆕 重构：从 Adapter 获取提示词模板，不再使用硬编码
   */
  private getAppPrompts(officeApp: OfficeAppType): AppAgentPrompts {
    const adapter = getAdapter(officeApp)

    if (adapter) {
      const templates = adapter.getAgentPromptTemplates()
      return {
        base: templates.base,
        selectionHint: templates.selectionHint,
        toolGuide: templates.toolGuide
      }
    }

    // 极端回退：Adapter 不可用时提供最小化默认值
    logger.warn('No adapter available, using minimal default prompts', { officeApp })
    return {
      base: `你是 ${officeApp} 文档编辑助手。你必须使用工具来完成用户的请求。`,
      selectionHint: '用户可能已选中了内容，格式化操作可直接应用于选区。',
      toolGuide: '请根据用户需求选择合适的工具执行操作。'
    }
  }

  /**
   * 🆕 从 Adapter 获取应用特定的提示词片段
   * 
   * 这允许 Adapter 提供额外的、动态的提示词内容
   * 与硬编码模板互补
   */
  getAdapterPromptFragment(context: AgentPromptContext): string {
    const adapter = getAdapter(context.officeApp)
    
    if (!adapter) {
      logger.debug('No adapter found for app', { officeApp: context.officeApp })
      return ''
    }

    try {
      const fragment = adapter.getSystemPromptFragment({
        appType: context.officeApp,
        hasSelection: context.hasSelection || false,
        selectionType: context.selectionType || 'none',
        userMessage: context.userMessage,
        availableTools: context.availableTools?.map(t => t.name)
      })

      logger.debug('Adapter prompt fragment retrieved', {
        officeApp: context.officeApp,
        fragmentLength: fragment.length
      })

      return fragment
    } catch (error) {
      logger.warn('Failed to get adapter prompt fragment', { error, officeApp: context.officeApp })
      return ''
    }
  }

  /**
   * 🆕 异步获取文档上下文
   * 
   * 用于在发送消息前获取结构化的文档信息
   * 
   * @param officeApp 应用类型
   * @param userMessage 用户消息（用于提取相关段落）
   */
  async getDocumentContext(
    officeApp: OfficeAppType, 
    userMessage?: string
  ): Promise<DocumentContext | undefined> {
    if (officeApp === 'none') {
      return undefined
    }

    try {
      // 设置当前应用类型
      documentContextExtractor.setCurrentApp(officeApp as 'word' | 'excel' | 'powerpoint')
      
      // 提取文档上下文
      const context = await documentContextExtractor.extractContext(userMessage)
      
      logger.debug('Document context retrieved', {
        officeApp,
        paragraphCount: context.structure.paragraphCount,
        hasSelection: !!context.selectionContext,
        relevantParagraphs: context.relevantParagraphs?.length || 0
      })
      
      return context
    } catch (error) {
      logger.warn('Failed to get document context', { error, officeApp })
      return undefined
    }
  }

  /**
   * 🆕 清除文档上下文缓存
   * 
   * 在文档发生变化时调用
   */
  clearDocumentContextCache(): void {
    documentContextExtractor.clearCache()
  }

  /**
   * 🆕 获取当前应用的 Adapter 实例
   */
  getAdapter(officeApp: OfficeAppType): IOfficeAppAdapter | undefined {
    return getAdapter(officeApp)
  }

  /**
   * 创建应用专属模板（用于 PromptSelector）
   */
  private createAppSpecificTemplate(officeApp: OfficeAppType): PromptTemplate {
    const appPrompts = this.getAppPrompts(officeApp)
    
    return {
      id: `agent-${officeApp}`,
      content: `${appPrompts.base}\n${appPrompts.toolGuide}`,
      priority: 0, // 最高优先级
      conditions: [`app:${officeApp}`],
      tokenCount: this.promptBuilder.estimateTokenCount(appPrompts.base + appPrompts.toolGuide)
    }
  }

  /**
   * 构建澄清策略指令
   */
  private buildClarificationInstruction(policy: ClarificationPolicy): string {
    if (!policy.allowAskingUser) {
      return `
🚫 **执行规则**：
- 当参数不完整时，使用合理的默认值直接执行
- 不要询问用户补充信息，直接完成操作`
    }

    const allowedActions: string[] = []
    
    if (policy.allowedScenarios.includes('missing_params')) {
      allowedActions.push('- 当必要参数缺失且无法推断时，可以询问用户')
    }
    if (policy.allowedScenarios.includes('ambiguous_intent')) {
      allowedActions.push('- 当用户意图不明确时，可以请求澄清')
    }
    if (policy.allowedScenarios.includes('confirmation_needed')) {
      allowedActions.push('- 对于破坏性操作（如删除），可以请求确认')
    }

    if (policy.preferDefaults) {
      allowedActions.push('- 优先使用合理的默认值，减少不必要的询问')
    }

    return `
💬 **交互规则**：
${allowedActions.join('\n')}`
  }

  /**
   * 基于工具 schema 生成参数示例
   */
  private generateToolExamples(tools: FormattingFunction[], officeApp: OfficeAppType): string {
    if (tools.length === 0) {
      return ''
    }

    const examples = tools.map(tool => {
      const exampleArgs = this.generateExampleArgs(tool)
      return `工具: ${tool.name}
参数示例: ${JSON.stringify(exampleArgs, null, 2)}`
    })

    return `📋 **可用工具参数示例**：\n${examples.join('\n\n')}`
  }

  /**
   * 根据工具 schema 生成示例参数
   */
  private generateExampleArgs(tool: FormattingFunction): Record<string, any> {
    const schema = tool.inputSchema
    const example: Record<string, any> = {}

    if (!schema?.properties) {
      return example
    }

    const required = schema.required || []

    for (const [key, prop] of Object.entries(schema.properties)) {
      const propSchema = prop as { type?: string; example?: unknown; enum?: unknown[]; default?: unknown }

      // 只为必填字段生成示例
      if (!required.includes(key)) {
        continue
      }

      // 根据类型生成示例值
      example[key] = this.generateExampleValue(key, propSchema)
    }

    return example
  }

  /**
   * 根据字段类型生成示例值
   */
  private generateExampleValue(key: string, schema: { type?: string; example?: unknown; enum?: unknown[]; default?: unknown }): unknown {
    // 优先使用 schema 中的示例
    if (schema.example !== undefined) {
      return schema.example
    }

    // 如果有枚举，使用第一个值
    if (schema.enum && schema.enum.length > 0) {
      return schema.enum[0]
    }

    // 如果有默认值，使用默认值
    if (schema.default !== undefined) {
      return schema.default
    }

    // 根据类型和字段名生成
    const type = schema.type

    // 根据常见字段名生成
    const keyLower = key.toLowerCase()
    if (keyLower.includes('text') || keyLower.includes('content')) {
      return '示例文本'
    }
    if (keyLower.includes('color') || keyLower.includes('rgb')) {
      return '#000000'
    }
    if (keyLower.includes('index') || keyLower.includes('row') || keyLower.includes('column')) {
      return 0
    }
    if (keyLower.includes('level')) {
      return 1
    }
    if (keyLower.includes('position')) {
      return 'cursor'
    }
    if (keyLower.includes('size')) {
      return 12
    }
    if (keyLower.includes('address') || keyLower.includes('range')) {
      return 'A1'
    }

    // 根据类型生成
    switch (type) {
      case 'string':
        return '...'
      case 'number':
      case 'integer':
        return 1
      case 'boolean':
        return true
      case 'array':
        return []
      case 'object':
        return {}
      default:
        return '...'
    }
  }

  /**
   * 🆕 获取工具调用示例（Few-shot Learning）
   * 通过示例教 AI 如何正确调用工具
   */
  private getFewShotExamples(officeApp: OfficeAppType): string {
    const examples: Record<OfficeAppType, string> = {
      word: `
【工具调用示例 - 请严格参考】

✅ 示例1 - 表格单元格写入（最常见错误场景）:
用户: "在表格第2行第3列写入'完成'"
正确调用: word_set_cell_value({ "tableIndex": 0, "rowIndex": 1, "columnIndex": 2, "value": "完成" })
⚠️ 注意: rowIndex/columnIndex 从 0 开始，所以"第2行"对应 rowIndex=1

✅ 示例2 - 创建新表格:
用户: "插入一个3行4列的表格"
正确调用: word_insert_table({ "rows": 3, "columns": 4 })

✅ 示例3 - 文本格式化:
用户: "把选中的文字加粗"
正确调用: word_format_text({ "bold": true })

✅ 示例4 - 查找替换:
用户: "把所有的'旧文本'替换成'新文本'"
正确调用: word_replace_text({ "searchText": "旧文本", "replaceText": "新文本", "matchCase": false })

✅ 示例5 - 插入文本:
用户: "在文档末尾插入'总结'"
正确调用: word_insert_text({ "text": "总结", "location": "end" })

⚠️ 重要区分规则:
- "在表格第X行第Y列写入/填入" → 使用 word_set_cell_value（操作已有表格）
- "插入/创建/新建 X行Y列的表格" → 使用 word_insert_table（创建新表格）
- "替换/改为/换成" → 使用 word_replace_text
- "插入/添加文本" → 使用 word_insert_text`,

      excel: `
【工具调用示例】

✅ 示例1 - 单元格写入:
用户: "在A1单元格写入'标题'"
正确调用: excel_set_cell_value({ "address": "A1", "value": "标题" })

✅ 示例2 - 范围写入:
用户: "在A1到C1写入'姓名','年龄','成绩'"
正确调用: excel_set_range_values({ "range": "A1:C1", "values": [["姓名", "年龄", "成绩"]] })

✅ 示例3 - 格式化:
用户: "把A1单元格加粗"
正确调用: excel_format_cell({ "address": "A1", "bold": true })`,

      powerpoint: `
【工具调用示例】

✅ 示例1 - 添加文本:
用户: "在当前幻灯片添加标题'项目介绍'"
正确调用: ppt_add_text({ "slideIndex": 0, "text": "项目介绍", "type": "title" })

✅ 示例2 - 插入幻灯片:
用户: "新建一张幻灯片"
正确调用: ppt_insert_slide({ "position": -1 })`,

      none: ''
    }
    
    return examples[officeApp] || ''
  }

  /**
   * 获取澄清策略预设
   */
  static getClarificationPolicy(preset: 'default' | 'strict' | 'interactive'): ClarificationPolicy {
    switch (preset) {
      case 'strict':
        return STRICT_EXECUTION_POLICY
      case 'interactive':
        return {
          allowAskingUser: true,
          allowedScenarios: ['missing_params', 'ambiguous_intent', 'confirmation_needed'],
          preferDefaults: false
        }
      case 'default':
      default:
        return DEFAULT_CLARIFICATION_POLICY
    }
  }
}

// 导出单例实例
export const agentPromptManager = new AgentPromptManager()
