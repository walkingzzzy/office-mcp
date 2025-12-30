# Excel MCP Server

专门处理 Microsoft Excel 电子表格操作的 MCP（Model Context Protocol）服务器。

## 概述

Excel MCP Server 是一个独立的 MCP 服务器，提供了完整的 Excel 电子表格操作能力。它通过 IPC 与 Office 插件通信，执行各种 Excel 电子表格操作，包括文本编辑、格式化、表格管理、图片插入等。

## 功能特性

### 核心功能模块

- **单元格操作** (cell.ts, cells.ts): 单元格读写、范围操作、合并拆分等
- **格式化** (format.ts, formatting.ts): 字体、填充、边框、数字格式等
- **公式** (formula.ts, formulas.ts): 公式设置、计算、命名范围等
- **图表** (chart.ts, charts.ts): 图表创建、编辑、格式化
- **工作表** (worksheet.ts, worksheets.ts): 工作表管理、复制、移动等
- **数据分析** (data.ts): 数据导入导出、统计分析、预测等
- **图片** (image.ts): 图片插入、调整、管理
- **表格增强** (tableEnhanced.ts): 表格创建、样式、筛选等
- **批注** (comment.ts): 批注添加、回复、解决
- **条件格式** (conditionalFormat.ts): 色阶、数据条、图标集等
- **数据透视表** (pivotTableEnhanced.ts): 透视表创建和管理
- **数据验证** (dataValidation.ts): 数据有效性规则
- **切片器** (slicer.ts): 切片器管理
- **形状** (shape.ts): 形状和绘图对象
- **透视层次结构** (pivotHierarchy.ts): 透视表层次结构
- **教育功能** (education.ts): 班级统计、排名生成等
- **元数据** (metadata.ts): 工作簿元数据管理

### 工具统计

- **总工具数**: 168 个 Excel 操作工具
- **工具模块**: 23 个功能模块
- **Browser 工具**: 2 个浏览器端工具

## 工具列表

Excel MCP 服务器提供了 159 个强大的工具，涵盖以下主要类别：

### 单元格操作（20个）
- **excel_get_cell** - 读取单个单元格的值和格式
- **excel_set_cell** - 设置单个单元格的值和格式
- **excel_get_range** - 读取单元格范围的值和格式
- **excel_set_range** - 设置单元格范围的值和格式
- **excel_clear_cell** - 清除单元格内容和格式
- **excel_clear_range** - 清除单元格范围内容和格式
- **excel_delete_cell** - 删除单元格并移动相邻单元格
- **excel_insert_cell** - 插入新单元格
- **excel_merge_cells** - 合并单元格范围
- **excel_unmerge_cells** - 取消合并单元格
- **excel_copy_cell** - 复制单元格到新位置
- **excel_cut_cell** - 剪切单元格到新位置
- **excel_paste_cell** - 粘贴单元格内容
- **excel_find_cell** - 查找包含特定值的单元格
- **excel_replace_cell** - 替换单元格中的值
- **excel_get_cell_formula** - 获取单元格公式
- **excel_set_cell_formula** - 设置单元格公式
- **excel_get_cell_format** - 获取单元格格式信息
- **excel_set_cell_format** - 设置单元格格式
- **excel_auto_fit_column** - 自动调整列宽

### 图表工具（10个）
- **excel_create_chart** - 创建新图表
- **excel_delete_chart** - 删除指定图表
- **excel_update_chart** - 更新图表数据和样式
- **excel_get_chart** - 获取图表信息
- **excel_set_chart_type** - 更改图表类型
- **excel_add_chart_series** - 添加数据系列
- **excel_remove_chart_series** - 移除数据系列
- **excel_set_chart_title** - 设置图表标题
- **excel_set_chart_legend** - 设置图表图例
- **excel_export_chart** - 导出图表为图片

### 数据分析工具（15个）
- **excel_sort_data** - 对数据范围进行排序
- **excel_filter_data** - 应用数据筛选
- **excel_advanced_filter** - 高级筛选功能
- **excel_subtotal** - 创建分类汇总
- **excel consolidate** - 合并多个数据范围
- **excel_text_to_columns** - 文本分列功能
- **excel_remove_duplicates** - 删除重复值
- **excel_data_validation** - 设置数据验证规则
- **excel_goal_seek** - 目标求解
- **excel_scenario_manager** - 方案管理
- **excel_solver** - 求解器工具
- **excel_forecast** - 预测分析
- **excel_moving_average** - 移动平均
- **excel_exponential_smoothing** - 指数平滑
- **excel_regression** - 回归分析

### 格式工具（15个）
- **excel_set_font** - 设置字体格式
- **excel_set_font_size** - 设置字号
- **excel_set_font_color** - 设置字体颜色
- **excel_set_background_color** - 设置背景颜色
- **excel_set_border** - 设置边框
- **excel_set_number_format** - 设置数字格式
- **excel_set_alignment** - 设置对齐方式
- **excel_set_text_wrap** - 设置自动换行
- **excel_set_cell_style** - 应用单元格样式
- **excel_create_style** - 创建新样式
- **excel_delete_style** - 删除自定义样式
- **excel_copy_format** - 复制格式
- **excel_paste_format** - 粘贴格式
- **excel_clear_format** - 清除格式
- **excel_format_as_table** - 格式化为表格

### 公式工具（15个）
- **excel_insert_formula** - 插入公式
- **excel_edit_formula** - 编辑现有公式
- **excel_delete_formula** - 删除公式
- **excel_evaluate_formula** - 计算公式结果
- **excel_trace_precedents** - 追踪引用单元格
- **excel_trace_dependents** - 追踪从属单元格
- **excel_show_formulas** - 显示/隐藏公式
- **excel_error_check** - 检查公式错误
- **excel_define_name** - 定义命名区域
- **excel_delete_name** - 删除命名区域
- **excel_list_names** - 列出所有命名区域
- **excel_apply_named_range** - 应用命名区域
- **excel_create_array_formula** - 创建数组公式
- **excel_convert_formula_to_value** - 将公式转换为值
- **excel_auto_sum** - 自动求和

### 工作表工具（10个）
- **excel_create_worksheet** - 创建新工作表
- **excel_delete_worksheet** - 删除工作表
- **excel_rename_worksheet** - 重命名工作表
- **excel_copy_worksheet** - 复制工作表
- **excel_move_worksheet** - 移动工作表位置
- **excel_hide_worksheet** - 隐藏工作表
- **excel_unhide_worksheet** - 取消隐藏工作表
- **excel_protect_worksheet** - 保护工作表
- **excel_unprotect_worksheet** - 取消工作表保护
- **excel_set_tab_color** - 设置工作表标签颜色

### 图片工具（6个）
- **excel_insert_image** - 插入图片
- **excel_delete_image** - 删除图片
- **excel_resize_image** - 调整图片大小
- **excel_move_image** - 移动图片位置
- **excel_crop_image** - 裁剪图片
- **excel_set_image_properties** - 设置图片属性

### 表格增强工具（14个）
- **excel_create_table** - 创建格式化表格
- **excel_delete_table** - 删除表格
- **excel_resize_table** - 调整表格大小
- **excel_add_table_column** - 添加表格列
- **excel_delete_table_column** - 删除表格列
- **excel_add_table_row** - 添加表格行
- **excel_delete_table_row** - 删除表格行
- **excel_set_table_style** - 设置表格样式
- **excel_toggle_total_row** - 显示/隐藏总计行
- **excel_sort_table** - 表格排序
- **excel_filter_table** - 表格筛选
- **excel_convert_to_range** - 将表格转换为范围
- **excel_get_table_data** - 获取表格数据
- **excel_refresh_table** - 刷新表格数据

### 评论工具（8个）
- **excel_add_comment** - 添加单元格评论
- **excel_edit_comment** - 编辑评论
- **excel_delete_comment** - 删除评论
- **excel_show_comment** - 显示评论
- **excel_hide_comment** - 隐藏评论
- **excel_resolve_comment** - 解决评论
- **excel_reply_comment** - 回复评论
- **excel_list_comments** - 列出所有评论

### 条件格式工具（9个）
- **excel_add_conditional_format** - 添加条件格式
- **excel_delete_conditional_format** - 删除条件格式
- **excel_edit_conditional_format** - 编辑条件格式
- **excel_color_scale** - 设置色阶格式
- **excel_data_bar** - 设置数据条格式
- **excel_icon_set** - 设置图标集格式
- **excel_highlight_cells** - 高亮单元格
- **excel_top_bottom_rules** - 设置顶部/底部规则
- **excel_clear_conditional_formats** - 清除所有条件格式

### 数据透视表增强工具（12个）
- **excel_create_pivot_table** - 创建数据透视表
- **excel_delete_pivot_table** - 删除数据透视表
- **excel_refresh_pivot_table** - 刷新数据透视表
- **excel_add_pivot_field** - 添加透视字段
- **excel_remove_pivot_field** - 移除透视字段
- **excel_move_pivot_field** - 移动透视字段
- **excel_set_pivot_filter** - 设置透视筛选
- **excel_set_pivot_value** - 设置值字段
- **excel_group_pivot_items** - 分组透视项
- **excel_ungroup_pivot_items** - 取消分组
- **excel_collapse_pivot** - 折叠透视项
- **excel_expand_pivot** - 展开透视项

### 数据验证工具（8个）
- **excel_add_data_validation** - 添加数据验证
- **excel_remove_data_validation** - 移除数据验证
- **excel_edit_data_validation** - 编辑数据验证
- **excel_circle_invalid_data** - 圈出无效数据
- **excel_clear_validation_circles** - 清除验证圈
- **excel_get_validation_input** - 获取验证输入
- **excel_set_validation_input** - 设置验证输入
- **excel_list_validations** - 列出所有验证规则

### 切片器工具（8个）
- **excel_insert_slicer** - 插入切片器
- **excel_delete_slicer** - 删除切片器
- **excel_connect_slicer** - 连接切片器到数据
- **excel_disconnect_slicer** - 断开切片器连接
- **excel_style_slicer** - 设置切片器样式
- **excel_clear_slicer_filters** - 清除切片器筛选
- **excel_group_slicers** - 组合切片器
- **excel_ungroup_slicers** - 取消切片器组合

### 形状工具（8个）
- **excel_insert_shape** - 插入形状
- **excel_delete_shape** - 删除形状
- **excel_resize_shape** - 调整形状大小
- **excel_move_shape** - 移动形状
- **excel_rotate_shape** - 旋转形状
- **excel_set_shape_style** - 设置形状样式
- **excel_add_text_to_shape** - 向形状添加文本
- **excel_format_shape_text** - 格式化形状文本

### 数据透视表层级工具（8个）
- **excel_create_hierarchy** - 创建层级结构
- **excel_delete_hierarchy** - 删除层级结构
- **excel_add_to_hierarchy** - 添加字段到层级
- **excel_remove_from_hierarchy** - 从层级移除字段
- **excel_reorder_hierarchy** - 重新排序层级
- **excel_set_hierarchy_name** - 设置层级名称
- **excel_expand_hierarchy** - 展开层级
- **excel_collapse_hierarchy** - 折叠层级

### 教育工具（3个）
- **excel_class_statistics** - 班级统计分析
- **excel_grade_ranking** - 成绩排名生成
- **excel_attendance_tracker** - 考勤跟踪表

## 安装

### 前置要求

- Node.js >= 18.0.0
- npm >= 9.0.0
- TypeScript >= 5.8.0

### 安装步骤

1. 克隆或下载项目
2. 安装依赖：

```bash
cd excel-mcp-server
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

在 Claude Desktop 的配置文件中添加 Excel MCP Server：

**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "excel": {
      "command": "node",
      "args": ["/path/to/excel-mcp-server/dist/server.js"],
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
    "excel": {
      "command": "npx",
      "args": ["tsx", "/path/to/excel-mcp-server/src/server.ts"],
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
    "name": "excel-mcp-server",
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
excel-mcp-server/
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
Excel MCP Server
    ↓ (HTTP/IPC)
Office Plugin (Browser)
    ↓ (Office.js)
Microsoft Excel
```

1. Claude Desktop 通过 stdio 与 MCP Server 通信
2. MCP Server 通过 HTTP/IPC 与 Office 插件通信
3. Office 插件使用 Office.js API 操作 Excel 电子表格

## 开发

### 添加新工具

1. 在 `src/tools/` 目录下创建新的工具文件
2. 定义工具的 `ToolDefinition`：

```typescript
import type { ToolDefinition } from './types.js'
import { sendIPCCommand } from '../utils/ipc.js'

export const myNewTool: ToolDefinition = {
  name: 'excel_my_new_tool',
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
    return await sendIPCCommand('excel.myNewTool', args)
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
- 添加适当的注释和电子表格

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
   - 确认 Excel 电子表格已打开

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
- [PowerPoint MCP Server](../powerpoint-mcp-server) - PowerPoint 操作 MCP 服务器
- [Office MCP Server](../office_mcp_server_js) - 原始的统一 Office MCP 服务器
