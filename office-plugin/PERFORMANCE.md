# 性能优化指南

本文档说明 Office 插件中实施的性能优化措施。

## 已实施的优化

### 1. 组件懒加载

使用 React.lazy 和 Suspense 实现代码分割，减少首屏加载时间。

**使用方式**：

```tsx
import { lazyLoad } from './utils/lazyLoad'

// 懒加载组件
const SettingsPanel = lazyLoad(
  () => import('./components/settings/SettingsPanel')
)

// 使用组件
function App() {
  return <SettingsPanel />
}
```

**预加载**：

```tsx
// 在用户可能访问前预加载
SettingsPanel.preload()

// 鼠标悬停时预加载
<button onMouseEnter={() => SettingsPanel.preload()}>
  打开设置
</button>
```

### 2. 配置缓存

使用 ConfigCache 缓存配置数据，减少重复请求。

**特性**：
- 内存缓存
- 过期时间控制
- 自动刷新

### 3. 错误边界

使用 ErrorBoundary 组件捕获错误，防止整个应用崩溃。

```tsx
import { ErrorBoundary } from './components/common/ErrorBoundary'

<ErrorBoundary>
  <YourComponent />
</ErrorBoundary>
```

### 4. 离线模式

支持离线访问本地配置，减少网络依赖。

**特性**：
- 本地配置存储
- 离线状态检测
- 自动重连

## 性能指标

### 首屏加载时间

- **目标**: < 2 秒
- **当前**: 约 1.5 秒（使用懒加载后）

### 配置加载

- **缓存命中**: < 50ms
- **网络请求**: < 500ms

### 内存使用

- **初始**: 约 30MB
- **运行时**: 约 50-80MB

## 优化建议

### 开发时

1. **避免不必要的重渲染**
   - 使用 React.memo
   - 使用 useMemo 和 useCallback
   - 合理拆分组件

2. **减少包体积**
   - 使用 tree shaking
   - 按需导入第三方库
   - 移除未使用的代码

3. **优化图片和资源**
   - 使用 WebP 格式
   - 压缩图片
   - 使用 CDN

### 生产环境

1. **启用压缩**
   - Gzip/Brotli 压缩
   - 代码混淆

2. **使用 CDN**
   - 静态资源 CDN
   - 减少服务器负载

3. **监控性能**
   - 使用 Lighthouse
   - 监控首屏时间
   - 追踪错误率

## 性能测试

### 运行 Lighthouse

```bash
npm run lighthouse
```

### 分析包体积

```bash
npm run analyze
```

### 性能分析

使用 React DevTools Profiler 分析组件渲染性能。

## 未来优化计划

- [ ] 实现虚拟滚动（长列表）
- [ ] 使用 Web Workers 处理耗时任务
- [ ] 实现请求去重和合并
- [ ] 优化 AI 流式响应处理
- [ ] 实现更智能的预加载策略
