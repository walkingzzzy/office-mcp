# Office 全套 MCP 服务集成指南

## 一、MCP 协议概述

**MCP (Model Context Protocol)** 是由 Anthropic 推动的开放标准，旨在为大型语言模型应用提供标准化接口，使其能够连接外部数据源和工具，并与其交互。

通过 MCP 协议，可以将 **Microsoft Office 全套应用**（Word、Excel、PowerPoint）的功能集成到支持 MCP 的客户端（如 Cursor、Claude Desktop 等）中，实现 AI 驱动的智能文档处理、数据分析和演示文稿自动化。

### 为什么需要 Office 全套 MCP 服务？

- **Word**: 自动化文档生成、内容提取、格式化、报告编写
- **Excel**: 数据分析、图表生成、自动化报表、公式计算
- **PowerPoint**: 演示文稿创建、幻灯片设计、内容排版、批量生成

## 二、环境要求

### 必需软件

1. **Python**
   - 版本要求：Python 3.10 或更高版本（推荐 Python 3.11+）
   - Windows 安装：从 [python.org](https://www.python.org/) 下载安装包
   - macOS 安装：`brew install python@3.11`
   - Linux 安装：`sudo apt install python3.11 python3.11-venv`
   - 验证：`python --version` 或 `python3 --version`

2. **pip 包管理器**
   - 随 Python 自动安装
   - 验证：`pip --version` 或 `pip3 --version`
   - 升级：`pip install --upgrade pip`

3. **虚拟环境工具**（推荐）
   - 使用 `venv`（Python 内置）或 `uv`（现代化工具）
   - 验证：`python -m venv --help`

4. **Microsoft Office**
   - Windows 10/11 或 macOS
   - Microsoft Office 2016 或更高版本（推荐 Office 365）
   - 或安装对应的 Python 库即可（无需完整 Office 套件）

## 三、Office MCP 服务架构设计

### 整体架构

```
┌─────────────────────────────────────────────────────────┐
│           AI 客户端 (Claude, Cursor, VSCode)            │
└─────────────────────┬───────────────────────────────────┘
                      │ MCP 协议
                      │
┌─────────────────────▼───────────────────────────────────┐
│              Office MCP 统一服务器 (Python)              │
│  ┌──────────────┬──────────────┬──────────────┐        │
│  │  Word 模块   │  Excel 模块  │   PPT 模块   │        │
│  │ python-docx  │   openpyxl   │ python-pptx  │        │
│  └──────────────┴──────────────┴──────────────┘        │
└─────────────────────┬───────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────┐
│          Office 文档 (.docx, .xlsx, .pptx)              │
└─────────────────────────────────────────────────────────┘
```

### 模块化设计

建议采用**模块化架构**，每个 Office 应用对应一个独立模块：

1. **Word 模块** (`word_handler.py`)
   - 文档创建、编辑、格式化
   - 段落、标题、表格、图片处理
   - 样式管理、批注提取
   - 支持读取和写入现有文档

2. **Excel 模块** (`excel_handler.py`)
   - 工作簿/工作表管理
   - 单元格读写、公式计算
   - 图表生成（柱状图、折线图、饼图等）
   - 数据格式化、条件格式

3. **PowerPoint 模块** (`ppt_handler.py`)
   - 演示文稿创建、幻灯片管理
   - 文本框、形状、图片添加
   - 表格、图表插入
   - 幻灯片布局和主题

## 四、实现方式

### 方式一：快速验证 - 使用现有 Word MCP 服务器

#### 1. 获取服务器
- GitHub 仓库：`https://github.com/GongRzhe/Office-Word-MCP-Server`
- 详细信息：`https://www.flowhunt.io/zh/mcp-servers/office-word-mcp-server/`
- **Star**: 960+ | **Fork**: 154+ | **License**: MIT
- **技术栈**: Python + FastMCP + python-docx

#### 2. 安装步骤（Python版本）
```bash
# 克隆仓库
git clone https://github.com/GongRzhe/Office-Word-MCP-Server.git
cd Office-Word-MCP-Server

# 创建虚拟环境（推荐）
python -m venv venv
# Windows 激活
venv\Scripts\activate
# macOS/Linux 激活
source venv/bin/activate

# 安装依赖
pip install -r requirements.txt

# 或使用 uv（更快的包管理器）
pip install uv
uv pip install -r requirements.txt

# 运行服务器
python src/main.py
# 或使用 uvx（无需安装）
uvx office-word-mcp-server
```

#### 3. Word 模块功能特性
- 创建、编辑和管理 Microsoft Word 文档
- ✅ **支持读取和写入现有文档**（python-docx 优势）
- 支持丰富的文本格式（粗体、斜体、下划线、颜色）
- 支持表格和图像处理
- 段落样式、标题层级、列表（有序/无序）
- 文档合并、转PDF、批注提取
- 通过自然语言指令操作文档

### 方式二：完整实现 - 构建 Office 全套 MCP 服务

#### 项目结构

```
office-mcp-server/
├── src/
│   ├── main.py              # MCP 服务器主入口
│   ├── config.py            # 配置管理
│   ├── handlers/
│   │   ├── __init__.py
│   │   ├── word_handler.py  # Word 文档处理
│   │   ├── excel_handler.py # Excel 表格处理
│   │   └── ppt_handler.py   # PowerPoint 演示处理
│   ├── tools/
│   │   ├── __init__.py
│   │   ├── word_tools.py    # Word MCP 工具定义
│   │   ├── excel_tools.py   # Excel MCP 工具定义
│   │   └── ppt_tools.py     # PPT MCP 工具定义
│   └── utils/
│       ├── __init__.py
│       ├── file_manager.py  # 文件管理工具
│       └── format_helper.py # 格式化辅助函数
├── tests/                   # 测试目录
│   ├── __init__.py
│   ├── test_word.py
│   ├── test_excel.py
│   └── test_ppt.py
├── requirements.txt         # 依赖列表
├── pyproject.toml           # 项目配置（推荐）
├── .python-version          # Python 版本
└── README.md
```

#### 核心依赖安装

```bash
# 创建虚拟环境
python -m venv venv

# 激活虚拟环境
# Windows
venv\Scripts\activate
# macOS/Linux
source venv/bin/activate

# 安装核心依赖
pip install mcp python-docx openpyxl python-pptx

# 或使用 FastMCP（更简单的 MCP 框架）
pip install fastmcp python-docx openpyxl python-pptx

# 可选：图像处理
pip install Pillow

# 可选：PDF 转换
pip install python-docx-pdf reportlab

# 开发依赖
pip install pytest black ruff mypy

# 或使用 uv（推荐，更快）
pip install uv
uv pip install fastmcp python-docx openpyxl python-pptx
```

### 方式三：使用 uvx 运行（无需本地安装）

```json
{
  "mcpServers": {
    "word-document-server": {
      "command": "uvx",
      "args": ["office-word-mcp-server"]
    }
  }
}
```

## 五、客户端配置

### 完整配置示例（支持 Word + Excel + PPT）

#### Cursor 编辑器配置

1. **打开 MCP 设置**
   - 使用快捷键：`Ctrl+Shift+P`（Windows）或 `Cmd+Shift+P`（macOS）
   - 选择：`View: Open MCP Settings`
   - 选择：`Add Custom MCP`

2. **配置文件位置**
   - Windows：`%APPDATA%\Cursor\mcp.json` 或 `~/.cursor/mcp.json`
   - macOS：`~/Library/Application Support/Cursor/mcp.json`

3. **配置示例（Office 全套服务）**
```json
{
  "mcpServers": {
    "office-suite-server": {
      "command": "python",
      "args": ["C:\\path\\to\\office-mcp-server\\src\\main.py"],
      "env": {
        "PYTHONPATH": "C:\\path\\to\\office-mcp-server",
        "MCP_TRANSPORT": "stdio"
      }
    }
  }
}
```

4. **配置示例（仅 Word 服务，使用虚拟环境）**
```json
{
  "mcpServers": {
    "word-document-server": {
      "command": "C:\\path\\to\\office-mcp-server\\venv\\Scripts\\python.exe",
      "args": ["C:\\path\\to\\office-mcp-server\\src\\main.py"]
    }
  }
}
```

5. **配置示例（使用 uvx，无需安装）**
```json
{
  "mcpServers": {
    "word-document-server": {
      "command": "uvx",
      "args": ["office-word-mcp-server"]
    }
  }
}
```

### Claude Desktop 配置

1. **配置文件位置**
   - Windows：`%APPDATA%\Claude\claude_desktop_config.json`
   - macOS：`~/Library/Application Support/Claude/claude_desktop_config.json`

2. **配置内容（Python 方案）**
```json
{
  "mcpServers": {
    "office-suite-server": {
      "command": "python",
      "args": ["/path/to/office-mcp-server/src/main.py"]
    }
  }
}
```

3. **配置内容（使用 uvx）**
```json
{
  "mcpServers": {
    "word-document-server": {
      "command": "uvx",
      "args": ["office-word-mcp-server"]
    }
  }
}
```

### Visual Studio Code 配置

1. **安装扩展**
   - 安装 GitHub Copilot 扩展
   - 确保启用 MCP 支持

2. **配置设置**
   - 在 VSCode 设置中，确保 `chat.mcp.enabled` 已启用
   - 在工作区创建 `.vscode/mcp.json` 文件

## 五、MCP 服务器开发要点

### 核心技术栈

1. **Python 库**
   - `mcp` 或 `fastmcp`：MCP Python SDK（`pip install mcp` 或 `pip install fastmcp`）
   - `python-docx`：处理 Word 文档，支持读写（`pip install python-docx`）
   - `openpyxl`：处理 Excel 文档（`pip install openpyxl`）
   - `python-pptx`：处理 PowerPoint 文档（`pip install python-pptx`）
   - `Pillow`：图像处理（`pip install Pillow`，可选）
   - `reportlab`：PDF 生成（`pip install reportlab`，可选）

2. **推荐版本（2025年最新）**
   - Python: 3.10+ (推荐 3.11 或 3.12)
   - fastmcp: 最新版本
   - python-docx: 1.1.0+
   - openpyxl: 3.1.0+
   - python-pptx: 0.6.23+

3. **传输协议**
   - **stdio 传输**：标准输入输出（最常用）
   - **HTTP 传输**：基于 HTTP 的传输方式
   - **SSE 传输**：服务器发送事件

### MCP 服务器基本结构

#### 方案一：使用 FastMCP（推荐，更简单）

```python
# 基本框架示例 - 使用 FastMCP
from fastmcp import FastMCP
from docx import Document
import os

# 创建 MCP 服务器实例
mcp = FastMCP("office-mcp-server")

# 定义工具（Tools）
@mcp.tool()
def create_word_document(filename: str, content: str) -> str:
    """创建新的 Word 文档

    Args:
        filename: 文件名（包含 .docx 扩展名）
        content: 文档内容

    Returns:
        成功消息或错误信息
    """
    try:
        doc = Document()
        doc.add_paragraph(content)
        doc.save(filename)
        return f"成功创建文档: {filename}"
    except Exception as e:
        return f"创建文档失败: {str(e)}"

@mcp.tool()
def read_word_document(filename: str) -> str:
    """读取 Word 文档内容

    Args:
        filename: 文件名（包含 .docx 扩展名）

    Returns:
        文档内容或错误信息
    """
    try:
        doc = Document(filename)
        content = "\n".join([para.text for para in doc.paragraphs])
        return content
    except Exception as e:
        return f"读取文档失败: {str(e)}"

# 定义资源（Resources）
@mcp.resource("word://documents")
def list_word_documents() -> str:
    """列出当前目录下的所有 Word 文档"""
    docs = [f for f in os.listdir('.') if f.endswith('.docx')]
    return "\n".join(docs)

# 启动服务器
if __name__ == "__main__":
    mcp.run()
```

#### 方案二：使用标准 MCP SDK

```python
# 基本框架示例 - 使用标准 MCP SDK
from mcp.server import Server
from mcp.server.stdio import stdio_server
from mcp.types import Tool, Resource
from docx import Document

# 创建服务器实例
server = Server("office-mcp-server")

# 定义工具列表
@server.list_tools()
async def list_tools() -> list[Tool]:
    return [
        Tool(
            name="create_word_document",
            description="创建新的 Word 文档",
            inputSchema={
                "type": "object",
                "properties": {
                    "filename": {"type": "string"},
                    "content": {"type": "string"},
                },
                "required": ["filename", "content"]
            }
        )
    ]

# 定义工具调用处理
@server.call_tool()
async def call_tool(name: str, arguments: dict) -> str:
    if name == "create_word_document":
        filename = arguments["filename"]
        content = arguments["content"]
        try:
            doc = Document()
            doc.add_paragraph(content)
            doc.save(filename)
            return f"成功创建文档: {filename}"
        except Exception as e:
            return f"创建文档失败: {str(e)}"

    return "未知工具"

# 启动服务器
async def main():
    async with stdio_server() as (read_stream, write_stream):
        await server.run(read_stream, write_stream)

if __name__ == "__main__":
    import asyncio
    asyncio.run(main())
```

### 关键功能实现

1. **文档创建**
   - 使用 `python-docx` 库创建新文档
   - 设置文档格式和样式
   ```python
   from docx import Document
   doc = Document()
   doc.add_heading('标题', level=1)
   doc.add_paragraph('内容')
   doc.save('document.docx')
   ```

2. **文档编辑（Python 优势）**
   - ✅ **读取现有文档**（python-docx 支持，Node.js docx 不支持）
   - 修改内容、格式
   - 保存更改
   ```python
   from docx import Document
   doc = Document('existing.docx')  # 读取现有文档
   doc.add_paragraph('新增内容')
   doc.save('existing.docx')  # 保存修改
   ```

3. **文档管理**
   - 列出可用文档
   - 删除文档
   - 文档搜索
   ```python
   import os
   docs = [f for f in os.listdir('.') if f.endswith('.docx')]
   ```

## 六、测试和验证

1. **重启客户端**
   - 配置完成后，重启 Cursor 或 Claude Desktop

2. **验证连接**
   - 在命令面板中输入 "MCP" 查看是否成功加载
   - 检查 MCP 服务器状态

3. **功能测试**
   - 尝试通过自然语言创建文档
   - 测试编辑、格式化等功能
   - 验证表格和图像处理

## 七、相关资源

### 官方资源
- MCP 协议文档：Anthropic 官方文档
- MCP Python SDK：`https://github.com/modelcontextprotocol/python-sdk`
- FastMCP 框架：`https://github.com/jlowin/fastmcp`（推荐，更简单）
- Office-Word MCP 服务器：`https://github.com/GongRzhe/Office-Word-MCP-Server`（Python 实现，已验证可行）
- FlowHunt MCP 服务器列表：`https://www.flowhunt.io/zh/mcp-servers/`
- markitdown-mcp：微软推出的 Office 文件转 Markdown 的 MCP 服务器

### 其他 Office MCP 服务器
- **ONLYOFFICE 协作空间 MCP 服务器**：`https://www.onlyoffice.com/zh/mcp-server`
- 支持文档管理和协作功能

### Python 库文档
- `python-docx`：`https://python-docx.readthedocs.io/`
- `openpyxl`：`https://openpyxl.readthedocs.io/`
- `python-pptx`：`https://python-pptx.readthedocs.io/`
- `Pillow`：`https://pillow.readthedocs.io/`
- `reportlab`：`https://www.reportlab.com/docs/reportlab-userguide.pdf`

## 八、常见问题

1. **路径问题**
   - Windows 路径使用双反斜杠 `\\` 或正斜杠 `/`
   - 确保 Python 可执行文件路径正确
   - 使用虚拟环境时，指定虚拟环境中的 Python 路径

2. **依赖问题**
   - 确保所有 pip 依赖已安装（运行 `pip install -r requirements.txt`）
   - 使用 `requirements.txt` 或 `pyproject.toml` 管理依赖
   - 推荐使用虚拟环境隔离依赖

3. **虚拟环境问题**
   - 确保虚拟环境已激活
   - Windows: `venv\Scripts\activate`
   - macOS/Linux: `source venv/bin/activate`
   - 或在配置中直接指定虚拟环境的 Python 路径

4. **权限问题**
   - 确保有文件读写权限
   - 无需安装完整 Office 套件（使用纯 Python 库）

5. **连接问题**
   - 检查 MCP 服务器是否正常运行
   - 查看客户端日志排查问题
   - 确保 Python 版本 >= 3.10

6. **编码问题**
   - 确保文件使用 UTF-8 编码
   - 在 Python 文件开头添加：`# -*- coding: utf-8 -*-`

## 九、扩展开发建议

1. **支持更多 Office 应用**
   - Excel（使用 `openpyxl` 或 `xlsxwriter`）
   - PowerPoint（使用 `python-pptx`）
   - Outlook（使用 `pywin32` 或 `exchangelib`）
   - PDF（使用 `reportlab` 或 `pypdf`）

2. **增强功能**
   - 文档模板支持（使用 `python-docx-template`）
   - 批量操作（使用 Python 的并发库）
   - 文档转换（PDF、HTML 等，使用 `python-docx2pdf`、`pdfkit` 等）
   - 文档合并和拆分
   - OCR 文字识别（使用 `pytesseract`）

3. **性能优化**
   - 异步处理（使用 `asyncio`）
   - 缓存机制（使用 `functools.lru_cache`）
   - 错误处理和重试（使用 `tenacity`）
   - 多进程处理大文件（使用 `multiprocessing`）

4. **安全性增强**
   - 输入验证和清理
   - 文件路径验证（防止路径遍历攻击）
   - 访问控制和权限管理
   - 日志记录和审计

