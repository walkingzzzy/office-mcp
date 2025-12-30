# API 设计文档

## 概述

本文档定义 Office Local Bridge 服务的 RESTful API 接口规范，供前端配置页面和 Office 插件调用。

> **实现状态说明**：
> - ✅ **已实现**：API 已完全实现并可用
> - ⚠️ **部分实现**：核心功能已实现，部分高级功能待开发
> - ❌ **未实现**：仅为设计规划，尚未开发

---

## 基础信息

### 服务地址

```
http://localhost:3001
```

### 通用响应格式

**成功响应**
```json
{
  "success": true,
  "data": { ... }
}
```

**错误响应**
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "错误描述"
  }
}
```

### 错误码

| 错误码 | 描述 |
|--------|------|
| `INVALID_REQUEST` | 请求参数无效 |
| `NOT_FOUND` | 资源不存在 |
| `ALREADY_EXISTS` | 资源已存在 |
| `OPERATION_FAILED` | 操作失败 |
| `PROVIDER_ERROR` | AI 提供商错误 |
| `MCP_ERROR` | MCP 服务器错误 |
| `SEARCH_ERROR` | 搜索服务错误 |

---

## 1. 健康检查 API ✅

### GET /health

检查服务健康状态。

**响应**
```json
{
  "status": "ok",
  "timestamp": 1705312345678,
  "version": "1.0.0",
  "mcpServers": [
    {
      "id": "word-mcp-server",
      "name": "Word MCP Server",
      "status": "running",
      "pid": 12345,
      "startTime": 1705312000000
    }
  ]
}
```

---

## 2. 配置管理 API ✅

### GET /api/config

获取完整配置。

**响应**
```json
{
  "success": true,
  "data": {
    "version": 1,
    "port": 3001,
    "host": "localhost",
    "logLevel": "info",
    "defaultProviderId": "provider_1",
    "defaultModelId": "model_1",
    "autoStart": true,
    "minimizeToTray": true
  }
}
```

### POST /api/config

保存配置（部分更新）。

**请求**
```json
{
  "port": 3002,
  "logLevel": "debug"
}
```

**响应**
```json
{
  "success": true,
  "data": { ... }
}
```

### POST /api/config/reset

重置为默认配置。

**响应**
```json
{
  "success": true,
  "data": { ... }
}
```

### POST /api/config/export

导出配置文件。

**响应**
```json
{
  "success": true,
  "data": {
    "content": "{ ... }",
    "filename": "config-export-20240115.json"
  }
}
```

### POST /api/config/import

导入配置文件。

**请求**
```json
{
  "content": "{ ... }"
}
```

---

## 3. AI 提供商 API ✅

### GET /api/config/providers

获取所有 AI 提供商。

**响应**
```json
{
  "success": true,
  "data": {
    "providers": [
      {
        "id": "provider_1",
        "type": "openai",
        "name": "OpenAI",
        "enabled": true,
        "isDefault": true,
        "baseUrl": "https://api.openai.com/v1",
        "connectionStatus": "connected",
        "lastTestedAt": 1705312345678,
        "modelCount": 5
      }
    ]
  }
}
```

### POST /api/config/providers

添加 AI 提供商。

**请求**
```json
{
  "type": "openai",
  "name": "我的 OpenAI",
  "apiKey": "sk-xxx",
  "baseUrl": "https://api.openai.com/v1",
  "enabled": true
}
```

**响应**
```json
{
  "success": true,
  "data": {
    "id": "provider_2",
    "type": "openai",
    "name": "我的 OpenAI",
    ...
  }
}
```

### PUT /api/config/providers/:id

更新 AI 提供商。

**请求**
```json
{
  "name": "OpenAI 主账号",
  "enabled": true
}
```

### DELETE /api/config/providers/:id

删除 AI 提供商。

**响应**
```json
{
  "success": true
}
```

### POST /api/config/providers/:id/test

测试 AI 提供商连接。

**响应**
```json
{
  "success": true,
  "data": {
    "connected": true,
    "latency": 523,
    "availableModels": ["gpt-4o", "gpt-4-turbo", "gpt-3.5-turbo"]
  }
}
```

### POST /api/config/providers/:id/set-default

设为默认提供商。

---

## 4. 模型管理 API ✅

### GET /api/config/models

获取所有模型。

**查询参数**
- `providerId` (可选): 按提供商筛选

**响应**
```json
{
  "success": true,
  "data": {
    "models": [
      {
        "id": "model_1",
        "providerId": "provider_1",
        "name": "gpt-4o",
        "displayName": "GPT-4o",
        "enabled": true,
        "isDefault": true,
        "maxTokens": 4096,
        "temperature": 0.7,
        "topP": 0.95,
        "supportsVision": true,
        "supportsTools": true,
        "supportsStreaming": true,
        "contextWindow": 128000
      }
    ]
  }
}
```

### GET /api/config/models/presets

获取预设模型模板。

**查询参数**
- `type`: 提供商类型 (openai, azure, anthropic, ollama)

**响应**
```json
{
  "success": true,
  "data": {
    "presets": [
      {
        "name": "gpt-4o",
        "displayName": "GPT-4o",
        "contextWindow": 128000,
        "supportsVision": true,
        "supportsTools": true,
        "recommended": true
      }
    ]
  }
}
```

### POST /api/config/models

添加模型。

**请求**
```json
{
  "providerId": "provider_1",
  "name": "gpt-4o",
  "displayName": "GPT-4o (自定义)",
  "maxTokens": 8192,
  "temperature": 0.5
}
```

### PUT /api/config/models/:id

更新模型配置。

### DELETE /api/config/models/:id

删除模型。

### POST /api/config/models/:id/set-default

设为默认模型。

---

## 5. MCP 服务器 API ✅

### GET /api/mcp/servers

获取 MCP 服务器状态列表。

**响应**
```json
{
  "success": true,
  "data": {
    "servers": [
      {
        "id": "word-mcp-server",
        "name": "Word MCP Server",
        "status": "running",
        "pid": 12345,
        "startTime": 1705312000000,
        "toolCount": 15
      }
    ]
  }
}
```

### GET /api/config/mcp-servers

获取 MCP 服务器配置列表。

**响应**
```json
{
  "success": true,
  "data": {
    "mcpServers": [
      {
        "id": "word-mcp-server",
        "name": "Word MCP Server",
        "command": "node",
        "args": ["/path/to/server.js"],
        "cwd": "/path/to/project",
        "env": {},
        "enabled": true,
        "autoStart": true
      }
    ]
  }
}
```

### POST /api/config/mcp-servers

添加 MCP 服务器。

**请求**
```json
{
  "name": "Custom MCP Server",
  "command": "node",
  "args": ["/path/to/custom-server.js"],
  "cwd": "/path/to/project",
  "env": {
    "NODE_ENV": "production"
  },
  "enabled": true,
  "autoStart": false
}
```

### PUT /api/config/mcp-servers/:id

更新 MCP 服务器配置。

### DELETE /api/config/mcp-servers/:id

删除 MCP 服务器。

### POST /api/mcp/servers/:id/start

启动 MCP 服务器。

**响应**
```json
{
  "success": true,
  "data": {
    "pid": 12346,
    "status": "running"
  }
}
```

### POST /api/mcp/servers/:id/stop

停止 MCP 服务器。

### POST /api/mcp/servers/:id/restart

重启 MCP 服务器。

### GET /api/mcp/servers/:id/tools

获取 MCP 服务器工具列表。

**响应**
```json
{
  "success": true,
  "data": {
    "tools": [
      {
        "name": "create_document",
        "description": "创建新的 Word 文档",
        "inputSchema": {
          "type": "object",
          "properties": {
            "title": {
              "type": "string",
              "description": "文档标题"
            },
            "content": {
              "type": "string",
              "description": "文档内容"
            }
          },
          "required": ["title"]
        }
      }
    ]
  }
}
```

### GET /api/mcp/servers/:id/logs

获取 MCP 服务器日志。

**查询参数**
- `limit`: 返回条数 (默认 100)
- `level`: 日志级别筛选

**响应**
```json
{
  "success": true,
  "data": {
    "logs": [
      {
        "timestamp": 1705312345678,
        "level": "info",
        "message": "Server started on stdio"
      }
    ]
  }
}
```

### POST /api/mcp/servers/:id/call

调用 MCP 工具。

**请求**
```json
{
  "toolName": "create_document",
  "args": {
    "title": "新文档",
    "content": "内容"
  }
}
```

**响应**
```json
{
  "success": true,
  "data": {
    "result": { ... }
  }
}
```

---

## 6. 联网搜索 API ✅

### GET /api/config/websearch

获取联网搜索配置。

**响应**
```json
{
  "success": true,
  "data": {
    "enabled": true,
    "provider": "tavily",
    "maxResults": 5,
    "searchDepth": "basic",
    "includeImages": false,
    "includeDomains": [],
    "excludeDomains": []
  }
}
```

### POST /api/config/websearch

保存联网搜索配置。

**请求**
```json
{
  "enabled": true,
  "provider": "tavily",
  "apiKey": "tvly-xxx",
  "maxResults": 5,
  "searchDepth": "advanced",
  "includeImages": true
}
```

### POST /api/search/test

测试搜索功能。

**请求**
```json
{
  "query": "什么是 MCP 协议"
}
```

**响应**
```json
{
  "success": true,
  "data": {
    "results": [
      {
        "title": "Model Context Protocol 介绍",
        "url": "https://anthropic.com/mcp",
        "snippet": "MCP 是一个开放协议...",
        "score": 0.95
      }
    ],
    "searchTime": 523
  }
}
```

### POST /api/search

执行搜索（供 AI 调用）。

**请求**
```json
{
  "query": "搜索关键词",
  "maxResults": 5
}
```

---

## 7. 知识库 API ⚠️

> **实现状态**：
> - ✅ **外部知识库连接管理**：已实现（Dify等）- `/api/knowledge/connections/*`
> - ✅ **本地知识库基础功能**：已实现 - `/api/knowledge/local/*`
> - ❌ **本地知识库索引系统**：未实现（设计规划中）

### 7.1 外部知识库连接 API ✅

#### GET /api/knowledge/connections

获取所有外部知识库连接。

**响应**
```json
{
  "success": true,
  "data": {
    "knowledgeBases": [
      {
        "id": "kb_1",
        "name": "项目文档",
        "description": "项目相关技术文档",
        "sourceType": "local",
        "sourcePaths": ["/path/to/docs"],
        "fileTypes": [".md", ".pdf", ".txt"],
        "indexStatus": "ready",
        "documentCount": 156,
        "vectorCount": 2340,
        "lastIndexed": 1705312345678
      }
    ]
  }
}
```

#### POST /api/knowledge/connections

创建外部知识库连接。

#### PUT /api/knowledge/connections/:id

更新外部知识库连接配置。

#### DELETE /api/knowledge/connections/:id

删除外部知识库连接。

#### POST /api/knowledge/connections/:id/test

测试外部知识库连接。

#### GET /api/knowledge/connections/:id/datasets

获取外部知识库的数据集列表。

#### POST /api/knowledge/search

搜索知识库。

**请求**
```json
{
  "query": "如何配置 API 端点",
  "knowledgeBaseIds": ["kb_1"],
  "topK": 5,
  "threshold": 0.7
}
```

**响应**
```json
{
  "success": true,
  "data": {
    "results": [
      {
        "knowledgeBaseId": "kb_1",
        "documentId": "doc_123",
        "documentName": "api-guide.md",
        "content": "## API 端点配置\n\n在 config.json 中...",
        "similarity": 0.92,
        "metadata": {
          "filePath": "/path/to/docs/api-guide.md",
          "fileType": ".md",
          "chunkIndex": 3
        }
      }
    ],
    "searchTime": 45
  }
}
```

### 7.2 本地知识库 API ✅

#### POST /api/knowledge/local/add

添加文档到本地知识库。

**请求**
```json
{
  "title": "文档标题",
  "content": "文档内容",
  "metadata": {
    "category": "技术文档",
    "tags": ["API", "设计"]
  }
}
```

**响应**
```json
{
  "success": true,
  "data": {
    "id": "doc-uuid",
    "title": "文档标题",
    "content": "文档内容...",
    "chunks": 5,
    "createdAt": 1705312345678,
    "metadata": {}
  }
}
```

#### POST /api/knowledge/local/batch

批量添加文档到本地知识库。

**请求**
```json
[
  {
    "title": "文档1",
    "content": "内容1",
    "metadata": {}
  },
  {
    "title": "文档2",
    "content": "内容2",
    "metadata": {}
  }
]
```

**响应**
```json
{
  "success": true,
  "data": {
    "success": [
      {
        "id": "doc-uuid-1",
        "title": "文档1"
      }
    ],
    "failed": [
      {
        "request": {
          "title": "文档2",
          "content": "内容2"
        },
        "error": "错误信息"
      }
    ]
  }
}
```

#### GET /api/knowledge/local/search

搜索本地知识库。

**查询参数**
- `query`: 搜索关键词（必需）
- `limit`: 返回结果数量（默认 10）
- `threshold`: 相似度阈值（默认 0.7）

**响应**
```json
{
  "success": true,
  "data": {
    "results": [
      {
        "id": "doc-uuid",
        "title": "文档标题",
        "content": "匹配的内容片段...",
        "similarity": 0.92,
        "metadata": {}
      }
    ],
    "total": 5
  }
}
```

#### PUT /api/knowledge/local/:id

更新文档。

**请求**
```json
{
  "title": "更新后的标题",
  "content": "更新后的内容",
  "metadata": {
    "category": "更新分类"
  }
}
```

#### DELETE /api/knowledge/local/:id

删除文档。

#### GET /api/knowledge/local/:id

获取文档详情。

#### GET /api/knowledge/local/list

列出所有文档。

**查询参数**
- `limit`: 返回数量
- `offset`: 偏移量

### 7.3 本地知识库索引系统 ❌

> **注意**：以下功能仅为设计规划，尚未实现。当前已实现的本地知识库功能（7.2节）可满足基本文档管理和搜索需求。

#### POST /api/knowledge

创建知识库索引配置。

#### PUT /api/knowledge/:id

更新知识库索引配置。

#### DELETE /api/knowledge/:id

删除知识库（包括向量数据）。

#### POST /api/knowledge/:id/index

触发索引任务。

#### GET /api/knowledge/:id/status

获取索引状态。

#### POST /api/knowledge/:id/cancel

取消索引任务。

#### GET /api/knowledge/vector-store

获取向量存储配置。

#### POST /api/knowledge/vector-store

保存向量存储配置。

---

## 8. AI 聊天 API ✅

### GET /api/ai/providers

获取可用的 AI 提供商（供 Office 插件使用）。

**响应**
```json
{
  "success": true,
  "data": {
    "providers": ["openai", "azure", "anthropic", "ollama", "custom"],
    "defaultProvider": "openai"
  }
}
```

### POST /api/ai/chat/completions

聊天完成请求。

**请求**
```json
{
  "config": {
    "provider": "openai",
    "apiKey": "sk-xxx",
    "model": "gpt-4o"
  },
  "request": {
    "model": "gpt-4o",
    "messages": [
      {"role": "user", "content": "你好"}
    ],
    "stream": false
  }
}
```

**响应**
```json
{
  "id": "chatcmpl-xxx",
  "object": "chat.completion",
  "created": 1705312345,
  "model": "gpt-4o",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "你好！有什么可以帮助你的吗？"
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 10,
    "completion_tokens": 15,
    "total_tokens": 25
  }
}
```

### POST /api/ai/chat/completions/stream

流式聊天完成请求。

**响应格式**: Server-Sent Events (SSE)

```
data: {"id":"chatcmpl-xxx","choices":[{"delta":{"content":"你"}}]}

data: {"id":"chatcmpl-xxx","choices":[{"delta":{"content":"好"}}]}

data: [DONE]
```

---

## 9. 工具执行 API ✅

### POST /api/execute-tool

执行 MCP 工具（供 Office 插件使用）。

**请求**
```json
{
  "toolName": "create_document",
  "args": {
    "title": "新文档"
  },
  "callId": "call_123",
  "serverId": "word-mcp-server"
}
```

**响应**
```json
{
  "success": true,
  "data": { ... },
  "callId": "call_123"
}
```

### GET /api/pending-commands

获取待执行的命令（轮询接口）。

**响应**
```json
{
  "commands": [
    {
      "callId": "call_123",
      "toolName": "create_document",
      "args": { ... }
    }
  ]
}
```

### POST /api/command-result

提交命令执行结果。

**请求**
```json
{
  "callId": "call_123",
  "success": true,
  "result": { ... }
}
```

---

## 10. 日志 API ✅

### GET /api/logs

获取系统日志。

**查询参数**
- `level`: 日志级别 (debug, info, warn, error)
- `limit`: 返回条数 (默认 100)
- `offset`: 偏移量
- `startTime`: 开始时间戳
- `endTime`: 结束时间戳

**响应**
```json
{
  "success": true,
  "data": {
    "logs": [
      {
        "timestamp": 1705312345678,
        "level": "info",
        "module": "Server",
        "message": "服务器已启动",
        "data": { "port": 3001 }
      }
    ],
    "total": 1000,
    "hasMore": true
  }
}
```

### DELETE /api/logs

清理日志。

**请求**
```json
{
  "beforeTimestamp": 1705312345678
}
```

---

## 11. WebSocket API ✅

### 连接

```
ws://localhost:3001/ws
```

### 事件类型

**服务器状态变更**
```json
{
  "type": "mcp:status",
  "data": {
    "id": "word-mcp-server",
    "status": "running"
  }
}
```

**索引进度**
```json
{
  "type": "knowledge:progress",
  "data": {
    "id": "kb_1",
    "progress": 65,
    "currentFile": "api-guide.md"
  }
}
```

**日志事件**
```json
{
  "type": "log",
  "data": {
    "timestamp": 1705312345678,
    "level": "info",
    "message": "..."
  }
}
```

---

## 实现优先级

### 阶段 1：核心 API（必须）
1. 健康检查 `/health`
2. AI 提供商 CRUD
3. 模型管理 CRUD
4. MCP 服务器管理

### 阶段 2：扩展 API（重要）
1. 联网搜索配置
2. AI 聊天代理
3. 配置导入导出

### 阶段 3：高级 API（可选）
1. 知识库管理
2. WebSocket 实时更新
3. 日志管理
