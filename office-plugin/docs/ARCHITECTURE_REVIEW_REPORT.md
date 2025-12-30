# Office 插件代码架构审查报告（更新版）

**审查日期**: 2025-12-30  
**审查范围**: `office-plugin/src/` 目录  
**参考文档**: `OPTIMIZATION_PLAN.md`, `PERFORMANCE_REVIEW_REPORT.md`

---

## 📊 臃肿程度评估

### 总体评分: **5.5/10** (中等)

> ⚠️ 注意：项目已有详细的优化计划文档，部分性能优化已实施。本报告基于当前代码实际状态。

| 维度 | 评分 | 说明 |
|------|------|------|
| 依赖冗余 | 7/10 | 双 UI 库 + 双图标库（已识别，待处理） |
| 代码组织 | 5/10 | 目录结构合理，存在少量空目录 |
| 状态管理 | 5/10 | 7 个 Store，有合并计划但尚未执行 |
| 性能优化 | 3/10 | ✅ 多项性能优化已实施 |
| 死代码 | 6/10 | 知识库连接器确认为死代码 |

---

## ✅ 已实施的优化（来自 PERFORMANCE_REVIEW_REPORT.md）

以下优化已在代码中确认实施：

| 优化项 | 文件 | 状态 |
|--------|------|------|
| ToolDefinitionCache TTL 延长至 30 分钟 | `ToolDefinitionCache.ts` | ✅ 已实施 |
| MCP 工具并行获取 (Promise.all) | `useToolExecution.ts` | ✅ 已实施 |
| WordAdapter 选区上下文并行获取 | `WordAdapter.ts` | ✅ 已实施 |
| 流式 UI 更新 requestAnimationFrame 节流 | `useStreamProcessor.ts` | ✅ 已实施 |
| 状态管理拆分 (P6/P7) | 多个 hooks | ✅ 已实施 |

---

## 🔴 P0 - 待处理问题（来自 OPTIMIZATION_PLAN.md）

### 1. UI 组件库冗余

**状态**: ⏳ 已识别，待处理

**当前情况**:
- `@fluentui/react-components`: 用于 organisms 层 (15 处)
- `@radix-ui/*` (11 个包): 用于 `src/components/ui/` shadcn 风格组件

**实际使用统计**:
| Radix 组件 | 使用文件 |
|-----------|---------|
| `react-slot` | button.tsx, badge.tsx |
| `react-dialog` | dialog.tsx |
| `react-scroll-area` | scroll-area.tsx |
| `react-select` | select.tsx |
| `react-separator` | separator.tsx |
| `react-tooltip` | tooltip.tsx |
| `react-toast` | toast.tsx |
| `react-dropdown-menu` | dropdown-menu.tsx |
| `react-checkbox` | checkbox.tsx |
| `react-avatar` | avatar.tsx |

**包体积影响**: ~200KB+ (gzipped ~60KB)

---

### 2. 图标库重复

**状态**: ⏳ 已识别，待处理

**实际使用统计**:
| 图标库 | 引用文件数 | 主要场景 |
|--------|-----------|---------|
| `lucide-react` | **38 个文件** | molecules、ui、input |
| `@fluentui/react-icons` | **15 个文件** | organisms、settings |

**包体积影响**: ~50KB (tree-shaking 后)

---

## 🟠 P1 - 待处理问题

### 3. Zustand Store 结构

**状态**: ⏳ 已有合并计划，待执行

**当前结构** (7 个 Store，共 2,249 行):
| Store | 行数 | 使用频率 |
|-------|------|----------|
| `multiTurnStore.ts` | 648 | 高 |
| `pendingOperationsStore.ts` | 439 | 中 |
| `conversationStore.ts` | 341 | 高 |
| `configStore.ts` | 290 | 高 |
| `localConfigStore.ts` | 247 | 中 |
| `documentContextStore.ts` | 165 | 低 |
| `themeStore.ts` | 119 | 低 |

**计划目标**: 合并为 3 个 Store

---

### 4. Services 目录结构

**状态**: ⏳ 已有扁平化计划，待执行

**当前**: 13 个子目录，194 个 .ts 文件  
**计划**: 简化为 5 个核心目录

---

## 🟡 P2 - 中等问题

### 5. 动画库重复

**状态**: ⏳ 待处理

| 库 | 实际使用 |
|----|---------|
| `framer-motion` | **仅 1 个文件** (ConversationSidebar.tsx) |
| `tailwindcss-animate` | CSS 动画类 |
| `tw-animate-css` | 未明确使用 |

**包体积影响**: framer-motion ~150KB

---

### 6. 知识库连接器死代码

**状态**: ✅ 已确认为死代码，待清理

**验证结果**:
```bash
# 搜索导入语句
grep -r "import.*from.*knowledge.*(Chroma|Milvus|Pinecone)Connector" src/
# 结果: 无匹配
```

**KnowledgeManager.ts 代码确认** (第 74-86 行):
```typescript
case 'milvus':
case 'pinecone':
case 'chroma':
  // 这些类型通过 HTTP 连接器代理
  connector = new HttpConnector({...})
```

**死代码文件**:
| 文件 | 行数 |
|------|------|
| `ChromaConnector.ts` | 651 |
| `MilvusConnector.ts` | 382 |
| `PineconeConnector.ts` | 481 |
| **总计** | **1,514 行** |

---

## 🟢 P3 - 轻微问题

### 7. 空目录

**已发现的空目录**:
```
src/config/
src/stores/                          # 与 src/store/ 重复命名
src/components/templates/
src/components/organisms/WordEditPanel/
src/hooks/wordEdit/
src/services/office/
src/services/ai/prompts/templates/
src/store/slices/
```

---

## 📈 量化数据汇总

### 代码统计
| 指标 | 数值 |
|------|------|
| TypeScript 文件 (.ts) | 368 个 |
| React 组件文件 (.tsx) | 112 个 |
| Store 总代码行数 | 2,249 行 |
| 确认的死代码行数 | 1,514 行 |
| 空目录数量 | 8 个 |

### 待优化包体积
| 类别 | 预估影响 |
|------|----------|
| Radix UI (11 包) | ~200KB |
| lucide-react | ~50KB |
| framer-motion | ~150KB |
| **总计** | **~400KB** |

---

## 🛠️ 建议执行顺序

### 立即可执行（低风险）- ✅ 已完成 (2025-12-30)
1. ✅ 删除空目录 - 已清理 8 个空目录
2. ✅ 删除知识库连接器死代码 - 已删除 ChromaConnector/MilvusConnector/PineconeConnector (1,514 行)
3. ✅ 移除 `tw-animate-css` 依赖 - 已移除
4. ✅ 移除 `framer-motion` 依赖 - 已用 CSS 动画替代 (~150KB)

### 短期执行（中等工作量）- 🔄 进行中
1. 🔄 统一图标库 → @fluentui/react-icons
   - ✅ 已创建图标映射文件 `src/shared/icons/index.ts`
   - ✅ 已迁移 UI 组件: dropdown-menu, select, dialog, checkbox, toast
   - ✅ 已迁移核心组件: Inputbar, ConversationSidebar
   - ⏳ 剩余 ~30 个文件待迁移（建议逐步进行）
2. 📋 移除 framer-motion，用 CSS 动画替代 - ✅ 已完成

### 中期执行（需要充分测试）
1. 📋 合并 Zustand Store (7 → 3)
2. 📋 迁移 Radix UI → Fluent UI

---

## 📝 与现有文档的关系

本报告基于以下现有文档进行核实和补充：

1. **OPTIMIZATION_PLAN.md** - 详细的优化方案和执行计划
2. **PERFORMANCE_REVIEW_REPORT.md** - 性能优化分析和实施记录

建议将本报告作为现有优化计划的**执行状态跟踪**，而非替代文档。

---

*报告生成时间: 2025-12-30*
