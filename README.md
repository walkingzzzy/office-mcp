# Office MCP Server

基于 MCP (Model Context Protocol) 的 Office AI 助手系统，支持 Word、Excel 和 PowerPoint。

## 架构

```
┌─────────────────┐      HTTP       ┌─────────────────┐     stdio      ┌─────────────────┐
│  Office Add-in  │◄───────────────►│ office-local-   │◄──────────────►│   MCP Servers   │
│    (Browser)    │  localhost:3001 │     bridge      │                │ word/excel/ppt  │
└────────┬────────┘                 └────────┬────────┘                └─────────────────┘
         │                                   │
         │ localStorage                      │ CORS 代理
         ▼                                   ▼
┌─────────────────┐                 ┌─────────────────┐
│   本地配置存储   │                 │   外部 AI API   │
│  (AES-GCM 加密) │                 │ OpenAI/Azure 等 │
└─────────────────┘                 └─────────────────┘
```

## 项目结构

```
├── office-plugin/           # Office 插件前端 (React + Vite)
├── office-local-bridge/     # 本地桥接服务 (Express)
│   └── desktop-app/         # 桌面配置应用 (Tauri)
├── word-mcp-server/         # Word MCP 服务器
├── excel-mcp-server/        # Excel MCP 服务器
├── powerpoint-mcp-server/   # PowerPoint MCP 服务器
└── shared/                  # 共享代码库
```

## 功能

- **AI 对话** - 支持 OpenAI/Azure/Anthropic/Ollama 等多种 AI 提供商
- **MCP 工具** - 200+ Office.js 工具，覆盖文档编辑、格式化、图表等
- **知识库** - 支持 HTTP/Milvus/Pinecone/Chroma 向量数据库
- **本地优先** - 配置加密存储，无需后端服务器

## 快速开始

### 环境要求

- Node.js >= 22.0.0
- Microsoft Office 2016+
- Windows 10/11 或 macOS

### 安装

```bash
# 克隆项目
git clone https://github.com/walkingzzzy/office-mcp-sever.git
cd office-mcp-sever

# 安装依赖
cd office-local-bridge && npm install
cd ../office-plugin && npm install
cd ../word-mcp-server && npm install
cd ../excel-mcp-server && npm install
cd ../powerpoint-mcp-server && npm install
```

### 启动

```bash
# 1. 启动桥接服务 (端口 3001)
cd office-local-bridge
npm run dev

# 2. 启动插件开发服务器 (端口 3000)
cd office-plugin
npm run dev
```

### 安装 Office 插件

1. 打开 Word/Excel/PowerPoint
2. 插入 → 获取加载项 → 上传我的加载项
3. 选择 `office-plugin/manifest.xml`

## API

| 端点 | 方法 | 说明 |
|------|------|------|
| `/health` | GET | 健康检查 |
| `/api/ai/chat/completions` | POST | AI 对话 (支持流式) |
| `/api/execute-tool` | POST | 执行 MCP 工具 |
| `/api/mcp/servers` | GET | MCP 服务器状态 |
| `/api/config` | GET/POST | 配置管理 |

## 技术栈

| 模块 | 技术 |
|------|------|
| 插件前端 | React 18, TypeScript, Vite, Zustand, TailwindCSS |
| 桥接服务 | Express, Node.js 22, TypeScript |
| 桌面应用 | Tauri 2.0, Rust |
| MCP 服务器 | @modelcontextprotocol/sdk |

## License

MIT
