# Office AI Add-in

Office AI 助手前端项目,支持 Word、Excel、PowerPoint 三大 Office 应用。

## 项目结构

```
office-addin/
├── public/                 # 静态资源
│   └── taskpane.html      # 任务窗格HTML模板
├── src/                    # 源代码
│   ├── components/         # React组件
│   │   ├── TaskPane.tsx   # 任务窗格布局组件
│   │   ├── Button.tsx     # 按钮组件
│   │   └── index.ts       # 组件导出
│   ├── services/           # 服务层
│   │   ├── WordAPI.ts     # Word API封装
│   │   ├── ExcelAPI.ts    # Excel API封装
│   │   ├── PowerPointAPI.ts # PowerPoint API封装
│   │   ├── DocumentAdapter.ts # 文档适配器工厂
│   │   ├── HttpClient.ts  # HTTP客户端
│   │   └── index.ts       # 服务导出
│   ├── types/              # TypeScript类型定义
│   │   └── index.ts       # 类型定义
│   ├── styles/             # 样式文件
│   │   ├── global.css     # 全局样式
│   │   └── App.css        # 应用样式
│   ├── index.tsx           # 入口文件
│   └── App.tsx             # 根组件
├── manifest.xml            # Office Add-in 配置文件
├── package.json            # 项目配置
├── tsconfig.json           # TypeScript配置
├── webpack.config.js       # Webpack配置
└── .eslintrc.json         # ESLint配置
```

## 技术栈

- **React 18**: UI框架
- **TypeScript 5**: 类型安全
- **Office.js**: Office Add-in API
- **Webpack 5**: 打包工具
- **Axios**: HTTP客户端
- **ESLint**: 代码规范

## 安装依赖

```bash
cd office-addin
npm install
```

## 开发

### 启动开发服务器

```bash
npm run dev
```

或

```bash
npm start
```

开发服务器将在 `https://localhost:3000` 启动。

### 构建生产版本

```bash
npm run build
```

构建产出在 `dist/` 目录。

### 代码检查

```bash
npm run lint
```

### 类型检查

```bash
npm run type-check
```

## 加载插件

### 方法1: 手动加载 (推荐用于开发)

1. 打开 Word/Excel/PowerPoint
2. 进入 **插入** > **我的加载项**
3. 选择 **共享文件夹**
4. 浏览到项目目录,选择 `manifest.xml`
5. 点击 **添加**

### 方法2: 使用 Office Add-in 调试工具

```bash
# 安装Office Add-in调试工具
npm install -g office-addin-debugging

# 启动调试
npx office-addin-debugging start manifest.xml
```

## 核心API使用示例

### 使用 DocumentAdapter (推荐)

```typescript
import { DocumentAdapter } from './services';

// 获取当前Office应用的适配器
const adapter = DocumentAdapter.getInstance();

// 获取文档内容
const content = await adapter.getContent();

// 插入内容
await adapter.insertContent('Hello World');

// 获取选中内容
const selection = await adapter.getSelection();
```

### 直接使用特定API

```typescript
import { WordAPI, ExcelAPI, PowerPointAPI } from './services';

// Word操作
await WordAPI.insertParagraph('新段落', 'End');
await WordAPI.createHighlight(0, 10, '#FFFF00');

// Excel操作
await ExcelAPI.setRangeValues('A1:B2', [[1, 2], [3, 4]]);
await ExcelAPI.createHighlight('A1:A10', '#00FF00');

// PowerPoint操作
await PowerPointAPI.addSlide();
await PowerPointAPI.addTitle(0, '标题文本');
```

### 使用 HTTP Client

```typescript
import { HttpClient } from './services';

// 健康检查
const health = await HttpClient.healthCheck();

// 调用MCP工具
const result = await HttpClient.callTool('get_server_info', {});

// 上传文件
const adapter = DocumentAdapter.getInstance();
const file = await adapter.getDocumentFile();
const uploadResult = await HttpClient.uploadFile(file, 'document.docx');

// POST请求
const response = await HttpClient.post('/api/endpoint', {
  key: 'value'
});
```

## 配置说明

### manifest.xml

Office Add-in 的核心配置文件,定义了:

- 插件ID和版本
- 支持的Office应用 (Word, Excel, PowerPoint)
- 权限要求
- 功能区按钮配置
- 资源URL

### webpack.config.js

Webpack配置,包含:

- TypeScript编译 (ts-loader)
- CSS加载
- 开发服务器 (HTTPS, 端口3000)
- 生产构建优化

### tsconfig.json

TypeScript配置,主要特性:

- React JSX支持
- 路径别名 `@/*` 映射到 `src/*`
- 严格类型检查
- ES2020目标

## 兼容性

- Office 2016 及以上版本
- Office 365
- Office Online (Web)
- Windows / macOS

## 注意事项

1. **HTTPS要求**: Office Add-in 必须通过HTTPS加载,开发服务器已配置自签名证书
2. **跨域配置**: 开发服务器已配置CORS头部
3. **Office.js加载**: 确保在使用Office API前等待 `Office.onReady()`
4. **错误处理**: 所有API调用都应该包含错误处理

## 下一步

1. 实现AI对话面板 (ChatPanel组件)
2. 集成WebSocket实时通信
3. 实现版本管理功能
4. 添加单元测试

## 许可证

MIT
