# 项目复审报告（确认已修复问题是否闭环）

> 复审日期：2026-01-05  
> 复审目标：在你们“新增大量代码并修复文档问题”后，重新核对上一轮问题是否真正闭环（含构建/测试/关键链路）。

## 1. 复审结论（先说结果）

**未完全闭环。** 当前状态满足：

- ✅ `shared`、`office-local-bridge`、`word/excel/powerpoint-mcp-server` **均可通过 `tsc` 构建**
- ✅ `office-local-bridge`、`word-mcp-server`、`powerpoint-mcp-server` **单元测试通过**

但仍存在以下阻断项：

- ❌ `office-plugin` 在启用严格类型检查后 **`tsc` 仍有大量错误（统计 215 条）**，导致 `npm run build` 失败
- ❌ `excel-mcp-server` 的 `npm test` **有 1 条用例失败**（与本地持久化 `data/excel-metrics/history.json` 相关，导致快照数量不稳定）
- ⚠️ `/v1/office/*` 兼容路由虽已加入，但 **`/v1/office/tools`、`/v1/office/document` 等与前端实际期望不匹配**，会造成动态工具发现/文档回写功能不可用或降级

## 2. 已确认修复（与上一轮问题对照）

### 2.1 中文/编码与 stdio 稳定性

- ✅ **stdio UTF-8 拆包问题已修**：`office-local-bridge/src/mcp/StdioBridge.ts` 已改为 `StringDecoder('utf8')` 的流式解码（不再 `data.toString()` 直接拼接），显著降低中文多字节字符跨 chunk 导致 JSON 解析失败的概率。
  - 备注：当前单测 `office-local-bridge/src/mcp/StdioBridge.test.ts` 未覆盖“多字节字符跨 chunk”的回归场景，建议补一条专门用例以防回归。

### 2.2 Windows 注册表输出编码/本地化解析

- ✅ **OfficeDetector 输出编码与本地化解析增强**：`office-local-bridge/src/office/OfficeDetector.ts` 使用 `chcp 65001` 强制 UTF-8 输出，并将默认值匹配由 `(默认)/(Default)` 扩展为“任意语言默认键”的通用正则，鲁棒性提升。

### 2.3 本地配置加密密钥安全性

- ✅ **密钥派生方式已改进**：`office-local-bridge/src/utils/crypto.ts` 已从“hostname+username 可预测派生”改为“首次生成随机 32 字节密钥并持久化到用户目录（`~/.office-local-bridge/encryption.key`）”，安全性明显提升。
  - 备注：这仍不等同于 OS Keychain/DPAPI 等级别，但已比可预测派生强很多。

### 2.4 认证与进程管理安全

- ✅ **Token 比较防时序攻击**：`office-local-bridge/src/middleware/auth.ts` 引入 `timingSafeEqual` + 缓存配置，安全性与性能均提升。
- ✅ **MCP 进程启动增加命令注入防护**：`office-local-bridge/src/mcp/ProcessManager.ts` 引入 `validateCommandWithArgs/validateEnv`（来自 `office-local-bridge/src/utils/commandValidator.ts`）对命令、参数、环境变量做白名单与危险字符校验；并移除了误导性的“子进程内存使用”字段（改为 `undefined` + 说明）。

### 2.5 前端死代码问题

- ✅ **ChatInterface 不可达代码已清理**：`office-plugin/src/components/features/chat/ChatInterface.tsx` 的 undo 分支已移除 `return` 后不可达逻辑。

## 3. 仍未闭环/新发现问题（需要你确认优先级）

### 3.1 `office-plugin` 严格模式启用后构建失败（阻断）

- 现状：`office-plugin/tsconfig.json` 已开启 `strict/strictNullChecks/strictFunctionTypes/strictPropertyInitialization` 等；但 `tsc` 当前仍有 **215 条错误**，导致 `npm run build` 失败。
- 典型错误类型：
  - `string | undefined`/`number | undefined` 未处理（空值收敛不足）
  - `strictFunctionTypes` 打开后，大量 `ToolHandler/validator` 函数参数协变/逆变不匹配
  - `React.lazy` 的默认导出类型不匹配（路由懒加载导出形态不统一）
  - 若干“应当调用函数却只判断函数引用”的逻辑（如 `BinaryDocumentAdapter.ts` 的 TS2774）
- 建议处理路线（二选一，建议你先定方向）：
  1. **渐进式严格化（推荐）**：保留 `strict: true`，但先把 `strictFunctionTypes`、`strictPropertyInitialization` 暂时回退为 `false`，优先收敛 `strictNullChecks` 相关错误；待工具系统的类型体系重构后再开启 `strictFunctionTypes`。
  2. **一次性拉齐严格模式**：对 ToolRegistry/ToolHandler/validators 做泛型化或统一参数解析层（会涉及较多文件改造）。

### 3.2 `/v1/office/*` 兼容路由“路由存在但语义不匹配”（功能风险）

- 现状：`office-local-bridge/src/server.ts` 已添加 `/v1/office/*` 兼容挂载，但：
  - `office-plugin/src/services/ai/toolSelection/DynamicToolDiscovery.ts` 调用的 **`GET /v1/office/tools`** 期望返回 `ToolsResponse{success,data:{tools,stats}}`，而当前挂载到 `mcpRouter`（`office-local-bridge/src/api/mcp.ts`）并无 `/` 路由实现 → **实际会 404 或不符合结构**。
  - `office-plugin/src/services/BinaryDocumentAdapter.ts` 的 **`GET /v1/office/document/<filePath>`** 在后端没有对应实现（仅在 `server.ts` 做了挂载）→ 若 SSE 触发 `onDocumentUpdate`，会稳定失败。
- 结论：这两条链路属于**真实可触发的功能缺口**（动态工具发现/文档回写），建议尽快补齐后端实现或调整前端改用 `/api/*`。

### 3.3 `excel-mcp-server` 测试不稳定（受本地持久化数据影响）

- 现状：`excel-mcp-server` 的 `npm test` 失败 1 条：
  - `MetricsStorage > 应该保存和加载历史数据` 期望快照长度为 1，但实际读到 2。
- 根因：仓库中存在本地持久化目录 `excel-mcp-server/data/excel-metrics/history.json`（当前为未跟踪文件），导致测试读取到旧快照。
- 建议：
  - 测试侧：使用临时目录或在 `beforeEach/afterEach` 清理历史文件，保证测试隔离。
  - 工程侧：将 `*/data/`（或至少 `excel-mcp-server/data/`）加入 `.gitignore`，避免误入版本库。

### 3.4 重要变更尚未纳入版本控制（发布/协作风险）

- 当前工作区有多处 **关键新文件为未跟踪**（示例：`office-local-bridge/src/utils/commandValidator.ts`、`shared/src/utils/security.ts` 等）。  
  若这些文件未被 `git add` 提交到仓库，其他机器/CI 将出现构建失败或行为缺失。

## 4. 构建与测试验证结果（本次复审实测）

- `shared`: `npm run build` ✅
- `office-local-bridge`: `npm run build` ✅，`npm test` ✅（集成测试部分因未启动服务而跳过，这是测试设计预期）
- `word-mcp-server`: `npm run build` ✅，`npm test` ✅
- `powerpoint-mcp-server`: `npm run build` ✅，`npm test` ✅
- `excel-mcp-server`: `npm run build` ✅，`npm test` ❌（1 failed，受 `data/excel-metrics/history.json` 影响）
- `office-plugin`: `npm run build` ❌（`tsc` 严格模式下 215 条类型错误）

## 5. 建议你先确认的 3 个决策点（决定后才能“彻底闭环”）

1. **前端严格模式策略**：走“渐进式严格化”还是“一次性拉齐”？  
2. **`/v1/office/*` 的定位**：要作为长期兼容 API 还是临时过渡？  
   - 若长期存在：请补齐 `/v1/office/tools` 与 `/v1/office/document` 的真实实现与安全边界。  
   - 若只过渡：前端尽快迁移到 `/api/*`，并为 `/v1` 设定移除版本。  
3. **测试隔离策略**：是否允许测试读写真实 `data/` 目录？（建议默认不允许，统一用临时目录）

---

### 附：本次复审期间的小修正

- 为通过 `office-local-bridge` 的 `tsc` 构建，我修正了 `office-local-bridge/src/proxy/providers/openai.ts` 中 `response` 的未初始化类型（改为 `Response | undefined`），否则会触发 TS2454。

