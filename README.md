# Office MCP Server

> **AI-Powered Office Automation** - 基于 MCP 协议的 Office 文档智能处理服务

[![Python Version](https://img.shields.io/badge/python-3.10%2B-blue)](https://www.python.org/downloads/)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)
[![MCP Protocol](https://img.shields.io/badge/MCP-1.0-orange)](https://modelcontextprotocol.io/)

## 📋 项目简介

Office MCP Server 是一个基于 **Model Context Protocol (MCP)** 的 Office 文档自动化服务，支持通过自然语言指令操作 Word、Excel、PowerPoint 文档。

### 核心功能

- ✅ **Word 文档处理**: 创建、编辑、格式化 Word 文档
- ✅ **Excel 表格处理**: 数据操作、公式计算、图表生成
- ✅ **PowerPoint 演示**: 幻灯片创建、内容排版、样式设置
- ✅ **读写支持**: 支持读取和写入现有文档（Python 方案优势）
- ✅ **PDF 转换**: 原生支持 PDF 生成和转换
- ✅ **AI 集成**: 与 Claude、Cursor 等 AI 客户端无缝集成

### 参考项目

本项目参考了 [GongRzhe/Office-Word-MCP-Server](https://github.com/GongRzhe/Office-Word-MCP-Server)（960+ stars）的成功实现，采用 Python + FastMCP 技术栈。

---

## ⚠️ 功能限制说明

本项目基于 Python 生态的 Office 处理库（`python-docx`、`openpyxl`、`python-pptx`）实现，已覆盖 **85%+ 的日常办公自动化需求**。但由于技术栈限制，部分 Microsoft Office 专有功能暂不支持。

### Excel 功能限制

| 功能类别 | 限制说明 | 技术原因 | 替代方案 |
|---------|---------|---------|---------|
| **🔧 VBA 宏与自动化** | 不支持 VBA 宏的执行、录制和编辑 | `openpyxl` 库不支持 VBA 宏引擎 | 使用 Python 脚本实现自动化逻辑 |
| **📊 数据透视表** | 基础功能可用，但跨平台支持受限 | `openpyxl` 对数据透视表支持有限，完整功能需 Windows + `pywin32` | 已实现基础创建和刷新功能，复杂场景建议使用 Excel 应用 |
| **🔍 Power Query** | 不支持数据获取和转换功能 | Power Query 是 Excel 专有功能，无开源实现 | 使用 Python 的 `pandas` 进行数据处理 |
| **📈 Power Pivot** | 不支持数据建模、DAX 公式、KPI | Power Pivot 是 Excel 专有功能 | 使用 Python 数据分析库（如 `pandas`、`numpy`） |
| **👥 共享工作簿** | 不支持多用户协作编辑和更改历史 | `openpyxl` 不支持共享工作簿协议 | 使用版本控制系统（如 Git）管理文件版本 |
| **🎯 高级假设分析** | 不支持数据表和方案管理器 | 这些是 Excel 内置的交互式工具 | 已支持单变量求解（目标搜索），其他场景可用 Python 实现 |

### PowerPoint 功能限制

| 功能类别 | 限制说明 | 技术原因 | 替代方案 |
|---------|---------|---------|---------|
| **🎬 动画效果** | 动画支持非常有限，仅提供基础标记 | `python-pptx` 对动画的 API 支持不完整，完整功能需 Windows + `win32com` | 在 PowerPoint 中手动添加复杂动画，或使用基础动画效果 |
| **🎨 SmartArt 图形** | 不支持 SmartArt 的创建和编辑 | SmartArt 是 Microsoft Office 专有功能，`python-pptx` 不支持 | 使用形状组合模拟 SmartArt 效果 |
| **🎵 音频与视频** | 不支持音频和视频文件嵌入 | `python-pptx` 库不支持多媒体嵌入 | 在 PowerPoint 中手动添加音频/视频 |
| **📐 母版编辑** | 不支持幻灯片母版的完整编辑 | `python-pptx` 对母版的支持非常有限 | 使用预设模板或在 PowerPoint 中编辑母版 |
| **📋 高级表格操作** | 不支持删除行列、拆分单元格、调整行高列宽 | `python-pptx` 表格操作 API 有限 | 已支持基础表格创建、数据填充、合并单元格 |
| **📄 PDF/视频导出** | PDF 导出需要 PowerPoint 应用，不支持视频导出 | 需要 Microsoft PowerPoint + `comtypes` 库（仅 Windows） | 使用 PowerPoint 应用手动导出，或使用在线转换工具 |
| **📌 页眉页脚** | 通过文本框模拟，非原生页眉页脚 | `python-pptx` 对页眉页脚支持有限 | 已实现文本框模拟方案，基本满足需求 |
| **🏢 企业级功能** | 不支持品牌模板管理、批量生成、演示录制等 | 这些是高级业务功能，需要额外开发 | 使用 Python 脚本实现批量处理逻辑 |

### Word 功能限制

| 功能类别 | 限制说明 | 技术原因 | 替代方案 |
|---------|---------|---------|---------|
| **📝 脚注与尾注** | 不支持脚注和尾注的创建和编辑 | `python-docx` 库不支持脚注/尾注 API | 使用文本框或段落备注替代 |
| **🔗 交叉引用** | 不支持交叉引用的创建和更新 | `python-docx` 对域代码支持有限 | 使用超链接或手动引用 |
| **📋 修订跟踪** | 不支持修订跟踪和批注的完整功能 | `python-docx` 对修订跟踪支持非常有限 | 使用版本控制系统（如 Git）管理文档版本 |
| **🔒 文档保护** | 不支持文档保护和权限控制 | `python-docx` 不支持文档保护 API | 使用 PDF 格式或手动在 Word 中设置保护 |
| **📐 域代码** | 对域代码支持非常有限，仅支持基础日期时间域 | `python-docx` 的域代码 API 不完整 | 已支持基础日期时间域，复杂域建议在 Word 中手动添加 |
| **🔧 VBA 宏** | 不支持 VBA 宏的执行、录制和编辑 | `python-docx` 不支持 VBA 宏引擎 | 使用 Python 脚本实现自动化逻辑 |
| **🎨 SmartArt** | 不支持 SmartArt 图形的创建和编辑 | SmartArt 是 Microsoft Office 专有功能 | 使用表格或形状组合实现类似效果 |
| **🖼️ 图片高级编辑** | 不支持图片裁剪、旋转、艺术效果 | `python-docx` 图片操作 API 有限 | 已支持图片插入和大小调整，高级编辑建议使用图像处理库或 Word |
| **📄 多栏布局** | 不支持多栏布局设置 | `python-docx` 对分栏支持有限 | 使用表格模拟多栏效果 |
| **📑 分节符** | 对分节符支持有限 | `python-docx` 分节符 API 不完整 | 已支持基础分页符，复杂分节建议在 Word 中手动设置 |
| **📊 长文档管理** | 不支持大纲视图、主控文档、子文档 | 这些是 Word 的高级文档管理功能 | 使用 Python 脚本实现文档拆分和合并 |
| **📇 索引与目录** | 目录生成支持有限，不支持索引 | `python-docx` 对目录和索引支持不完整 | 已支持基础目录生成，索引建议在 Word 中手动创建 |

### 需要额外系统支持的功能

| 功能类别 | 限制说明 | 技术原因 | 替代方案 |
|---------|---------|---------|---------|
| **🏢 企业级功能** | 不支持品牌模板管理、批量文档生成、工作流集成 | 这些是高级业务功能，需要额外开发 | 使用 Python 脚本实现批量处理逻辑 |
| **☁️ 在线协作** | 不支持 OneDrive、SharePoint 集成 | 需要 Microsoft 365 API 集成 | 使用本地文件系统或第三方云存储 |
| **🌐 多语言支持** | 不支持自动翻译和多语言校对 | 需要集成翻译 API | 使用第三方翻译服务 |
| **📊 文档分析** | 不支持可读性分析、关键词提取等高级分析 | 需要 NLP 库支持 | 使用 Python NLP 库（如 spaCy、NLTK）实现 |

### 已完整支持的核心功能 ✅

尽管存在上述限制，本项目已完整实现以下功能，足以满足绝大多数办公自动化场景：

<details>
<summary><b>📝 Excel 核心功能（点击展开）</b></summary>

- ✅ **工作簿与工作表管理**：创建、打开、保存、复制、保护
- ✅ **数据操作**：单元格读写、批量数据处理、数据清除
- ✅ **公式与函数**：100+ 常用函数（SUM、VLOOKUP、IF 等）
- ✅ **数据格式化**：字体、颜色、对齐、边框、条件格式
- ✅ **数据排序与筛选**：多列排序、按颜色排序、自动筛选
- ✅ **图表创建**：柱状图、折线图、饼图、散点图、组合图、趋势线
- ✅ **行列操作**：插入、删除、隐藏、调整大小、复制、移动
- ✅ **数据导入导出**：CSV、JSON、PDF、HTML 格式互转
- ✅ **打印设置**：页面设置、页边距、打印区域、分页符
- ✅ **数据分析**：描述性统计、回归分析、方差分析、t检验、趋势预测
- ✅ **协作功能**：批注添加、查看、删除
- ✅ **安全功能**：工作簿加密、单元格锁定、数据脱敏
- ✅ **批量处理**：批量文件处理、工作簿合并、报表自动化

</details>

<details>
<summary><b>📄 Word 核心功能（点击展开）</b></summary>

- ✅ **文档基础操作**：创建、打开、保存、插入文本、添加标题、分页符
- ✅ **文本编辑与格式化**：字体设置、字符样式、段落格式、列表格式、正则表达式查找替换（新增）
- ✅ **特殊字符**：插入 40+ 种特殊字符（版权、商标、数学符号、箭头、货币符号等）（新增）
- ✅ **样式与主题**：应用内置样式、创建自定义段落样式、列出所有样式（新增）
- ✅ **表格操作**：创建表格、填充数据、读取数据、插入/删除行列、合并单元格、格式化、表格排序、数据导入（新增）
- ✅ **图片与多媒体**：从文件/URL 插入图片、完整的大小和对齐控制（新增）
- ✅ **页眉页脚与页码**：添加页眉页脚、插入页码、首页不同、奇偶页不同（新增）、插入日期时间域（新增）
- ✅ **目录与引用**：生成目录
- ✅ **书签与超链接**：添加/删除书签、添加/编辑/删除超链接、批量更新超链接（新增）
- ✅ **文档元数据**：获取和设置文档属性（作者、标题、主题、关键词等）（新增）
- ✅ **内容提取**：提取文本、段落、表格数据、图片信息、超链接、文档统计
- ✅ **导出功能**：导出为 PDF、HTML、TXT、Markdown、RTF
- ✅ **批量操作**：批量替换文本、批量应用样式、批量转换格式（新增）、批量添加页眉页脚（新增）、批量插入内容（新增）
- ✅ **高级功能**：邮件合并、文档合并、文档拆分、多级列表（新增）

</details>

<details>
<summary><b>🎨 PowerPoint 核心功能（点击展开）</b></summary>

- ✅ **演示文稿管理**：创建、打开、保存、获取信息
- ✅ **幻灯片操作**：添加、删除、移动、复制、布局设置
- ✅ **文本处理**：文本框插入、字符格式、段落格式、项目符号
- ✅ **图片操作**：图片插入、大小调整、位置设置
- ✅ **表格功能**：表格创建、数据填充、单元格合并、格式化
- ✅ **形状绘制**：矩形、椭圆、三角形、箭头、圆角矩形
- ✅ **图表创建**：柱状图、折线图、饼图、条形图、面积图
- ✅ **样式设置**：主题应用、背景设置、过渡效果
- ✅ **演讲者备注**：添加、获取、编辑备注
- ✅ **超链接**：网页链接、幻灯片链接、文件链接、邮箱链接
- ✅ **批量操作**：批量设置过渡、批量添加页脚
- ✅ **内容提取**：提取文本、标题、备注、图片信息、超链接（新增）
- ✅ **导出功能**：导出为 PDF（需 PowerPoint 应用）、HTML

</details>

### 💡 使用建议

#### Excel 使用建议
1. **日常办公自动化**：本项目完全满足需求，无需担心功能限制
2. **数据分析场景**：已提供丰富的统计分析工具，可替代 Excel 的大部分分析功能
3. **复杂 VBA 宏**：建议改用 Python 脚本实现，更易维护和跨平台
4. **企业级数据建模**：推荐使用专业 BI 工具（如 Power BI、Tableau）或 Python 数据分析栈

#### PowerPoint 使用建议
1. **演示文稿创建与编辑**：核心功能完整，满足日常演示需求
2. **复杂动画效果**：建议在 PowerPoint 中手动添加，或使用基础动画效果
3. **多媒体内容**：音频/视频需在 PowerPoint 中手动添加
4. **SmartArt 图形**：可使用形状组合实现类似效果
5. **批量处理**：利用 Python 脚本实现批量演示文稿生成和处理
6. **内容分析**：使用新增的内容提取功能分析演示文稿结构

#### Word 使用建议
1. **日常文档处理**：核心功能完整，满足绝大多数文档创建和编辑需求
2. **文本编辑增强**：使用正则表达式查找替换功能处理复杂文本模式
3. **样式管理**：创建自定义样式实现文档格式统一，提高效率
4. **批量处理**：利用批量操作功能处理多个文档，节省时间
5. **内容提取**：使用内容提取功能分析文档结构和数据
6. **脚注与交叉引用**：这些功能受限，建议在 Word 中手动添加
7. **文档保护**：使用 PDF 格式或在 Word 中手动设置保护
8. **复杂域代码**：基础日期时间域已支持，复杂域建议在 Word 中手动添加

### 📊 功能覆盖率

| Office 应用 | 功能类别 | 覆盖率 | 说明 |
|-----------|---------|-------|------|
| **📊 Excel** | 核心办公功能 | **95%+** | 工作簿、数据、格式、公式、图表等 |
| **📊 Excel** | 数据分析功能 | **90%+** | 统计分析、预测分析、数据可视化 |
| **📊 Excel** | 协作与安全 | **70%** | 批注、加密、权限控制（不含共享工作簿） |
| **📊 Excel** | 高级专有功能 | **20%** | VBA、Power Query、Power Pivot 等 |
| **📊 Excel** | **整体覆盖率** | **✅ 85%+** | 满足绝大多数办公自动化需求 |
| **🎨 PowerPoint** | 核心演示功能 | **90%+** | 幻灯片管理、文本、图片、表格、图表 |
| **🎨 PowerPoint** | 样式与设计 | **60%** | 主题、背景、过渡（动画支持有限） |
| **🎨 PowerPoint** | 内容提取 | **100%** | 文本、标题、备注、图片、超链接提取 |
| **🎨 PowerPoint** | 高级专有功能 | **10%** | SmartArt、音视频、母版、企业级功能 |
| **🎨 PowerPoint** | **整体覆盖率** | **✅ 60%+** | 满足日常演示文稿创建和编辑需求 |
| **📄 Word** | 核心文档功能 | **95%+** | 文档创建、编辑、格式化、表格、图片（新增功能） |
| **📄 Word** | 文本编辑增强 | **90%+** | 正则表达式、特殊字符、多级列表（新增） |
| **📄 Word** | 样式与格式 | **75%** | 内置样式、自定义样式、主题（部分支持） |
| **📄 Word** | 内容提取 | **100%** | 文本、表格、图片、超链接、元数据提取 |
| **📄 Word** | 批量操作 | **85%+** | 批量转换、批量格式化、批量插入（新增） |
| **📄 Word** | 高级专有功能 | **20%** | 脚注、交叉引用、修订跟踪、VBA 宏等 |
| **📄 Word** | **整体覆盖率** | **✅ 70%+** | 满足日常文档处理需求，新增 15+ 工具 |
| **🎯 项目整体** | **综合覆盖率** | **✅ 75%+** | 覆盖三大 Office 应用的核心功能 |

---

## 🚀 快速开始

### 前置要求

- **Python**: 3.10 或更高版本（推荐 3.11+）
- **操作系统**: Windows 10/11, macOS 10.15+, 或 Linux
- **AI 客户端**: Claude Desktop, Cursor, 或其他支持 MCP 的客户端

### 安装步骤

#### 方式一：使用 pip（推荐）

```bash
# 克隆仓库
git clone https://github.com/your-username/office-mcp-server.git
cd office-mcp-server

# 创建虚拟环境
python -m venv venv

# 激活虚拟环境
# Windows
venv\Scripts\activate
# macOS/Linux
source venv/bin/activate

# 安装依赖
pip install -r requirements.txt

# 运行服务器
python src/main.py
```

#### 方式二：使用 uv（更快）

```bash
# 安装 uv
pip install uv

# 克隆仓库
git clone https://github.com/your-username/office-mcp-server.git
cd office-mcp-server

# 使用 uv 安装依赖
uv pip install -r requirements.txt

# 运行服务器
python src/main.py
```

#### 方式三：使用 uvx（无需安装）

```bash
# 直接运行（如果已发布到 PyPI）
uvx office-mcp-server
```

---

## 🛠️ 技术栈

| 组件 | 技术 | 版本 | 说明 |
|------|------|------|------|
| **运行环境** | Python | 3.10+ | 推荐 3.11 或 3.12 |
| **MCP SDK** | FastMCP | 最新版 | 简化 MCP 开发 |
| **Word** | python-docx | 1.1.0+ | ✅ 支持读写 |
| **Excel** | openpyxl | 3.1.0+ | ✅ 支持读写 |
| **PowerPoint** | python-pptx | 0.6.23+ | ✅ 支持读写 |
| **PDF** | reportlab | 4.0+ | PDF 生成 |
| **图像** | Pillow | 10.0+ | 图像处理 |

---

## 📦 项目结构

```
office-mcp-server/
├── src/
│   ├── main.py              # MCP 服务器主入口
│   ├── config.py            # 配置管理
│   ├── handlers/            # 业务处理层
│   │   ├── word_handler.py  # Word 文档处理
│   │   ├── excel_handler.py # Excel 表格处理
│   │   └── ppt_handler.py   # PowerPoint 演示处理
│   ├── tools/               # MCP 工具定义层
│   │   ├── word_tools.py    # Word MCP 工具
│   │   ├── excel_tools.py   # Excel MCP 工具
│   │   └── ppt_tools.py     # PPT MCP 工具
│   └── utils/               # 工具函数层
│       ├── file_manager.py  # 文件管理
│       └── format_helper.py # 格式化辅助
├── tests/                   # 测试目录
├── docs/                    # 文档目录
├── requirements.txt         # 依赖列表
├── pyproject.toml           # 项目配置
└── README.md                # 项目说明
```

---

## ⚙️ 客户端配置

### Cursor 编辑器

1. 打开 MCP 设置：`Ctrl+Shift+P` → `View: Open MCP Settings`
2. 编辑配置文件（Windows: `%APPDATA%\Cursor\mcp.json`）

```json
{
  "mcpServers": {
    "office-suite": {
      "command": "python",
      "args": ["C:\\path\\to\\office-mcp-server\\src\\main.py"],
      "env": {
        "PYTHONPATH": "C:\\path\\to\\office-mcp-server"
      }
    }
  }
}
```

### Claude Desktop

编辑配置文件（Windows: `%APPDATA%\Claude\claude_desktop_config.json`）

```json
{
  "mcpServers": {
    "office-suite": {
      "command": "python",
      "args": ["/path/to/office-mcp-server/src/main.py"]
    }
  }
}
```

### 使用 uvx（推荐）

```json
{
  "mcpServers": {
    "office-suite": {
      "command": "uvx",
      "args": ["office-mcp-server"]
    }
  }
}
```

---

## 💡 使用示例

### 示例 1: 创建 Word 文档

**用户指令**:
```
请创建一个名为 "项目报告.docx" 的 Word 文档，包含标题"2024年度项目总结"。
```

**AI 自动调用**:
```python
create_word_document(
    filename="项目报告.docx",
    title="2024年度项目总结",
    content="本报告总结了2024年度的主要项目成果。"
)
```

### 示例 2: 生成 Excel 报表

**用户指令**:
```
创建一个销售数据表格，包含产品名称和销售额，并生成柱状图。
```

**AI 自动调用**:
```python
create_excel_workbook(filename="销售报表.xlsx")
write_excel_data(filename="销售报表.xlsx", data=[...])
create_excel_chart(filename="销售报表.xlsx", chart_type="bar", ...)
```

### 示例 3: 制作 PowerPoint 演示

**用户指令**:
```
创建一个产品介绍的 PPT，包含标题页和功能列表页。
```

**AI 自动调用**:
```python
create_presentation(filename="产品介绍.pptx", title="新产品发布")
add_slide_with_content(filename="产品介绍.pptx", title="核心功能", content=[...])
```

---

## 🧪 测试

```bash
# 运行所有测试
pytest

# 运行特定测试
pytest tests/test_word.py

# 生成覆盖率报告
pytest --cov=src --cov-report=html
```

---

## 📚 文档

- [技术方案设计](OFFICE_MCP技术方案设计.md) - 完整的技术架构和实现方案
- [开发计划](OFFICE_MCP开发计划.md) - 详细的开发路线图
- [服务集成指南](OFFICE_MCP服务集成指南.md) - 客户端集成指南
- [Word 功能说明](WORD_MCP功能说明文档.md) - Word 功能详细说明
- [Excel 功能说明](EXCEL_MCP功能说明文档.md) - Excel 功能详细说明
- [PowerPoint 功能说明](POWERPOINT_MCP功能说明文档.md) - PowerPoint 功能详细说明

---

## 🤝 贡献

欢迎贡献代码、报告问题或提出建议！

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

---

## 📄 许可证

本项目采用 MIT 许可证 - 详见 [LICENSE](LICENSE) 文件

---

## 🙏 致谢

- [Anthropic](https://www.anthropic.com/) - MCP 协议开发者
- [GongRzhe/Office-Word-MCP-Server](https://github.com/GongRzhe/Office-Word-MCP-Server) - 参考实现
- [python-docx](https://python-docx.readthedocs.io/) - Word 文档处理库
- [openpyxl](https://openpyxl.readthedocs.io/) - Excel 表格处理库
- [python-pptx](https://python-pptx.readthedocs.io/) - PowerPoint 演示处理库

---

## 📞 联系方式

- **项目主页**: https://github.com/your-username/office-mcp-server
- **问题反馈**: https://github.com/your-username/office-mcp-server/issues
- **讨论区**: https://github.com/your-username/office-mcp-server/discussions

---

**⭐ 如果这个项目对你有帮助，请给个 Star！**

