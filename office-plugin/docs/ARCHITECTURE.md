# Office 插件架构文档

## 概述

武汉问津 AI 助手 Office 插件，支持 Word、Excel、PowerPoint 的 AI 辅助功能。

## 技术栈

- **框架**: React 18 + TypeScript
- **构建工具**: Vite 5
- **UI 组件库**: Fluent UI v9 (主要) + Radix UI (部分)
- **状态管理**: Zustand
- **样式**: Tailwind CSS 4
- **API 客户端**: Axios + React Query

## 目录结构

```
src/
├── components/           # UI 组件
│   ├── atoms/           # 基础原子组件
│   ├── molecules/       # 复合分子组件
│   ├── organisms/       # 复杂有机组件
│   ├── features/        # 功能特性组件
│   └── ui/              # shadcn/ui 风格组件
│
├── hooks/               # React Hooks
│   ├── useChat.ts       # 聊天功能
│   ├── useWordEdit.ts   # Word 编辑
│   └── ...
│
├── services/            # 业务服务层
│   ├── ai/              # AI 服务
│   │   ├── aiService.ts
│   │   ├── conversation/  # 多轮对话
│   │   ├── prompts/      # Prompt 管理
│   │   └── toolMappings/ # 工具映射
│   ├── api/             # API 调用
│   │   ├── client.ts
│   │   └── endpoints/
│   ├── adapters/        # Office 适配器
│   ├── tools/           # Office 工具
│   │   ├── word/
│   │   ├── excel/
│   │   └── powerpoint/
│   ├── knowledge/       # 知识库服务
│   ├── storage/         # 存储服务
│   └── config/          # 配置管理
│
├── store/               # Zustand Store
│   ├── appStore.ts      # 应用状态 (文档上下文+待执行操作)
│   ├── configStore.ts   # 远程配置
│   ├── localConfigStore.ts  # 本地配置
│   ├── themeStore.ts    # 主题
│   ├── conversationStore.ts  # 对话列表
│   └── multiTurnStore.ts     # 多轮对话会话
│
├── types/               # TypeScript 类型
├── utils/               # 工具函数
├── lib/                 # 第三方库封装
├── shared/              # 共享模块
│   └── errors/          # 错误处理
│
└── taskpane/            # 入口点
    ├── index.html
    ├── index.tsx
    └── index.css
```

## 核心模块

### 1. AI 服务层 (`services/ai/`)

负责 AI 对话、工具调用、文档分析等核心功能。

- **aiService**: 主 AI 服务入口
- **FunctionCallHandler**: 处理 AI 函数调用
- **McpToolExecutor**: MCP 工具执行
- **OrchestrationEngine**: 编排引擎
- **conversation/**: 多轮对话管理

### 2. Office 适配器 (`services/adapters/`)

统一的 Office 文档操作接口。

- **WordAdapter**: Word 文档操作
- **ExcelAdapter**: Excel 表格操作
- **PowerPointAdapter**: PPT 幻灯片操作

### 3. 工具系统 (`services/tools/`)

Office 操作工具的实现。

- **word/**: 120+ Word 工具
- **excel/**: 80+ Excel 工具
- **powerpoint/**: 50+ PowerPoint 工具

### 4. 状态管理 (`store/`)

使用 Zustand 管理应用状态。

| Store | 职责 |
|-------|------|
| `appStore` | 文档上下文、待执行操作队列 |
| `configStore` | 远程配置同步 |
| `localConfigStore` | 本地 AI 配置 |
| `themeStore` | 主题切换 |
| `conversationStore` | 对话列表管理 |
| `multiTurnStore` | 多轮对话会话状态 |

### 5. 组件架构

采用原子设计模式：

- **atoms**: Button, Input, Badge 等基础组件
- **molecules**: ChatBubble, ToolCard 等复合组件
- **organisms**: ChatInterface, Sidebar 等复杂组件
- **features**: 特定功能模块

## 数据流

```
用户输入
    ↓
ChatInterface (组件)
    ↓
useChat Hook
    ↓
AI Service → API Client → 后端
    ↓
FunctionCallHandler
    ↓
OfficeToolExecutor
    ↓
WordAdapter/ExcelAdapter/PowerPointAdapter
    ↓
Office.js API
```

## 构建产物

```
dist/
├── taskpane/index.html  # 主页面
├── taskpane.js          # 主 bundle
├── taskpane.css         # 样式
└── libs/office.js       # Office.js
```

## 配置文件

- `manifest.xml`: Office 插件清单
- `vite.config.ts`: 构建配置
- `tailwind.config.ts`: 样式配置
- `tsconfig.json`: TypeScript 配置

---

*最后更新: 2025-12-30*

