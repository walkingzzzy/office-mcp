# Office AI Plugin 开发文档

## 架构概览

### 系统架构
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Office Add-in │    │   Bridge Server │    │   MCP Server    │
│   (Frontend)    │◄──►│   (Middleware)  │◄──►│   (Backend)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### 核心组件
- **MCP Server**: Python 后端服务，处理 Office 文档操作
- **Bridge Server**: Node.js 中间件，连接前端和后端
- **Office Add-in**: TypeScript 前端，Office 插件界面

## 项目结构

```
office-mcp-server/
├── src/office_mcp_server/          # Python 后端
│   ├── handlers/                   # 文档处理器
│   ├── tools/                      # 工具模块
│   └── utils/                      # 工具函数
├── bridge-server/                  # Node.js 中间件
├── office-addin/                   # Office 插件前端
│   ├── src/components/             # React 组件
│   ├── src/services/               # 服务层
│   └── src/utils/                  # 工具函数
├── tests/                          # 测试文件
└── docs/                           # 文档
```

## API 文档

### MCP Server API

#### Excel 处理器

##### 读取数据
```python
async def read_range(range_addr: str) -> Dict[str, Any]:
    """读取 Excel 范围数据"""
    # 实现细节
```

##### 写入数据
```python
async def write_range(range_addr: str, values: List[List[Any]]) -> Dict[str, Any]:
    """写入 Excel 范围数据"""
    # 实现细节
```

#### PowerPoint 处理器

##### 获取幻灯片信息
```python
async def get_slides_info() -> Dict[str, Any]:
    """获取幻灯片信息"""
    # 实现细节
```

##### 添加文本框
```python
async def add_text_box(slide_index: int, text: str, **kwargs) -> Dict[str, Any]:
    """添加文本框"""
    # 实现细节
```

### Bridge Server API

#### 代理请求
```javascript
app.post('/api/excel/:method', async (req, res) => {
  // 转发到 MCP Server
});
```

### Office Add-in API

#### 服务适配器
```typescript
interface IDocumentAdapter {
  getContent(): Promise<string>;
  setContent(content: string): Promise<void>;
  highlightRange(change: Change): Promise<void>;
}
```

## 开发环境设置

### 后端开发
```bash
# 创建虚拟环境
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 安装依赖
pip install -r requirements.txt

# 运行服务器
python src/office_mcp_server/main.py
```

### 前端开发
```bash
# 安装依赖
cd office-addin
npm install

# 开发模式
npm run dev

# 构建
npm run build
```

### 中间件开发
```bash
# 安装依赖
cd bridge-server
npm install

# 启动服务
npm start
```

## 测试指南

### 运行测试
```bash
# 单元测试
python run_tests.py unit

# 集成测试
python run_tests.py integration

# 所有测试
python run_tests.py all
```

### 测试覆盖率
```bash
pytest --cov=src/office_mcp_server --cov-report=html
```

## 贡献指南

### 代码规范
- Python: 遵循 PEP 8
- TypeScript: 使用 ESLint 和 Prettier
- 提交信息: 使用约定式提交

### 开发流程
1. Fork 项目
2. 创建功能分支
3. 编写代码和测试
4. 提交 Pull Request

### 代码审查
- 所有 PR 需要至少一个审查者
- 必须通过所有测试
- 代码覆盖率不能降低

## 性能优化

### 后端优化
- 使用批量操作
- 实现响应缓存
- 连接池管理

### 前端优化
- 组件懒加载
- 虚拟滚动
- 智能缓存

### 内存管理
- 及时释放资源
- 使用对象池
- 监控内存使用

## 部署指南

### 生产环境
```bash
# 构建后端
python setup.py build

# 构建前端
npm run build:prod

# 打包部署
python deploy.py --env production
```

### Docker 部署
```dockerfile
FROM python:3.9-slim
COPY . /app
WORKDIR /app
RUN pip install -r requirements.txt
CMD ["python", "src/office_mcp_server/main.py"]
```

## 故障排除

### 常见问题
1. **端口冲突**: 修改配置文件中的端口设置
2. **依赖缺失**: 重新安装依赖包
3. **权限问题**: 以管理员身份运行

### 调试技巧
- 启用详细日志
- 使用调试器
- 检查网络连接

## 扩展开发

### 添加新的文档处理器
1. 继承 `BaseHandler` 类
2. 实现必要的方法
3. 注册到服务器

### 添加新的前端组件
1. 创建 React 组件
2. 实现必要的接口
3. 添加到路由

### 添加新的工具
1. 在 `tools/` 目录创建模块
2. 实现工具函数
3. 编写测试用例

---

*本文档持续更新中*