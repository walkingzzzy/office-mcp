# Office Local Bridge 桌面应用开发文档

## 目录

1. [项目概述](#项目概述)
2. [技术选型](#技术选型)
3. [整体架构](#整体架构)
4. [配置页面规划](#配置页面规划)
5. [API 设计](#api-设计)
6. [数据持久化](#数据持久化)
7. [开发步骤](#开发步骤)
8. [打包部署](#打包部署)

---

## 项目概述

### 背景

Office Local Bridge 是一个本地桥接服务，用于连接 Office 插件与 MCP Server。当前服务以命令行形式运行，缺少图形化配置界面。

### 目标

构建一个桌面版配置管理应用，提供以下功能：
- AI 服务配置（多提供商支持）
- 模型管理（模型参数配置）
- 联网搜索配置
- MCP 服务器配置
- 知识库管理（RAG 功能）
- 服务状态监控

---

## 技术选型

### 方案对比

| 方案 | 优点 | 缺点 | 推荐场景 |
|------|------|------|----------|
| **Electron** | 生态成熟、跨平台、可访问系统API | 体积大(~150MB)、内存占用高 | 功能复杂的桌面应用 |
| **Tauri** | 体积小(~10MB)、性能好、安全性高 | Rust学习曲线、生态较新 | 轻量级桌面应用 |
| **纯 Web + Express** | 开发简单、无需额外依赖 | 需手动启动服务、无系统托盘 | 开发者工具 |

### 推荐方案：Tauri 2.0

**理由**：
1. **轻量级**：打包后体积约 10-15MB，适合工具类应用
2. **性能优秀**：Rust 后端，资源占用低
3. **安全性**：默认安全策略，适合处理 API Key 等敏感数据
4. **跨平台**：支持 Windows/macOS/Linux
5. **系统集成**：支持系统托盘、开机自启、窗口管理

### 前端技术栈

```
React 18 + TypeScript + Vite + TailwindCSS + React Router
```

### 后端技术栈

```
Tauri 2.0 (Rust) + 现有 Express 服务 (可选保留)
```

---

## 整体架构

### 架构图

```
┌─────────────────────────────────────────────────────────────────┐
│                    Tauri 桌面应用                                │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    前端 (WebView)                        │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │   │
│  │  │ AI配置   │ │ 模型管理 │ │ MCP配置  │ │ 知识库   │   │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘   │   │
│  │  ┌──────────┐ ┌──────────┐ ┌────────────────────────┐   │   │
│  │  │ 联网搜索 │ │ 状态监控 │ │ 系统设置              │   │   │
│  │  └──────────┘ └──────────┘ └────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                 Tauri 核心 (Rust)                        │   │
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐     │   │
│  │  │ 配置管理     │ │ 进程管理     │ │ 系统托盘     │     │   │
│  │  │ (JSON存储)   │ │ (MCP服务器)  │ │ (后台运行)   │     │   │
│  │  └──────────────┘ └──────────────┘ └──────────────┘     │   │
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐     │   │
│  │  │ AI代理       │ │ 知识库索引   │ │ 日志系统     │     │   │
│  │  │ (HTTP请求)   │ │ (向量存储)   │ │              │     │   │
│  │  └──────────────┘ └──────────────┘ └──────────────┘     │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTP API (localhost:3001)
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Office 插件 (Add-in)                         │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Word / Excel / PowerPoint 插件面板                       │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### 组件职责

| 组件 | 职责 |
|------|------|
| **Tauri 前端** | UI 渲染、用户交互、状态展示 |
| **Tauri Rust 核心** | 配置持久化、进程管理、系统集成 |
| **HTTP API** | 对外提供服务接口，供 Office 插件调用 |
| **MCP 服务器** | 执行 Office 文档操作 |

---

## 配置页面规划

### 1. AI 服务配置

**功能**：管理多个 AI 提供商的配置

```typescript
interface AIProviderConfig {
  id: string
  type: 'openai' | 'azure' | 'anthropic' | 'ollama' | 'custom'
  name: string
  enabled: boolean
  apiKey: string
  baseUrl?: string
  // Azure 特有
  azureDeployment?: string
  azureApiVersion?: string
  // 自定义端点
  customHeaders?: Record<string, string>
}
```

**页面元素**：
- 提供商列表（卡片形式）
- 添加提供商按钮
- 编辑/删除操作
- 连接测试按钮
- 设为默认提供商

**支持的提供商**：
| 提供商 | 配置项 |
|--------|--------|
| OpenAI | API Key, Base URL (可选) |
| Azure OpenAI | API Key, Endpoint, Deployment, API Version |
| Anthropic | API Key |
| Ollama | Base URL (本地) |
| 自定义 | Base URL, API Key, Headers |

### 2. 模型管理

**功能**：管理各提供商下的模型配置

```typescript
interface ModelConfig {
  id: string
  providerId: string
  name: string
  displayName: string
  enabled: boolean
  isDefault: boolean
  // 参数配置
  maxTokens?: number
  temperature?: number
  topP?: number
  frequencyPenalty?: number
  presencePenalty?: number
  // 功能支持
  supportsVision?: boolean
  supportsTools?: boolean
  supportsStreaming?: boolean
}
```

**页面元素**：
- 按提供商分组的模型列表
- 添加自定义模型
- 模型参数配置面板
- 预设模型快速添加（GPT-4, Claude-3等）
- 设为默认模型

### 3. 联网搜索配置

**功能**：配置 AI 联网搜索能力

```typescript
interface WebSearchConfig {
  enabled: boolean
  provider: 'tavily' | 'serper' | 'bing' | 'google' | 'duckduckgo'
  apiKey: string
  maxResults: number
  searchDepth: 'basic' | 'advanced'
  includeImages: boolean
  includeDomains?: string[]
  excludeDomains?: string[]
}
```

**页面元素**：
- 启用/禁用开关
- 搜索引擎选择
- API Key 配置
- 搜索参数配置
- 域名过滤设置
- 测试搜索功能

**支持的搜索引擎**：
| 引擎 | 特点 | 需要 API Key |
|------|------|--------------|
| Tavily | AI 优化搜索 | 是 |
| Serper | Google 搜索 API | 是 |
| Bing | 微软搜索 | 是 |
| DuckDuckGo | 免费、隐私保护 | 否 |

### 4. MCP 配置

**功能**：管理 MCP 服务器

```typescript
interface McpServerConfig {
  id: string
  name: string
  command: string
  args?: string[]
  cwd?: string
  env?: Record<string, string>
  enabled: boolean
  autoStart: boolean
}

interface McpServerStatus {
  id: string
  status: 'running' | 'stopped' | 'error'
  pid?: number
  startTime?: number
  lastError?: string
  tools?: McpTool[]
}
```

**页面元素**：
- MCP 服务器列表
- 状态指示器（运行/停止/错误）
- 启动/停止/重启按钮
- 添加自定义 MCP 服务器
- 查看可用工具列表
- 日志查看

**预置 MCP 服务器**：
- Word MCP Server
- Excel MCP Server
- PowerPoint MCP Server

### 5. 知识库管理

**功能**：管理本地知识库（RAG）

```typescript
interface KnowledgeBase {
  id: string
  name: string
  description?: string
  type: 'local' | 'notion' | 'confluence'
  // 本地文件夹
  sourcePaths?: string[]
  // 文件类型过滤
  fileTypes?: string[]
  // 索引状态
  indexStatus: 'idle' | 'indexing' | 'ready' | 'error'
  documentCount: number
  lastIndexed?: number
}

interface VectorStoreConfig {
  provider: 'local' | 'pinecone' | 'qdrant' | 'chroma'
  // 本地存储路径
  localPath?: string
  // 云服务配置
  apiKey?: string
  indexName?: string
  // 嵌入模型
  embeddingModel: string
  embeddingProvider: string
}
```

**页面元素**：
- 知识库列表
- 添加知识库（选择文件夹）
- 索引进度显示
- 文档数量统计
- 向量存储配置
- 嵌入模型选择
- 重建索引按钮

**支持的文件类型**：
- 文档：.pdf, .docx, .doc, .txt, .md
- 表格：.xlsx, .xls, .csv
- 代码：.js, .ts, .py, .java, .go
- 网页：.html, .htm

---

## API 设计

### RESTful API 端点

```
# 健康检查
GET  /health

# 配置管理
GET  /api/config                    # 获取完整配置
POST /api/config                    # 保存完整配置
POST /api/config/reset              # 重置为默认配置

# AI 提供商
GET  /api/config/providers          # 获取所有提供商
POST /api/config/providers          # 添加提供商
PUT  /api/config/providers/:id      # 更新提供商
DEL  /api/config/providers/:id      # 删除提供商
POST /api/config/providers/:id/test # 测试连接

# 模型管理
GET  /api/config/models             # 获取所有模型
POST /api/config/models             # 添加模型
PUT  /api/config/models/:id         # 更新模型
DEL  /api/config/models/:id         # 删除模型

# MCP 服务器
GET  /api/mcp/servers               # 获取服务器状态
POST /api/mcp/servers               # 添加服务器
PUT  /api/mcp/servers/:id           # 更新服务器配置
DEL  /api/mcp/servers/:id           # 删除服务器
POST /api/mcp/servers/:id/start     # 启动服务器
POST /api/mcp/servers/:id/stop      # 停止服务器
POST /api/mcp/servers/:id/restart   # 重启服务器
GET  /api/mcp/servers/:id/tools     # 获取工具列表
GET  /api/mcp/servers/:id/logs      # 获取日志

# 联网搜索
GET  /api/config/websearch          # 获取搜索配置
POST /api/config/websearch          # 保存搜索配置
POST /api/search/test               # 测试搜索

# 知识库
GET  /api/knowledge                 # 获取所有知识库
POST /api/knowledge                 # 创建知识库
PUT  /api/knowledge/:id             # 更新知识库
DEL  /api/knowledge/:id             # 删除知识库
POST /api/knowledge/:id/index       # 触发索引
GET  /api/knowledge/:id/status      # 获取索引状态
POST /api/knowledge/search          # 搜索知识库

# AI 聊天（供 Office 插件使用）
POST /api/ai/chat/completions       # 聊天完成
GET  /api/ai/providers              # 获取可用提供商
```

### Tauri IPC 命令

```rust
// Rust 端命令定义
#[tauri::command]
fn get_config() -> Result<BridgeConfig, String>;

#[tauri::command]
fn save_config(config: BridgeConfig) -> Result<(), String>;

#[tauri::command]
fn start_mcp_server(id: String) -> Result<(), String>;

#[tauri::command]
fn stop_mcp_server(id: String) -> Result<(), String>;

#[tauri::command]
fn select_folder() -> Result<String, String>;

#[tauri::command]
fn index_knowledge_base(id: String) -> Result<(), String>;
```

---

## 数据持久化

### 配置文件结构

```
~/.office-local-bridge/
├── config.json           # 主配置文件
├── providers.json        # AI 提供商配置（敏感信息加密）
├── models.json           # 模型配置
├── mcp-servers.json      # MCP 服务器配置
├── websearch.json        # 联网搜索配置
├── knowledge/            # 知识库数据
│   ├── index.json        # 知识库索引
│   └── vectors/          # 向量存储
└── logs/                 # 日志文件
    └── bridge.log
```

### 配置文件示例

**config.json**
```json
{
  "version": 1,
  "port": 3001,
  "host": "localhost",
  "logLevel": "info",
  "defaultProviderId": "provider_openai_1",
  "defaultModelId": "model_gpt4_1",
  "autoStart": true,
  "minimizeToTray": true
}
```

**providers.json**
```json
{
  "version": 1,
  "providers": [
    {
      "id": "provider_openai_1",
      "type": "openai",
      "name": "OpenAI",
      "enabled": true,
      "apiKey": "encrypted:xxxxx",
      "baseUrl": "https://api.openai.com/v1"
    }
  ]
}
```

### 敏感数据加密

使用系统密钥链或 AES-256 加密存储 API Key：

```rust
// Tauri 端加密存储
use keyring::Entry;

fn store_api_key(provider_id: &str, api_key: &str) -> Result<(), Error> {
    let entry = Entry::new("office-local-bridge", provider_id)?;
    entry.set_password(api_key)?;
    Ok(())
}

fn get_api_key(provider_id: &str) -> Result<String, Error> {
    let entry = Entry::new("office-local-bridge", provider_id)?;
    entry.get_password()
}
```

---

## 开发步骤

### 阶段 1：项目初始化（1-2天）

1. **创建 Tauri 项目**
   ```bash
   npm create tauri-app@latest office-local-bridge-app -- --template react-ts
   cd office-local-bridge-app
   npm install
   ```

2. **配置开发环境**
   - 安装 Rust 工具链
   - 配置 Tauri CLI
   - 设置 VS Code 开发环境

3. **整合现有代码**
   - 将现有 Express API 迁移或保留
   - 设置 HTTP 服务端口

### 阶段 2：基础框架（2-3天）

1. **前端框架搭建**
   - 路由配置
   - 布局组件
   - 导航菜单
   - 主题样式

2. **Rust 后端基础**
   - 配置管理模块
   - 文件操作封装
   - IPC 命令定义

3. **开发工具配置**
   - 热重载
   - 日志系统
   - 错误处理

### 阶段 3：核心功能（5-7天）

1. **AI 服务配置**（1-2天）
   - 提供商 CRUD
   - 连接测试
   - API Key 安全存储

2. **模型管理**（1天）
   - 模型列表
   - 参数配置
   - 默认模型设置

3. **MCP 配置**（1-2天）
   - 服务器管理
   - 进程控制
   - 状态监控

4. **联网搜索**（1天）
   - 搜索引擎配置
   - 搜索测试

5. **知识库管理**（2天）
   - 文件夹选择
   - 文档索引
   - 向量存储

### 阶段 4：系统集成（2-3天）

1. **系统托盘**
   - 托盘图标
   - 右键菜单
   - 状态显示

2. **开机自启**
   - 启动配置
   - 后台运行

3. **日志系统**
   - 日志查看器
   - 日志级别控制

### 阶段 5：测试与优化（2-3天）

1. **功能测试**
2. **性能优化**
3. **UI/UX 优化**
4. **文档完善**

### 阶段 6：打包发布（1-2天）

1. **Windows 打包**
2. **macOS 打包**
3. **安装程序制作**
4. **发布文档**

---

## 打包部署

### Windows

```bash
# 构建 MSI 安装包
npm run tauri build

# 输出位置
# src-tauri/target/release/bundle/msi/
```

### macOS

```bash
# 构建 DMG 安装包
npm run tauri build

# 输出位置
# src-tauri/target/release/bundle/dmg/
```

### 分发方式

1. **GitHub Releases**：自动构建和发布
2. **自动更新**：Tauri 内置更新机制
3. **便携版**：无需安装的可执行文件

---

## 附录

### 参考资源

- [Tauri 官方文档](https://tauri.app/v1/guides/)
- [React 官方文档](https://react.dev/)
- [TailwindCSS 文档](https://tailwindcss.com/docs)

### 目录结构

```
office-local-bridge-app/
├── src/                          # 前端源码
│   ├── components/               # 通用组件
│   │   ├── Layout.tsx
│   │   ├── Sidebar.tsx
│   │   ├── Card.tsx
│   │   └── ...
│   ├── pages/                    # 页面组件
│   │   ├── Dashboard.tsx         # 仪表盘
│   │   ├── AIConfig.tsx          # AI 服务配置
│   │   ├── ModelConfig.tsx       # 模型管理
│   │   ├── McpConfig.tsx         # MCP 配置
│   │   ├── SearchConfig.tsx      # 联网搜索
│   │   ├── KnowledgeBase.tsx     # 知识库
│   │   └── Settings.tsx          # 系统设置
│   ├── services/                 # 服务层
│   │   ├── api.ts                # API 调用
│   │   └── tauri.ts              # Tauri IPC
│   ├── types/                    # 类型定义
│   ├── hooks/                    # 自定义 Hooks
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── src-tauri/                    # Rust 后端
│   ├── src/
│   │   ├── main.rs               # 入口
│   │   ├── commands/             # IPC 命令
│   │   ├── config/               # 配置管理
│   │   ├── mcp/                  # MCP 进程管理
│   │   ├── knowledge/            # 知识库管理
│   │   └── http/                 # HTTP 服务
│   ├── Cargo.toml
│   └── tauri.conf.json
├── package.json
└── README.md
```
