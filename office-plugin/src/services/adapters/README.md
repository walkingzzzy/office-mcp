# Office App Adapter 架构指南

## 概述

Adapter 架构将应用无关的通用逻辑与应用特定逻辑分离，使得：
- **扩展性**：新增应用支持无需修改现有代码
- **隔离性**：修改一个应用的逻辑不影响其他应用
- **可测试性**：每个 Adapter 可独立测试

---

## 1. 新增应用支持

### 步骤

```typescript
// 1. 创建新的 Adapter 类
// 文件: adapters/OutlookAdapter.ts

import { BaseOfficeAppAdapter } from './BaseAdapter'
import type { AdapterCreateOptions, PromptContext, SelectionType } from './types'

export class OutlookAdapter extends BaseOfficeAppAdapter {
  constructor(options: AdapterCreateOptions = {}) {
    super('outlook' as any, options)  // 需要先扩展 OfficeAppType
  }

  // 实现必须的抽象方法
  async detectSelectionType(): Promise<SelectionType> {
    // Outlook 特定的选区检测逻辑
    try {
      const result = await this.executeTool('outlook_get_selection', {})
      return result.success ? 'text' : 'none'
    } catch {
      return 'none'
    }
  }

  getToolPrefix(): string {
    return 'outlook_'
  }

  getSystemPromptFragment(context: PromptContext): string {
    return `你是一个专业的 Outlook 邮件助手。你可以帮助用户：
- 撰写和编辑邮件
- 管理日历和会议
- 处理联系人`
  }
}

// 2. 扩展类型定义（在 types.ts 中）
export type OfficeAppType = 'word' | 'excel' | 'powerpoint' | 'outlook' | 'none'

// 3. 在 AdapterRegistry 中注册
import { OutlookAdapter } from './OutlookAdapter'

const outlookAdapter = new OutlookAdapter()
adapterRegistry.register(outlookAdapter)
```

### 完整示例：添加 Outlook 支持

```bash
# 创建文件
touch adapters/OutlookAdapter.ts

# 更新注册表
# 在 AdapterRegistry.ts 的 registerDefaults() 中添加
```

---

## 2. 修改应用逻辑

### 场景：修改 Excel 的选区检测逻辑

只需修改 `ExcelAdapter.ts`，不影响 Word 和 PowerPoint：

```typescript
// ExcelAdapter.ts

async detectSelectionType(): Promise<SelectionType> {
  try {
    // 🆕 增强的选区检测逻辑
    const result = await this.executeTool('excel_detect_selection_type', {})
    
    if (result.success && result.data?.selectionType) {
      // 新增：支持更多选区类型
      const mapping: Record<string, SelectionType> = {
        'cell': 'text',
        'range': 'table',
        'chart': 'image',
        'shape': 'image',      // 🆕 新增
        'sparkline': 'image',  // 🆕 新增
        'none': 'none'
      }
      return mapping[result.data.selectionType] || 'text'
    }
    
    return 'none'
  } catch (error) {
    this.logger.warn('Selection detection failed', { error })
    return 'none'
  }
}
```

### 场景：为 PowerPoint 添加教育场景提示词

```typescript
// PowerPointAdapter.ts

getSystemPromptFragment(context: PromptContext): string {
  const parts: string[] = [PPT_PROMPTS.base]

  // 🆕 新增：检测教育场景关键词
  if (context.userMessage) {
    const educationKeywords = ['课件', '教案', '讲义', '测验', '问答']
    if (educationKeywords.some(kw => context.userMessage?.includes(kw))) {
      parts.push(`
【教育场景专用功能】
- 快速创建测验幻灯片
- 生成知识点卡片
- 添加互动问答环节`)
    }
  }

  return parts.join('\n\n')
}
```

---

## 3. 添加新功能

### 步骤

1. 在 `IOfficeAppAdapter` 接口中定义新方法
2. 在 `BaseOfficeAppAdapter` 中添加默认实现（可选）
3. 各 Adapter 根据需要覆盖实现

### 示例：添加"导出为 PDF"功能

```typescript
// 1. 更新接口 (types.ts)
export interface IOfficeAppAdapter {
  // ... 现有方法

  /**
   * 🆕 导出当前文档为 PDF
   */
  exportToPDF(options?: ExportPDFOptions): Promise<ExportResult>
}

export interface ExportPDFOptions {
  filename?: string
  quality?: 'low' | 'medium' | 'high'
  includeComments?: boolean
}

export interface ExportResult {
  success: boolean
  filePath?: string
  error?: string
}

// 2. 在基类中添加默认实现 (BaseAdapter.ts)
async exportToPDF(options?: ExportPDFOptions): Promise<ExportResult> {
  // 默认实现：不支持
  return {
    success: false,
    error: `${this.appType} does not support PDF export`
  }
}

// 3. Word 实现 (WordAdapter.ts)
async exportToPDF(options?: ExportPDFOptions): Promise<ExportResult> {
  try {
    const result = await this.executeTool('word_export_pdf', {
      filename: options?.filename,
      quality: options?.quality || 'high'
    })
    
    return {
      success: result.success,
      filePath: result.data?.filePath
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    }
  }
}

// 4. Excel 实现 (ExcelAdapter.ts)
async exportToPDF(options?: ExportPDFOptions): Promise<ExportResult> {
  try {
    const result = await this.executeTool('excel_export_pdf', {
      filename: options?.filename,
      // Excel 特有：可以指定工作表范围
      sheets: 'all'
    })
    
    return {
      success: result.success,
      filePath: result.data?.filePath
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    }
  }
}

// 5. PowerPoint 实现 (PowerPointAdapter.ts)
async exportToPDF(options?: ExportPDFOptions): Promise<ExportResult> {
  try {
    const result = await this.executeTool('ppt_export_pdf', {
      filename: options?.filename,
      // PPT 特有：可以包含备注
      includeNotes: options?.includeComments
    })
    
    return {
      success: result.success,
      filePath: result.data?.filePath
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    }
  }
}
```

### 使用新功能

```typescript
import { getAdapter } from '../adapters'

async function exportCurrentDocument() {
  const adapter = getAdapter('word')
  
  if (adapter) {
    const result = await adapter.exportToPDF({
      filename: 'my-document.pdf',
      quality: 'high'
    })
    
    if (result.success) {
      console.log('Exported to:', result.filePath)
    } else {
      console.error('Export failed:', result.error)
    }
  }
}
```

---

## 文件结构

```
adapters/
├── types.ts              # 接口和类型定义
├── BaseAdapter.ts        # 基础抽象类（通用逻辑）
├── WordAdapter.ts        # Word 适配器
├── ExcelAdapter.ts       # Excel 适配器
├── PowerPointAdapter.ts  # PowerPoint 适配器
├── AdapterRegistry.ts    # 注册表和工厂函数
├── index.ts              # 模块入口
├── README.md             # 本文档
└── __tests__/
    └── AdapterRegistry.test.ts
```

---

## 最佳实践

1. **保持接口精简**：只添加确实需要的方法
2. **提供默认实现**：在基类中提供合理的默认行为
3. **单一职责**：每个 Adapter 只处理自己应用的逻辑
4. **缓存优化**：利用基类的缓存机制避免重复调用
5. **错误处理**：在 Adapter 内部处理错误，返回一致的结果

---

## API 快速参考

```typescript
// 获取适配器
const adapter = getAdapter('word')
const adapter = getActiveAdapter()

// 切换活跃应用
setActiveApp('excel')

// 获取选区上下文
const context = await adapter.getSelectionContext()

// 检查工具归属
const isWordTool = adapter.isToolForThisApp('word_insert_text')

// 获取系统提示词
const prompt = adapter.getSystemPromptFragment({
  appType: 'word',
  hasSelection: true,
  selectionType: 'text',
  userMessage: '请帮我格式化这段文字'
})

// 初始化所有适配器
await adapterRegistry.initializeAll()
```
