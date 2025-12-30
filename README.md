# Office AI 助手

> 基于 MCP 协议的 Office AI 插件系统，支持 Word、Excel 和 PowerPoint

## 项目概览

本项目是一个轻量化的 Office AI 助手系统，通过本地桥接服务实现 Office 插件与 AI 服务的无缝集成。

### 架构概览

```
┌─────────────────┐      HTTP       ┌─────────────────┐     stdio      ┌─────────────────┐
│  Office Add-in  │◄───────────────►│ office-local-   │◄──────────────►│   MCP Servers   │
│    (Browser)    │  localhost:3001 │     bridge      │                │ word/excel/ppt  │
└────────┬────────┘                 └────────┬────────┘                └─────────────────┘
         │                                   │
         │ localStorage (加密)               │ CORS 代理
         ▼                                   ▼
┌─────────────────┐                 ┌─────────────────┐
│   本地配置存储   │                 │   外部 AI API   │
│  SecureStorage  │                 │ OpenAI/Azure 等 │
└─────────────────┘                 └─────────────────┘
```

## 项目结构

```
office工具/
├── office-plugin/           # Office 插件前端 (React + TypeScript + Vite)
├── office-local-bridge/     # 本地桥接服务 (Express + Node.js)
├── word-mcp-server/         # Word MCP 服务器 (40+ 个工具)
├── excel-mcp-server/        # Excel MCP 服务器 (159 个工具)
├── powerpoint-mcp-server/   # PowerPoint MCP 服务器 (87 个工具)
├── shared/                  # 共享代码和类型定义
└── README.md               # 本文档
```

## 功能特性

### 已完成

- **office-local-bridge 服务** - HTTP 服务 + MCP 进程管理
- **AI API 代理** - 支持 OpenAI/Azure/Anthropic/Custom
- **本地配置管理** - AES-GCM 256位加密存储
- **知识库集成** - HTTP/Milvus/Pinecone/Chroma
- **Office 工具执行器** - 210 个 Office.js 工具
- **首次使用引导** - SetupWizard 配置向导
- **设置面板** - AI 提供商、知识库、MCP 服务器配置

### 开发中

- E2E 测试
- 用户引导流程优化

## 快速开始

### 环境要求

- Node.js >= 22.0.0
- Microsoft Office 2016/2019/2021/365
- Windows 10/11 或 macOS

### 1. 安装依赖

```bash
# 安装所有子项目依赖
cd office-plugin && npm install
cd ../office-local-bridge && npm install
cd ../word-mcp-server && npm install
cd ../excel-mcp-server && npm install
cd ../powerpoint-mcp-server && npm install
```

### 2. 启动服务

```bash
# 启动桥接服务（端口 3001）
cd office-local-bridge
npm run dev

# 启动 Office 插件开发服务器（端口 3000）
cd office-plugin
npm run dev
```

### 3. 安装 Office 插件

参考 [office-plugin/README.md](office-plugin/README.md) 中的安装说明。

## 技术栈

### Office 插件前端

| 技术 | 版本 | 用途 |
|------|------|------|
| React | ^18.2.0 | UI 框架 |
| TypeScript | ^5.3.0 | 类型安全 |
| Vite | ^5.0.0 | 构建工具 |
| Zustand | ^4.4.0 | 状态管理 |
| TailwindCSS | ^4.1.17 | 样式工具 |
| Office.js | ^1.1.110 | Office API |

### 桥接服务

| 技术 | 版本 | 用途 |
|------|------|------|
| Express | ^4.21.0 | HTTP 服务器 |
| Node.js | >=22.0.0 | 运行时 |
| TypeScript | ^5.8.2 | 类型安全 |
| Vitest | ^3.2.4 | 测试框架 |

### MCP 服务器

| 技术 | 版本 | 用途 |
|------|------|------|
| @modelcontextprotocol/sdk | ^1.17.5 | MCP 协议 SDK |
| tsx | ^4.20.3 | TS 执行器 |

## API 端点

| 端点 | 方法 | 功能 |
|------|------|------|
| `/health` | GET | 健康检查 |
| `/api/execute-tool` | POST | MCP 推送命令 |
| `/api/pending-commands` | GET | 轮询待执行命令 |
| `/api/command-result` | POST | 返回执行结果 |
| `/api/mcp/servers` | GET | 获取 MCP 服务器状态 |
| `/api/mcp/servers/:id/restart` | POST | 重启 MCP 服务器 |
| `/api/ai/chat/completions` | POST | AI 对话（支持流式）|

## 配置说明

### AI 提供商配置

首次使用时，SetupWizard 会引导您配置：

1. **桥接服务地址** - 默认 `http://localhost:3001`
2. **AI 提供商** - OpenAI/Azure/Anthropic/Custom
3. **API Key** - 加密存储在本地

### 端口配置

| 服务 | 端口 | 说明 |
|------|------|------|
| Office 插件 (Vite) | 3000 | 开发服务器 |
| office-local-bridge | 3001 | 桥接服务 |

## 文档

- [轻量化架构设计方案](LIGHTWEIGHT_ARCHITECTURE_DESIGN.md)
- [开发阶段计划](DEVELOPMENT_PHASES.md)
- [Office 插件详细文档](office-plugin/README.md)

## 许可证

MIT License
