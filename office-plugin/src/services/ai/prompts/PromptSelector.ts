/**
 * 提示词选择器 - 根据上下文动态选择合适的提示词模板
 * 支持 Word/Excel/PowerPoint 三种 Office 应用
 */

import Logger from '../../../utils/logger'
import { ABTestManager } from './ABTestManager'
import { PromptCache } from './PromptCache'
import { PromptVersionManager } from './PromptVersionManager'
import { detailedExamplesPrompt } from './templates/fallbacks/detailed-examples'
import { hyperlinkOperationsPrompt } from './templates/scenarios/hyperlink-operations'
import { imageFormattingPrompt } from './templates/scenarios/image-formatting'
import { searchReplacePrompt } from './templates/scenarios/search-replace'
import { tableOperationsPrompt } from './templates/scenarios/table-operations'
import { textFormattingPrompt } from './templates/scenarios/text-formatting'
import { 
  baseSystemPrompt, 
  wordBasePrompt, 
  excelBasePrompt, 
  powerpointBasePrompt 
} from './templates/system/base'
import { contextAwarePrompt } from './templates/system/context-aware'
import { multiToolPrompt } from './templates/system/multi-tool'
import type {PromptSelectionContext, PromptTemplate } from './types'

export type OfficeAppType = 'word' | 'excel' | 'powerpoint' | 'none'

/**
 * 扩展的提示词选择上下文
 */
export interface ExtendedPromptSelectionContext extends PromptSelectionContext {
  /** Office 应用类型 */
  officeApp?: OfficeAppType
}

const logger = new Logger('PromptSelector')

export class PromptSelector {
  private templates: Map<string, PromptTemplate> = new Map()
  private cache: PromptCache
  private abTestManager: ABTestManager
  private versionManager: PromptVersionManager

  constructor() {
    this.cache = new PromptCache()
    this.abTestManager = new ABTestManager()
    this.versionManager = new PromptVersionManager()
    this.initializeTemplates()

    // 定期清理缓存
    setInterval(() => this.cache.cleanup(), 5 * 60 * 1000) // 每5分钟清理一次
  }

  /**
   * 初始化提示词模板
   */
  private initializeTemplates(): void {
    const templates = [
      // 通用基础模板
      baseSystemPrompt,
      // 应用专属模板
      wordBasePrompt,
      excelBasePrompt,
      powerpointBasePrompt,
      // 场景模板
      multiToolPrompt,
      contextAwarePrompt,
      imageFormattingPrompt,
      textFormattingPrompt,
      tableOperationsPrompt,
      searchReplacePrompt,
      hyperlinkOperationsPrompt,
      detailedExamplesPrompt
    ]

    templates.forEach(template => {
      this.templates.set(template.id, template)
    })

    logger.info('Prompt templates initialized', { count: templates.length })
  }

  /**
   * 根据 Office 应用类型获取基础模板
   */
  private getAppBaseTemplate(officeApp?: OfficeAppType): PromptTemplate {
    switch (officeApp) {
      case 'word':
        return wordBasePrompt
      case 'excel':
        return excelBasePrompt
      case 'powerpoint':
        return powerpointBasePrompt
      default:
        return baseSystemPrompt
    }
  }

  /**
   * 选择合适的提示词模板 - 增强版上下文感知 + 分层策略
   * @param context 选择上下文（可包含 officeApp）
   * @param requiredLevel 所需详细程度 1-3
   */
  selectPrompts(context: PromptSelectionContext | ExtendedPromptSelectionContext, requiredLevel: 1 | 2 | 3 = 2): PromptTemplate[] {
    const selectedPrompts: PromptTemplate[] = []
    const extendedContext = context as ExtendedPromptSelectionContext

    // L1: 基础系统提示 - 根据 officeApp 选择应用专属模板
    const baseTemplate = extendedContext.officeApp 
      ? this.getAppBaseTemplate(extendedContext.officeApp)
      : this.versionManager.getActiveTemplate('base-system') || baseSystemPrompt
    selectedPrompts.push(baseTemplate)

    // L2: 上下文感知提示 (有选区时)
    if (context.selectionType !== 'none') {
      selectedPrompts.push(contextAwarePrompt)
    }

    // L2: 多工具调用提示 (按需)
    if (context.toolCount > 1 || context.hasMultipleTasks || context.userIntent === 'multi_task') {
      selectedPrompts.push(multiToolPrompt)
    }

    // L2: 场景相关提示 (智能匹配) - 仅在L2+时添加
    if (requiredLevel >= 2) {
      const scenarioPrompt = this.selectScenarioPrompt(context)
      if (scenarioPrompt) {
        selectedPrompts.push(scenarioPrompt)
      }
    }

    // L3: 详细示例 (仅在L3时添加)
    if (requiredLevel === 3) {
      selectedPrompts.push(detailedExamplesPrompt)
    }

    logger.debug('Prompts selected', {
      context,
      requiredLevel,
      selectedCount: selectedPrompts.length,
      selectedIds: selectedPrompts.map(p => p.id)
    })

    return selectedPrompts
  }

  /**
   * 智能选择场景提示词
   */
  private selectScenarioPrompt(context: PromptSelectionContext): PromptTemplate | null {
    // 优先级1: 多任务场景
    if (context.userIntent === 'multi_task') {
      // 根据选区类型选择主要场景
      if (context.selectionType === 'image') return imageFormattingPrompt
      if (context.selectionType === 'table') return tableOperationsPrompt
      return textFormattingPrompt // 默认文本场景
    }

    // 优先级2: 精确意图匹配
    switch (context.userIntent) {
      case 'image_formatting':
        return imageFormattingPrompt
      case 'table_operations':
        return tableOperationsPrompt
      case 'search_replace':
        return searchReplacePrompt
      case 'hyperlink_operations':
        return hyperlinkOperationsPrompt
      case 'text_formatting':
        return textFormattingPrompt
      default:
        return null
    }
  }

  /**
   * 获取所有可用模板
   */
  getAllTemplates(): PromptTemplate[] {
    return Array.from(this.templates.values())
  }
}