# 快速启动指南

本指南帮助您快速启动和测试 Office MCP Server。

## 前提条件

确保已安装:
- Python 3.10 或更高版本
- pip (Python 包管理器)

## 快速开始

### 1. 激活虚拟环境

```bash
# Windows
venv\Scripts\activate

# macOS/Linux
source venv/bin/activate
```

### 2. 验证安装

```bash
# 检查 Python 版本
python --version

# 检查已安装的包
pip list
```

### 3. 运行测试

```bash
# 运行所有测试
pytest tests/ -v

# 查看测试覆盖率
pytest tests/ --cov=src --cov-report=html

# 打开覆盖率报告 (Windows)
start htmlcov\index.html
```

### 4. 启动 MCP 服务器

```bash
# 直接运行
python src/office_mcp_server/main.py

# 或使用命令行工具 (安装后可用)
office-mcp
```

## 开发工作流

### 代码格式化

```bash
# 使用 Black 格式化代码
black src/ tests/

# 检查代码风格
ruff check src/ tests/

# 类型检查
mypy src/
```

### 运行单个测试文件

```bash
# 测试配置模块
pytest tests/test_config.py -v

# 测试文件管理器
pytest tests/test_file_manager.py -v

# 测试格式化工具
pytest tests/test_format_helper.py -v
```

## 配置 MCP 客户端

### Cursor 编辑器

1. 打开 MCP 设置文件:
   - Windows: `%APPDATA%\Cursor\mcp.json`
   - macOS: `~/Library/Application Support/Cursor/mcp.json`

2. 添加配置:

```json
{
  "mcpServers": {
    "office-suite": {
      "command": "python",
      "args": ["C:\\path\\to\\office-mcp-server\\src\\office_mcp_server\\main.py"],
      "env": {
        "PYTHONPATH": "C:\\path\\to\\office-mcp-server"
      }
    }
  }
}
```

### Claude Desktop

1. 打开配置文件:
   - Windows: `%APPDATA%\Claude\claude_desktop_config.json`
   - macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`

2. 添加配置:

```json
{
  "mcpServers": {
    "office-suite": {
      "command": "python",
      "args": ["C:\\path\\to\\office-mcp-server\\src\\office_mcp_server\\main.py"]
    }
  }
}
```

## 环境变量配置

创建 `.env` 文件 (可选):

```env
# 服务器配置
SERVER_NAME=office-mcp-server
SERVER_VERSION=1.0.0
LOG_LEVEL=INFO
MAX_FILE_SIZE=104857600

# 路径配置
TEMP_DIR=temp
OUTPUT_DIR=output
TEMPLATE_DIR=templates

# Word 配置
WORD_DEFAULT_FONT=宋体
WORD_DEFAULT_FONT_SIZE=12
WORD_DEFAULT_LINE_SPACING=1.5

# Excel 配置
EXCEL_DEFAULT_SHEET_NAME=Sheet1
EXCEL_MAX_ROWS=1048576
EXCEL_MAX_COLS=16384

# PowerPoint 配置
PPT_DEFAULT_WIDTH=9144000
PPT_DEFAULT_HEIGHT=6858000
PPT_DEFAULT_THEME=Office Theme
```

## 测试 MCP 工具

启动服务器后,可以使用以下工具:

### 1. 获取服务器信息

```python
# MCP 工具调用
get_server_info()
```

返回:
```json
{
  "name": "office-mcp-server",
  "version": "1.0.0",
  "log_level": "INFO",
  "supported_formats": {
    "word": [".docx", ".doc"],
    "excel": [".xlsx", ".xls"],
    "powerpoint": [".pptx", ".ppt"]
  }
}
```

### 2. 创建 Word 文档 (占位符)

```python
# MCP 工具调用
create_word_document(
    filename="test.docx",
    title="测试文档",
    content="这是一个测试文档"
)
```

### 3. 创建 Excel 工作簿 (占位符)

```python
# MCP 工具调用
create_excel_workbook(
    filename="test.xlsx",
    sheet_name="数据表"
)
```

### 4. 创建 PowerPoint 演示 (占位符)

```python
# MCP 工具调用
create_presentation(
    filename="test.pptx",
    title="产品介绍"
)
```

## 故障排除

### 问题: ModuleNotFoundError

```bash
# 重新安装项目
pip install -e .
```

### 问题: 测试失败

```bash
# 清理缓存并重新运行
pytest --cache-clear tests/ -v
```

### 问题: 虚拟环境未激活

```bash
# 检查命令提示符前是否有 (venv)
# 如果没有,重新激活虚拟环境
venv\Scripts\activate  # Windows
```

### 问题: 依赖包版本冲突

```bash
# 重新创建虚拟环境
deactivate
rm -rf venv  # Linux/macOS
rmdir /s venv  # Windows

python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

## 日志查看

服务器日志默认输出到控制台,格式如下:

```
2025-11-11 18:00:00 | INFO     | office_mcp_server.main:main:149 - 启动 office-mcp-server v1.0.0
2025-11-11 18:00:00 | INFO     | office_mcp_server.main:main:150 - 日志级别: INFO
```

## 性能监控

### 查看测试覆盖率

```bash
pytest tests/ --cov=src --cov-report=term-missing
```

### 查看详细日志

设置环境变量:
```bash
# Windows
set LOG_LEVEL=DEBUG

# Linux/macOS
export LOG_LEVEL=DEBUG
```

## 下一步

完成基础设置后:
1. 查看 [开发计划文档](../OFFICE_MCP开发计划.md)
2. 阅读 [阶段一完成报告](PHASE1_COMPLETION_REPORT.md)
3. 开始实现 Word 功能 (阶段二)

## 获取帮助

- 查看项目文档: `docs/` 目录
- 查看测试用例: `tests/` 目录
- 查看配置示例: `pyproject.toml` 和 `.env`

---

**更新时间:** 2025年11月11日
**文档版本:** v1.0
