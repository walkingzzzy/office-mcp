# 剩余任务清单

> 生成时间: 2025-12-29
> 基于架构审查报告验证结果

## 📊 任务概览

| 任务ID | 问题 | 优先级 | 预计工时 | 状态 |
|--------|------|--------|----------|------|
| T1 | P5: MCP 工具同步优化 | 中 | 2-3h | ✅ 已完成 |
| T2 | P11: deprecated 目录清理 | 低 | 1h | ✅ 已完成 |
| T3 | P2: 错误处理统一（剩余部分） | 中 | 4-6h | ✅ 已完成 |
| T4 | 剩余 `any` 类型清理 | 低 | 8-10h | 待开始 |

---

## 🔧 任务详情

### T1: MCP 工具同步优化 (P5)

**优先级**: 中  
**影响**: 组件挂载时的启动延迟  
**预计工时**: 2-3 小时

#### 问题描述

当前 `synchronizeMcpTools` 函数在每次组件挂载时都会从 MCP 服务器重新获取所有工具定义，导致不必要的网络请求和启动延迟。

#### 文件位置

- **主文件**: `office-plugin/src/components/features/chat/hooks/tools/useToolExecution.ts`
- **行号**: 96-125

#### 当前代码

```typescript
async function synchronizeMcpTools(registry: ReturnType<typeof getFunctionRegistry>): Promise<boolean> {
  try {
    const { baseUrl, apiKey } = aiService.getConfig()
    dynamicToolDiscovery.configure(baseUrl, apiKey || '')
    const categories: Array<'word' | 'excel' | 'powerpoint'> = ['word', 'excel', 'powerpoint']
    const aggregatedTools: ToolDefinition[] = []
    for (const category of categories) {
      const tools = await dynamicToolDiscovery.getAvailableTools('all', category)
      aggregatedTools.push(...tools)
    }
    // 每次都重新注册所有工具
    aggregatedTools.forEach((tool) => {
      const formattingFunction = convertToolDefinitionToFormattingFunction(tool)
      registry.register(formattingFunction)
    })
    // ...
  }
}
```

#### 修复步骤

1. **创建工具缓存服务** (`office-plugin/src/services/ai/ToolDefinitionCache.ts`)
   ```typescript
   interface ToolCache {
     tools: ToolDefinition[]
     timestamp: number
     version: string
   }
   
   class ToolDefinitionCache {
     private readonly CACHE_KEY = 'mcp_tool_definitions'
     private readonly CACHE_TTL = 5 * 60 * 1000 // 5 分钟
     
     async getTools(): Promise<ToolDefinition[] | null>
     async setTools(tools: ToolDefinition[]): Promise<void>
     isValid(): boolean
     invalidate(): void
   }
   ```

2. **修改 `synchronizeMcpTools` 函数**
   - 先检查缓存是否有效
   - 缓存有效时直接使用缓存的工具定义
   - 缓存无效时才从服务器获取并更新缓存

3. **添加缓存失效机制**
   - MCP 服务器重启时失效
   - 用户手动刷新时失效
   - 版本变更时失效

#### 预期效果

- 首次加载后，后续组件挂载无需网络请求
- 启动延迟从 ~500ms 降低到 ~50ms
- 减少 MCP 服务器负载

---

### T2: deprecated 目录清理 (P11)

**优先级**: 低  
**影响**: 代码维护性  
**预计工时**: 1 小时

#### 问题描述

`deprecated` 目录中的存根服务类仍然存在，虽然已标记废弃，但可能被误用。

#### 文件位置

- `office-plugin/src/services/deprecated/ExcelService.ts`
- `office-plugin/src/services/deprecated/PowerPointService.ts`
- `office-plugin/src/services/deprecated/sseClient.ts`

#### 修复步骤

1. **检查引用情况**
   ```bash
   # 搜索是否有代码仍在引用这些文件
   grep -r "ExcelService" --include="*.ts" --include="*.tsx" src/
   grep -r "PowerPointService" --include="*.ts" --include="*.tsx" src/
   grep -r "sseClient" --include="*.ts" --include="*.tsx" src/
   ```

2. **移除或更新引用**
   - 如果有引用，更新为使用 MCP 工具
   - 如果无引用，可以安全删除

3. **决策选项**
   - **选项 A**: 完全删除 deprecated 目录（推荐，如果无引用）
   - **选项 B**: 保留但添加编译时警告
   - **选项 C**: 在下一个主版本发布时删除

#### 预期效果

- 减少代码库体积
- 消除误用风险
- 提高代码可维护性

---

### T3: 错误处理统一 - 剩余部分 (P2)

**优先级**: 中
**影响**: 用户体验、问题定位
**预计工时**: 4-6 小时

#### 问题描述

虽然核心模块已使用 Logger 和 ErrorHandler，但仍有部分文件使用不一致的错误处理方式。

#### 待处理文件

需要逐步统一以下类型的错误处理：

1. **静默失败的方法** - 返回默认值而不报告错误
2. **仅记录日志的 catch** - 未向上传播或通知用户
3. **直接使用 console.error** - 未使用统一的 Logger

#### 修复步骤

1. **识别高优先级文件**
   ```bash
   # 查找仍使用 console.error 的文件
   grep -r "console.error" --include="*.ts" --include="*.tsx" src/
   ```

2. **应用统一错误处理模式**
   ```typescript
   // 使用 Result 模式
   import { tryCatchAsync } from '../shared/errors/Result'

   const result = await tryCatchAsync(async () => {
     // 可能失败的操作
   })

   if (!result.success) {
     ErrorHandler.log(result.error, 'OperationName')
     ErrorHandler.showUserError('操作失败', result.error.message)
     return
   }
   ```

3. **分批处理**
   - 第一批：用户可见的错误路径（API 调用、文档操作）
   - 第二批：后台操作（缓存、日志）
   - 第三批：边缘情况

#### 预期效果

- 用户能看到有意义的错误提示
- 开发者能快速定位问题
- 错误处理行为一致可预测

---

### T4: 剩余 `any` 类型清理

**优先级**: 低
**影响**: 类型安全、IDE 支持
**预计工时**: 8-10 小时

#### 问题描述

虽然核心 API 层已修复，但仍有 472 处 `any` 类型使用分布在其他文件中。

#### 高优先级文件

1. **类型定义文件** - `src/types/*.ts`
2. **服务层** - `src/services/**/*.ts`
3. **Hooks** - `src/hooks/*.ts`

#### 修复策略

1. **使用 `unknown` 替代 `any`**
   ```typescript
   // 之前
   function process(data: any) { ... }

   // 之后
   function process(data: unknown) {
     if (typeof data === 'string') { ... }
   }
   ```

2. **定义具体接口**
   ```typescript
   // 之前
   const response: any = await fetch(...)

   // 之后
   interface ApiResponse<T> {
     success: boolean
     data: T
     error?: string
   }
   const response: ApiResponse<User> = await fetch(...)
   ```

3. **启用严格模式**
   ```json
   // tsconfig.json
   {
     "compilerOptions": {
       "noImplicitAny": true
     }
   }
   ```

#### 预期效果

- 编译时捕获更多类型错误
- IDE 自动补全更准确
- 代码可维护性提升

---

## 📋 执行建议

### 推荐执行顺序

1. **T1 (P5)** - MCP 工具同步优化
   - 影响用户体验（启动速度）
   - 实现相对独立，风险低

2. **T3 (P2)** - 错误处理统一
   - 影响问题定位能力
   - 可分批进行

3. **T2 (P11)** - deprecated 清理
   - 低风险，可在空闲时处理

4. **T4** - any 类型清理
   - 工作量大，可持续进行
   - 建议结合日常开发逐步清理

### 注意事项

- 每个任务完成后更新架构审查报告
- 修改前确保有完整的测试覆盖
- 大范围重构前创建分支

---

> **文档维护**: 任务完成后请更新状态并记录实际工时