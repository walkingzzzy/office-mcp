# Word MCP Server

专门处理 Microsoft Word 文档操作的 MCP（Model Context Protocol）服务器。

## 概述

Word MCP Server 是一个独立的 MCP 服务器，提供了完整的 Word 文档操作能力。它通过 IPC 与 Office 插件通信，执行各种 Word 文档操作，包括文本编辑、格式化、表格管理、图片插入等。

## 功能特性

### 核心功能模块

- **文档管理** (document.ts): 文档创建、打开、保存、关闭等基础操作
- **文本操作** (text.ts, paragraph.ts): 文本插入、删除、查找、替换等
- **格式化** (formatting.ts, styles.ts): 字体、段落、样式等格式设置
- **表格** (table.ts): 表格创建、编辑、格式化
- **图片** (image.ts, images.ts): 图片插入、调整、管理
- **页面设置** (pageSetup.ts): 页边距、纸张大小、方向等
- **页眉页脚** (headerFooter.ts): 页眉页脚管理
- **书签** (bookmark.ts): 书签创建和导航
- **超链接** (hyperlink.ts, hyperlinks.ts): 超链接管理
- **批注** (comment.ts, annotation.ts): 批注和注释
- **修订跟踪** (trackChanges.ts): 修订跟踪和审阅
- **内容控件** (contentControl.ts): 内容控件管理
- **域** (field.ts): 域代码管理
- **图表** (chart.ts): 图表插入和编辑
- **形状** (shape.ts): 形状和绘图对象
- **画布** (canvas.ts): 绘图画布
- **索引** (index.ts): 索引和目录
- **协作** (coauthoring.ts): 协作编辑
- **冲突解决** (conflict.ts): 冲突检测和解决
- **教育功能** (education.ts): 教育相关功能
- **高级功能** (advanced.ts): 高级文档操作

### 工具统计

- **总工具数**: 约 160 个 Word 操作工具
- **工具模块**: 28 个功能模块
- **Browser 工具**: 3 个浏览器端工具

## 工具列表

### 文本工具（10个）

#### word_insert_text
- **描述**：在指定位置插入文本
- **功能**：在文档的指定位置插入新的文本内容
- **参数**：position（插入位置）、text（要插入的文本）
- **使用场景**：在文档中添加新内容、补充说明文字

#### word_replace_text
- **描述**：用新文本替换指定文本
- **功能**：查找并替换文档中的特定文本
- **参数**：searchText（要查找的文本）、replaceText（替换文本）、matchCase（是否区分大小写）
- **使用场景**：批量修改文档内容、更新术语

#### word_delete_text
- **描述**：删除指定文本或文本范围
- **功能**：删除文档中的指定文本内容
- **参数**：text（要删除的文本）或 range（文本范围）
- **使用场景**：移除不需要的内容、清理文档

#### word_search_text
- **描述**：在文档中搜索文本
- **功能**：查找文档中特定文本的位置和数量
- **参数**：searchText（搜索文本）、matchCase（是否区分大小写）
- **使用场景**：定位特定内容、统计文本出现次数

#### word_get_selected_text
- **描述**：获取当前选中的文本
- **功能**：返回用户当前选中的文本内容
- **参数**：无
- **使用场景**：获取用户选择的内容进行处理

#### word_select_text_range
- **描述**：通过位置或搜索选择文本范围
- **功能**：选中指定范围的文本
- **参数**：start（起始位置）、end（结束位置）或 searchText（搜索文本）
- **使用场景**：选中特定内容进行批量操作

#### word_clear_formatting
- **描述**：清除选中文本或范围的格式
- **功能**：移除文本的所有格式设置，恢复默认样式
- **参数**：range（文本范围，可选）
- **使用场景**：重置文本格式、统一文档样式

#### word_copy_text
- **描述**：复制文本到剪贴板
- **功能**：将选中文本复制到系统剪贴板
- **参数**：text（要复制的文本，可选）
- **使用场景**：复制内容到其他位置

#### word_cut_text
- **描述**：剪切文本到剪贴板
- **功能**：将选中文本剪切到系统剪贴板并从原位置删除
- **参数**：text（要剪切的文本，可选）
- **使用场景**：移动内容到其他位置

#### word_paste_text
- **描述**：从剪贴板粘贴文本
- **功能**：将剪贴板内容插入到当前位置
- **参数**：position（插入位置，可选）
- **使用场景**：粘贴复制的内容

### 格式化工具（10个）

#### word_set_font
- **描述**：设置选中文本或范围的字体
- **功能**：更改文本的字体样式
- **参数**：fontName（字体名称）、range（文本范围，可选）
- **使用场景**：统一文档字体、美化排版

#### word_set_font_size
- **描述**：设置选中文本或范围的字号
- **功能**：调整文本的大小
- **参数**：fontSize（字号大小）、range（文本范围，可选）
- **使用场景**：设置标题大小、调整正文字号

#### word_set_font_color
- **描述**：设置选中文本或范围的字体颜色
- **功能**：更改文本的颜色
- **参数**：color（颜色值）、range（文本范围，可选）
- **使用场景**：突出重点内容、分类标记

#### word_set_bold
- **描述**：设置或取消文本加粗格式
- **功能**：切换文本的加粗状态
- **参数**：enabled（是否启用）、range（文本范围，可选）
- **使用场景**：强调重要内容、设置标题样式

#### word_set_italic
- **描述**：设置或取消文本斜体格式
- **功能**：切换文本的斜体状态
- **参数**：enabled（是否启用）、range（文本范围，可选）
- **使用场景**：标记引用内容、特殊强调

#### word_set_underline
- **描述**：设置或取消文本下划线格式
- **功能**：为文本添加或移除下划线
- **参数**：enabled（是否启用）、style（下划线样式，可选）
- **使用场景**：标记链接、强调内容

#### word_set_highlight
- **描述**：设置或取消文本高亮显示
- **功能**：为文本添加背景高亮效果
- **参数**：color（高亮颜色）、range（文本范围，可选）
- **使用场景**：标记重点内容、批注标记

#### word_set_strikethrough
- **描述**：设置或取消文本删除线格式
- **功能**：为文本添加或移除删除线
- **参数**：enabled（是否启用）、range（文本范围，可选）
- **使用场景**：标记删除内容、版本对比

#### word_set_subscript
- **描述**：设置或取消下标格式
- **功能**：将文本设置为下标
- **参数**：enabled（是否启用）、range（文本范围，可选）
- **使用场景**：化学公式、数学符号

#### word_set_superscript
- **描述**：设置或取消上标格式
- **功能**：将文本设置为上标
- **参数**：enabled（是否启用）、range（文本范围，可选）
- **使用场景**：数学指数、脚注标记

### 表格工具（15个）

#### word_insert_table
- **描述**：在 Word 文档中插入表格
- **功能**：创建指定行列数的表格
- **参数**：rows（行数）、columns（列数）、position（插入位置）
- **使用场景**：创建数据表格、整理信息

#### word_delete_table
- **描述**：从 Word 文档中删除表格
- **功能**：删除指定的表格
- **参数**：tableIndex（表格索引）
- **使用场景**：移除不需要的表格

#### word_add_row
- **描述**：在表格中添加新行
- **功能**：在指定位置添加新行
- **参数**：tableIndex（表格索引）、position（插入位置）、count（行数）
- **使用场景**：扩展表格、添加新数据

#### word_add_column
- **描述**：在表格中添加新列
- **功能**：在指定位置添加新列
- **参数**：tableIndex（表格索引）、position（插入位置）、count（列数）
- **使用场景**：扩展表格、添加新字段

#### word_merge_cells
- **描述**：合并表格单元格
- **功能**：将选中的单元格合并
- **参数**：tableIndex（表格索引）、cells（要合并的单元格）
- **使用场景**：创建表头、合并相关数据

#### word_split_table
- **描述**：将表格转换为文本
- **功能**：将表格内容转换为纯文本
- **参数**：tableIndex（表格索引）、separator（分隔符）
- **使用场景**：导出表格数据、简化格式

#### word_set_table_style
- **描述**：设置表格样式
- **功能**：应用预定义或自定义表格样式
- **参数**：tableIndex（表格索引）、styleName（样式名称）
- **使用场景**：美化表格、统一格式

#### word_apply_list_style
- **描述**：应用列表格式（项目符号或编号）
- **功能**：为段落添加列表格式
- **参数**：listType（列表类型）、level（级别）、range（文本范围）
- **使用场景**：创建清单、设置层级

#### word_set_line_spacing
- **描述**：设置行距
- **功能**：调整段落内行与行之间的距离
- **参数**：spacing（行距值）、range（文本范围）
- **使用场景**：调整文档密度、改善可读性

#### word_set_paragraph_alignment
- **描述**：设置段落对齐方式
- **功能**：设置段落的对齐方式
- **参数**：alignment（对齐方式）、range（文本范围）
- **使用场景**：排版对齐、设置标题居中

#### word_set_paragraph_indent
- **描述**：设置段落缩进
- **功能**：调整段落的缩进距离
- **参数**：leftIndent（左缩进）、rightIndent（右缩进）
- **使用场景**：设置首行缩进、创建层级

#### word_merge_paragraphs
- **描述**：将多个段落合并为一个
- **功能**：合并选中的多个段落
- **参数**：paragraphs（要合并的段落）
- **使用场景**：整理格式、合并短段落

#### word_split_paragraph
- **描述**：在指定位置拆分段落
- **功能**：将段落从指定位置拆分
- **参数**：position（拆分位置）、paragraph（目标段落）
- **使用场景**：分离内容、创建新段落

#### word_move_paragraph
- **描述**：将段落移动到不同位置
- **功能**：调整段落的顺序
- **参数**：paragraph（要移动的段落）、targetPosition（目标位置）
- **使用场景**：重组内容、调整顺序

### 图片工具（10个）

#### word_insert_image
- **描述**：在 Word 文档中插入图片
- **功能**：在指定位置插入图片文件
- **参数**：imagePath（图片路径）、position（插入位置）、width（宽度）、height（高度）
- **使用场景**：添加插图、插入logo

#### word_delete_image
- **描述**：从 Word 文档中删除图片
- **功能**：删除指定的图片
- **参数**：imageIndex（图片索引）
- **使用场景**：移除不需要的图片

#### word_resize_image
- **描述**：调整图片尺寸
- **功能**：更改图片的宽度和高度
- **参数**：imageIndex（图片索引）、width（新宽度）、height（新高度）
- **使用场景**：调整图片大小、统一尺寸

#### word_move_image
- **描述**：移动图片到新位置
- **功能**：更改图片在文档中的位置
- **参数**：imageIndex（图片索引）、position（新位置）
- **使用场景**：调整图片布局、重新排版

#### word_rotate_image
- **描述**：按角度旋转图片
- **功能**：旋转指定角度的图片
- **参数**：imageIndex（图片索引）、angle（旋转角度）
- **使用场景**：调整图片方向、特殊效果

#### word_set_image_position
- **描述**：设置图片定位类型
- **功能**：设置图片的定位方式（嵌入式或浮动）
- **参数**：imageIndex（图片索引）、positionType（定位类型）
- **使用场景**：控制图片行为、排版布局

#### word_wrap_text_around_image
- **描述**：设置图片的文字环绕方式
- **功能**：配置文本如何环绕图片
- **参数**：imageIndex（图片索引）、wrapType（环绕类型）
- **使用场景**：图文混排、美化布局

#### word_add_image_caption
- **描述**：为图片添加标题
- **功能**：在图片下方添加说明文字
- **参数**：imageIndex（图片索引）、caption（标题文本）
- **使用场景**：添加图片说明、标注内容

#### word_compress_images
- **描述**：压缩文档中的图片
- **功能**：减小图片文件大小
- **参数**：compressionLevel（压缩级别）、targetImages（目标图片）
- **使用场景**：减小文档体积、优化存储

#### word_replace_image
- **描述**：替换现有图片
- **功能**：用新图片替换指定图片
- **参数**：imageIndex（图片索引）、newImagePath（新图片路径）
- **使用场景**：更新图片内容、替换错误图片

### 超链接工具（8个）

#### word_insert_hyperlink
- **描述**：在文档中插入超链接
- **功能**：为文本或图片添加可点击的链接
- **参数**：text（链接文本）、url（链接地址）、range（文本范围）
- **使用场景**：添加网址链接、创建交叉引用

#### word_remove_hyperlink
- **描述**：从文本中删除超链接
- **功能**：移除文本的超链接属性
- **参数**：range（文本范围）
- **使用场景**：清理链接、纯文本化

#### word_insert_bookmark
- **描述**：在当前位置插入书签
- **功能**：创建可快速定位的书签
- **参数**：bookmarkName（书签名称）、range（文本范围）
- **使用场景**：创建导航点、标记重要位置

#### word_insert_cross_reference
- **描述**：插入交叉引用
- **功能**：引用文档中的其他内容
- **参数**：referenceType（引用类型）、target（目标对象）
- **使用场景**：引用图表、引用章节

#### word_insert_footnote
- **描述**：在当前位置插入脚注
- **功能**：添加页面底部的注释
- **参数**：noteText（脚注内容）、range（文本范围）
- **使用场景**：添加解释说明、引用来源

#### word_insert_endnote
- **描述**：在当前位置插入尾注
- **功能**：添加文档末尾的注释
- **参数**：noteText（尾注内容）、range（文本范围）
- **使用场景**：添加参考文献、文档说明

#### word_insert_citation
- **描述**：插入引文引用
- **功能**：添加学术引用标记
- **参数**：source（来源信息）、style（引用样式）
- **使用场景**：学术论文、引用文献

#### word_insert_bibliography
- **描述**：插入参考文献列表
- **功能**：生成文档中的所有引用列表
- **参数**：style（引用样式）、position（插入位置）
- **使用场景**：学术论文、研究报告

### 读取工具（7个）

#### word_read_document
- **描述**：读取整个文档内容
- **功能**：获取文档的完整文本内容
- **参数**：includeFormatting（是否包含格式）
- **使用场景**：文档分析、内容提取

#### word_detect_selection_type
- **描述**：检测当前选区的类型
- **功能**：判断选中的是文本、图片还是其他对象
- **参数**：无
- **使用场景**：条件操作、类型判断

#### word_check_document_has_images
- **描述**：检查文档中是否包含图片
- **功能**：判断文档是否存在图片
- **参数**：无
- **使用场景**：预处理检查、批量操作

#### word_check_document_has_tables
- **描述**：检查文档中是否包含表格
- **功能**：判断文档是否存在表格
- **参数**：无
- **使用场景**：预处理检查、数据提取

#### word_get_images
- **描述**：获取文档中所有图片的列表
- **功能**：返回所有图片的信息
- **参数**：无
- **使用场景**：图片管理、批量处理

#### word_format_text
- **描述**：使用指定样式格式化文本
- **功能**：应用预定义样式到文本
- **参数**：styleName（样式名称）、range（文本范围）
- **使用场景**：快速格式化、统一样式

#### word_set_font_name
- **描述**：设置选中文本或指定范围的字体名称
- **功能**：更改文本的字体类型
- **参数**：fontName（字体名称）、range（文本范围）
- **使用场景**：设置文档字体、特殊效果

### 图表工具（2个）

#### word_insert_chart
- **描述**：在 Word 文档中插入图表
- **功能**：创建并插入各种类型的图表
- **参数**：chartType（图表类型）、data（图表数据）、position（位置）
- **使用场景**：数据可视化、报告制作

#### word_get_charts
- **描述**：获取 Word 文档中的图表信息
- **功能**：列出文档中所有图表的详细信息
- **参数**：无
- **使用场景**：图表管理、批量更新

## 安装

### 前置要求

- Node.js >= 18.0.0
- npm >= 9.0.0
- TypeScript >= 5.8.0

### 安装步骤

1. 克隆或下载项目
2. 安装依赖：

```bash
cd word-mcp-server
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

在 Claude Desktop 的配置文件中添加 Word MCP Server：

**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "word": {
      "command": "node",
      "args": ["/path/to/word-mcp-server/dist/server.js"],
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
    "word": {
      "command": "npx",
      "args": ["tsx", "/path/to/word-mcp-server/src/server.ts"],
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
    "name": "word-mcp-server",
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
word-mcp-server/
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
Word MCP Server
    ↓ (HTTP/IPC)
Office Plugin (Browser)
    ↓ (Office.js)
Microsoft Word
```

1. Claude Desktop 通过 stdio 与 MCP Server 通信
2. MCP Server 通过 HTTP/IPC 与 Office 插件通信
3. Office 插件使用 Office.js API 操作 Word 文档

## 开发

### 添加新工具

1. 在 `src/tools/` 目录下创建新的工具文件
2. 定义工具的 `ToolDefinition`：

```typescript
import type { ToolDefinition } from './types.js'
import { sendIPCCommand } from '../utils/ipc.js'

export const myNewTool: ToolDefinition = {
  name: 'word_my_new_tool',
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
    return await sendIPCCommand('word.myNewTool', args)
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
- 添加适当的注释和文档

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
   - 确认 Word 文档已打开

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

- [Excel MCP Server](../excel-mcp-server) - Excel 操作 MCP 服务器
- [PowerPoint MCP Server](../powerpoint-mcp-server) - PowerPoint 操作 MCP 服务器
- [Office MCP Server](../office_mcp_server_js) - 原始的统一 Office MCP 服务器
