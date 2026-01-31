# Office 工具项目修复方案（根因导向）

> 生成日期：2026-01-05  
> 范围：`office-plugin`、`office-local-bridge`、`word-mcp-server`、`excel-mcp-server`、`powerpoint-mcp-server`、`shared`、`office-local-bridge/desktop-app(Tauri)`

## 0. 背景与目标

本仓库是一个“Office 插件（前端）↔ 本地桥接服务（HTTP/WebSocket）↔ MCP Server（stdio JSON-RPC）”的多模块系统。当前已存在历史审查文档（`CODE_REVIEW_REPORT.md`、`FIXES_APPLIED.md`），但仍可见多处“接口口径不一致 / 编码边界不稳 / 工程化分叉”的系统性问题。

本修复方案的目标是：

1. **稳定性优先**：消除中文/多字节字符导致的 stdio 解码与 JSON 解析偶发失败；降低“偶现超时/丢消息”风险。
2. **口径统一**：统一插件与桥接服务的 API 路径与基址，避免“部分功能永远 404/不可用”。
3. **工程可复现**：统一包管理器与锁文件策略，保证在不同机器上可稳定安装与构建。
4. **可维护性提升**：减少重复实现、逐步恢复 TypeScript 严格性、收敛日志与配置规范。
5. **中文编码可靠**：明确 Windows/PowerShell/外部命令输出的编码策略，避免中文路径/注册表输出解析失败。

## 1. 现状关键链路（用于定位根因）

1. 插件（`office-plugin`）在 `https://localhost:3000` 运行（Office 插件必须 HTTPS），通过 **HTTP** 调用 `office-local-bridge`（默认 `http://localhost:3001`），Vite 代理用于解决混合内容限制。
2. 桥接服务（`office-local-bridge`）通过 `ProcessManager` 拉起 MCP Server，通过 `StdioBridge` 进行 stdout JSON-RPC 通信。
3. MCP Server 侧输出的 JSON-RPC（以及日志）都混在 stdout/stderr，桥接侧以“按行 JSON.parse”方式解析。

此链路中最脆弱的环节是：

- **stdio 数据流解码与分包边界**（多字节字符跨 chunk 时极易误伤）
- **Windows 外部命令输出编码**（注册表/PowerShell 在中文系统下经常不是 UTF-8）
- **API 端点口径不一致导致的功能不可用**

## 2. 优先级定义

- **P0**：导致功能不可用、数据错乱、偶发超时/丢消息、或明显安全风险；必须优先修复。
- **P1**：影响正确性/兼容性/可运维性，可能在真实环境触发事故；应在 P0 后尽快处理。
- **P2**：影响可维护性/扩展性/性能；建议纳入中期迭代。
- **P3**：体验/代码整洁度类问题；可随手修或跟随重构处理。

## 3. 问题清单（按优先级）

### P0：稳定性与功能可用性

#### P0-1 stdio UTF-8 多字节拆包导致 JSON 解析失败（中文高风险）

- 现状：`office-local-bridge/src/mcp/StdioBridge.ts` 在 `stdout.on('data')` 中使用 `data.toString()` 累加字符串并按 `\n` 分割，再对每行 `JSON.parse`。
- 根因：Node 的 `Buffer#toString('utf8')` 在 chunk 边界处遇到 UTF-8 多字节字符时，**可能把字符拆断并产生替换字符**，导致：
  - JSON 字符串内容损坏 → `JSON.parse` 失败 → 请求永远等不到响应 → 触发超时
  - 日志/响应混流时更难复现与排查
- 建议修复（推荐）：对每个 serverId 使用 `StringDecoder('utf8')`（或 `TextDecoder('utf-8')` 的 streaming 模式）来解码，并把“未完成的行”保留在 buffer 中。
- 涉及文件：
  - `office-local-bridge/src/mcp/StdioBridge.ts`
  - `office-local-bridge/src/mcp/StdioBridge.test.ts`（补充“跨 chunk 多字节中文”测试）
- 验收标准：
  - 单元测试模拟“中文字符跨 chunk”时仍能正确解析 JSON-RPC 响应。
  - 运行压测（连续工具调用/并发调用）不出现超时上升与 bufferOverflow 误触发。

#### P0-2 `/api/*` 与 `/v1/office/*` 两套路由并存且不一致（必然 404）

- 现状：
  - `office-local-bridge` 实际路由挂载在 `/api/*` 与 `/health`（见 `office-local-bridge/src/server.ts`）。
  - `office-plugin` 与脚本/README 仍存在对 `/v1/office/*` 的调用（例如：
    - `office-plugin/src/services/BinaryDocumentAdapter.ts`
    - `office-plugin/src/components/molecules/FileUploadButton/FileUploadButton.tsx`
    - `office-plugin/src/services/ai/toolSelection/DynamicToolDiscovery.ts`
    - `office-plugin/scripts/Test-OfficePluginInstall.ps1`
    - `office-plugin/scripts/Test-OfficePluginHost.ps1`
    - `office-plugin/README.md`）
- 影响：部分功能在当前仓库结构下**必然不可用**（404 或跨域失败），并造成“看似偶发、实则口径不一致”的排障成本。
- 修复策略（需二选一，并可短期兼容双路由，见第 5 节方案对比）：
  - 方案 A：桥接服务新增 `/v1/office/*` 兼容层（内部转发到 `/api/*`）
  - 方案 B：插件/脚本/文档统一迁移到 `/api/*`（推荐最终态）
- 验收标准：
  - 插件侧所有网络请求都能在默认配置下跑通（无硬编码到不存在的后端）。
  - E2E 脚本与 README 指令与真实服务一致。

#### P0-3 包管理器与锁文件混用（构建不可复现）

- 现状：同一模块存在 `package-lock.json` 与 `pnpm-lock.yaml` 并存（如 `office-plugin`），且脚本中仍使用 `yarn`（`office-plugin/scripts/Test-OfficePluginInstall.ps1`）。
- 影响：
  - 安装依赖可能出现“同一依赖多版本/行为不一致”
  - 新环境复现成本高（尤其是需要 Office 证书/HTTPS 场景）
- 建议：明确统一策略（推荐 pnpm 或 npm 其一），并：
  - 删除/忽略多余锁文件
  - 更新脚本与 README 统一使用选定的包管理器
- 验收标准：
  - 仅保留一种锁文件，CI/本地均能稳定安装与构建。

### P1：兼容性 / 正确性 / 运维质量

#### P1-1 Windows 注册表输出编码与本地化解析脆弱

- 现状：`office-local-bridge/src/office/OfficeDetector.ts` 使用 `reg query` 并设置 `encoding:'utf8'`，同时解析 `(默认)` / `(Default)` 等本地化文本。
- 风险：
  - 中文 Windows 下 `reg query` 输出常用本地代码页（GBK/936），强行按 UTF-8 解码可能出现乱码。
  - 解析依赖本地化字符串，非中文/非英文系统可能失败。
- 建议：优先改用“结构化读取”的方式（见第 5 节方案对比）。

#### P1-2 插件 TS 严格模式关闭导致运行时风险累积

- 现状：`office-plugin/tsconfig.json` 中 `strict:false`、`strictNullChecks:false`。
- 风险：空值/类型错误被推迟到运行时（Office 插件调试成本高）。
- 建议：采用“渐进式严格化”路线（先局部开启/分目录迁移/配合 eslint 规则），避免一次性爆炸式修复。

#### P1-3 ChatInterface 体积过大且存在不可达逻辑

- 现状：`office-plugin/src/components/features/chat/ChatInterface.tsx` 超大文件，且存在 `return` 后的不可达代码分支。
- 建议：
  - 先清理不可达逻辑（保证行为一致）
  - 再按“展示层/状态管理/副作用/工具调用”拆分为子组件与 hooks

#### P1-4 安全：本地配置加密密钥可预测

- 现状：`office-local-bridge/src/utils/crypto.ts` 使用 `hostname + username` 生成密钥，属于“可预测派生”，难以抵御本机恶意进程或同用户上下文读取。
- 建议：接入 OS 级密钥存储（Windows DPAPI / macOS Keychain / Linux Secret Service），或引入 `keytar`/Tauri 插件等方案（见第 5 节）。

### P2：可维护性 / 复用 / 性能

- 重复实现：多处 `ConfigManager.ts`、`ipc.ts`、`ToolErrorHandler.ts` 在多个 MCP Server 之间重复或分叉（hash 已显示部分文件完全相同）。
- 监控/运维数据不准确：`office-local-bridge/src/mcp/ProcessManager.ts` 的 `memoryUsage` 读取的是当前进程而非子进程，容易误导排障。
- 日志口径不统一：大量 `console.*` 混用；应统一走 logger 并引入“敏感信息脱敏”约束。

## 4. 分阶段修复路线图（建议执行顺序）

### 阶段 0（P0）：稳定性与编码边界修复

1. 修复 `StdioBridge` 的 UTF-8 streaming 解码（并补充单元测试）。
2. 明确并落地“编码基线”：
   - Node 内部统一 UTF-8（已基本满足）
   - PowerShell 脚本开头统一设置输出为 UTF-8，并写文件时显式 `-Encoding utf8`
   - 如需解析 Windows 命令输出，统一采用 Buffer + 指定解码（或改用结构化 API）

### 阶段 1（P0）：API 口径统一与兼容层

1. 选定最终 API 口径（推荐：`office-local-bridge` 作为唯一后端，统一使用 `/api/*`）。
2. 短期兼容：在 bridge 侧增加 `/v1/office/*` 的临时兼容路由（可选，给老插件/脚本过渡）。
3. 插件侧清理硬编码：
   - 所有请求通过统一的 `apiBaseUrl` 与统一的 endpoints 模块
   - 移除 `http://localhost:3001/v1/office/...` 这类固定字符串

### 阶段 2（P0）：工程化一致（包管理器/脚本/文档）

1. 统一包管理器（pnpm 或 npm 二选一）。
2. 清理锁文件：只保留一种锁文件并更新 `.gitignore` 策略。
3. 更新脚本与 README：统一命令行入口，避免同时出现 yarn/npm/pnpm。

### 阶段 3（P1/P2）：可维护性治理

1. 渐进式启用 TS 严格选项（建议每周解锁 1-2 个选项，持续收敛）。
2. 拆分 `ChatInterface.tsx`，引入边界更清晰的模块（UI/状态/副作用/服务调用分离）。
3. 重复代码下沉 `shared`：统一 `ToolErrorHandler`、`ConfigManager`、`ipc` 等公共实现，避免三份分叉。

### 阶段 4（P1）：安全增强（可并行规划）

1. 本地配置加密改为 OS 级密钥存储（或至少改为“随机密钥 + 本地安全存储”）。
2. 增加脱敏日志规则：绝不输出 `apiKey/apiToken` 原文，必要时仅显示 hash/尾号。

## 5. 关键方案对比（建议做决策后再动手）

### 5.1 API 口径统一

**方案 A：bridge 增加 `/v1/office/*` 兼容层（短期）**

- 优点：老插件/脚本不立刻坏；迁移成本低。
- 缺点：长期会形成“双路由维护负担”；新功能容易忘记补两份。
- 适用：你已有外部用户在使用 `/v1/office/*`，需要平滑升级。

**方案 B：插件/脚本/文档统一迁移到 `/api/*`（推荐最终态）**

- 优点：口径单一、排障简单；bridge 的职责边界更清晰。
- 缺点：需要一次性改动多处调用点；需要版本管理与发布节奏配合。
- 适用：当前以仓库内自用为主，或可控制插件发布节奏。

**推荐**：B 为最终态；若存在外部兼容压力，则先 A 后 B，并为兼容层设置“移除日期/版本”。

### 5.2 Windows 注册表与 Office 检测实现

**方案 A：引入 Node 侧注册表读取库（结构化读取）**

- 优点：不依赖命令输出编码/本地化；鲁棒性最高。
- 缺点：新增依赖；需要评估打包与许可。

**方案 B：`reg query` 使用 Buffer 输出并按 GBK 解码**

- 优点：改动小；无需新增依赖。
- 缺点：仍依赖命令行；遇到不同系统区域仍可能出问题。

**方案 C：改用 PowerShell `Get-ItemProperty` 并强制 UTF-8 输出**

- 优点：PowerShell 更易读取结构化数据。
- 缺点：仍是外部命令；编码/版本差异仍可能踩坑。

**推荐**：A；若短期追求最小改动，先 B 过渡。

### 5.3 包管理器统一

**方案 A：pnpm（推荐用于多包仓库）**

- 优点：节省磁盘、安装快、适合 workspace；你当前环境已安装 pnpm。
- 缺点：需要统一 workspace 配置与脚本口径。

**方案 B：npm**

- 优点：默认工具链；学习成本最低。
- 缺点：多包复用能力弱于 pnpm；依赖去重与速度一般。

**推荐**：pnpm（并明确是否采用 workspace 管理所有模块）。

### 5.4 本地密钥存储

**方案 A：OS Keychain/DPAPI/SecretService（推荐）**

- 优点：安全等级最高，符合“本地优先但不裸奔”的预期。
- 缺点：跨平台实现复杂，需评估依赖与安装成本。

**方案 B：随机主密钥 + 文件存储（加权限）**

- 优点：实现简单；比可预测派生强。
- 缺点：仍可能被同用户恶意进程读取；安全性中等。

**推荐**：若产品化/对安全敏感，选 A；内部工具或 MVP 可先 B。

## 6. 交付物（建议）

- `FIX_PLAN.md`（本文件，持续更新为“修复路线真相源”）
- 兼容层/迁移完成后更新：
  - `README.md`
  - `office-plugin/README.md`
  - `office-plugin/scripts/*.ps1`
- 单元测试新增：
  - `office-local-bridge/src/mcp/StdioBridge.test.ts`（多字节拆包）
  -（可选）接口回归测试：验证 `/api/*` 与兼容层 `/v1/office/*`

## 7. 验收与测试清单（落地时执行）

1. **编码与 stdio**
   - 含中文的工具调用（参数/返回/日志）连续执行 1000 次，不出现超时与 JSON 解析错误。
2. **接口**
   - 插件：聊天/工具调用/MCP 列表/知识库搜索/文件上传（若启用）都能在默认配置跑通。
3. **工程**
   - 全仓库统一包管理器后：全新机器从 0 安装依赖并构建成功。
4. **回归**
   - word/excel/ppt 三个 MCP server 的 `npm test` 可通过（或按模块现有测试策略执行）。

## 8. 风险与回滚策略

- API 迁移风险：旧插件仍调用 `/v1/office/*` 时会失败。
  - 回滚：保留 `/v1/office/*` 兼容层一个发布周期；或插件端增加 fallback（先 `/api` 失败再尝试 `/v1`）。
- stdio 解码修改风险：如果 MCP Server 输出并非 UTF-8（理论上应为 UTF-8），可能出现差异。
  - 回滚：保留旧逻辑开关（环境变量）以快速切换；但最终应统一 UTF-8。
- 包管理器统一风险：开发者本地缓存与脚本可能依赖旧命令。
  - 回滚：在短期内提供迁移指南与兼容脚本别名，但设定淘汰日期。

## 9. 建议的下一步（你确认后即可开始改）

1. 我先提交 **P0-1（StdioBridge UTF-8 streaming 解码 + 测试）**，这是中文场景最容易“偶现爆炸”的根因。
2. 你确定 API 口径选择（第 5.1 节 A/B），我再批量统一插件/脚本/文档。
3. 最后统一包管理器与锁文件，并补齐“从 0 到可运行”的最短路径文档。

