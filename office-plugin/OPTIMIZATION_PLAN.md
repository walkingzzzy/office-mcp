# Office 插件性能优化方案

> 基于代码分析和日志诊断，本文档提出针对性的性能优化建议。
> 
> **更新日期**: 2025-12-30
> **实现状态**: P0 和 P1 优化已完成实现

## 一、延迟来源分析

根据日志分析，主要延迟来源：

| 阶段 | 耗时 | 占比 | 说明 |
|------|------|------|------|
| AI API 响应 | ~10秒 | 90%+ | 模型推理时间（claude-opus-4-5） |
| 前端预处理 | ~100ms | <1% | 意图分析、工具选择、文档读取 |
| 流式渲染 | ~50ms | <1% | SSE 解析和 UI 更新 |

**结论**：主要瓶颈在 AI 模型响应时间，前端优化空间有限但仍有价值。

---

## 二、优化方案

### P0 - 立即可做（高收益）

#### 1. 模型选择优化
**状态**: ⏳ 待实现（需要 UI 配置支持）

**问题**：当前使用 `claude-opus-4-5`，响应时间 8-15 秒  
**方案**：
- 简单问候/查询自动切换到快速模型（如 `claude-haiku` 或 `gpt-4o-mini`）
- 在设置中提供"快速响应"模式选项

```typescript
// 建议在 ChatInterface.tsx 中添加
const getOptimalModel = (userIntent: UserIntent, complexity: string) => {
  if (userIntent === UserIntent.QUERY || complexity === 'simple') {
    return fastModelId || selectedModelId // 优先使用快速模型
  }
  return selectedModelId
}
```

#### 2. 合并重复的复杂度检测
**状态**: ✅ 已实现（方案 B - 分析缓存）

**问题**：`handleSendMessage` 中 `detectTaskComplexity()` 被调用了 **2次**

经代码验证，实际调用情况如下：
```
multiTurn.analyzeInput()                    // 内部调用 detectTaskComplexity() ← 第1次
taskPlanningIntegration.shouldCreateTaskPlan() // 内部调用 detectTaskComplexity() ← 第2次（重复！）
prepareUserPrompt()                         // 调用 detectUserIntent()（不同函数，不重复）
```

**具体位置**：
- `useMultiTurnConversation.ts:119` - `detectTaskComplexity(userMessage)`
- `useTaskPlanningIntegration.ts:99` - `detectTaskComplexity(userMessage)`

**实现方案**：创建统一的分析缓存 `AnalysisCache`

**实现文件**：
- `src/services/cache/AnalysisCache.ts` - 分析结果缓存服务
- `src/services/ai/prompts/TaskComplexityDetector.ts` - 已集成缓存

```typescript
// 方案 B：创建统一的分析缓存（已实现）
// services/cache/AnalysisCache.ts
class AnalysisCache {
  private complexityCache = new Map<string, { result: ComplexityResult; timestamp: number }>()
  private readonly TTL = 1000 // 1秒内复用

  getComplexity(input: string): ComplexityResult | null {
    const key = input.substring(0, 100) // 使用前100字符作为 key
    const cached = this.complexityCache.get(key)
    if (cached && Date.now() - cached.timestamp < this.TTL) {
      return cached.result
    }
    return null
  }

  setComplexity(input: string, result: ComplexityResult) {
    const key = input.substring(0, 100)
    this.complexityCache.set(key, { result, timestamp: Date.now() })
  }
}
```

**预期收益**：减少 20-50ms 重复计算（`detectTaskComplexity` 包含正则匹配和关键词检测）

---

### P1 - 短期优化（中等收益）

#### 3. 添加输入防抖
**状态**: ⏭️ 跳过（当前不需要）

**问题**：用户快速输入时可能触发不必要的预处理

**⚠️ 验证结果（2025-01-XX）**：
经代码验证，**当前不存在此问题**：
- `Inputbar.tsx` 中 `onChange` 只更新 React state，不触发任何昂贵操作
- 预处理（意图分析、复杂度检测等）只在 `handleSendMessage` 中执行
- `handleSendMessage` 只在用户主动提交时触发（按 Enter 或点击发送）

**结论**：此优化**优先级降低**，当前架构下输入变化不会触发预处理。
如果未来添加"实时意图预览"等功能，再考虑引入防抖。

**方案**（备用）：

```typescript
// hooks/useDebounce.ts
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return debouncedValue
}

// 在 ChatInterface 中使用（如果需要实时预处理）
const debouncedInput = useDebounce(inputText, 300)
```

#### 4. 文档内容缓存
**状态**: ✅ 已实现

**问题**：每次发送消息都读取文档内容  

**实现文件**：
- `src/services/cache/DocumentContextCache.ts` - 文档内容缓存服务
- `src/components/features/chat/ChatInterface.tsx` - 已集成缓存
- `src/components/features/chat/hooks/useFunctionCalling.ts` - 工具执行后自动失效缓存

**方案**：

```typescript
// services/cache/DocumentContextCache.ts（已实现）
class DocumentContextCache {
  private cache: { content: string; timestamp: number; hash: string } | null = null
  private readonly TTL = 5000 // 5秒缓存

  async getDocumentContent(wordService: WordService): Promise<string> {
    const now = Date.now()
    
    // 检查缓存是否有效
    if (this.cache && (now - this.cache.timestamp) < this.TTL) {
      return this.cache.content
    }
    
    // 读取新内容
    const content = await wordService.readDocument()
    this.cache = {
      content: content.text,
      timestamp: now,
      hash: this.computeHash(content.text)
    }
    
    return content.text
  }

  invalidate() {
    this.cache = null
  }
}

export const documentContextCache = new DocumentContextCache()
```

**预期收益**：减少 100-200ms 文档读取时间

#### 5. 选区上下文缓存
**状态**: ✅ 已实现

**问题**：`useToolExecution.selectToolsForMessage()` 每次调用都会执行 `getSelectionContextForApp()`

经代码验证：
- `useToolExecution.ts:361` - 调用 `getSelectionContextForApp(currentOfficeApp, config.wordService)`
- 该函数通过 Office.js API 读取当前选区状态，涉及异步操作

**注意**：`useFunctionCalling` 依赖 `useToolExecution`，不是独立重复调用。但在短时间内多次发送消息时，缓存仍有价值。

**实现文件**：
- `src/services/cache/SelectionContextCache.ts` - 选区上下文缓存服务
- `src/components/features/chat/hooks/tools/useToolExecution.ts` - 已集成缓存
- `src/components/features/chat/hooks/useFunctionCalling.ts` - 工具执行后自动失效缓存

**方案**：

```typescript
// services/cache/SelectionContextCache.ts（已实现）
class SelectionContextCache {
  private cache: SelectionContext | null = null
  private timestamp = 0
  private readonly TTL = 2000 // 2秒缓存

  async get(appType: OfficeAppType, wordService: WordService): Promise<SelectionContext> {
    if (this.cache && Date.now() - this.timestamp < this.TTL) {
      return this.cache
    }
    
    this.cache = await getSelectionContextForApp(appType, wordService)
    this.timestamp = Date.now()
    return this.cache
  }

  invalidate() {
    this.cache = null
  }
}
```

---

### P2 - 中期优化（需要更多工作）

#### 6. 消息列表虚拟滚动
**状态**: ⏳ 待实现

**问题**：长对话时消息列表渲染性能下降  
**方案**：使用 `react-window` 或 `@tanstack/react-virtual`

```typescript
// components/organisms/MessageList/VirtualMessageList.tsx
import { useVirtualizer } from '@tanstack/react-virtual'

export const VirtualMessageList: FC<{ messages: Message[] }> = ({ messages }) => {
  const parentRef = useRef<HTMLDivElement>(null)
  
  const virtualizer = useVirtualizer({
    count: messages.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 100, // 估计每条消息高度
    overscan: 5
  })

  return (
    <div ref={parentRef} style={{ height: '100%', overflow: 'auto' }}>
      <div style={{ height: virtualizer.getTotalSize() }}>
        {virtualizer.getVirtualItems().map(virtualRow => (
          <MessageItem 
            key={messages[virtualRow.index].id}
            message={messages[virtualRow.index]}
            style={{ transform: `translateY(${virtualRow.start}px)` }}
          />
        ))}
      </div>
    </div>
  )
}
```

#### 7. 流式响应批量更新
**状态**: ⏳ 待实现

**问题**：每个 SSE chunk 都触发 React 状态更新  
**方案**：使用 `requestAnimationFrame` 批量更新

```typescript
// services/ai/streamHandler.ts 优化
class BatchedStreamHandler {
  private pendingContent = ''
  private rafId: number | null = null

  processChunk(content: string, onUpdate: (content: string) => void) {
    this.pendingContent += content
    
    if (!this.rafId) {
      this.rafId = requestAnimationFrame(() => {
        onUpdate(this.pendingContent)
        this.pendingContent = ''
        this.rafId = null
      })
    }
  }
}
```

#### 8. 工具选择结果缓存
**状态**: ⏭️ 跳过（收益有限）

**问题**：相似输入重复进行工具选择

**⚠️ 验证结果（2025-01-XX）**：
经代码验证分析 `ToolSelector.selectCandidateTools()` 方法：
- 工具选择涉及：关键词匹配、模式识别、上下文过滤、优先级排序、冲突解决
- 主要是**纯 JS 计算**（字符串匹配、数组操作），无 I/O 阻塞
- 单次执行耗时估计 **10-30ms**

**实际场景分析**：
- 用户很少连续发送**相同或高度相似**的消息
- 工具列表会根据选区状态变化（用户可能选中不同内容）
- 缓存命中率可能较低

**结论**：此优化**收益有限**，但实现简单。可在有明确性能问题时再添加。

**方案**（可选）：

```typescript
// services/ai/ToolSelectionCache.ts
class ToolSelectionCache {
  private cache = new Map<string, { tools: FormattingFunction[], timestamp: number }>()
  private readonly TTL = 60000 // 1分钟
  private readonly MAX_SIZE = 50

  private generateKey(input: string, context: SelectionContext): string {
    // 使用输入的前50字符 + 上下文类型作为 key
    return `${input.substring(0, 50)}:${context.selectionType}:${context.documentType}`
  }

  get(input: string, context: SelectionContext): FormattingFunction[] | null {
    const key = this.generateKey(input, context)
    const cached = this.cache.get(key)
    
    if (cached && Date.now() - cached.timestamp < this.TTL) {
      return cached.tools
    }
    
    return null
  }

  set(input: string, context: SelectionContext, tools: FormattingFunction[]) {
    // LRU 淘汰
    if (this.cache.size >= this.MAX_SIZE) {
      const oldestKey = this.cache.keys().next().value
      this.cache.delete(oldestKey)
    }
    
    const key = this.generateKey(input, context)
    this.cache.set(key, { tools, timestamp: Date.now() })
  }
}
```

---

### P3 - 长期优化（架构级）

#### 9. Web Workers 处理 CPU 密集任务
**状态**: ⏳ 待实现

**问题**：意图分析、复杂度检测等阻塞主线程  
**方案**：

```typescript
// workers/analysisWorker.ts
self.onmessage = (e: MessageEvent) => {
  const { type, payload } = e.data
  
  switch (type) {
    case 'ANALYZE_INTENT':
      const result = analyzeUserInput(payload.input, payload.context)
      self.postMessage({ type: 'INTENT_RESULT', result })
      break
    case 'DETECT_COMPLEXITY':
      const complexity = detectTaskComplexity(payload.input)
      self.postMessage({ type: 'COMPLEXITY_RESULT', result: complexity })
      break
  }
}

// 使用
const worker = new Worker(new URL('./workers/analysisWorker.ts', import.meta.url))
worker.postMessage({ type: 'ANALYZE_INTENT', payload: { input, context } })
```

#### 10. 预加载和预热优化
**状态**: ⏳ 待实现

**问题**：首次请求需要初始化多个组件  
**方案**：

```typescript
// 在应用启动时预热
// App.tsx 或 main.tsx
useEffect(() => {
  // 后台预热，不阻塞渲染
  const preload = async () => {
    // 1. 预加载 MCP 工具定义
    await import('./services/ai/DynamicToolDiscovery').then(m => m.dynamicToolDiscovery.preload())
    
    // 2. 预初始化 Registry
    await import('./services/ai/FormattingFunctionRegistry').then(m => m.getFunctionRegistry().initialize())
    
    // 3. 预热 AI 服务连接
    await import('./services/ai/aiService').then(m => m.aiService.testConnection())
  }
  
  // 使用 requestIdleCallback 在空闲时执行
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => preload())
  } else {
    setTimeout(preload, 1000)
  }
}, [])
```

---

## 三、实施优先级

| 优先级 | 优化项 | 预期收益 | 工作量 | 状态 |
|--------|--------|----------|--------|------|
| P0 | 模型选择优化 | 减少 5-8秒 | 小 | ⏳ 待实现 |
| P0 | 合并重复复杂度检测 | 减少 20-50ms | 小 | ✅ 已实现 |
| P1 | 输入防抖 | 减少不必要计算 | 小 | ⏭️ 跳过 |
| P1 | 文档内容缓存 | 减少 100-200ms | 中 | ✅ 已实现 |
| P1 | 选区上下文缓存 | 减少 50ms | 小 | ✅ 已实现 |
| P2 | 消息列表虚拟滚动 | 提升长对话性能 | 中 | ⏳ 待实现 |
| P2 | 流式响应批量更新 | 减少 UI 卡顿 | 中 | ⏳ 待实现 |
| P2 | 工具选择缓存 | 减少 20-50ms | 小 | ⏭️ 跳过 |
| P3 | Web Workers | 提升 UI 响应性 | 大 | ⏳ 待实现 |
| P3 | 预加载优化 | 减少首次请求延迟 | 中 | ⏳ 待实现 |

---

## 四、已实现的缓存服务

### 缓存服务文件列表

| 文件 | 说明 | TTL |
|------|------|-----|
| `src/services/cache/AnalysisCache.ts` | 复杂度检测和意图分析缓存 | 1秒 |
| `src/services/cache/DocumentContextCache.ts` | 文档内容和选区内容缓存 | 5秒/2秒 |
| `src/services/cache/SelectionContextCache.ts` | 选区上下文缓存 | 2秒 |
| `src/services/cache/index.ts` | 统一导出 | - |

### 缓存失效机制

工具执行后自动失效缓存（在 `useFunctionCalling.ts` 中实现）：
- `executeConfirmedTools()` 执行后失效文档和选区缓存
- `executeTaskPlan()` 执行后失效文档和选区缓存（仅非记录模式）

---

## 五、监控指标

建议添加以下性能监控：

```typescript
// utils/performanceMonitor.ts
export const perfMonitor = {
  mark(name: string) {
    performance.mark(name)
  },
  
  measure(name: string, startMark: string, endMark: string) {
    performance.measure(name, startMark, endMark)
    const measure = performance.getEntriesByName(name)[0]
    console.log(`[PERF] ${name}: ${measure.duration.toFixed(2)}ms`)
    return measure.duration
  },
  
  // 关键指标
  metrics: {
    intentAnalysis: 0,
    toolSelection: 0,
    documentRead: 0,
    aiRequestStart: 0,
    aiFirstToken: 0,
    aiComplete: 0
  }
}

// 使用示例
perfMonitor.mark('intent-start')
const result = analyzeUserInput(input)
perfMonitor.mark('intent-end')
perfMonitor.measure('Intent Analysis', 'intent-start', 'intent-end')
```

---

## 六、总结

### 已完成的优化（2025-12-30）

1. **P0 - 合并重复复杂度检测** ✅
   - 实现了 `AnalysisCache` 服务，1秒 TTL 缓存
   - `detectTaskComplexity()` 的两次调用现在会复用缓存结果
   - 预期收益：减少 20-50ms

2. **P1 - 文档内容缓存** ✅
   - 实现了 `DocumentContextCache` 服务，5秒 TTL
   - `prepareUserPrompt()` 中的文档读取现在使用缓存
   - 预期收益：减少 100-200ms

3. **P1 - 选区上下文缓存** ✅
   - 实现了 `SelectionContextCache` 服务，2秒 TTL
   - `selectToolsForMessage()` 中的选区获取现在使用缓存
   - 预期收益：减少 50ms

4. **缓存失效机制** ✅
   - 工具执行后自动失效所有缓存
   - 确保文档修改后获取最新内容

### 待实现的优化

1. **P0 - 模型选择优化**：需要 UI 配置支持
2. **P2 - 消息列表虚拟滚动**：需要引入 `@tanstack/react-virtual`
3. **P2 - 流式响应批量更新**：需要修改 `streamHandler.ts`
4. **P3 - Web Workers**：架构级改动
5. **P3 - 预加载优化**：需要修改应用启动流程

### 跳过的优化

1. **P1 - 输入防抖**：当前架构不需要
2. **P2 - 工具选择缓存**：收益有限，缓存命中率低

建议按优先级逐步实施，每个优化完成后进行性能测试验证效果。
