# Office 插件性能与准确性优化方案

> 文档版本: 1.2  
> 创建日期: 2025-12-29  
> 更新日期: 2025-12-29  
> 状态: **全部完成** ✅

## 实施进度

| 阶段 | 状态 | 完成项 |
|------|------|--------|
| P0 优先级 | ✅ 已完成 | 工具冲突解决、Few-shot 示例、预热缓存 |
| P1 优先级 | ✅ 已完成 | 精简提示词、工具调用验证 |
| P2 优先级 | ✅ 已完成 | 并行化、MCP 缓存增强、文档上下文提取 |
| P3 优先级 | ✅ 已完成 | 提示词结构改进、意图识别增强 |

## 目录

1. [问题概述](#问题概述)
2. [问题一：AI 响应速度极慢](#问题一ai-响应速度极慢)
3. [问题二：上下文理解能力弱](#问题二上下文理解能力弱)
4. [问题三：工具调用准确性低](#问题三工具调用准确性低)
5. [实施计划](#实施计划)
6. [风险评估](#风险评估)

---

## 问题概述

根据日志分析，Office 插件存在以下三个核心问题：

| 问题 | 现象 | 影响 |
|------|------|------|
| AI 响应慢 | 6.5 秒延迟 | 用户体验差 |
| 上下文理解弱 | 无法准确理解文档内容 | 操作不符合预期 |
| 工具调用不准确 | 调用错误工具或参数 | 执行失败或结果错误 |

---

## 问题一：AI 响应速度极慢

### 1.1 根因分析

**日志时间线：**

```
07:40:49.967Z - StreamToolCallAccumulator 生成工具调用
07:40:49.968Z - useFunctionCalling 准备执行
07:40:56.499Z - FunctionCallHandler 开始处理 (延迟 6.5 秒!)
07:40:56.782Z - McpToolExecutor 执行完成 (实际执行仅 283ms)
```

**瓶颈定位：**

1. **基础设施重复初始化** (`useToolExecution.ts`)
   - 每次消息都重新创建 `FunctionCallHandler`、`StreamToolCallAccumulator`、`ToolSelector`
   - 预估耗时：500-1000ms

2. **MCP 工具执行链路过长**
   ```
   用户请求 → aiService → SSE流 → onMCPTool回调 → McpCommandPoller → McpToolExecutor → MCP Server
   ```
   - 多次网络往返，每次 100-500ms

3. **系统提示词过长** (`PromptBuilder.ts`)
   - 当前强制执行指令约 1500 字符
   - 增加 LLM 推理时间约 500-1000ms

4. **串行等待设计**
   - 工具选择、prompt 构建、上下文获取串行执行
   - 可并行化节省 1-2 秒

### 1.2 优化方案

#### 方案 1.1: 预热和缓存基础设施 ⭐ P0

**目标：** 减少重复初始化开销

**修改文件：** `office-plugin/src/components/features/chat/hooks/tools/useToolExecution.ts`

```typescript
// 在组件挂载时预初始化（而非每次消息时）
useEffect(() => {
  const warmUp = async () => {
    const registry = getFunctionRegistry()
    const handler = new FunctionCallHandler(registry, {
      onConfirmRequest: config.onConfirmRequest,
      onBatchConfirm: config.onBatchConfirm,
      onProgress: config.onProgress,
      undoManager: config.undoManager
    })
    const accumulator = new StreamToolCallAccumulator()
    const toolSelector = new ToolSelector(registry.getAllFunctions())
    
    // 预加载 MCP 工具定义
    await dynamicToolDiscovery.discoverTools()
    
    updateState({ 
      registry, 
      handler, 
      accumulator, 
      toolSelector, 
      mcpToolsLoaded: true 
    })
    
    logger.info('[WARM_UP] Infrastructure pre-initialized')
  }
  
  warmUp()
}, []) // 仅在挂载时执行一次
```

**预期效果：** 减少 1-2 秒延迟

---

#### 方案 1.2: 精简系统提示词 ⭐ P1

**目标：** 减少 LLM 推理时间

**修改文件：** `office-plugin/src/services/ai/prompts/PromptBuilder.ts`

**当前代码（约 1500 字符）：**
```typescript
const forceExecutionInstruction = `
【CRITICAL SYSTEM INSTRUCTION - 关键系统指令】
You are an AUTOMATED TOOL EXECUTOR, NOT a conversational assistant.
Your ONLY job is to EXECUTE user commands IMMEDIATELY...
// ... 大量重复指令
`
```

**优化后（约 300 字符）：**
```typescript
const forceExecutionInstruction = `
【执行规则】
1. 用户命令 → 立即调用工具，不询问
2. 参数不明确 → 使用合理默认值
3. 禁止返回"我可以帮你..."等询问文本
4. 工具调用 = 成功，纯文本回复 = 失败`
```

**预期效果：** 减少 0.5-1 秒延迟

---

#### 方案 1.3: 并行化非依赖操作 ⭐ P2

**目标：** 并行执行独立操作

**修改文件：** `office-plugin/src/components/features/chat/hooks/useFunctionCalling.ts`

```typescript
const internalSend = useCallback(async (options: InternalSendOptions) => {
  // 🔧 优化：并行执行独立操作
  const [infrastructure, selectionContext] = await Promise.all([
    ensureFunctionInfrastructure(),
    getSelectionContextForApp(currentOfficeApp)
  ])
  
  // 工具选择和 agentPromptOptions 构建可以并行
  const toolSelectionPromise = selectToolsForMessage(
    userMessage, 
    currentOfficeApp, 
    infrastructure
  )
  
  const agentPromptOptions = {
    officeApp: selectionContext.documentType as OfficeAppType,
    hasSelection: selectionContext.hasSelection,
    selectionType: selectionContext.selectionType
  }
  
  const { tools: selectedTools } = await toolSelectionPromise
  
  // ... 后续逻辑
}, [])
```

**预期效果：** 减少 1-2 秒延迟

---

#### 方案 1.4: 增强 MCP 工具缓存 ⭐ P2

**目标：** 减少重复的 MCP 调用

**修改文件：** `office-plugin/src/services/ai/McpToolExecutor.ts`

```typescript
export class McpToolExecutor {
  // 增加缓存 TTL（读操作）
  private cacheTTL: number = 30000  // 从 5 秒增加到 30 秒
  
  // 扩展可缓存的工具模式
  private cacheablePatterns: RegExp[] = [
    /^word_read_/,
    /^word_get_/,
    /^word_get_paragraphs$/,      // 新增
    /^word_get_document_structure$/, // 新增
    /^excel_read_/,
    /^excel_get_/,
    /^ppt_read_/,
    /^ppt_get_/
  ]
  
  // 新增：预取常用数据
  async prefetchCommonData(): Promise<void> {
    const commonTools = ['word_read_document', 'word_get_paragraphs']
    await Promise.all(
      commonTools.map(tool => this.executeTool(tool, {}))
    )
    logger.info('[CACHE] Common data prefetched')
  }
}
```

**预期效果：** 后续请求减少 500ms-1s

---

## 问题二：上下文理解能力弱

### 2.1 根因分析

1. **文档内容提取不完整**
   - 当前只传递 `officeDocument` 的 base64 数据
   - 没有结构化的文档上下文（段落、标题、表格位置等）

2. **系统提示词缺乏文档结构信息**
   - 只有应用类型和选区信息
   - AI 不知道文档的整体结构

3. **意图提取过于简单**
   - 基于关键词的简单匹配
   - 容易将"分析问题"误判为"修复问题"

4. **用户消息被系统包装污染**
   - 清理逻辑可能丢失关键信息

### 2.2 优化方案

#### 方案 2.1: 创建文档上下文提取器 ⭐ P2

**目标：** 提供结构化的文档上下文

**新建文件：** `office-plugin/src/services/ai/DocumentContextExtractor.ts`

```typescript
import Logger from '../../utils/logger'
import { mcpToolExecutor } from './McpToolExecutor'

const logger = new Logger('DocumentContextExtractor')

export interface DocumentStructure {
  headings: Array<{ level: number; text: string; position: number }>
  paragraphCount: number
  tableCount: number
  imageCount: number
  hasIssueMarkers?: boolean
}

export interface SelectionContextInfo {
  beforeText: string   // 选区前 200 字符
  selectedText: string
  afterText: string    // 选区后 200 字符
}

export interface DocumentContext {
  title?: string
  structure: DocumentStructure
  selectionContext?: SelectionContextInfo
  relevantParagraphs?: string[]
}

export class DocumentContextExtractor {
  private cache: DocumentContext | null = null
  private cacheTimestamp: number = 0
  private cacheTTL: number = 10000 // 10 秒缓存

  async extractContext(userMessage: string): Promise<DocumentContext> {
    // 检查缓存
    if (this.cache && Date.now() - this.cacheTimestamp < this.cacheTTL) {
      logger.debug('[CONTEXT] Using cached document context')
      return this.cache
    }

    try {
      // 1. 获取文档结构
      const structure = await this.getDocumentStructure()
      
      // 2. 获取选区上下文
      const selectionContext = await this.getSelectionContext()
      
      // 3. 基于用户意图提取相关段落
      const relevantParagraphs = await this.findRelevantParagraphs(
        userMessage, 
        structure
      )

      const context: DocumentContext = {
        structure,
        selectionContext,
        relevantParagraphs
      }

      // 更新缓存
      this.cache = context
      this.cacheTimestamp = Date.now()

      return context
    } catch (error) {
      logger.error('[CONTEXT] Failed to extract context', { error })
      return {
        structure: {
          headings: [],
          paragraphCount: 0,
          tableCount: 0,
          imageCount: 0
        }
      }
    }
  }

  private async getDocumentStructure(): Promise<DocumentStructure> {
    const result = await mcpToolExecutor.executeTool('word_get_paragraphs', {})
    
    if (!result.success || !result.data) {
      return {
        headings: [],
        paragraphCount: 0,
        tableCount: 0,
        imageCount: 0
      }
    }

    const paragraphs = result.data.paragraphs || []
    const headings = paragraphs
      .filter((p: any) => p.style?.startsWith('Heading'))
      .map((p: any, index: number) => ({
        level: parseInt(p.style.replace('Heading', '')) || 1,
        text: p.text?.substring(0, 50) || '',
        position: index
      }))

    return {
      headings,
      paragraphCount: paragraphs.length,
      tableCount: result.data.tableCount || 0,
      imageCount: result.data.imageCount || 0
    }
  }

  private async getSelectionContext(): Promise<SelectionContextInfo | undefined> {
    const result = await mcpToolExecutor.executeTool('word_get_selected_text', {})
    
    if (!result.success || !result.data?.text) {
      return undefined
    }

    return {
      beforeText: result.data.beforeText?.substring(-200) || '',
      selectedText: result.data.text,
      afterText: result.data.afterText?.substring(0, 200) || ''
    }
  }

  private async findRelevantParagraphs(
    userMessage: string, 
    structure: DocumentStructure
  ): Promise<string[]> {
    // 简单的关键词匹配
    const keywords = this.extractKeywords(userMessage)
    
    if (keywords.length === 0) {
      return []
    }

    // 这里可以扩展为更复杂的相关性匹配
    return []
  }

  private extractKeywords(text: string): string[] {
    const stopWords = new Set(['的', '是', '在', '和', '了', '有', '我', '你', '这', '那'])
    return text
      .split(/\s+/)
      .filter(word => word.length > 1 && !stopWords.has(word))
      .slice(0, 5)
  }

  clearCache(): void {
    this.cache = null
    this.cacheTimestamp = 0
  }
}

export const documentContextExtractor = new DocumentContextExtractor()
```

**预期效果：** 提供结构化上下文，提升理解准确率 20-30%

---

#### 方案 2.2: 改进系统提示词结构 ⭐ P3

**目标：** 在提示词中包含文档结构信息

**修改文件：** `office-plugin/src/services/ai/prompts/AgentPromptManager.ts`

```typescript
// 在 AgentPromptContext 接口中添加
export interface AgentPromptContext {
  // ... 现有字段
  documentContext?: DocumentContext  // 新增
}

// 修改 generateAgentSystemPrompt 方法
generateAgentSystemPrompt(context: AgentPromptContext): string {
  const parts: string[] = []
  
  // 1. 角色定义（简洁）
  parts.push(`你是 ${context.officeApp} 文档编辑助手。`)
  
  // 2. 文档上下文（新增）
  if (context.documentContext?.structure) {
    const { structure } = context.documentContext
    parts.push(`
【当前文档】
- 段落数: ${structure.paragraphCount}
- 标题数: ${structure.headings.length}
- 表格数: ${structure.tableCount}
- 图片数: ${structure.imageCount}`)
    
    if (structure.headings.length > 0) {
      const headingList = structure.headings
        .slice(0, 5)
        .map(h => `  ${'#'.repeat(h.level)} ${h.text}`)
        .join('\n')
      parts.push(`\n文档结构:\n${headingList}`)
    }
  }
  
  // 3. 选区上下文（新增）
  if (context.documentContext?.selectionContext) {
    const { selectionContext } = context.documentContext
    parts.push(`
【当前选区】
前文: ...${selectionContext.beforeText.slice(-50)}
选中: ${selectionContext.selectedText.slice(0, 100)}${selectionContext.selectedText.length > 100 ? '...' : ''}
后文: ${selectionContext.afterText.slice(0, 50)}...`)
  }
  
  // 4. 可用工具（精简列表）
  if (context.availableTools && context.availableTools.length > 0) {
    const toolNames = context.availableTools.map(t => t.name).join(', ')
    parts.push(`\n【可用工具】${toolNames}`)
  }
  
  // 5. 执行规则
  parts.push(this.buildClarificationInstruction(context.clarificationPolicy))
  
  return parts.join('\n')
}
```

**预期效果：** AI 能更好地理解文档结构和当前上下文

---

#### 方案 2.3: 增强意图识别 ⭐ P3

**目标：** 更准确地区分"查询"和"执行"意图

**修改文件：** `office-plugin/src/services/ai/prompts/IntentExtractor.ts`

```typescript
// 在 isQuery 方法中增强判断逻辑
private isQuery(input: string): boolean {
  const lowerInput = input.toLowerCase()
  
  // 🔴 首先检查是否包含执行关键词
  const executeKeywords = [
    '修改', '调整', '执行', '应用', '修复', '处理', '更新', '设置',
    '删除', '添加', '插入', '替换', '移除', '改为', '换成', '设为',
    '格式化', '重新排版', '重新整理', '优化', '美化',
    '解决', '纠正', '改正', '完善', '整改'
  ]
  
  const hasExecuteKeyword = executeKeywords.some(kw => 
    lowerInput.includes(kw.toLowerCase())
  )
  
  if (hasExecuteKeyword) {
    return false  // 有执行关键词，不是查询
  }
  
  // 🟢 检查查询模式
  const queryPatterns = [
    /[？?]$/,                           // 问号结尾
    /^(有多少|是什么|怎么|如何|为什么)/, // 疑问词开头
    /^(告诉我|说说|讲讲|分析|检查|查看)/, // 查询动词开头
    /(问题|情况|状态|信息)$/,            // 查询名词结尾
    /存在(什么|哪些|的)?(问题|错误)/     // 问题查询模式
  ]
  
  return queryPatterns.some(p => p.test(input))
}
```

**预期效果：** 减少意图误判，提升准确率 15-20%

---

## 问题三：工具调用准确性低

### 3.1 根因分析

1. **工具描述不够精确**
   - 描述过于简单，如 "在文档中插入文本"
   - 缺少使用场景和参数说明

2. **工具选择存在冲突**
   - `word_insert_table` 和 `word_set_cell_value` 同时被选中
   - AI 无法正确区分"创建表格"和"写入单元格"

3. **缺少工具调用示例（Few-shot）**
   - 没有在 prompt 中提供工具调用的示例
   - AI 需要"猜测"如何调用工具

4. **工具参数 schema 不完整**
   - 缺少 `required` 字段
   - 缺少 `example` 和 `description`

### 3.2 优化方案

#### 方案 3.1: 增强工具描述 ⭐ P1

**目标：** 提供更详细的工具描述

**新建文件：** `office-plugin/src/services/ai/ToolDescriptionEnhancer.ts`

```typescript
import type { FormattingFunction } from './types'
import Logger from '../../utils/logger'

const logger = new Logger('ToolDescriptionEnhancer')

/**
 * 工具描述增强器
 * 为工具添加更详细的描述、使用场景和参数说明
 */
export class ToolDescriptionEnhancer {
  /**
   * 增强单个工具的描述
   */
  enhance(tool: FormattingFunction): FormattingFunction {
    const enhanced = { ...tool }
    
    // 构建增强描述
    const parts: string[] = [tool.description]
    
    // 添加使用场景
    if (tool.metadata?.scenario) {
      parts.push(`\n使用场景: ${tool.metadata.scenario}`)
    }
    
    // 添加适用选区类型
    if (tool.metadata?.applicableSelection?.length) {
      parts.push(`适用于: ${tool.metadata.applicableSelection.join('/')}选区`)
    }
    
    // 添加参数说明
    const paramDescriptions = this.buildParamDescriptions(tool)
    if (paramDescriptions) {
      parts.push(`\n参数:\n${paramDescriptions}`)
    }
    
    enhanced.description = parts.join('\n')
    
    return enhanced
  }

  /**
   * 批量增强工具描述
   */
  enhanceAll(tools: FormattingFunction[]): FormattingFunction[] {
    return tools.map(tool => this.enhance(tool))
  }

  /**
   * 构建参数描述
   */
  private buildParamDescriptions(tool: FormattingFunction): string {
    const schema = tool.inputSchema
    if (!schema?.properties) return ''
    
    const required = new Set(schema.required || [])
    
    return Object.entries(schema.properties)
      .map(([key, prop]: [string, any]) => {
        const isRequired = required.has(key) ? '(必填)' : '(可选)'
        const type = prop.type || 'any'
        const desc = prop.description || ''
        const example = prop.example ? ` 示例: ${JSON.stringify(prop.example)}` : ''
        const enumValues = prop.enum ? ` 可选值: ${prop.enum.join('|')}` : ''
        
        return `  - ${key} ${isRequired}: ${type} - ${desc}${example}${enumValues}`
      })
      .join('\n')
  }
}

export const toolDescriptionEnhancer = new ToolDescriptionEnhancer()
```

**预期效果：** AI 更清楚每个工具的用途和参数

---

#### 方案 3.2: 添加 Few-shot 示例 ⭐ P0

**目标：** 通过示例教 AI 如何正确调用工具

**修改文件：** `office-plugin/src/services/ai/prompts/AgentPromptManager.ts`

```typescript
/**
 * 获取工具调用示例（Few-shot）
 */
private getFewShotExamples(officeApp: OfficeAppType): string {
  const examples: Record<OfficeAppType, string> = {
    word: `
【工具调用示例】

示例1 - 文本格式化:
用户: "把选中的文字加粗"
正确调用: word_format_text({ "bold": true })

示例2 - 表格单元格写入:
用户: "在表格第2行第3列写入'完成'"
正确调用: word_set_cell_value({ "tableIndex": 0, "rowIndex": 1, "columnIndex": 2, "value": "完成" })
注意: rowIndex 和 columnIndex 从 0 开始计数

示例3 - 创建新表格:
用户: "插入一个3行4列的表格"
正确调用: word_insert_table({ "rows": 3, "columns": 4 })

示例4 - 查找替换:
用户: "把所有的'旧文本'替换成'新文本'"
正确调用: word_replace_text({ "searchText": "旧文本", "replaceText": "新文本", "replaceAll": true })

⚠️ 重要区分:
- "在表格写入/填入" → 使用 word_set_cell_value
- "插入/创建表格" → 使用 word_insert_table
`,
    excel: `
【工具调用示例】

示例1 - 单元格写入:
用户: "在A1单元格写入'标题'"
正确调用: excel_set_cell_value({ "address": "A1", "value": "标题" })

示例2 - 批量填充:
用户: "在A1到A10填入1到10"
正确调用: excel_set_range_values({ "range": "A1:A10", "values": [[1],[2],[3],[4],[5],[6],[7],[8],[9],[10]] })
`,
    powerpoint: `
【工具调用示例】

示例1 - 添加文本:
用户: "在当前幻灯片添加标题'项目介绍'"
正确调用: ppt_add_text({ "slideIndex": 0, "text": "项目介绍", "type": "title" })

示例2 - 插入幻灯片:
用户: "新建一张幻灯片"
正确调用: ppt_insert_slide({ "position": -1 })
`,
    none: ''
  }
  
  return examples[officeApp] || ''
}

// 在 generateAgentSystemPrompt 中使用
generateAgentSystemPrompt(context: AgentPromptContext): string {
  const parts: string[] = []
  
  // ... 其他部分
  
  // 添加 Few-shot 示例
  const examples = this.getFewShotExamples(context.officeApp)
  if (examples) {
    parts.push(examples)
  }
  
  return parts.join('\n')
}
```

**预期效果：** 工具调用准确率提升 30-40%

---

#### 方案 3.3: 实现工具调用验证和自动纠错 ⭐ P1

**目标：** 在执行前验证工具调用，自动修复常见错误

**新建文件：** `office-plugin/src/services/ai/ToolCallValidator.ts`

```typescript
import type { FormattingFunction, ToolCall } from './types'
import Logger from '../../utils/logger'

const logger = new Logger('ToolCallValidator')

export interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
  fixedToolCall?: ToolCall
}

export class ToolCallValidator {
  /**
   * 验证工具调用
   */
  validate(toolCall: ToolCall, tool: FormattingFunction): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []
    
    try {
      const args = JSON.parse(toolCall.function.arguments)
      const schema = tool.inputSchema
      
      // 1. 检查必填参数
      const required = schema?.required || []
      for (const param of required) {
        if (!(param in args) || args[param] === undefined || args[param] === null) {
          errors.push(`缺少必填参数: ${param}`)
        }
      }
      
      // 2. 检查参数类型
      for (const [key, value] of Object.entries(args)) {
        const propSchema = schema?.properties?.[key] as any
        if (propSchema) {
          const typeError = this.checkType(value, propSchema)
          if (typeError) {
            warnings.push(`参数 ${key}: ${typeError}`)
          }
        }
      }
      
      // 3. 检查枚举值
      for (const [key, value] of Object.entries(args)) {
        const propSchema = schema?.properties?.[key] as any
        if (propSchema?.enum && !propSchema.enum.includes(value)) {
          errors.push(`参数 ${key} 的值 "${value}" 不在允许范围内，可选: ${propSchema.enum.join(', ')}`)
        }
      }
      
      return { 
        valid: errors.length === 0, 
        errors, 
        warnings 
      }
    } catch (e) {
      return { 
        valid: false, 
        errors: [`参数解析失败: ${(e as Error).message}`], 
        warnings: [] 
      }
    }
  }

  /**
   * 尝试自动修复工具调用
   */
  autoFix(toolCall: ToolCall, tool: FormattingFunction): ToolCall | null {
    try {
      const args = JSON.parse(toolCall.function.arguments)
      const schema = tool.inputSchema
      let modified = false
      
      // 1. 填充缺失的必填参数
      for (const param of schema?.required || []) {
        if (!(param in args) || args[param] === undefined) {
          const propSchema = schema?.properties?.[param] as any
          const defaultValue = this.getDefaultValue(propSchema, param)
          
          if (defaultValue !== undefined) {
            args[param] = defaultValue
            modified = true
            logger.info(`[AUTO_FIX] 填充缺失参数 ${param} = ${JSON.stringify(defaultValue)}`)
          }
        }
      }
      
      // 2. 修复类型错误
      for (const [key, value] of Object.entries(args)) {
        const propSchema = schema?.properties?.[key] as any
        if (propSchema) {
          const fixedValue = this.fixType(value, propSchema)
          if (fixedValue !== value) {
            args[key] = fixedValue
            modified = true
            logger.info(`[AUTO_FIX] 修复参数类型 ${key}: ${value} → ${fixedValue}`)
          }
        }
      }
      
      if (!modified) {
        return toolCall
      }
      
      return {
        ...toolCall,
        function: {
          ...toolCall.function,
          arguments: JSON.stringify(args)
        }
      }
    } catch (e) {
      logger.error('[AUTO_FIX] 修复失败', { error: e })
      return null
    }
  }

  private checkType(value: any, schema: any): string | null {
    const expectedType = schema.type
    const actualType = Array.isArray(value) ? 'array' : typeof value
    
    if (expectedType === 'integer' && !Number.isInteger(value)) {
      return `期望整数，实际为 ${actualType}`
    }
    
    if (expectedType && expectedType !== actualType) {
      if (!(expectedType === 'number' && actualType === 'number')) {
        return `期望 ${expectedType}，实际为 ${actualType}`
      }
    }
    
    return null
  }

  private getDefaultValue(schema: any, paramName: string): any {
    // 优先使用 schema 中的默认值
    if (schema?.default !== undefined) return schema.default
    
    // 使用枚举的第一个值
    if (schema?.enum?.length > 0) return schema.enum[0]
    
    // 根据参数名推断
    const nameLower = paramName.toLowerCase()
    if (nameLower.includes('index')) return 0
    if (nameLower.includes('text') || nameLower.includes('value')) return ''
    if (nameLower.includes('enabled') || nameLower.includes('bold') || nameLower.includes('italic')) return false
    
    // 根据类型推断
    switch (schema?.type) {
      case 'string': return ''
      case 'number':
      case 'integer': return 0
      case 'boolean': return false
      case 'array': return []
      case 'object': return {}
      default: return undefined
    }
  }

  private fixType(value: any, schema: any): any {
    const expectedType = schema.type
    
    // 字符串转数字
    if ((expectedType === 'number' || expectedType === 'integer') && typeof value === 'string') {
      const num = Number(value)
      if (!isNaN(num)) {
        return expectedType === 'integer' ? Math.floor(num) : num
      }
    }
    
    // 数字转字符串
    if (expectedType === 'string' && typeof value === 'number') {
      return String(value)
    }
    
    // 字符串转布尔
    if (expectedType === 'boolean' && typeof value === 'string') {
      return value.toLowerCase() === 'true' || value === '1'
    }
    
    return value
  }
}

export const toolCallValidator = new ToolCallValidator()
```

**预期效果：** 自动修复 60-70% 的参数错误

---

#### 方案 3.4: 改进工具冲突解决 ⭐ P0

**目标：** 在工具选择阶段排除冲突工具

**修改文件：** `office-plugin/src/services/ai/ToolSelector.ts`

```typescript
/**
 * 🎯 冲突工具解析（增强版）
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
    logger.info('[CONFLICT RESOLUTION] Detected conflict', {
      type: conflict.type,
      winner: conflict.winner,
      losers: conflict.losers,
      reason: conflict.reason
    })
    
    // 移除冲突中的失败者
    filteredTools = filteredTools.filter(t => !conflict.losers.includes(t.name))
    
    // 确保胜出者在列表中
    if (!filteredTools.some(t => t.name === conflict.winner)) {
      const winnerTool = this.allFunctions.find(t => t.name === conflict.winner)
      if (winnerTool) {
        filteredTools.unshift(winnerTool)
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
  
  // 冲突1: 表格插入 vs 单元格写入
  if (toolNames.has('word_insert_table') && toolNames.has('word_set_cell_value')) {
    const cellWritePatterns = [
      /第\s*\d+\s*行/,
      /第\s*\d+\s*列/,
      /写入|填入|填充/,
      /单元格/,
      /表格.*写|在表格/
    ]
    const tableCreatePatterns = [
      /插入.*表格/,
      /创建.*表格/,
      /新建.*表格/,
      /添加.*表格/
    ]
    
    const hasCellWriteIntent = cellWritePatterns.some(p => p.test(userInput))
    const hasTableCreateIntent = tableCreatePatterns.some(p => p.test(userInput))
    
    if (hasCellWriteIntent && !hasTableCreateIntent) {
      conflicts.push({
        type: 'table_vs_cell',
        winner: 'word_set_cell_value',
        losers: ['word_insert_table'],
        reason: '检测到单元格写入意图，排除表格创建工具'
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
  
  // 冲突2: 文本插入 vs 文本替换
  if (toolNames.has('word_insert_text') && toolNames.has('word_replace_text')) {
    const replacePatterns = [/替换/, /换成/, /改为/, /把.*改/]
    const insertPatterns = [/插入/, /添加/, /写入/]
    
    const hasReplaceIntent = replacePatterns.some(p => p.test(userInput))
    const hasInsertIntent = insertPatterns.some(p => p.test(userInput)) && !hasReplaceIntent
    
    if (hasReplaceIntent) {
      conflicts.push({
        type: 'insert_vs_replace',
        winner: 'word_replace_text',
        losers: ['word_insert_text'],
        reason: '检测到替换意图'
      })
    }
  }
  
  return conflicts
}

interface ConflictInfo {
  type: string
  winner: string
  losers: string[]
  reason: string
}
```

**预期效果：** 减少 80% 的工具选择冲突

---

## 实施计划

### 优先级矩阵

| 优先级 | 方案 | 预期收益 | 实施难度 | 预计工时 |
|--------|------|----------|----------|----------|
| **P0** | 3.4 工具冲突解决 | 高 | 中 | 2h |
| **P0** | 3.2 Few-shot 示例 | 高 | 低 | 1h |
| **P0** | 1.1 预热缓存基础设施 | 高 | 低 | 2h |
| **P1** | 1.2 精简系统提示词 | 中 | 低 | 1h |
| **P1** | 3.1 增强工具描述 | 中 | 低 | 2h |
| **P1** | 3.3 工具调用验证 | 高 | 中 | 3h |
| **P2** | 1.3 并行化操作 | 中 | 中 | 3h |
| **P2** | 1.4 增强 MCP 缓存 | 中 | 低 | 1h |
| **P2** | 2.1 文档上下文提取 | 高 | 高 | 4h |
| **P3** | 2.2 改进提示词结构 | 中 | 中 | 2h |
| **P3** | 2.3 增强意图识别 | 中 | 高 | 3h |

### 实施阶段

#### 第一阶段（立即实施）- 预计 5 小时 ✅ 已完成

1. ✅ 方案 3.4: 工具冲突解决
2. ✅ 方案 3.2: Few-shot 示例
3. ✅ 方案 1.1: 预热缓存基础设施

**预期效果：**
- 工具调用准确率提升 40%
- 响应时间减少 1-2 秒

#### 第二阶段（本周内）- 预计 7 小时 ✅ 已完成

1. ✅ 方案 1.2: 精简系统提示词
2. ✅ 方案 3.1: 增强工具描述
3. ✅ 方案 3.3: 工具调用验证

**预期效果：**
- 响应时间再减少 0.5-1 秒
- 参数错误自动修复率 60%

#### 第三阶段（下周）- 预计 8 小时 ✅ 已完成

1. ✅ 方案 1.3: 并行化操作
2. ✅ 方案 1.4: 增强 MCP 缓存
3. ✅ 方案 2.1: 文档上下文提取

**预期效果：**
- 响应时间再减少 1-2 秒
- 上下文理解准确率提升 20%

#### 第四阶段（后续迭代）- 预计 5 小时 ✅ 已完成

1. ✅ 方案 2.2: 改进提示词结构
2. ✅ 方案 2.3: 增强意图识别

**预期效果：**
- 整体准确率再提升 10-15%

---

## 风险评估

### 高风险项

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| 精简提示词导致 AI 不遵守规则 | 工具调用失败增加 | 保留核心指令，A/B 测试验证 |
| 自动修复引入错误参数 | 执行结果不符预期 | 只修复明确缺失的参数，不修改用户指定值 |
| 文档上下文提取增加延迟 | 响应变慢 | 实现缓存和增量提取 |

### 中风险项

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| 工具冲突解决过于激进 | 排除了正确的工具 | 添加详细日志，支持回退 |
| Few-shot 示例过长 | 增加 token 消耗 | 控制示例数量，按需加载 |
| 并行化引入竞态条件 | 状态不一致 | 使用 Promise.all 确保原子性 |

### 低风险项

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| 缓存数据过期 | 使用旧数据 | 设置合理 TTL，写操作自动失效 |
| 预热失败 | 首次请求变慢 | 添加错误处理，降级到按需初始化 |

---

## 验证指标

### 性能指标

| 指标 | 当前值 | 目标值 | 测量方法 |
|------|--------|--------|----------|
| 首次响应时间 | 6.5s | < 3s | 日志时间戳差值 |
| 后续响应时间 | 6.5s | < 2s | 日志时间戳差值 |
| 工具执行时间 | 283ms | < 300ms | McpToolExecutor 日志 |

### 准确性指标

| 指标 | 当前值 | 目标值 | 测量方法 |
|------|--------|--------|----------|
| 工具选择准确率 | ~60% | > 90% | 人工抽样验证 |
| 参数正确率 | ~70% | > 95% | 自动验证 + 人工抽样 |
| 意图识别准确率 | ~70% | > 85% | 人工抽样验证 |

### 用户体验指标

| 指标 | 当前值 | 目标值 | 测量方法 |
|------|--------|--------|----------|
| 一次成功率 | ~50% | > 80% | 用户反馈统计 |
| 重试次数 | ~2次 | < 1次 | 日志统计 |

---

## 附录

### A. 相关文件清单

```
office-plugin/
├── src/
│   ├── components/features/chat/hooks/
│   │   ├── useFunctionCalling.ts          # 主协调器
│   │   ├── streaming/useStreamProcessor.ts # 流处理
│   │   ├── tools/useToolExecution.ts      # 工具执行
│   │   ├── tools/useResponseAnalysis.ts   # 响应分析
│   │   └── state/useFunctionCallState.ts  # 状态管理
│   └── services/ai/
│       ├── FunctionCallHandler.ts         # 函数调用处理
│       ├── McpToolExecutor.ts             # MCP 执行器
│       ├── StreamToolCallAccumulator.ts   # 流累积器
│       ├── ToolSelector.ts                # 工具选择器
│       ├── aiService.ts                   # AI 服务
│       └── prompts/
│           ├── AgentPromptManager.ts      # 提示词管理
│           ├── PromptBuilder.ts           # 提示词构建
│           └── IntentExtractor.ts         # 意图提取
```

### B. 新增文件清单

```
office-plugin/src/services/ai/
├── DocumentContextExtractor.ts  # 方案 2.1 ✅ 已创建
├── ToolDescriptionEnhancer.ts   # 方案 3.1 (可选，已通过其他方式实现)
└── ToolCallValidator.ts         # 方案 3.3 ✅ 已创建
```

### C. 测试用例建议

```typescript
// 工具冲突解决测试
describe('ToolSelector.resolveToolConflicts', () => {
  it('should select word_set_cell_value for cell write intent', () => {
    const result = selector.selectCandidateTools(
      '在表格第2行第3列写入完成',
      { selectionType: 'table', documentType: 'word' }
    )
    expect(result.map(t => t.name)).toContain('word_set_cell_value')
    expect(result.map(t => t.name)).not.toContain('word_insert_table')
  })
  
  it('should select word_insert_table for table create intent', () => {
    const result = selector.selectCandidateTools(
      '插入一个3行4列的表格',
      { selectionType: 'none', documentType: 'word' }
    )
    expect(result.map(t => t.name)).toContain('word_insert_table')
  })
})

// 工具调用验证测试
describe('ToolCallValidator', () => {
  it('should detect missing required params', () => {
    const result = validator.validate(
      { function: { name: 'word_set_cell_value', arguments: '{}' } },
      wordSetCellValueTool
    )
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('缺少必填参数: value')
  })
  
  it('should auto-fix missing params with defaults', () => {
    const fixed = validator.autoFix(
      { function: { name: 'word_set_cell_value', arguments: '{"value":"test"}' } },
      wordSetCellValueTool
    )
    const args = JSON.parse(fixed.function.arguments)
    expect(args.tableIndex).toBe(0)
    expect(args.rowIndex).toBe(0)
  })
})
```

---

> 文档结束
