# Office 插件架构文档

## 概述

武汉问津 Office 插件采用 **Fluent UI React v9** 框架，遵循 **Atomic Design** 架构模式，与 Microsoft Office Add-ins 官方标准完全对齐。

## 技术栈

### 核心框架
- **UI 框架**: Fluent UI React v9 ([@fluentui/react-components](https://react.fluentui.dev))
- **React**: 18.2.0
- **TypeScript**: 5.3.0 (strict mode)
- **构建工具**: Vite 5.0
- **Office.js**: 1.0

### 状态管理
- **服务器状态**: @tanstack/react-query 5.x
- **客户端状态**: Zustand 4.x

### 工具库
- **样式系统**: Fluent UI makeStyles + tokens
- **图标**: @fluentui/react-icons
- **日期处理**: date-fns
- **类名组合**: clsx
- **表单组件**: react-textarea-autosize

### 测试
- **测试框架**: Vitest 3.x
- **测试工具**: @testing-library/react
- **测试环境**: jsdom

## 架构模式

### Atomic Design 层次结构

```
components/
├── atoms/           # 原子组件（最小UI单元）
│   ├── Button/
│   ├── Spinner/
│   ├── Text/
│   ├── Badge/
│   ├── Tooltip/
│   ├── Divider/
│   ├── Card/
│   └── Select/
│
├── molecules/       # 分子组件（原子组合）
│   ├── MessageInput/
│   └── ModelSelector/
│
├── organisms/       # 有机体组件（复杂功能区块）
│   ├── ChatHeader/
│   ├── MessageList/
│   ├── InputArea/
│   └── ConnectionBanner/
│
└── features/        # 功能组件（完整业务逻辑）
    └── chat/
        └── ChatInterface/
```

### 目录结构

```
packages/office-plugin/
├── src/
│   ├── app/                     # 应用层
│   │   └── providers/           # 全局Providers
│   │       ├── FluentProvider.tsx
│   │       ├── QueryProvider.tsx
│   │       └── AppProviders.tsx
│   │
│   ├── components/              # 组件层（Atomic Design）
│   │   ├── atoms/               # 8个原子组件
│   │   ├── molecules/           # 2个分子组件
│   │   ├── organisms/           # 4个有机体组件
│   │   └── features/            # 功能组件
│   │
│   ├── shared/                  # 共享资源
│   │   ├── hooks/               # 通用Hooks
│   │   ├── utils/               # 工具函数
│   │   ├── types/               # 类型定义
│   │   └── constants/           # 常量
│   │
│   ├── services/                # 服务层
│   │   ├── api/
│   │   │   ├── client.ts        # HTTP客户端
│   │   │   └── endpoints/       # API端点
│   │   ├── ai.ts                # AI服务
│   │   ├── config.ts            # 配置服务
│   │   └── conversation.ts      # 对话服务
│   │
│   ├── store/                   # 状态管理
│   │   └── configStore.ts       # Zustand store
│   │
│   ├── styles/                  # 全局样式
│   │   └── theme/
│   │       ├── tokens.ts        # Fluent UI Tokens
│   │       └── index.ts
│   │
│   ├── tests/                   # 测试文件
│   │   └── setup.ts
│   │
│   └── taskpane/                # Taskpane入口
│       ├── index.tsx
│       └── index.html
│
├── vitest.config.ts             # 测试配置
├── vite.config.ts               # 构建配置
├── tsconfig.json                # TS配置
├── manifest.xml                 # Office插件清单
└── package.json
```

## 设计系统

### Fluent UI Tokens

品牌色映射（武汉问津）：

```typescript
const brandColors: BrandVariants = {
  10: '#F5FDF9',    // 最浅
  20: '#E0F9EC',
  30: '#C0F5DC',
  40: '#9EF1CA',
  50: '#79ECB8',
  60: '#52E5A5',
  70: '#00b96b',    // 主品牌色 ✓
  80: '#009a5b',
  90: '#00804d',
  100: '#006a40',
  // ...
  160: '#000905'    // 最深
}
```

### 样式规范

所有组件使用 `makeStyles` API：

```typescript
import { makeStyles, tokens } from '@fluentui/react-components'

export const useComponentStyles = makeStyles({
  root: {
    display: 'flex',
    gap: tokens.spacingHorizontalM,
    padding: tokens.spacingVerticalS,
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorNeutralBackground1,
  },
})
```

### 响应式断点

```typescript
export const BREAKPOINTS = {
  xs: 320,   // Excel/Word/PowerPoint 最小宽度
  sm: 350,   // Office Web 典型宽度
  md: 400,   // 用户调整后常见宽度
  lg: 600,   // 舒适宽度
}
```

## 数据流

### API通信流程

```
ChatInterface (组件)
     ↓
useConfig() (Hook)
     ↓
configApi (Service)
     ↓
apiClient (HTTP Client)
     ↓
武汉问津主应用 API Server (http://localhost:3001)
```

### 状态管理

1. **服务器状态**: 通过 React Query 管理
   - 自动缓存
   - 自动重新验证
   - 后台更新

2. **客户端状态**: 通过 Zustand 管理
   - 轻量级
   - 无需Provider
   - 简单的API

### 流式响应处理

```typescript
await aiService.streamChatCompletion(
  request,
  signal,
  (chunk) => {
    // 实时更新UI
    fullResponse += chunk.content
    setMessages(prev => prev.map(m =>
      m.id === aiMessageId
        ? { ...m, content: fullResponse }
        : m
    ))
  }
)
```

## 组件通信

### Props Down, Events Up

```typescript
<ChatInterface
  selectedModelId={modelId}           // Props down
  onModelChange={(id) => { ... }}     // Events up
/>
```

### 组合优于继承

```typescript
// ✓ 好的做法
<InputArea>
  <MessageInput />
  <ToolbarButtons />
</InputArea>

// ✗ 避免继承
class CustomInputArea extends InputArea { ... }
```

## 性能优化

### 代码分割

```typescript
const ChatInterface = lazy(() =>
  import('@/components/features/chat/ChatInterface')
)
```

### 虚拟滚动

MessageList 组件在消息数 > 50 时自动启用虚拟滚动：

```typescript
const virtualizer = useVirtualizer({
  count: messages.length,
  getScrollElement: () => containerRef.current,
  estimateSize: () => 150,
  enabled: messages.length > 50,
})
```

### 请求取消

所有 API 请求支持 AbortController：

```typescript
const abortController = new AbortController()

await aiService.streamChatCompletion(
  request,
  abortController.signal,  // 支持取消
  onChunk
)
```

## 测试策略

### 测试金字塔

```
       /\
      /  \    E2E Tests (计划)
     /────\
    /      \  Integration Tests (计划)
   /────────\
  /          \ Unit Tests (已实现)
 /────────────\
```

### 测试覆盖

- **Atoms**: Button, Spinner, Text (100%)
- **Molecules**: MessageInput (100%)
- **Organisms**: 待实现
- **Features**: 待实现

### 测试命令

```bash
yarn test              # 运行所有测试
yarn test:ui           # 测试 UI 界面
yarn test:coverage     # 生成覆盖率报告
```

## 可访问性

### WCAG 2.1 AA 合规

所有 Fluent UI 组件默认支持：

- ✓ 键盘导航
- ✓ 屏幕阅读器
- ✓ 颜色对比度 ≥ 4.5:1
- ✓ ARIA 标签

### 键盘快捷键

| 快捷键 | 功能 |
|-------|------|
| Enter | 发送消息 |
| Shift+Enter | 换行 |
| Ctrl/Cmd+N | 新建对话 |
| Esc | 关闭对话框 |

## Office.js 集成

### 初始化流程

```typescript
Office.onReady((info) => {
  console.log('Office Host:', info.host)     // Word/Excel/PowerPoint
  console.log('Platform:', info.platform)    // PC/Mac/Web

  // 渲染React应用
  root.render(<App officeInfo={info} />)
})
```

### 支持的应用

- ✓ Microsoft Word
- ✓ Microsoft Excel
- ✓ Microsoft PowerPoint

### API版本

Office.js 1.0 - 兼容所有现代 Office 版本

## 部署

### 开发环境

```bash
yarn dev     # 启动开发服务器 (https://localhost:3000)
```

### 生产构建

```bash
yarn build   # 生成生产构建产物
```

### 安装证书

```bash
yarn cert:install   # 安装本地HTTPS证书
yarn cert:verify    # 验证证书
```

## 最佳实践

### 组件开发

1. **职责单一**: 每个组件只做一件事
2. **可组合**: 通过组合构建复杂组件
3. **类型安全**: 使用 TypeScript 接口
4. **样式隔离**: makeStyles 自动生成唯一类名

### 错误处理

```typescript
try {
  await apiCall()
} catch (error: any) {
  if (error.name === 'AbortError') {
    console.log('请求已取消')
  } else {
    console.error('API失败:', error)
    // 显示错误提示
  }
}
```

### 性能考虑

- 使用 React.memo 避免不必要的重渲染
- 使用 useCallback 缓存函数
- 使用 useMemo 缓存计算结果
- 虚拟滚动处理大列表

## 维护指南

### 添加新组件

1. 确定组件层级（Atom/Molecule/Organism/Feature）
2. 创建组件目录：`ComponentName/`
3. 创建文件：
   - `ComponentName.tsx` (组件实现)
   - `ComponentName.styles.ts` (样式)
   - `ComponentName.test.tsx` (测试)
   - `index.ts` (导出)
4. 更新父级 index.ts

### 更新依赖

```bash
yarn upgrade-interactive    # 交互式升级
```

### 调试

- Chrome DevTools: F12
- React DevTools: 安装浏览器扩展
- Vite HMR: 代码变更自动刷新

## 参考资料

- [Fluent UI React](https://react.fluentui.dev)
- [Office Add-ins 文档](https://learn.microsoft.com/en-us/office/dev/add-ins/)
- [Atomic Design](https://bradfrost.com/blog/post/atomic-web-design/)
- [React Query](https://tanstack.com/query)
- [Vitest](https://vitest.dev)
