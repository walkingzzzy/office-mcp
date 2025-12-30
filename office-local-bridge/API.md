# Office Local Bridge API 文档

## 基础信息

- **基础 URL**: `http://localhost:3001`
- **内容类型**: `application/json`
- **CORS**: 已启用，支持跨域请求

## 健康检查 API

### GET /health

获取服务健康状态。

**响应示例**:

```json
{
  "status": "ok",
  "timestamp": 1702800000000,
  "mcpServers": [
    {
      "id": "word-mcp-server",
      "name": "Word MCP Server",
      "status": "running",
      "startTime": 1702799000000
    }
  ]
}
```

## MCP 管理 API

### GET /api/mcp/servers

获取所有已注册的 MCP Server。

**响应示例**:

```json
[
  {
    "id": "word-mcp-server",
    "name": "Word MCP Server",
    "status": "running",
    "enabled": true
  }
]
```

### GET /api/mcp/servers/:id/tools

获取指定 MCP Server 的工具列表。

**路径参数**:
- `id`: MCP Server ID

**响应示例**:

```json
{
  "tools": [
    {
      "name": "word_insert_text",
      "description": "在 Word 文档中插入文本",
      "inputSchema": {
        "type": "object",
        "properties": {
          "text": { "type": "string" }
        }
      }
    }
  ]
}
```

### POST /api/mcp/servers/:id/call

调用 MCP 工具。

**请求体**:

```json
{
  "toolName": "word_insert_text",
  "args": {
    "text": "Hello World"
  }
}
```

**响应示例**:

```json
{
  "success": true,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "文本已插入"
      }
    ]
  }
}
```

## AI 代理 API

### GET /api/ai/providers

获取支持的 AI 提供商列表。

**响应示例**:

```json
[
  {
    "id": "openai",
    "name": "OpenAI",
    "type": "openai"
  },
  {
    "id": "azure",
    "name": "Azure OpenAI",
    "type": "azure"
  }
]
```

### POST /api/ai/chat/completions

AI 对话接口（支持流式输出）。

**请求体**:

```json
{
  "provider": "openai",
  "apiKey": "sk-...",
  "model": "gpt-4",
  "messages": [
    {
      "role": "user",
      "content": "你好"
    }
  ],
  "stream": true
}
```

**流式响应** (SSE):

```
data: {"id":"1","choices":[{"delta":{"content":"你"}}]}

data: {"id":"1","choices":[{"delta":{"content":"好"}}]}

data: [DONE]
```

## 工具执行 API

### POST /api/execute-tool

执行 Office 工具（由 MCP Server 调用）。

**请求体**:

```json
{
  "toolName": "word_get_selection",
  "args": {},
  "callId": "call_123"
}
```

### GET /api/pending-commands

获取待执行的命令（由 Office 插件轮询）。

**响应示例**:

```json
[
  {
    "id": "cmd_123",
    "toolName": "word_get_selection",
    "args": {},
    "timestamp": 1702800000000
  }
]
```

### POST /api/command-result

提交命令执行结果（由 Office 插件调用）。

**请求体**:

```json
{
  "commandId": "cmd_123",
  "success": true,
  "result": {
    "text": "选中的文本"
  }
}
```

## 错误响应

所有 API 在出错时返回统一格式：

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "错误描述"
  }
}
```

常见错误码：
- `SERVER_NOT_FOUND`: MCP Server 未找到
- `TOOL_NOT_FOUND`: 工具未找到
- `EXECUTION_ERROR`: 执行错误
- `INVALID_REQUEST`: 请求参数无效
