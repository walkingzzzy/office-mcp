# Office MCP Server 日志系统说明

## 📋 概述

Office MCP Server 使用 [Loguru](https://github.com/Delgan/loguru) 作为日志框架，提供强大的日志记录和管理功能。

## 🎯 日志功能

### 双重日志输出

1. **控制台日志**（彩色输出）
   - 实时显示服务器运行状态
   - 彩色格式便于快速识别日志级别
   - 适合开发和调试

2. **文件日志**（持久化存储）
   - 主日志文件：`logs/office_mcp_server.log`
   - 错误日志文件：`logs/error.log`
   - 自动轮转和压缩
   - 适合生产环境和问题追踪

## 📁 日志文件

### 主日志文件
- **路径**: `logs/office_mcp_server.log`
- **内容**: 所有级别的日志（INFO, WARNING, ERROR 等）
- **格式**: `时间 | 级别 | 模块:函数:行号 - 消息`
- **示例**:
  ```
  2025-11-12 12:40:17 | INFO | __main__:main:95 - 启动 office-mcp-server v1.0.0
  ```

### 错误日志文件
- **路径**: `logs/error.log`
- **内容**: 仅记录 ERROR 级别及以上的日志
- **特点**: 
  - 包含完整的异常堆栈信息
  - 显示变量值（diagnose=True）
  - 便于快速定位错误

## ⚙️ 日志配置

### 环境变量配置

在 `.env` 文件中配置（参考 `.env.example`）:

```bash
# 是否启用文件日志
LOG_TO_FILE=true

# 日志级别 (DEBUG, INFO, WARNING, ERROR, CRITICAL)
LOG_LEVEL=INFO

# 日志轮转大小
LOG_ROTATION=10 MB

# 日志保留时间
LOG_RETENTION=7 days

# 日志压缩格式
LOG_COMPRESSION=zip

# 日志目录
LOGS_DIR=logs
```

### 配置说明

| 配置项 | 说明 | 默认值 | 示例 |
|--------|------|--------|------|
| `LOG_TO_FILE` | 是否输出到文件 | `true` | `true`, `false` |
| `LOG_LEVEL` | 日志级别 | `INFO` | `DEBUG`, `INFO`, `WARNING`, `ERROR` |
| `LOG_ROTATION` | 日志轮转大小 | `10 MB` | `10 MB`, `100 MB`, `1 GB` |
| `LOG_RETENTION` | 日志保留时间 | `7 days` | `7 days`, `1 week`, `1 month` |
| `LOG_COMPRESSION` | 压缩格式 | `zip` | `zip`, `gz`, `tar.gz` |
| `LOGS_DIR` | 日志目录 | `logs` | 任意路径 |

## 🔍 查看日志

### 方法 1: 使用日志查看工具（推荐）

运行 `view_logs.bat`:

```bash
view_logs.bat
```

功能菜单:
1. 查看最新日志 (最后50行)
2. 查看错误日志 (最后50行)
3. 查看完整日志
4. 查看完整错误日志
5. 清空日志文件
6. 退出

### 方法 2: 直接查看文件

**Windows PowerShell**:
```powershell
# 查看最新日志
Get-Content logs\office_mcp_server.log -Tail 50

# 查看错误日志
Get-Content logs\error.log -Tail 50

# 实时监控日志
Get-Content logs\office_mcp_server.log -Wait -Tail 10
```

**Git Bash / Linux**:
```bash
# 查看最新日志
tail -n 50 logs/office_mcp_server.log

# 查看错误日志
tail -n 50 logs/error.log

# 实时监控日志
tail -f logs/office_mcp_server.log
```

## 🛠️ 日志管理

### 日志轮转

当日志文件达到指定大小时，会自动创建新文件并压缩旧文件:

```
logs/
├── office_mcp_server.log          # 当前日志
├── office_mcp_server.2025-11-12.log.zip  # 已压缩的旧日志
└── error.log                      # 当前错误日志
```

### 日志清理

旧日志会根据 `LOG_RETENTION` 配置自动删除。

手动清理:
```bash
# 使用日志查看工具
view_logs.bat  # 选择选项 5

# 或直接删除
del logs\*.log
```

## 📊 日志级别

| 级别 | 用途 | 示例 |
|------|------|------|
| `DEBUG` | 详细调试信息 | 函数参数、变量值 |
| `INFO` | 一般信息 | 服务启动、工具注册 |
| `WARNING` | 警告信息 | 配置缺失、性能问题 |
| `ERROR` | 错误信息 | 操作失败、异常 |
| `CRITICAL` | 严重错误 | 系统崩溃 |

## 🔧 故障排查

### 问题: 日志文件未创建

**检查**:
1. 确认 `LOG_TO_FILE=true`
2. 检查 `logs/` 目录是否存在
3. 检查文件权限

**解决**:
```bash
# 手动创建日志目录
mkdir logs
```

### 问题: 日志文件过大

**解决**:
1. 调整 `LOG_ROTATION` 为更小的值
2. 减少 `LOG_RETENTION` 时间
3. 降低 `LOG_LEVEL` (如从 DEBUG 改为 INFO)

### 问题: 找不到错误信息

**查看错误日志**:
```bash
# 查看所有错误
type logs\error.log

# 或使用日志查看工具
view_logs.bat
```

## 💡 最佳实践

1. **生产环境**: 
   - 设置 `LOG_LEVEL=INFO`
   - 启用文件日志 `LOG_TO_FILE=true`
   - 定期检查错误日志

2. **开发环境**:
   - 设置 `LOG_LEVEL=DEBUG`
   - 可以禁用文件日志以提高性能

3. **调试问题**:
   - 先查看 `error.log`
   - 如需更多信息，查看完整日志
   - 使用 `DEBUG` 级别获取详细信息

4. **日志归档**:
   - 定期备份重要日志
   - 使用版本控制系统管理配置变更

## 📞 相关资源

- [Loguru 文档](https://loguru.readthedocs.io/)
- [项目主 README](../README.md)
- [配置说明](../README.md#配置)

