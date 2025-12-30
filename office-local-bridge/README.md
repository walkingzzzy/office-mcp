# Office Local Bridge

轻量级本地桥接服务，用于连接 Office 插件与 MCP Server，并提供 AI API 代理功能。

## 功能特性

- ✅ **MCP 进程管理**：自动启动、停止和监控 MCP Server 进程
- ✅ **stdio 通信桥接**：桥接 Office 插件与 MCP Server 的 JSON-RPC 通信
- ✅ **AI API 代理**：解决浏览器 CORS 限制，支持多种 AI 提供商
- ✅ **健康检查**：实时监控服务和 MCP Server 状态
- ✅ **优雅关闭**：确保所有进程正确清理

## 支持的 AI 提供商

- OpenAI
- Azure OpenAI
- Anthropic (Claude)
- 自定义 OpenAI 兼容端点

## 快速开始

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

### 构建

```bash
npm run build
```

### 启动服务

```bash
npm start
```

服务将在 `http://localhost:3001` 启动。

## API 端点

详细的 API 文档请参考：
- [API.md](./API.md) - 简化版 API 文档
- [docs/api-design.md](./docs/api-design.md) - 完整 API 设计文档（包含实现状态）

### 核心 API（已实现 ✅）

#### 健康检查
```
GET /health                         # 服务健康状态
```

#### 配置管理
```
GET /api/config                     # 获取完整配置
POST /api/config                    # 保存配置
POST /api/config/reset              # 重置为默认配置
POST /api/config/export             # 导出配置
POST /api/config/import             # 导入配置
```

#### AI 提供商管理
```
GET /api/providers                  # 获取所有 AI 提供商
POST /api/providers                 # 添加 AI 提供商
PUT /api/providers/:id              # 更新提供商配置
DELETE /api/providers/:id           # 删除提供商
POST /api/providers/:id/test        # 测试提供商连接
```

#### MCP 服务器管理
```
GET /api/config/mcp-servers         # 获取所有 MCP 服务器
POST /api/config/mcp-servers        # 添加 MCP 服务器
PUT /api/config/mcp-servers/:id     # 更新服务器配置
DELETE /api/config/mcp-servers/:id  # 删除服务器
POST /api/config/mcp-servers/:id/toggle  # 启用/禁用服务器
GET /api/mcp/servers/:id/tools      # 获取服务器工具列表
POST /api/mcp/servers/:id/call      # 调用 MCP 工具
```

#### 知识库管理
```
# 外部知识库连接（Dify等）
GET /api/knowledge/connections      # 获取所有连接
POST /api/knowledge/connections     # 创建连接
PUT /api/knowledge/connections/:id  # 更新连接
DELETE /api/knowledge/connections/:id  # 删除连接
POST /api/knowledge/search          # 搜索知识库

# 本地知识库
POST /api/knowledge/local/add       # 添加文档
POST /api/knowledge/local/batch     # 批量添加文档
GET /api/knowledge/local/search     # 搜索文档
PUT /api/knowledge/local/:id        # 更新文档
DELETE /api/knowledge/local/:id     # 删除文档
GET /api/knowledge/local/:id        # 获取文档详情
GET /api/knowledge/local/list       # 列出所有文档
```

#### 联网搜索
```
GET /api/config/websearch           # 获取搜索配置
POST /api/config/websearch          # 保存搜索配置
POST /api/search/test               # 测试搜索功能
POST /api/search                    # 执行搜索
```

#### AI 聊天代理
```
GET /api/ai/providers               # 获取可用提供商
POST /api/ai/chat/completions       # AI 对话（支持流式）
POST /api/ai/chat/completions/stream  # 流式对话
```

#### 工具执行
```
POST /api/execute-tool              # 执行 MCP 工具
GET /api/pending-commands           # 获取待执行命令
POST /api/command-result            # 提交命令执行结果
```

#### 日志管理
```
GET /api/logs                       # 获取系统日志
DELETE /api/logs                    # 清理日志
```

#### WebSocket
```
ws://localhost:3001/ws              # WebSocket 连接
```

## 配置

在项目根目录创建 `config.json`：

```json
{
  "port": 3001,
  "host": "localhost",
  "logLevel": "info",
  "mcpServers": [
    {
      "id": "word-mcp-server",
      "name": "Word MCP Server",
      "command": "node",
      "args": ["../word-mcp-server/dist/index.js"],
      "enabled": true
    }
  ]
}
```

## 测试

```bash
npm test
```

## 许可证

MIT
