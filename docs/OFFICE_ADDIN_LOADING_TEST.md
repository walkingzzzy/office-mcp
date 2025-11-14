# Office插件加载测试指南

## 📋 测试目的

验证Office Add-in能够在Word、Excel、PowerPoint三个应用中成功加载并正常运行。

## 🔧 前提条件

### 1. 环境准备
- ✅ Windows 10/11 或 macOS 12+
- ✅ Office 2016及以上版本(或Office 365)
- ✅ Node.js 18+ 已安装
- ✅ 开发者模式已启用

### 2. 启用Office开发者模式

**Windows**:
1. 信任Microsoft Store加载项中心
2. 启用侧载加载项功能

**macOS**:
```bash
defaults write com.microsoft.Word OfficeWebAddinDeveloperExtras -bool true
defaults write com.microsoft.Excel OfficeWebAddinDeveloperExtras -bool true
defaults write com.microsoft.Powerpoint OfficeWebAddinDeveloperExtras -bool true
```

### 3. 安装依赖

```bash
cd office-addin
npm install
```

## 🚀 测试步骤

### 步骤1: 启动开发服务器

```bash
cd office-addin
npm run dev
```

**预期结果**:
- ✅ Webpack开发服务器启动成功
- ✅ 监听端口: https://localhost:3000
- ✅ 控制台输出: "Compiled successfully"

### 步骤2: 配置SSL证书(首次使用)

Office要求HTTPS连接,需要信任本地开发证书:

**Windows**:
```bash
# 使用管理员权限运行
npm install -g office-addin-dev-certs
office-addin-dev-certs install
```

**macOS**:
```bash
npm install -g office-addin-dev-certs
office-addin-dev-certs install --machine
```

### 步骤3: 侧载插件

#### 方法1: 使用Office Desktop (推荐)

**Word测试**:
1. 打开Microsoft Word
2. 点击"插入" → "加载项" → "我的加载项"
3. 点击"上传我的加载项"
4. 选择文件: `office-addin/manifest.xml`
5. 点击"上传"

**Excel测试**:
1. 打开Microsoft Excel
2. 重复上述步骤

**PowerPoint测试**:
1. 打开Microsoft PowerPoint
2. 重复上述步骤

#### 方法2: 使用Office Online (备选)

1. 访问 https://www.office.com
2. 登录Microsoft账号
3. 打开Word/Excel/PowerPoint Online
4. 点击"插入" → "Office加载项"
5. 上传manifest.xml

### 步骤4: 验证插件加载

**检查清单**:

1. **插件图标显示**
   - ✅ 功能区"主页"选项卡出现"AI 助手"组
   - ✅ "打开 AI 助手"按钮可见

2. **打开任务窗格**
   - ✅ 点击"打开 AI 助手"按钮
   - ✅ 右侧任务窗格打开
   - ✅ 显示标题"Office AI 助手"

3. **UI正常渲染**
   - ✅ TaskPane组件正确显示
   - ✅ 按钮样式正常
   - ✅ 无JavaScript错误(查看浏览器控制台)

4. **网络连接测试**
   - ✅ 打开浏览器开发者工具(F12)
   - ✅ 切换到Console标签
   - ✅ 查看是否有网络请求错误

### 步骤5: 基础功能测试

**测试用例1: 健康检查**
```javascript
// 在浏览器控制台执行
fetch('http://localhost:3000/api/health')
  .then(r => r.json())
  .then(console.log)
```

**预期输出**:
```json
{
  "status": "healthy",
  "timestamp": "2025-01-13T..."
}
```

**测试用例2: Office.js可用性**
```javascript
// 在浏览器控制台执行
console.log(Office.context.host); // 应该输出: 1 (Word), 2 (Excel), 4 (PowerPoint)
console.log(Office.context.platform); // 应该输出: 0 (PC), 1 (Mac)
```

## 📊 测试报告模板

### 测试环境
- 操作系统: Windows 11 / macOS 13
- Office版本: Office 365 / Office 2021
- 浏览器: Chrome 120 / Edge 120
- 测试日期: 2025-01-13

### 测试结果

| 测试项 | Word | Excel | PowerPoint | 备注 |
|--------|------|-------|------------|------|
| 插件加载 | ✅ | ✅ | ✅ | |
| 任务窗格打开 | ✅ | ✅ | ✅ | |
| UI正常显示 | ✅ | ✅ | ✅ | |
| 网络连接 | ✅ | ✅ | ✅ | |
| Office.js可用 | ✅ | ✅ | ✅ | |

### 发现的问题

1. **问题描述**:
   - 严重程度: 高/中/低
   - 复现步骤:
   - 错误信息:
   - 截图:

## 🐛 常见问题排查

### 问题1: 插件无法加载

**症状**: 上传manifest.xml后没有反应

**解决方案**:
1. 检查manifest.xml格式是否正确
2. 验证SourceLocation URL是否可访问: https://localhost:3000/taskpane.html
3. 确认SSL证书已信任
4. 重启Office应用

### 问题2: 任务窗格空白

**症状**: 任务窗格打开但内容为空

**解决方案**:
1. 打开浏览器开发者工具查看错误
2. 检查webpack dev server是否运行
3. 验证CORS配置
4. 清除Office缓存

**Windows清除缓存**:
```bash
rd /s /q %LOCALAPPDATA%\Microsoft\Office\16.0\Wef
```

**macOS清除缓存**:
```bash
rm -rf ~/Library/Containers/com.microsoft.*/Data/Library/Caches/com.microsoft.*/WebKit
```

### 问题3: CORS错误

**症状**: 控制台显示"Access-Control-Allow-Origin"错误

**解决方案**:
1. 确认Bridge Server已启动
2. 检查Bridge Server CORS配置
3. 验证请求URL正确

### 问题4: SSL证书错误

**症状**: "此网站的安全证书存在问题"

**解决方案**:
1. 重新安装开发证书:
   ```bash
   office-addin-dev-certs install --force
   ```
2. 手动信任证书:
   - Windows: 导入到"受信任的根证书颁发机构"
   - macOS: 在"钥匙串访问"中设为"始终信任"

## 📝 测试检查清单

### 加载前检查
- [ ] webpack dev server运行正常
- [ ] https://localhost:3000 可访问
- [ ] SSL证书已信任
- [ ] Office应用已打开

### 加载过程检查
- [ ] manifest.xml上传成功
- [ ] 插件图标出现在功能区
- [ ] 任务窗格可以打开
- [ ] 无控制台错误

### 功能验证检查
- [ ] Office.context可用
- [ ] Office.context.host正确
- [ ] 网络请求成功
- [ ] UI交互正常

### 跨应用验证
- [ ] Word中测试通过
- [ ] Excel中测试通过
- [ ] PowerPoint中测试通过

### 跨平台验证(可选)
- [ ] Windows平台测试通过
- [ ] macOS平台测试通过
- [ ] Office Online测试通过

## 🎯 成功标准

插件加载测试通过的标准:

1. ✅ **100%加载成功率**: 在Word、Excel、PowerPoint三个应用中都能成功加载
2. ✅ **UI正常显示**: 任务窗格正确渲染,无布局错误
3. ✅ **Office.js可用**: Office API可以正常调用
4. ✅ **网络连接正常**: 能够与Bridge Server通信
5. ✅ **无JavaScript错误**: 浏览器控制台无报错

## 📞 支持

如果遇到问题:
1. 查看本文档的"常见问题排查"章节
2. 查看浏览器控制台错误信息
3. 查看webpack dev server日志
4. 记录详细的错误信息和复现步骤

## 📚 参考资料

- [Office Add-ins官方文档](https://learn.microsoft.com/en-us/office/dev/add-ins/)
- [侧载Office加载项](https://learn.microsoft.com/en-us/office/dev/add-ins/testing/test-debug-office-add-ins)
- [Office.js API参考](https://learn.microsoft.com/en-us/javascript/api/office)
