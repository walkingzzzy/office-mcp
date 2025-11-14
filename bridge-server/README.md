# Bridge Server

Office AI插件的Bridge Server,连接Office Add-in前端和MCP后端服务。

## 功能

- ✅ Express HTTP服务器
- ✅ MCP Client (stdio通信)
- ✅ JSON-RPC协议支持
- ✅ 文件上传/下载
- ✅ 工具调用接口
- ✅ Winston日志系统
- ✅ 错误处理中间件
- ✅ CORS跨域支持

## 项目结构

```
bridge-server/
├── src/
│   ├── config/              # 配置
│   │   └── index.ts        # 服务器配置
│   ├── controllers/         # 控制器
│   │   ├── healthController.ts   # 健康检查
│   │   ├── toolController.ts     # 工具调用
│   │   └── fileController.ts     # 文件处理
│   ├── middleware/          # 中间件
│   │   └── errorHandler.ts # 错误处理
│   ├── routes/              # 路由
│   │   └── index.ts        # 路由配置
│   ├── services/            # 服务
│   │   └── MCPClient.ts    # MCP客户端
│   ├── types/               # 类型定义
│   │   └── index.ts        # TypeScript类型
│   ├── utils/               # 工具
│   │   └── logger.ts       # 日志工具
│   ├── app.ts              # Express应用
│   └── index.ts            # 入口文件
├── temp/                    # 临时文件目录
├── logs/                    # 日志目录
├── package.json
├── tsconfig.json
└── .env.example
```

## 技术栈

- **Node.js**: 运行时环境
- **Express**: Web框架
- **TypeScript**: 类型安全
- **Winston**: 日志系统
- **Multer**: 文件上传
- **child_process**: stdio通信

## 安装依赖

```bash
cd bridge-server
npm install
```

## 配置

复制 `.env.example` 到 `.env` 并修改配置:

```bash
cp .env.example .env
```

配置项说明:

```env
PORT=3001                           # 服务器端口
MCP_SERVER_PATH=../src/office_mcp_server/main.py  # MCP服务器路径
PYTHON_PATH=python                  # Python解释器
TEMP_DIR=./temp                     # 临时文件目录
LOG_DIR=./logs                      # 日志目录
LOG_LEVEL=info                      # 日志级别
CORS_ORIGIN=https://localhost:3000  # CORS源
MAX_FILE_SIZE=50                    # 最大文件大小(MB)
```

## 开发

### 启动开发服务器

```bash
npm run dev
```

使用nodemon自动重启。

### 构建生产版本

```bash
npm run build
```

### 启动生产服务器

```bash
npm start
```

### 代码检查

```bash
npm run lint
```

### 类型检查

```bash
npm run type-check
```

## API接口

### 健康检查

**GET** `/api/health`

响应:
```json
{
  "success": true,
  "data": {
    "status": "ok",
    "timestamp": "2025-01-12T10:00:00.000Z",
    "mcpServer": "connected"
  },
  "message": "服务器运行正常"
}
```

### 获取服务器信息

**GET** `/api/server/info`

响应:
```json
{
  "success": true,
  "data": {
    "name": "office-mcp-server",
    "version": "1.0.0",
    "protocolVersion": "2024-11-05"
  }
}
```

### 获取工具列表

**GET** `/api/tools/list`

响应:
```json
{
  "success": true,
  "data": {
    "tools": [
      {
        "name": "get_server_info",
        "description": "获取服务器信息",
        "inputSchema": {
          "type": "object",
          "properties": {},
          "required": []
        }
      }
    ]
  }
}
```

### 调用工具

**POST** `/api/tools/call`

请求体:
```json
{
  "tool": "get_server_info",
  "parameters": {}
}
```

响应:
```json
{
  "success": true,
  "data": {
    "result": "..."
  }
}
```

### 上传文件

**POST** `/api/files/upload`

Content-Type: `multipart/form-data`

字段: `file` (文件)

响应:
```json
{
  "success": true,
  "data": {
    "filename": "file-1234567890-123456789.docx",
    "originalName": "document.docx",
    "mimetype": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "size": 12345,
    "path": "/path/to/temp/file-1234567890-123456789.docx"
  },
  "message": "文件上传成功"
}
```

### 下载文件

**GET** `/api/files/:filename`

响应: 文件流

### 删除文件

**DELETE** `/api/files/:filename`

响应:
```json
{
  "success": true,
  "message": "文件删除成功"
}
```

## MCP Client使用

### 启动MCP服务器

```typescript
import mcpClient from './services/MCPClient';

await mcpClient.start();
```

### 调用工具

```typescript
const result = await mcpClient.callTool('get_server_info', {});
console.log(result);
```

### 获取工具列表

```typescript
const tools = await mcpClient.listTools();
console.log(tools);
```

### 停止MCP服务器

```typescript
mcpClient.stop();
```

## 日志

日志文件位于 `logs/` 目录:

- `combined.log`: 所有日志
- `error.log`: 错误日志

日志格式:
```
2025-01-12 10:00:00 [INFO]: 启动MCP Client...
2025-01-12 10:00:01 [INFO]: MCP服务器初始化成功
2025-01-12 10:00:02 [INFO]: Bridge Server运行在端口 3001
```

## 错误处理

所有API错误响应格式:

```json
{
  "success": false,
  "error": "错误信息",
  "message": "友好的错误描述"
}
```

HTTP状态码:
- `200`: 成功
- `400`: 请求参数错误
- `404`: 资源不存在
- `500`: 服务器内部错误

## 开发注意事项

1. **MCP服务器路径**: 确保 `MCP_SERVER_PATH` 指向正确的Python脚本
2. **Python环境**: 确保Python环境已安装所需依赖
3. **文件权限**: 确保temp和logs目录有写权限
4. **CORS配置**: 确保CORS_ORIGIN与前端地址匹配
5. **文件大小限制**: 根据需要调整MAX_FILE_SIZE

## 测试

使用curl测试API:

```bash
# 健康检查
curl http://localhost:3001/api/health

# 获取工具列表
curl http://localhost:3001/api/tools/list

# 调用工具
curl -X POST http://localhost:3001/api/tools/call \
  -H "Content-Type: application/json" \
  -d '{"tool":"get_server_info","parameters":{}}'

# 上传文件
curl -X POST http://localhost:3001/api/files/upload \
  -F "file=@document.docx"
```

## 下一步

1. 实现WebSocket实时通信
2. 添加单元测试
3. 添加API文档(Swagger)
4. 实现请求限流
5. 添加身份验证

## 许可证

MIT
