/**
 * 动态工具选择器
 * 根据用户输入的意图，动态选择相关的格式化函数（限制在10个以内）
 * 提升 AI 理解准确率
 * 
 * 模块化重构：
 * - 关键词映射已拆分到 ./toolMappings/ 目录
 * - 权重配置已拆分到 ./toolWeights.ts
 */

import Logger from '../../utils/logger'
import { getAdapter, adapterRegistry } from '../adapters'
import type { IOfficeAppAdapter, ToolFilterCriteria } from '../adapters/types'
import {
  detectToolCombinationPatterns,
  getRecommendedToolsFromPatterns
} from './toolCombinationPatterns'
import {
  FormattingFunction,
  FunctionCategory,
  SelectionContext
} from './types'
import { KEYWORD_TO_TOOLS_MAPPING } from './toolMappings'
import { CATEGORY_WEIGHTS } from './toolWeights'

const logger = new Logger('ToolSelector')

// 以下映射和权重配置已模块化，从外部导入
// @see ./toolMappings/
// @see ./toolWeights.ts

/**
 * 工具冲突信息
 */
interface ConflictInfo {
  /** 冲突类型 */
  type: string
  /** 胜出的工具名称 */
  winner: string
  /** 被排除的工具名称列表 */
  losers: string[]
  /** 冲突原因说明 */
  reason: string
}

/**
 * 工具选择器类
 */
export class ToolSelector {
  private allFunctions: FormattingFunction[]
  private functionByCategory: Map<FunctionCategory, FormattingFunction[]>

  constructor(allFunctions: FormattingFunction[]) {
    this.allFunctions = allFunctions
    this.functionByCategory = this.groupFunctionsByCategory(allFunctions)
    logger.debug(`ToolSelector initialized with ${allFunctions.length} functions`)
  }

  /**
   * 🗑️ DEPRECATED: 旧的工具选择方法
   * 已被 selectCandidateTools() 替代
   *
   * @deprecated 使用 selectCandidateTools() 替代
   * @see selectCandidateTools
   */

  /**
   * 🎯 核心方法: 选择候选工具 (方案 A: 客户端预选择 + 方案2: 工具组合模式识别)
   * 根据用户输入和上下文预选择 10-15 个候选工具
   *
   * @param userInput - 用户输入的消息
   * @param context - 选区上下文信息
   * @param maxCount - 最大候选工具数量 (默认15)
   * @returns 候选工具列表
   */
  selectCandidateTools(
    userInput: string,
    context: SelectionContext,
    maxCount: number = 15
  ): FormattingFunction[] {
    logger.info('[CANDIDATE TOOL SELECTION] Starting tool selection', {
      userInput,
      context,
      maxCount
    })

    // 🎯 方案2: 工具组合模式识别
    const detectedPatterns = detectToolCombinationPatterns(userInput)
    const patternRecommendedTools = getRecommendedToolsFromPatterns(detectedPatterns)

    logger.info('[CANDIDATE TOOL SELECTION] Pattern detection completed', {
      detectedPatterns: detectedPatterns.map(p => ({ name: p.name, tools: p.tools })),
      patternRecommendedTools
    })

    // 步骤 1: 基于关键词匹配工具
    const keywordMatchedTools = this.matchByKeywords(userInput)

    logger.info('[CANDIDATE TOOL SELECTION] Keyword matching completed', {
      matchedToolCount: keywordMatchedTools.length,
      toolNames: keywordMatchedTools.map(t => t.name)
    })

    // 🎯 方案2: 合并模式推荐的工具
    const patternMatchedTools = this.allFunctions.filter(func =>
      patternRecommendedTools.includes(func.name)
    )

    // 合并关键词匹配和模式匹配的工具，去重
    const combinedTools = new Map<string, FormattingFunction>()

    // 优先添加模式匹配的工具（优先级更高）
    patternMatchedTools.forEach(tool => combinedTools.set(tool.name, tool))

    // 添加关键词匹配的工具
    keywordMatchedTools.forEach(tool => combinedTools.set(tool.name, tool))

    const mergedTools = Array.from(combinedTools.values())

    logger.info('[CANDIDATE TOOL SELECTION] Pattern and keyword tools merged', {
      patternToolCount: patternMatchedTools.length,
      keywordToolCount: keywordMatchedTools.length,
      mergedToolCount: mergedTools.length,
      mergedToolNames: mergedTools.map(t => t.name)
    })

    // 步骤 2: 根据上下文过滤工具 (使用合并后的工具列表)
    const contextFilteredTools = this.filterByContext(mergedTools, context)

    logger.info('[CANDIDATE TOOL SELECTION] Context filtering completed', {
      filteredToolCount: contextFilteredTools.length,
      toolNames: contextFilteredTools.map((t) => t.name)
    })

    const intentScores = this.calculateIntentScores(userInput, contextFilteredTools)

    // 步骤 3: 优先级排序
    let sortedTools = this.sortByPriority(contextFilteredTools, intentScores)

    // 🎯 关键修复：冲突工具排除
    // 当检测到单元格写入意图时，从候选列表中移除 word_insert_table
    sortedTools = this.resolveToolConflicts(userInput, sortedTools, intentScores)

    logger.info('[CANDIDATE TOOL SELECTION] Priority sorting completed', {
      sortedToolCount: sortedTools.length,
      toolNames: sortedTools.map((t) => ({ name: t.name, priority: t.priority })),
      intentHighlights: Array.from(intentScores.entries()).filter(([_, score]) => score > 0)
    })

    // 步骤 4: 截取候选
    const candidateTools = sortedTools.slice(0, maxCount)

    // 步骤 5: 如果候选工具不足,添加兜底工具
    if (candidateTools.length < 5) {
      const fallbackTools = this.getFallbackTools(context)

      logger.info('[CANDIDATE TOOL SELECTION] Adding fallback tools', {
        currentCount: candidateTools.length,
        fallbackCount: fallbackTools.length
      })

      // 合并并去重，但要根据选区类型过滤兜底工具
      const toolNames = new Set(candidateTools.map(t => t.name))
      for (const tool of fallbackTools) {
        // 图片选区时，排除不相关的工具
        if (context.selectionType === 'image') {
          if (tool.category === FunctionCategory.LIST ||
              tool.category === FunctionCategory.PARAGRAPH ||
              tool.category === FunctionCategory.FONT ||
              tool.category === FunctionCategory.STYLE) {
            continue // 跳过不适用于图片的工具
          }
        }

        if (!toolNames.has(tool.name) && candidateTools.length < maxCount) {
          candidateTools.push(tool)
          toolNames.add(tool.name)
        }
      }
    }

    logger.info('[CANDIDATE TOOL SELECTION] Final selection completed', {
      finalCount: candidateTools.length,
      selectedTools: candidateTools.map(t => ({
        name: t.name,
        category: t.category,
        priority: t.priority
      })),
      selectionReason: this.getSelectionReason(userInput, context, candidateTools)
    })

    return candidateTools
  }

  /**
   * 基于关键词匹配工具
   * 使用 KEYWORD_TO_TOOLS_MAPPING 映射表
   */
  private matchByKeywords(userInput: string): FormattingFunction[] {
    const normalizedInput = userInput.toLowerCase()
    const matchedToolNames = new Set<string>()

    // 遍历关键词映射表
    for (const [keyword, toolNames] of Object.entries(KEYWORD_TO_TOOLS_MAPPING)) {
      if (normalizedInput.includes(keyword.toLowerCase())) {
        toolNames.forEach((name) => matchedToolNames.add(name))
      }
    }

    // 检查 metadata 关键词
    this.allFunctions.forEach((func) => {
      const intentKeywords = func.metadata?.intentKeywords || []
      if (intentKeywords.some((keyword) => normalizedInput.includes(keyword.toLowerCase()))) {
        matchedToolNames.add(func.name)
      }
    })

    const matchedTools = this.allFunctions.filter((func) =>
      matchedToolNames.has(func.name)
    )

    logger.debug('[MATCH BY KEYWORDS] Keyword matching result', {
      matchedKeywords: Array.from(matchedToolNames),
      matchedToolCount: matchedTools.length
    })

    return matchedTools
  }

  /**
   * 根据上下文过滤工具
   * 基于选区类型、文档状态等信息
   */
  private filterByContext(
    tools: FormattingFunction[],
    context: SelectionContext
  ): FormattingFunction[] {
    // 🆕 首先按文档类型过滤（这是强制性的，不能绕过）
    const docTypeFiltered = tools.filter((tool) => this.matchesDocumentType(tool, context.documentType))

    let filtered = docTypeFiltered

    const affinityMatched = filtered.filter((tool) =>
      this.matchesSelectionAffinity(tool, context.selectionType)
    )

    if (affinityMatched.length > 0) {
      filtered = affinityMatched
    }

    if (context.selectionType === 'image') {
      const imageTools = this.allFunctions.filter((tool) =>
        (tool.name === 'align_images' ||
        tool.name === 'adjust_images_size' ||
        tool.name === 'format_image_border') &&
        this.matchesDocumentType(tool, context.documentType) // 🆕 确保图片工具也匹配文档类型
      )

      const otherRelevantTools = filtered.filter((tool) =>
        tool.category === FunctionCategory.IMAGE ||
        tool.category === FunctionCategory.SMART ||
        tool.name.includes('image') ||
        tool.name.includes('picture')
      )

      const combinedImageTools = new Map<string, FormattingFunction>()
      imageTools.forEach((tool) => combinedImageTools.set(tool.name, tool))
      otherRelevantTools.forEach((tool) => combinedImageTools.set(tool.name, tool))
      filtered = Array.from(combinedImageTools.values())

      logger.debug('[FILTER BY CONTEXT] Image selection detected, filtered to image tools', {
        filteredCount: filtered.length
      })
    }

    if (context.selectionType === 'table') {
      filtered = filtered.filter((tool) =>
        tool.category === FunctionCategory.TABLE || tool.name.includes('table')
      )

      logger.debug('[FILTER BY CONTEXT] Table selection detected, filtered to table tools', {
        filteredCount: filtered.length
      })
    }

    if (context.selectionType === 'text') {
      filtered = filtered.filter((tool) =>
        tool.category === FunctionCategory.FONT ||
        tool.category === FunctionCategory.PARAGRAPH ||
        tool.category === FunctionCategory.STYLE
      )

      logger.debug('[FILTER BY CONTEXT] Text selection detected, filtered to text tools', {
        filteredCount: filtered.length
      })
    }

    const isStrictContext = context.selectionType === 'image' || context.selectionType === 'table'

    if (filtered.length < 3) {
      if (isStrictContext) {
        logger.debug('[FILTER BY CONTEXT] Strict context, keeping filtered tools despite low count', {
          selectionType: context.selectionType,
          filteredCount: filtered.length
        })
        return filtered
      }

      // 🆕 即使工具数量少，也要保持文档类型过滤
      logger.debug('[FILTER BY CONTEXT] Too few tools after filtering, returning document-type filtered list')
      return docTypeFiltered
    }

    return filtered
  }

  /**
  /**
   * 按优先级排序工具
   * P0 (priority=0) > P1 (priority=1) > P2 (priority=2)
   */
  private sortByPriority(tools: FormattingFunction[], intentScores?: Map<string, number>): FormattingFunction[] {
    return [...tools].sort((a, b) => {
      const scoreA = intentScores?.get(a.name) ?? 0
      const scoreB = intentScores?.get(b.name) ?? 0
      if (scoreA !== scoreB) {
        return scoreB - scoreA
      }

      const priorityA = typeof a.priority === 'number' ? a.priority : 99
      const priorityB = typeof b.priority === 'number' ? b.priority : 99
      if (priorityA !== priorityB) {
        return priorityA - priorityB
      }

      const weightA = CATEGORY_WEIGHTS[a.category] || 1.0
      const weightB = CATEGORY_WEIGHTS[b.category] || 1.0
      return weightB - weightA
    })
  }

  /**
  /**
   * 获取兜底工具列表
   * 当关键词匹配失败或工具数量不足时使用
   */
  private getFallbackTools(context: SelectionContext): FormattingFunction[] {
    const fallbackTools: FormattingFunction[] = []

    // 根据选区类型提供不同的兜底工具
    if (context.selectionType === 'text' || context.selectionType === 'none') {
      // 文本选区或无选区: 提供常用文本格式化工具
      const commonTextTools = ['apply_font_formatting', 'apply_paragraph_formatting', 'apply_style']
      fallbackTools.push(...this.allFunctions.filter(f => commonTextTools.includes(f.name)))
    }

    if (context.selectionType === 'image') {
      // 图片选区: 提供图片相关工具
      const imageTools = ['align_images', 'adjust_images_size', 'format_image_border']
      fallbackTools.push(...this.allFunctions.filter(f => imageTools.includes(f.name)))
    }

    if (context.selectionType === 'table') {
      // 表格选区: 提供表格相关工具
      const tableTools = ['insert_table', 'format_table', 'format_table_border']
      fallbackTools.push(...this.allFunctions.filter(f => tableTools.includes(f.name)))
    }

    // 添加高优先级工具 (P0)，但排除只读/查询类工具
    const excludedFromFallback = [
      'word_get_paragraphs',
      'word_read_document',
      'word_get_selected_text',
      'excel_read_sheet',
      'ppt_get_slides'
    ]
    const p0Tools = this.allFunctions.filter(f => 
      f.priority === 0 && !excludedFromFallback.includes(f.name)
    )
    fallbackTools.push(...p0Tools.slice(0, 5))

    // 去重
    const uniqueTools = Array.from(new Map(fallbackTools.map(t => [t.name, t])).values())

    logger.debug('[GET FALLBACK TOOLS] Fallback tools generated', {
      selectionType: context.selectionType,
      fallbackCount: uniqueTools.length,
      toolNames: uniqueTools.map(t => t.name)
    })

    return uniqueTools
  }

  /**
   * 从用户输入中提取匹配的关键词
   */
  private extractKeywords(userInput: string): Set<string> {
    const normalizedInput = userInput.toLowerCase()
    const matchedKeywords = new Set<string>()

    for (const keyword of Object.keys(KEYWORD_TO_TOOLS_MAPPING)) {
      if (normalizedInput.includes(keyword.toLowerCase())) {
        matchedKeywords.add(keyword)
      }
    }

    return matchedKeywords
  }

  /**
   * 生成工具选择原因说明
   * 用于日志和调试
   */
  private getSelectionReason(
    userInput: string,
    context: SelectionContext,
    selectedTools: FormattingFunction[]
  ): string {
    const reasons: string[] = []

    const keywords = this.extractKeywords(userInput)
    if (keywords.size > 0) {
      reasons.push(`关键词匹配: ${[...keywords].join(', ')}`)
    }

    if (context.selectionType !== 'none') {
      reasons.push(`选中内容: ${context.selectionType}`)
    }

    if (context.documentType) {
      reasons.push(`文档类型: ${context.documentType}`)
    }

    const scenarioHints = selectedTools
      .map((tool) => tool.metadata?.scenario)
      .filter((scenario): scenario is string => Boolean(scenario))
      .slice(0, 2)
    if (scenarioHints.length > 0) {
      reasons.push(`场景提示: ${scenarioHints.join(', ')}`)
    }

    const p0Count = selectedTools.filter((t) => t.priority === 0).length
    if (p0Count > 0) {
      reasons.push(`包含 ${p0Count} 个 P0 优先级工具`)
    }

    return reasons.join('; ')
  }

  private calculateIntentScores(userInput: string, tools: FormattingFunction[]): Map<string, number> {
    const normalizedInput = userInput.toLowerCase()
    const scores = new Map<string, number>()

    // 检测行列写入模式
    const rowColumnPattern = /第\s*\d+\s*行.*第?\s*\d+\s*列|第\s*\d+\s*列.*第?\s*\d+\s*行|row\s*\d+.*col|col\s*\d+.*row/i
    const cellWritePattern = /写入|填入|填充|设置.*单元格|表格.*写|cell.*value|write.*cell/i
    const hasRowColumnRef = rowColumnPattern.test(userInput)
    const hasCellWriteIntent = cellWritePattern.test(userInput)

    tools.forEach((tool) => {
      let score = 0
      const keywords = tool.metadata?.intentKeywords || []
      keywords.forEach((keyword) => {
        if (keyword && normalizedInput.includes(keyword.toLowerCase())) {
          score += keyword.length > 3 ? 2 : 1
        }
      })

      if (tool.metadata?.scenario) {
        tool.metadata.scenario
          .split(/[，。,、]/)
          .map((fragment) => fragment.trim().toLowerCase())
          .filter((fragment) => fragment.length >= 2)
          .forEach((fragment) => {
            if (normalizedInput.includes(fragment)) {
              score += 1
            }
          })
      }

      // 🎯 关键修复：检测行列写入意图，强制提升 word_set_cell_value
      if (hasRowColumnRef || hasCellWriteIntent) {
        // 检查工具是否有 rowIndex/columnIndex 参数
        const schemaProps = tool.inputSchema?.properties || {}
        const hasRowColParams = 'rowIndex' in schemaProps || 'columnIndex' in schemaProps || 
                                'row' in schemaProps || 'column' in schemaProps
        
        // word_set_cell_value 强制加分
        if (tool.name === 'word_set_cell_value') {
          score += 10  // 强制优先
          logger.debug('[INTENT SCORE] Boosted word_set_cell_value for row/column intent', { score })
        } else if (hasRowColParams && tool.metadata?.applicableSelection?.includes('table')) {
          score += 5
        }
        
        // word_insert_table 在有行列写入意图时降分
        if (tool.name === 'word_insert_table' && (hasRowColumnRef || hasCellWriteIntent)) {
          score -= 5  // 惩罚，避免误选
          logger.debug('[INTENT SCORE] Penalized word_insert_table for cell write intent', { score })
        }
      }

      if (score > 0) {
        scores.set(tool.name, score)
      }
    })

    return scores
  }

  /**
   * 🎯 冲突工具解析（增强版）
   * 当检测到特定意图时，排除冲突的工具，避免 AI 模型错误选择
   */
  private resolveToolConflicts(
    userInput: string,
    tools: FormattingFunction[],
    intentScores: Map<string, number>
  ): FormattingFunction[] {
    const conflicts = this.detectAllConflicts(userInput, tools)
    
    if (conflicts.length === 0) {
      return tools
    }
    
    let filteredTools = [...tools]
    
    for (const conflict of conflicts) {
      logger.info('[TOOL CONFLICT RESOLUTION] Resolving conflict', {
        type: conflict.type,
        winner: conflict.winner,
        losers: conflict.losers,
        reason: conflict.reason
      })
      
      // 移除冲突中的失败者
      filteredTools = filteredTools.filter(t => !conflict.losers.includes(t.name))
      
      // 确保胜出者在列表中
      if (conflict.winner && !filteredTools.some(t => t.name === conflict.winner)) {
        const winnerTool = this.allFunctions.find(t => t.name === conflict.winner)
        if (winnerTool) {
          filteredTools.unshift(winnerTool)
          logger.info('[TOOL CONFLICT RESOLUTION] Added winner tool', { winner: conflict.winner })
        }
      }
    }
    
    return filteredTools
  }

  /**
   * 检测所有工具冲突
   */
  private detectAllConflicts(userInput: string, tools: FormattingFunction[]): ConflictInfo[] {
    const conflicts: ConflictInfo[] = []
    const toolNames = new Set(tools.map(t => t.name))
    
    // ========== 冲突1: 表格插入 vs 单元格写入 ==========
    if (toolNames.has('word_insert_table') || toolNames.has('word_set_cell_value')) {
      const cellWritePatterns = [
        /第\s*\d+\s*行/,
        /第\s*\d+\s*列/,
        /写入|填入|填充/,
        /单元格/,
        /表格.*写|在表格/,
        /row\s*\d|col\s*\d/i
      ]
      const tableCreatePatterns = [
        /插入\s*(一个|一张|个)?\s*\d*\s*(行|列|x|\*)?\s*\d*\s*(行|列)?\s*(的)?\s*表格/,
        /创建.*表格/,
        /新建.*表格/,
        /添加.*表格/,
        /insert.*table/i,
        /create.*table/i
      ]
      
      const hasCellWriteIntent = cellWritePatterns.some(p => p.test(userInput))
      const hasTableCreateIntent = tableCreatePatterns.some(p => p.test(userInput))
      
      if (hasCellWriteIntent && !hasTableCreateIntent) {
        conflicts.push({
          type: 'table_vs_cell',
          winner: 'word_set_cell_value',
          losers: ['word_insert_table'],
          reason: '检测到单元格写入意图（行/列引用或写入关键词），排除表格创建工具'
        })
      } else if (hasTableCreateIntent && !hasCellWriteIntent) {
        conflicts.push({
          type: 'table_vs_cell',
          winner: 'word_insert_table',
          losers: ['word_set_cell_value'],
          reason: '检测到表格创建意图，排除单元格写入工具'
        })
      }
    }
    
    // ========== 冲突2: 文本插入 vs 文本替换 ==========
    if (toolNames.has('word_insert_text') && toolNames.has('word_replace_text')) {
      const replacePatterns = [/替换/, /换成/, /改为/, /把.*改/, /将.*改/]
      const insertOnlyPatterns = [/^插入/, /^添加/, /^写入/]
      
      const hasReplaceIntent = replacePatterns.some(p => p.test(userInput))
      const hasInsertOnlyIntent = insertOnlyPatterns.some(p => p.test(userInput)) && !hasReplaceIntent
      
      if (hasReplaceIntent) {
        conflicts.push({
          type: 'insert_vs_replace',
          winner: 'word_replace_text',
          losers: ['word_insert_text'],
          reason: '检测到替换意图'
        })
      } else if (hasInsertOnlyIntent) {
        conflicts.push({
          type: 'insert_vs_replace',
          winner: 'word_insert_text',
          losers: ['word_replace_text'],
          reason: '检测到纯插入意图'
        })
      }
    }
    
    // ========== 冲突3: 读取文档 vs 修改文档 ==========
    const readTools = ['word_read_document', 'word_get_paragraphs', 'word_get_selected_text']
    const writeTools = ['word_insert_text', 'word_replace_text', 'word_format_text']
    const hasReadTool = readTools.some(t => toolNames.has(t))
    const hasWriteTool = writeTools.some(t => toolNames.has(t))
    
    if (hasReadTool && hasWriteTool) {
      const readOnlyPatterns = [/^查看/, /^读取/, /^获取/, /^显示/, /有什么/, /是什么/]
      const writePatterns = [/修改/, /编辑/, /格式化/, /插入/, /删除/, /替换/]
      
      const isReadOnly = readOnlyPatterns.some(p => p.test(userInput)) && 
                         !writePatterns.some(p => p.test(userInput))
      
      if (isReadOnly) {
        conflicts.push({
          type: 'read_vs_write',
          winner: 'word_read_document',
          losers: writeTools.filter(t => toolNames.has(t)),
          reason: '检测到只读查询意图，排除写入工具'
        })
      }
    }
    
    logger.info('[TOOL CONFLICT RESOLUTION] Detected conflicts', {
      userInput: userInput.substring(0, 50),
      conflictCount: conflicts.length,
      conflicts: conflicts.map(c => ({ type: c.type, winner: c.winner }))
    })
    
    return conflicts
  }

  private matchesDocumentType(tool: FormattingFunction, documentType: SelectionContext['documentType']): boolean {
    const allowed = tool.metadata?.documentTypes
    if (!allowed || allowed.length === 0) {
      return true
    }
    return allowed.includes(documentType)
  }

  private matchesSelectionAffinity(tool: FormattingFunction, selectionType: SelectionContext['selectionType']): boolean {
    const affinity = tool.metadata?.applicableSelection
    if (!affinity || affinity.length === 0) {
      return selectionType !== 'image'
    }

    if (selectionType === 'none') {
      return affinity.includes('none') || affinity.includes('text')
    }

    return affinity.includes(selectionType)
  }

  /**
  /**
   * 🗑️ DEPRECATED: 以下方法已废弃,仅用于旧的 selectTools() 方法
   * 新的 selectCandidateTools() 方法使用更简洁的 KEYWORD_TO_TOOLS_MAPPING
   *
   * @deprecated
   * - extractKeywords() - 已废弃
   * - matchCategories() - 已废弃
   * - selectFunctionsByCategories() - 已废弃
   * - rankFunctionsByRelevance() - 已废弃
   * - calculateContextRelevance() - 已废弃
   * - getDefaultHighFrequencyFunctions() - 已废弃
   * - calculateConfidence() - 已废弃
   */

  /**
   * 按类别分组函数
   */
  private groupFunctionsByCategory(functions: FormattingFunction[]): Map<FunctionCategory, FormattingFunction[]> {
    const grouped = new Map<FunctionCategory, FormattingFunction[]>()

    // 初始化所有类别
    Object.values(FunctionCategory).forEach(category => {
      grouped.set(category, [])
    })

    // 分组函数
    functions.forEach(func => {
      const categoryFunctions = grouped.get(func.category) || []
      categoryFunctions.push(func)
      grouped.set(func.category, categoryFunctions)
    })

    return grouped
  }

  /**
   * 获取工具选择统计信息
   */
  getSelectionStats(): {
    totalFunctions: number
    functionsByCategory: Record<string, number>
    availableCategories: string[]
  } {
    const functionsByCategory: Record<string, number> = {}

    this.functionByCategory.forEach((functions, category) => {
      functionsByCategory[category] = functions.length
    })

    return {
      totalFunctions: this.allFunctions.length,
      functionsByCategory,
      availableCategories: Object.values(FunctionCategory)
    }
  }

  /**
   * 更新函数列表
   */
  updateFunctions(newFunctions: FormattingFunction[]): void {
    logger.info(`Updating functions from ${this.allFunctions.length} to ${newFunctions.length}`)
    this.allFunctions = newFunctions
    this.functionByCategory = this.groupFunctionsByCategory(newFunctions)
  }

  // ==================== 🆕 Adapter 集成方法 ====================

  /**
   * 🆕 使用 Adapter 进行工具过滤
   *
   * 委托给对应应用的 Adapter 来判断工具是否适用
   */
  filterToolsWithAdapter(
    tools: FormattingFunction[],
    context: SelectionContext
  ): FormattingFunction[] {
    const adapter = getAdapter(context.documentType)

    if (!adapter) {
      logger.debug('[ADAPTER FILTER] No adapter found, using default filtering')
      return tools
    }

    // 获取 Adapter 的过滤条件
    const selectionInfo = {
      hasSelection: context.hasSelection,
      selectionType: context.selectionType
    }

    const filterCriteria = adapter.getToolFilterCriteria(selectionInfo)

    // 使用 Adapter 判断工具是否属于当前应用
    const filteredTools = tools.filter(tool => {
      // 检查工具是否属于当前应用或是通用工具
      const isForThisApp = adapter.isToolForThisApp(tool.name)
      const isCommonTool = !tool.name.startsWith('word_') &&
                          !tool.name.startsWith('excel_') &&
                          !tool.name.startsWith('ppt_')

      return isForThisApp || isCommonTool
    })

    logger.debug('[ADAPTER FILTER] Tools filtered by adapter', {
      appType: context.documentType,
      originalCount: tools.length,
      filteredCount: filteredTools.length,
      filterCriteria
    })

    return filteredTools
  }

  /**
   * 🆕 使用 Adapter 的 filterToolsByIntent 进行意图过滤
   *
   * 这是增强版本，结合用户意图和上下文进行更精确的过滤
   */
  filterToolsByIntentWithAdapter(
    tools: FormattingFunction[],
    userInput: string,
    context: SelectionContext
  ): FormattingFunction[] {
    const adapter = getAdapter(context.documentType)

    if (!adapter) {
      logger.debug('[ADAPTER INTENT FILTER] No adapter found, using default filtering')
      return this.filterToolsWithAdapter(tools, context)
    }

    // 提取关键词（转换为数组）
    const keywordsSet = this.extractKeywords(userInput)
    const keywords = Array.from(keywordsSet)

    // 构建过滤上下文
    const filterContext = {
      userIntent: userInput,
      selectionType: context.selectionType,
      hasSelection: context.hasSelection,
      keywords
    }

    try {
      // 使用 Adapter 的 filterToolsByIntent 方法
      const filteredTools = adapter.filterToolsByIntent(tools, filterContext)

      logger.debug('[ADAPTER INTENT FILTER] Tools filtered by intent', {
        appType: context.documentType,
        originalCount: tools.length,
        filteredCount: filteredTools.length,
        keywords
      })

      return filteredTools
    } catch (error) {
      logger.warn('[ADAPTER INTENT FILTER] Failed, falling back to default', { error })
      return this.filterToolsWithAdapter(tools, context)
    }
  }

  /**
   * 🆕 获取当前应用的 Adapter
   */
  getAdapterForApp(appType: string): IOfficeAppAdapter | undefined {
    return getAdapter(appType as any)
  }

  /**
   * 🆕 根据 Adapter 判断工具是否匹配
   */
  isToolMatchingAdapter(tool: FormattingFunction, context: SelectionContext): boolean {
    const adapter = getAdapter(context.documentType)

    if (!adapter) {
      return true // 没有 Adapter 时，默认匹配
    }

    return adapter.isToolForThisApp(tool.name)
  }

  /**
   * 🆕 获取 Adapter 的关键词工具映射
   */
  getAdapterKeywordMappings(context: SelectionContext): Record<string, string[]> {
    const adapter = getAdapter(context.documentType)

    if (!adapter) {
      return {}
    }

    return adapter.getKeywordToolMappings()
  }
}

/**
 * 便捷函数：创建工具选择器
 */
export function createToolSelector(functions: FormattingFunction[]): ToolSelector {
  return new ToolSelector(functions)
}

/**
 * 便捷函数：选择工具
 */
export function selectTools(
  functions: FormattingFunction[],
  message: string,
  maxTools: number = 10,
  context?: SelectionContext
): FormattingFunction[] {
  const selector = new ToolSelector(functions)
  const defaultContext: SelectionContext = {
    hasSelection: false,
    selectionType: 'none',
    documentType: 'word'
  }
  return selector.selectCandidateTools(message, context || defaultContext, maxTools)
}
