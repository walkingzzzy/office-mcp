# 武汉问津 Office 插件

> 武汉问津 AI 助手的 Office 插件，支持 Word、Excel 和 PowerPoint

## 📊 开发进度

| 阶段 | 状态 | 完成度 | 说明 |
|------|------|--------|------|
| **第一期** | ✅ 已完成 | 100% | 武汉问津主应用扩展 |
| **第二期** | ✅ 已完成 | 100% | 一键安装功能（Windows） |
| **第三期** | ✅ 已完成 | 100% | Office 插件基础 UI 完善 |
| **第四期** | ✅ 已完成 | 100% | AI 对话功能集成 |
| **第五期** | ✅ 已完成 | 100% | Word 文档编辑功能 ✨ |
| **第六期** | ✅ 已完成 | 100% | Excel 和 PowerPoint 支持 ✨ |
| **第七期** | ⏳ 未开始 | 0% | 高级功能集成 |
| **第八期** | ⏳ 未开始 | 0% | 测试、优化和发布 |

**总体进度**: 约 85% 完成 ✨

详细开发计划请参考：[OFFICE_PLUGIN_DEVELOPMENT_PLAN.md](../../OFFICE_PLUGIN_DEVELOPMENT_PLAN.md)

## 📋 项目概述

这是武汉问津 AI 助手的 Office 插件项目，作为 Yarn Workspace 的一个 package 存在于 `packages/office-plugin/` 目录下。

### 技术栈

- **React 18** - UI 框架
- **TypeScript 5** - 类型安全
- **Vite 5** - 构建工具和开发服务器
- **Fluent UI React v9** - UI 组件库（Microsoft 官方推荐）
- **Office.js** - Office Add-in API
- **@fluentui/react-icons** - 图标库（Microsoft 官方）
- **Zustand** - 状态管理

### 项目结构

```
office-plugin/
├── src/
│   ├── app/                   # 应用主入口
│   ├── assets/                # 静态资源
│   ├── components/            # React 组件
│   ├── config/                # 配置文件
│   ├── constants/             # 常量定义
│   ├── hooks/                 # React Hooks
│   ├── lib/                   # 第三方库封装
│   ├── routes/                # 路由配置
│   ├── services/              # 业务服务层
│   ├── shared/                # 共享模块
│   ├── store/                 # Zustand 状态管理
│   ├── styles/                # 全局样式
│   ├── taskpane/              # 任务窗格入口
│   │   ├── index.html         # HTML 入口
│   │   └── index.tsx          # React 入口
│   ├── types/                 # TypeScript 类型定义
│   ├── utils/                 # 工具函数
│   └── commands.html          # Ribbon 命令
├── public/
│   └── assets/                # 图标资源
├── manifest.xml               # Office 插件清单
├── package.json               # 项目配置
├── tsconfig.json              # TypeScript 配置
├── vite.config.ts             # Vite 配置
└── README.md                  # 本文档
```

## 🚀 快速开始

### 前置要求

- Node.js >= 22.0.0
- Yarn (项目使用 Yarn Workspaces)
- Microsoft Office 2016/2019/2021/365
- Windows 10/11 或 macOS

### 1. 安装依赖

在**项目根目录**运行：

```bash
yarn install
```

这会安装所有 workspace 的依赖，包括 office-plugin。

### 2. 生成 HTTPS 证书

Office 插件**必须**使用 HTTPS 才能运行。首次开发需要生成自签名证书：

**在项目根目录运行**：

```bash
yarn setup:office
```

或者在 `packages/office-plugin` 目录下运行：

```bash
cd packages/office-plugin
yarn cert:install
```

这会在 `~/.office-addin-dev-certs/` 目录下生成证书文件。

**验证证书**：

```bash
yarn cert:verify
```

### 3. 启动开发服务器

#### 方式 1: 同时启动主应用和 Office 插件（推荐）⭐

**在项目根目录运行**：

```bash
yarn dev:all
```

这会同时启动：
- 武汉问津主应用（Electron）
- Office 插件开发服务器（Vite，端口 3000）

#### 方式 2: 仅启动 Office 插件

**在项目根目录运行**：

```bash
yarn dev:office
```

或者在 `packages/office-plugin` 目录下运行：

```bash
cd packages/office-plugin
yarn dev
```

开发服务器会运行在 `https://localhost:3000`

### 4. 安装插件到 Office

#### 方法 1: 使用武汉问津主应用安装（推荐）⭐

1. 启动武汉问津主应用
2. 进入 **设置 > Office 插件**
3. 点击 **一键安装** 按钮
4. 重启 Word/Excel/PowerPoint

#### 方法 2: 手动注册（开发调试）

**Windows:**

1. 打开注册表编辑器 (`Win + R` → `regedit`)
2. 导航到: `HKEY_CURRENT_USER\Software\Microsoft\Office\16.0\WEF\Developer`
3. 创建新的字符串值:
   - **名称**: `WuhanWenjinPlugin`
   - **数据**: `E:\cherry\wuhanwenjin\packages\office-plugin\manifest.xml` (你的完整路径)
4. 重启 Office 应用

**macOS:**

```bash
# 复制 manifest.xml 到 Office 插件目录
cp manifest.xml ~/Library/Containers/com.microsoft.Word/Data/Documents/wef/
cp manifest.xml ~/Library/Containers/com.microsoft.Excel/Data/Documents/wef/
cp manifest.xml ~/Library/Containers/com.microsoft.Powerpoint/Data/Documents/wef/
```

### 5. 在 Office 中打开插件

1. 打开 Microsoft Word/Excel/PowerPoint
2. 在 **主页** 选项卡中，找到 **武汉问津** 组
3. 点击 **AI 助手** 按钮
4. 任务窗格会在右侧打开

## 🧪 Hello World 功能测试

第一期的 Hello World 示例提供了以下测试功能：

### Word 功能

- ✅ **插入问候文本** - 在文档末尾插入武汉问津的介绍文本
- ✅ **读取选中文本** - 读取当前选中的文本内容

### Excel 功能

- ✅ **插入示例数据** - 在活动工作表插入示例数据表格

### PowerPoint 功能

- ✅ **插入文本框** - 在当前幻灯片插入文本框

### API 连接测试

- ✅ **连接武汉问津 API** - 测试与主应用的 `/v1/office/config` API 连接

## 🛠️ 开发命令

### 在项目根目录运行

```bash
# 同时启动主应用和 Office 插件（推荐）
yarn dev:all

# 仅启动 Office 插件开发服务器
yarn dev:office

# 安装 HTTPS 证书（首次开发必须）
yarn setup:office
```

### 在 packages/office-plugin 目录运行

```bash
# 启动开发服务器 (HTTPS, 端口 3000)
yarn dev

# 构建生产版本
yarn build

# 预览构建结果
yarn preview

# 验证 manifest.xml 格式
yarn validate

# 安装 HTTPS 证书
yarn cert:install

# 验证 HTTPS 证书
yarn cert:verify

# 启动 Office 调试（自动打开 Word 并加载插件）
yarn start

# 停止 Office 调试
yarn stop
```

## 🔧 配置说明

### manifest.xml

Office 插件的核心配置文件，定义了：

- **基本信息**: 插件名称、版本、描述、图标
- **支持的应用**: Word、Excel、PowerPoint
- **任务窗格 URL**: `https://localhost:3000/taskpane/index.html`
- **Ribbon 按钮**: 在主页选项卡添加"武汉问津"组
- **权限**: `ReadWriteDocument` (读写文档权限)

### vite.config.ts

Vite 构建配置，包括：

- **HTTPS 配置**: 自动读取 `~/.office-addin-dev-certs/` 证书
- **开发服务器**: 端口 3000，支持 CORS
- **构建输出**: `dist/` 目录
- **路径别名**: `@/` → `src/`, `@shared/` → `../shared/`

### 与武汉问津主应用的集成

Office 插件通过以下方式与主应用集成：

#### 1. **API 通信**
- 通过 `http://localhost:3001/v1/office/*` API 与主应用通信
- 支持流式响应（Server-Sent Events）
- 自动重连和错误处理

#### 2. **AI 功能**
- ✅ 使用主应用的 AI 模型进行对话
- ✅ 支持 Function Calling 机制
- ✅ 流式响应支持
- ✅ 多轮对话上下文管理

#### 3. **知识库**
- ✅ 查询和搜索主应用的知识库
- ✅ AI 可以基于知识库内容回答问题
- ❌ 不能创建或管理知识库（在主应用中完成）

#### 4. **MCP 工具**
- ✅ 使用主应用已激活的 MCP 工具
- ✅ 扩展 AI 能力（文件系统、网络搜索、代码执行等）
- ❌ 不能激活、停用或配置 MCP 服务器（在主应用中完成）

#### 5. **配置同步**
- ✅ 从主应用获取 API keys、模型配置、助手配置
- ✅ 自动同步，无需手动配置
- ❌ 不能修改配置（在主应用中完成）

#### 6. **安装管理**
- 主应用的 `OfficePluginService` 管理插件安装/卸载
- 支持 Windows 和 macOS
- 自动检测 Office 版本

#### 7. **共享依赖**
- 通过 Yarn Workspace 共享 React、TypeScript、Fluent UI 等依赖
- 统一的构建工具链（Vite）

**重要提示**：
- ⚠️ Office 插件只使用主应用的功能，不管理这些功能
- ⚠️ 所有配置和管理（MCP 服务器、知识库、AI 配置）都在主应用中完成
- ⚠️ Office 插件作为纯客户端应用，专注于 Office.js 操作

**详细集成指南**：参见 [主应用集成指南](docs/04-developer-guides/MAIN_APP_INTEGRATION.md)

## ⚠️ 功能限制说明

### 修订跟踪功能不可用

**重要提示**: 由于 Microsoft Office JavaScript API 的技术限制，本插件**无法支持修订跟踪(Track Changes)功能**。

**技术原因**:
- ✅ Office.js API 不提供 Track Changes 操作接口
- ✅ WordApi 1.6+ 虽然有 `Revision` 对象，但**仅为只读**，无法接受/拒绝修订
- ✅ 无法通过代码启用/禁用修订跟踪模式
- ✅ 这是 Office.js 平台级别的限制，所有基于 Office.js 的插件都受此限制

**验证来源**:
- Microsoft Learn 官方文档确认（2025年）
- Stack Overflow 社区确认
- Office Add-in 开发者社区讨论

**推荐替代方案**:
- ✅ 使用**批注功能**（需要 Office 2019+）
- ✅ 批注功能可以覆盖约 80% 的修订跟踪使用场景
- ✅ 支持添加、回复、解决批注
- ✅ 支持按作者筛选和批量管理批注

**适用场景**:
- ✅ 作业批改：在错误处添加批注说明
- ✅ 文档审阅：添加修改建议批注
- ✅ 协作编辑：标记需要讨论的内容

**不支持的场景**:
- ❌ 无法显示修订标记（删除线、下划线）
- ❌ 无法接受/拒绝修订
- ❌ 无法追踪谁在何时修改了哪些内容（批注可以部分替代）

**版本要求**:
- 批注功能需要 **Office 2019 或 Microsoft 365**
- Office 2016 用户无法使用批注功能

我们会持续关注 Microsoft Office.js API 更新，一旦支持修订跟踪功能，将立即添加到插件中。

### 图片处理限制

**浮动图片不支持**: Office.js 只支持内嵌图片（Inline Picture）的操作，浮动图片（Floating Picture）功能有限。

**影响**:
- ✅ 可以调整内嵌图片的大小、对齐方式
- ⚠️ 图片改为"四周型"等浮动布局后，无法通过标准 API 操作
- ⚠️ 高级文字环绕需要使用 OOXML（技术复杂度高）

**推荐做法**:
- 优先使用内嵌图片
- 需要浮动布局时，先完成图片调整，再手动设置文字环绕

### Office 版本兼容性

| 功能 | Office 2016 | Office 2019 | Microsoft 365 |
|------|-------------|-------------|---------------|
| 基础格式化 | ✅ 支持 | ✅ 支持 | ✅ 支持 |
| 查找替换 | ✅ 支持 | ✅ 支持 | ✅ 支持 |
| 图片处理 | ✅ 支持 | ✅ 支持 | ✅ 支持 |
| **批注功能** | ❌ 不支持 | ✅ 支持 | ✅ 支持 |
| **目录生成** | ⚠️ 降级方案 | ✅ 支持 | ✅ 支持 |
| **修订跟踪** | ❌ 不支持 | ❌ 不支持 | ❌ 不支持 |

## 🐛 常见问题

### 1. 插件无法加载

**症状**: Word 中看不到"武汉问津"按钮

**解决方案**:
- ✅ 检查 manifest.xml 路径是否正确
- ✅ 确认开发服务器正在运行 (`yarn dev`)
- ✅ 重启 Office 应用
- ✅ 检查 Office 版本（需要 Office 2016 或更高版本）
- ✅ 查看 Office 错误日志

**Windows 日志位置**:
```
%LOCALAPPDATA%\Microsoft\Office\16.0\Wef\
```

### 2. HTTPS 证书错误

**症状**: 浏览器或 Office 提示证书不受信任

**解决方案**:

```bash
# 重新安装证书
yarn cert:install --force

# 验证证书
yarn cert:verify
```

### 3. Office.js 未定义

**症状**: 控制台报错 `Office is not defined`

**解决方案**:
- ✅ 确保 `index.html` 中引入了 Office.js
- ✅ 使用 `Office.onReady()` 等待初始化完成
- ✅ 检查网络连接（Office.js 从 CDN 加载）

### 4. 端口被占用

**症状**: `Error: listen EADDRINUSE: address already in use :::3000`

**解决方案**:
- 修改 `vite.config.ts` 中的 `server.port`
- 同时更新 `manifest.xml` 中的所有 URL

### 5. 无法连接武汉问津 API

**症状**: 显示"未连接"状态

**解决方案**:
- ✅ 确保武汉问津主应用正在运行
- ✅ 检查主应用的 API Server 端口（默认 3001）
- ✅ 检查防火墙设置

## 📚 文档导航

### 📖 快速开始
- [快速开始指南](docs/01-getting-started/) - 项目概述、安装配置、快速上手

### 🏗️ 架构设计
- [架构设计文档](docs/02-architecture/) - 系统架构、技术方案、设计原则

### 👥 用户指南
- [用户指南](docs/03-user-guides/) - 功能使用指南、测试文档

### 🔧 开发者指南
- [开发者指南](docs/04-developer-guides/) - API文档、集成指南、测试场景

### 💻 实现细节
- [实现细节](docs/05-implementation/) - 具体实现、技术分析、各应用设计

### 🛠️ 维护优化
- [维护优化](docs/06-maintenance/) - 优化报告、修复计划、维护文档

### 📋 阶段总结文档

- [第二期总结 - 配置同步与 UI 基础](./PHASE2_SUMMARY.md)
- [第三期总结 - Office 插件基础 UI 完善](./PHASE3_SUMMARY.md)
- [第三期测试指南](./PHASE3_TESTING.md)
- [第四期总结 - AI 对话功能集成](../../docs/office-plugin-phase4-completion-summary.md)
- [第五期总结 - Word 文档编辑功能](../../docs/office-plugin-phase5-completion-summary.md)
- [第六期总结 - Excel 和 PowerPoint 支持](../../docs/office-plugin-phase6-completion-summary.md)
- [第七期总结 - 高级功能集成与性能优化](../../docs/office-plugin-phase7-completion-summary.md) ✨

### 🎨 设计文档

- [聊天界面更新说明](./CHAT_INTERFACE_UPDATE.md)
- [输入栏设计修复](./INPUTBAR_DESIGN_FIX.md)
- [UI 重新设计](./UI_REDESIGN.md)

### 参考资料

- [Office Add-ins 官方文档](https://learn.microsoft.com/en-us/office/dev/add-ins/)
- [Office.js API 参考](https://learn.microsoft.com/en-us/javascript/api/office)
- [Word JavaScript API](https://learn.microsoft.com/en-us/javascript/api/word)
- [Excel JavaScript API](https://learn.microsoft.com/en-us/javascript/api/excel)
- [PowerPoint JavaScript API](https://learn.microsoft.com/en-us/javascript/api/powerpoint)
- [HeroUI 文档](https://heroui.com/)
- [武汉问津开发计划](../../OFFICE_PLUGIN_DEVELOPMENT_PLAN.md)

## ✅ 验收标准

### 第一期（已完成）

- [x] Office 插件项目结构已创建（`packages/office-plugin/`）
- [x] TypeScript + React + Vite 配置完成
- [x] HeroUI 集成完成
- [x] Hello World 任务窗格可以运行
- [x] 支持 Word、Excel、PowerPoint
- [x] 基础的 Office.js API 调用正常
- [x] 可以连接武汉问津主应用 API
- [x] 开发文档完整

### 第二期（已完成）

- [x] API 客户端服务正常工作
- [x] 配置管理服务正常工作
- [x] Zustand 状态管理正常工作
- [x] React Hooks 正常工作
- [x] UI 组件正常显示和交互
- [x] App.tsx 集成所有功能

### 第三期（已完成）✨

- [x] 消息复制功能已实现
- [x] 错误处理机制已完善
- [x] 网络状态提示已添加
- [x] 重试连接功能已实现
- [x] 所有组件正常工作
- [x] 测试指南已完成

## 📝 下一步开发

**当前进度**: 7/8 期完成 (87.5%) 🎉

已完成阶段：
- ✅ **第一期**: 项目基础架构
- ✅ **第二期**: 配置同步与 UI 基础
- ✅ **第三期**: Office 插件基础 UI 完善
- ✅ **第四期**: AI 对话功能集成
- ✅ **第五期**: Word 文档编辑功能
- ✅ **第六期**: Excel 和 PowerPoint 支持
- ✅ **第七期**: 高级功能集成与性能优化

下一步任务：
- **第八期**: 发布准备（测试、文档、部署）

## 🤝 贡献

如有问题或建议，请联系开发团队或提交 Issue。

## 📄 许可证

与武汉问津主应用保持一致。

