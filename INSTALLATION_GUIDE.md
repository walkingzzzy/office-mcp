# Office AI Plugin 安装指南

## 系统要求

### 最低要求
- **操作系统**: Windows 10 (版本 1903 或更高) / Windows 11
- **Office 版本**: Microsoft Office 2016 或更高版本
- **Python**: Python 3.8 或更高版本
- **Node.js**: Node.js 14.0 或更高版本
- **内存**: 至少 4GB RAM
- **存储空间**: 至少 500MB 可用空间
- **网络**: 稳定的互联网连接

### 推荐配置
- **操作系统**: Windows 11
- **Office 版本**: Microsoft Office 365 或 Office 2021
- **Python**: Python 3.9+
- **Node.js**: Node.js 16.0+
- **内存**: 8GB RAM 或更多
- **存储空间**: 1GB 可用空间

## 安装前准备

### 1. 检查 Office 版本
1. 打开任意 Office 应用程序（Excel、Word、PowerPoint）
2. 点击 **文件** → **账户** → **关于**
3. 确认版本号为 2016 或更高

### 2. 安装 Python
1. 访问 [Python 官网](https://www.python.org/downloads/)
2. 下载 Python 3.8+ 版本
3. 运行安装程序，**务必勾选 "Add Python to PATH"**
4. 验证安装：打开命令提示符，输入 `python --version`

### 3. 安装 Node.js
1. 访问 [Node.js 官网](https://nodejs.org/)
2. 下载 LTS 版本
3. 运行安装程序
4. 验证安装：打开命令提示符，输入 `node --version`

## 安装步骤

### 方法一：自动安装（推荐）

1. **下载安装包**
   - 从官网下载 `office-ai-plugin-1.0.0.zip`
   - 解压到任意目录（建议：`C:\Program Files\OfficeAIPlugin`）

2. **运行安装脚本**
   ```cmd
   # 右键点击 install.bat，选择"以管理员身份运行"
   install.bat
   ```

3. **等待安装完成**
   - 脚本会自动安装所有依赖
   - 看到 "安装完成！" 提示即表示成功

4. **启动服务**
   ```cmd
   # 双击运行
   start.bat
   ```

### 方法二：手动安装

#### 步骤 1：安装后端服务
```cmd
# 进入后端目录
cd backend

# 创建虚拟环境
python -m venv venv

# 激活虚拟环境
venv\Scripts\activate.bat

# 安装依赖
pip install -r requirements.txt
```

#### 步骤 2：安装中间件
```cmd
# 进入中间件目录
cd bridge

# 安装依赖
npm install
```

#### 步骤 3：配置服务
1. 复制 `config.json.example` 为 `config.json`
2. 根据需要修改配置参数

#### 步骤 4：启动服务
```cmd
# 启动后端（新命令窗口）
cd backend
venv\Scripts\activate.bat
python src\office_mcp_server\main.py

# 启动中间件（新命令窗口）
cd bridge
npm start
```

## Office 插件配置

### 1. 启用开发者模式
1. 打开 Office 应用程序
2. 点击 **文件** → **选项** → **信任中心** → **信任中心设置**
3. 选择 **受信任的加载项目录**
4. 添加插件目录路径

### 2. 加载插件清单
1. 在 Office 中按 `Ctrl + F12` 打开开发者工具
2. 选择 **加载项** → **我的加载项** → **开发人员加载项**
3. 选择 `manifest.xml` 文件

### 3. 验证插件加载
1. 在 Office 功能区查看是否出现 "AI Assistant" 选项卡
2. 点击选项卡，确认插件界面正常显示

## 配置说明

### 配置文件位置
- 主配置：`config.json`
- 用户配置：`%APPDATA%\OfficeAIPlugin\user-config.json`
- 日志配置：`logs\app.log`

### 主要配置项
```json
{
  "server": {
    "host": "localhost",
    "port": 8000,
    "debug": false
  },
  "bridge": {
    "host": "localhost",
    "port": 3000
  },
  "logging": {
    "level": "INFO",
    "file": "logs/app.log"
  }
}
```

### 端口配置
- **后端服务**: 默认端口 8000
- **中间件**: 默认端口 3000
- 如需修改，请同时更新 `config.json` 和插件配置

## 验证安装

### 1. 检查服务状态
```cmd
# 检查后端服务
curl http://localhost:8000/health

# 检查中间件
curl http://localhost:3000/health
```

### 2. 测试插件功能
1. 打开 Excel
2. 点击 "AI Assistant" 选项卡
3. 尝试使用任意功能
4. 确认功能正常工作

### 3. 查看日志
- 后端日志：`logs\mcp-server.log`
- 中间件日志：`logs\bridge-server.log`
- 插件日志：浏览器开发者工具控制台

## 常见问题解决

### 问题 1：Python 未找到
**错误信息**: `'python' 不是内部或外部命令`

**解决方案**:
1. 重新安装 Python，确保勾选 "Add Python to PATH"
2. 或手动添加 Python 到系统 PATH
3. 重启命令提示符

### 问题 2：端口被占用
**错误信息**: `Port 8000 is already in use`

**解决方案**:
1. 查找占用端口的进程：`netstat -ano | findstr :8000`
2. 终止进程：`taskkill /PID <进程ID> /F`
3. 或修改配置文件使用其他端口

### 问题 3：Office 插件未加载
**现象**: Office 中看不到 AI Assistant 选项卡

**解决方案**:
1. 检查插件清单文件路径
2. 确认 Office 信任设置
3. 重启 Office 应用程序
4. 检查浏览器控制台错误信息

### 问题 4：权限不足
**错误信息**: `Access denied` 或 `Permission error`

**解决方案**:
1. 以管理员身份运行安装脚本
2. 检查文件夹权限设置
3. 关闭杀毒软件临时保护

### 问题 5：网络连接问题
**现象**: 插件无法连接到服务

**解决方案**:
1. 检查防火墙设置
2. 确认服务正在运行
3. 验证端口配置正确
4. 检查网络代理设置

## 卸载指南

### 完全卸载
1. 停止所有服务：运行 `stop.bat`
2. 从 Office 中移除插件
3. 删除安装目录
4. 清理注册表项（可选）
5. 删除用户配置文件

### 保留配置卸载
1. 停止服务
2. 仅删除程序文件
3. 保留 `config.json` 和用户数据

## 更新升级

### 自动更新
1. 插件会自动检查更新
2. 有新版本时会显示通知
3. 点击通知进行自动更新

### 手动更新
1. 下载新版本安装包
2. 停止当前服务
3. 备份配置文件
4. 解压新版本覆盖旧文件
5. 恢复配置文件
6. 重新启动服务

## 技术支持

### 获取帮助
- **文档**: 查看 `docs/` 目录下的详细文档
- **日志**: 检查 `logs/` 目录下的日志文件
- **社区**: 访问用户论坛获取帮助

### 联系支持
- **邮箱**: support@officeaiplugin.com
- **电话**: 400-123-4567
- **在线客服**: https://support.officeaiplugin.com

### 报告问题
1. 收集错误信息和日志
2. 描述重现步骤
3. 提供系统环境信息
4. 通过 GitHub Issues 或邮件报告

---

*安装过程中如遇问题，请参考故障排除部分或联系技术支持*