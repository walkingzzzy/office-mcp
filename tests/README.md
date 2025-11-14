# 测试文档

## 测试概述

本项目包含完整的测试套件,覆盖单元测试、集成测试和性能测试。

## 测试类型

### 1. 单元测试

**位置**: `bridge-server/src/__tests__/`

**测试框架**: Jest + ts-jest + Supertest

**运行方式**:
```bash
cd bridge-server
npm test                # 运行所有测试
npm run test:watch      # 监听模式
npm run test:coverage   # 生成覆盖率报告
```

**测试内容**:
- Express API端点测试
- MCP Client基础功能测试
- 错误处理测试
- 中间件测试

**覆盖率目标**: 70%+

### 2. 端到端通信测试

**位置**: `tests/e2e/bridge-communication.test.js`

**测试内容**:
- 健康检查接口
- 服务器信息接口
- 工具列表接口
- MCP工具调用
- 响应时间测试
- 错误处理
- 404处理

**运行方式**:
```bash
# 方式1: 使用脚本
.\run_e2e_test.bat

# 方式2: 直接运行
node tests\e2e\bridge-communication.test.js
```

**前提条件**:
- Bridge Server必须正在运行 (`npm run dev`)
- MCP Server必须可用

**测试流程**:
```
1. 检查Bridge Server可用性
2. 执行7个测试用例
3. 生成测试报告(JSON格式)
4. 输出测试结果汇总
```

**预期结果**:
- 所有测试通过率: 100%
- 平均响应时间: <500ms
- MCP工具调用成功

### 3. 性能基准测试

**位置**: `tests/e2e/performance-benchmark.test.js`

**测试内容**:
1. **健康检查延迟测试** (100次请求)
   - 平均延迟
   - P50/P90/P95/P99延迟

2. **工具调用延迟测试** (50次请求)
   - MCP工具调用延迟统计

3. **并发性能测试** (10并发 x 10请求)
   - 并发处理能力
   - 吞吐量 (req/s)

4. **压力测试** (持续30秒)
   - 最大吞吐量
   - 成功率
   - 延迟分布

**运行方式**:
```bash
# 方式1: 使用脚本
.\run_performance_test.bat

# 方式2: 直接运行
node tests\e2e\performance-benchmark.test.js
```

**前提条件**:
- Bridge Server必须正在运行
- MCP Server必须可用
- 测试期间不应有其他负载

**性能目标**:

| 指标 | 目标值 | 说明 |
|-----|--------|------|
| 平均延迟 | <100ms | 健康检查接口 |
| P95延迟 | <200ms | 健康检查接口 |
| P99延迟 | <500ms | 健康检查接口 |
| MCP调用延迟 | <1000ms | 工具调用接口 |
| 吞吐量 | >100 req/s | 并发测试 |
| 成功率 | >95% | 压力测试 |

## 测试结果

### 结果存储

测试结果自动保存在 `tests/results/` 目录:

- `e2e-test-{timestamp}.json`: 端到端测试结果
- `benchmark-{timestamp}.json`: 性能测试结果

### 结果格式

**端到端测试结果**:
```json
{
  "totalTests": 7,
  "passedTests": 7,
  "failedTests": 0,
  "tests": [
    {
      "name": "健康检查",
      "status": "passed",
      "duration": 45
    }
  ],
  "startTime": 1234567890,
  "endTime": 1234567900,
  "duration": 10000
}
```

**性能测试结果**:
```json
{
  "tests": [
    {
      "name": "健康检查延迟测试",
      "iterations": 100,
      "stats": {
        "mean": 85.5,
        "median": 82,
        "p95": 120,
        "p99": 150
      }
    }
  ]
}
```

## 测试最佳实践

### 运行测试前

1. **启动Bridge Server**:
   ```bash
   cd bridge-server
   npm run dev
   ```

2. **确认MCP Server可用**:
   ```bash
   # 测试健康检查
   curl http://localhost:3001/api/health
   ```

3. **检查依赖**:
   ```bash
   # Bridge Server依赖
   cd bridge-server
   npm install

   # E2E测试依赖(axios)
   npm install axios
   ```

### 单元测试最佳实践

1. **隔离测试**: 使用Jest Mock隔离外部依赖
2. **命名规范**: 测试文件命名为 `*.test.ts` 或 `*.spec.ts`
3. **断言清晰**: 使用明确的断言信息
4. **覆盖边界**: 测试正常、异常、边界情况

### E2E测试最佳实践

1. **独立性**: 每个测试用例应该独立,不依赖其他测试
2. **清理**: 测试后清理临时数据和资源
3. **超时设置**: 设置合理的超时时间
4. **错误处理**: 捕获并记录测试失败的详细信息

### 性能测试最佳实践

1. **环境稳定**: 在稳定的环境中运行
2. **预热**: 开始正式测试前进行预热
3. **多次运行**: 多次运行取平均值
4. **记录基线**: 建立性能基线以便对比

## 持续集成

### GitHub Actions配置

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v2
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'

      - name: Install dependencies
        run: |
          cd bridge-server
          npm install

      - name: Run unit tests
        run: |
          cd bridge-server
          npm run test:coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v2
```

## 故障排查

### 常见问题

**问题1: 无法连接到Bridge Server**

解决方案:
- 检查Bridge Server是否运行: `netstat -an | findstr 3001`
- 检查端口是否被占用
- 查看Bridge Server日志

**问题2: MCP工具调用失败**

解决方案:
- 检查MCP Server路径配置
- 检查Python环境
- 查看MCP Server日志

**问题3: 测试超时**

解决方案:
- 增加超时时间
- 检查网络连接
- 检查服务器负载

**问题4: 性能测试结果不稳定**

解决方案:
- 关闭其他程序减少干扰
- 多次运行取平均值
- 检查系统资源使用情况

## 测试覆盖率

查看详细的覆盖率报告:

```bash
cd bridge-server
npm run test:coverage
```

覆盖率报告生成在 `bridge-server/coverage/` 目录:
- `lcov-report/index.html`: HTML格式报告
- `coverage-final.json`: JSON格式数据

## 下一步

1. **增加前端测试**:
   - React组件测试
   - Office.js API测试

2. **增加集成测试**:
   - 文件上传/下载测试
   - WebSocket通信测试

3. **CI/CD集成**:
   - 自动化测试流程
   - 测试报告生成

4. **性能监控**:
   - 实时性能监控
   - 性能趋势分析

## 参考资料

- [Jest文档](https://jestjs.io/)
- [Supertest文档](https://github.com/visionmedia/supertest)
- [性能测试最佳实践](https://github.com/nodejs/benchmarking)
