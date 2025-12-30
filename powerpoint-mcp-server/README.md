# PowerPoint MCP Server

专门处理 Microsoft PowerPoint 演示文稿操作的 MCP（Model Context Protocol）服务器。

## 概述

PowerPoint MCP Server 是一个独立的 MCP 服务器，提供了完整的 PowerPoint 演示文稿操作能力。它通过 IPC 与 Office 插件通信，执行各种 PowerPoint 演示文稿操作，包括幻灯片管理、形状编辑、动画设置、媒体插入等。

## 功能特性

### 核心功能模块

- **幻灯片操作** (slide.ts, slides.ts): 幻灯片添加、删除、复制、移动等
- **形状管理** (shapes.ts): 形状创建、编辑、格式化、组合等
- **动画效果** (animations.ts): 动画添加、编辑、预览、播放控制
- **演示文稿** (presentation.ts): 演示文稿属性、设置、保存等
- **母版管理** (master.ts): 幻灯片母版和布局管理
- **自定义布局** (customLayout.ts): 自定义幻灯片布局
- **媒体管理** (media.ts): 图片、视频、音频插入和管理
- **批注** (comment.ts): 批注添加、回复、解决
- **备注** (notes.ts): 演讲者备注管理
- **超链接** (hyperlink.ts): 超链接创建和管理
- **内容操作** (content.ts): 文本框、表格等内容操作
- **导出功能** (export.ts): 演示文稿导出为各种格式
- **放映设置** (slideShowSettings.ts): 幻灯片放映设置
- **教育功能** (education.ts): 教学相关功能
- **元数据** (metadata.ts): 演示文稿元数据管理

### 工具统计

- **总工具数**: 87 个 PowerPoint 操作工具
- **工具模块**: 17 个功能模块
- **Browser 工具**: 2 个浏览器端工具

## 工具列表

PowerPoint MCP 服务器提供了 87 个强大的工具，涵盖以下主要类别：

### 幻灯片操作（10个）
- **ppt_add_slide** - 添加新幻灯片
- **ppt_delete_slide** - 删除指定幻灯片
- **ppt_duplicate_slide** - 复制幻灯片
- **ppt_move_slide** - 移动幻灯片位置
- **ppt_hide_slide** - 隐藏幻灯片
- **ppt_show_slide** - 显示隐藏的幻灯片
- **ppt_get_slide_count** - 获取幻灯片总数
- **ppt_get_current_slide** - 获取当前幻灯片信息
- **ppt_goto_slide** - 跳转到指定幻灯片
- **ppt_select_slide** - 选择指定幻灯片

### 形状和文本（12个）
- **ppt_add_shape** - 添加形状
- **ppt_delete_shape** - 删除形状
- **ppt_resize_shape** - 调整形状大小
- **ppt_move_shape** - 移动形状位置
- **ppt_rotate_shape** - 旋转形状
- **ppt_set_shape_fill** - 设置形状填充
- **ppt_set_shape_outline** - 设置形状轮廓
- **ppt_add_text_to_shape** - 向形状添加文本
- **ppt_set_shape_text** - 设置形状文本内容
- **ppt_format_shape_text** - 格式化形状文本
- **ppt_group_shapes** - 组合形状
- **ppt_ungroup_shapes** - 取消组合形状

### 图片和媒体（6个）
- **ppt_insert_image** - 插入图片
- **ppt_delete_image** - 删除图片
- **ppt_resize_image** - 调整图片大小
- **ppt_crop_image** - 裁剪图片
- **ppt_insert_video** - 插入视频
- **ppt_insert_audio** - 插入音频

### 动画和过渡（8个）
- **ppt_add_animation** - 添加动画效果
- **ppt_remove_animation** - 移除动画效果
- **ppt_edit_animation** - 编辑动画效果
- **ppt_set_animation_timing** - 设置动画时间
- **ppt_add_slide_transition** - 添加幻灯片过渡效果
- **ppt_remove_slide_transition** - 移除过渡效果
- **ppt_set_transition_speed** - 设置过渡速度
- **ppt_preview_animation** - 预览动画效果

### 教育工具（2个）
- **ppt_create_quiz_slide** - 创建测验幻灯片
- **ppt_generate_lecture_notes** - 生成讲座笔记

### 幻灯片母版（6个）
- **ppt_access_slide_master** - 访问幻灯片母版
- **ppt_add_layout** - 添加新布局
- **ppt_delete_layout** - 删除布局
- **ppt_rename_layout** - 重命名布局
- **ppt_apply_layout** - 应用布局到幻灯片
- **ppt_modify_master** - 修改母版样式

### 备注工具（5个）
- **ppt_add_note** - 添加演讲者备注
- **ppt_edit_note** - 编辑备注内容
- **ppt_delete_note** - 删除备注
- **ppt_get_note** - 获取备注内容
- **ppt_format_note** - 格式化备注文本

### 超链接工具（5个）
- **ppt_add_hyperlink** - 添加超链接
- **ppt_edit_hyperlink** - 编辑超链接
- **ppt_remove_hyperlink** - 移除超链接
- **ppt_add_action_button** - 添加动作按钮
- **ppt_set_action_settings** - 设置动作设置

### 导出工具（3个）
- **ppt_export_as_pdf** - 导出为 PDF
- **ppt_export_as_images** - 导出为图片
- **ppt_export_as_video** - 导出为视频

### 媒体增强（4个）
- **ppt_trim_video** - 裁剪视频
- **ppt_set_video_playback** - 设置视频播放选项
- **ppt_set_audio_playback** - 设置音频播放选项
- **ppt_compress_media** - 压缩媒体文件

### 批注工具（9个）
- **ppt_add_comment** - 添加批注
- **ppt_reply_comment** - 回复批注
- **ppt_edit_comment** - 编辑批注
- **ppt_delete_comment** - 删除批注
- **ppt_resolve_comment** - 解决批注
- **ppt_reopen_comment** - 重新打开批注
- **ppt_show_comments** - 显示批注
- **ppt_hide_comments** - 隐藏批注
- **ppt_list_comments** - 列出所有批注

### 自定义布局（7个）
- **ppt_create_custom_layout** - 创建自定义布局
- **ppt_save_layout_template** - 保存布局模板
- **ppt_load_layout_template** - 加载布局模板
- **ppt_delete_custom_layout** - 删除自定义布局
- **ppt_duplicate_layout** - 复制布局
- **ppt_set_layout_background** - 设置布局背景
- **ppt_add_placeholder** - 添加占位符

### 幻灯片播放设置（10个）
- **ppt_start_slideshow** - 开始幻灯片放映
- **ppt_stop_slideshow** - 停止幻灯片放映
- **ppt_pause_slideshow** - 暂停幻灯片放映
- **ppt_resume_slideshow** - 继续幻灯片放映
- **ppt_next_slide** - 切换到下一张幻灯片
- **ppt_previous_slide** - 切换到上一张幻灯片
- **ppt_goto_slide_in_show** - 放映中跳转到指定幻灯片
- **ppt_set_show_settings** - 设置放映选项
- **ppt_set_loop_show** - 设置循环放映
- **ppt_set_show_narration** - 设置旁白播放

## 安装

### 前置要求

- Node.js >= 18.0.0
- npm >= 9.0.0
- TypeScript >= 5.8.0

### 安装步骤

1. 克隆或下载项目
2. 安装依赖：

```bash
cd powerpoint-mcp-server
npm install
```

3. 构建项目：

```bash
npm run build
```

## 使用方法

### 开发模式

使用 tsx 直接运行 TypeScript 代码：

```bash
npm run dev
```

### 生产模式

先构建，然后运行编译后的代码：

```bash
npm run build
npm start
```

### 配置 Claude Desktop

在 Claude Desktop 的配置文件中添加 PowerPoint MCP Server：

**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "powerpoint": {
      "command": "node",
      "args": ["/path/to/powerpoint-mcp-server/dist/server.js"],
      "env": {
        "NODE_ENV": "production"
      }
    }
  }
}
```

开发模式配置：

```json
{
  "mcpServers": {
    "powerpoint": {
      "command": "npx",
      "args": ["tsx", "/path/to/powerpoint-mcp-server/src/server.ts"],
      "env": {
        "NODE_ENV": "development"
      }
    }
  }
}
```

## 配置

### 环境配置

项目支持两种环境配置：

- `config/development.json`: 开发环境配置
- `config/production.json`: 生产环境配置

通过 `NODE_ENV` 环境变量切换：

```bash
# 开发环境
NODE_ENV=development npm run dev

# 生产环境
NODE_ENV=production npm start
```

### 配置项说明

```json
{
  "server": {
    "name": "powerpoint-mcp-server",
    "version": "1.0.0"
  },
  "ipc": {
    "apiBaseUrl": "http://localhost:3001",
    "timeout": 30000,
    "maxRetries": 3
  },
  "logging": {
    "level": "info",
    "enableConsole": true,
    "enableFile": false
  }
}
```

- **server**: 服务器基本信息
- **ipc**: IPC 通信配置
  - `apiBaseUrl`: Office 插件的 API 地址
  - `timeout`: 请求超时时间（毫秒）
  - `maxRetries`: 最大重试次数
- **logging**: 日志配置
  - `level`: 日志级别 (debug/info/warn/error)
  - `enableConsole`: 是否输出到控制台
  - `enableFile`: 是否输出到文件

## 架构

### 项目结构

```
powerpoint-mcp-server/
├── src/
│   ├── server.ts              # 服务器入口
│   ├── tools/                 # 工具定义
│   │   ├── *.ts              # 各功能模块工具
│   │   ├── browser/          # 浏览器端工具
│   │   ├── utils/            # 工具辅助函数
│   │   └── index.ts          # 工具导出
│   ├── utils/                # 通用工具
│   │   ├── logger.ts         # 日志工具
│   │   ├── ipc.ts            # IPC 通信
│   │   ├── errorHandler.ts   # 错误处理
│   │   └── ToolErrorHandler.ts
│   ├── config/               # 配置管理
│   │   └── ConfigManager.ts
│   └── types/                # 类型定义
│       ├── index.ts
│       └── globals.d.ts
├── config/                   # 配置文件
│   ├── development.json
│   └── production.json
├── dist/                     # 编译输出
├── package.json
├── tsconfig.json
└── README.md
```

### 通信流程

```
Claude Desktop
    ↓ (stdio)
PowerPoint MCP Server
    ↓ (HTTP/IPC)
Office Plugin (Browser)
    ↓ (Office.js)
Microsoft PowerPoint
```

1. Claude Desktop 通过 stdio 与 MCP Server 通信
2. MCP Server 通过 HTTP/IPC 与 Office 插件通信
3. Office 插件使用 Office.js API 操作 PowerPoint 演示文稿

## 开发

### 添加新工具

1. 在 `src/tools/` 目录下创建新的工具文件
2. 定义工具的 `ToolDefinition`：

```typescript
import type { ToolDefinition } from './types.js'
import { sendIPCCommand } from '../utils/ipc.js'

export const myNewTool: ToolDefinition = {
  name: 'ppt_my_new_tool',
  description: '工具描述',
  inputSchema: {
    type: 'object',
    properties: {
      param1: {
        type: 'string',
        description: '参数描述'
      }
    },
    required: ['param1']
  },
  handler: async (args) => {
    return await sendIPCCommand('powerpoint.myNewTool', args)
  }
}
```

3. 在 `src/tools/index.ts` 中导出新工具
4. 重新构建项目

### 运行测试

```bash
npm test
```

### 代码规范

项目使用 TypeScript 严格模式，请确保：

- 所有代码通过 TypeScript 类型检查
- 遵循项目的代码风格
- 添加适当的注释和演示文稿

## 故障排查

### 常见问题

1. **服务器无法启动**
   - 检查 Node.js 版本是否 >= 18
   - 检查依赖是否正确安装
   - 查看日志输出的错误信息

2. **工具调用失败**
   - 确认 Office 插件正在运行
   - 检查 IPC 配置的 `apiBaseUrl` 是否正确
   - 查看 Office 插件的日志

3. **超时错误**
   - 增加 `config/*.json` 中的 `timeout` 值
   - 检查网络连接
   - 确认 PowerPoint 演示文稿已打开

### 日志

开发模式下，日志会输出到控制台。生产模式下，可以配置日志输出到文件。

日志级别：
- `debug`: 详细的调试信息
- `info`: 一般信息
- `warn`: 警告信息
- `error`: 错误信息

## 许可证

[待定]

## 贡献

欢迎提交 Issue 和 Pull Request！

## 相关项目

- [Word MCP Server](../word-mcp-server) - Word 操作 MCP 服务器
- [Excel MCP Server](../excel-mcp-server) - Excel 操作 MCP 服务器
- [Office MCP Server](../office_mcp_server_js) - 原始的统一 Office MCP 服务器
