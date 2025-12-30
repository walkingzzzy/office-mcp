# Office Local Bridge 桌面应用

基于 Tauri 2.0 + React + TypeScript 构建的桌面配置管理应用。

## 技术栈

- **前端**: React 18 + TypeScript + TailwindCSS + Vite
- **后端**: Tauri 2.0 (Rust)
- **UI 组件**: 自定义组件库

## 开发环境要求

- Node.js >= 18.0.0
- Rust (通过 rustup 安装)
- Windows: Visual Studio Build Tools
- macOS: Xcode Command Line Tools

## 安装依赖

```bash
# 安装前端依赖
npm install
```

## 开发模式

```bash
# 启动开发服务器（仅前端）
npm run dev

# 启动 Tauri 开发模式（包含 Rust 后端）
npm run tauri:dev
```

## 构建生产版本

```bash
# 构建应用
npm run tauri:build
```

构建产物位于 `src-tauri/target/release/bundle/` 目录。

## 项目结构

```
desktop-app/
├── src/                    # 前端源码
│   ├── components/         # 通用组件
│   ├── pages/              # 页面组件
│   ├── services/           # API 服务
│   ├── types/              # 类型定义
│   ├── hooks/              # 自定义 Hooks
│   ├── App.tsx             # 应用入口
│   └── main.tsx            # 渲染入口
├── src-tauri/              # Rust 后端
│   ├── src/
│   │   ├── main.rs         # 入口
│   │   ├── lib.rs          # 库入口
│   │   ├── commands.rs     # IPC 命令
│   │   └── config.rs       # 配置管理
│   ├── Cargo.toml          # Rust 依赖
│   └── tauri.conf.json     # Tauri 配置
├── package.json
└── README.md
```

## 功能模块

1. **仪表盘** - 服务状态概览
2. **AI 服务配置** - 管理多个 AI 提供商
3. **模型管理** - 配置模型参数
4. **MCP 服务器** - 管理 MCP 进程
5. **系统设置** - 应用配置
