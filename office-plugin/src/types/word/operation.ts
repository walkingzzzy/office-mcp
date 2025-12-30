/**
 * Word 操作相关类型定义
 */

/**
 * 文本更改操作
 */
export interface WordTextChange {
  /** 操作类型 */
  type: 'insert' | 'delete' | 'replace'
  /** 原始文本（delete, replace） */
  oldText?: string
  /** 新文本（insert, replace） */
  newText?: string
  /** 操作位置 */
  position?: number
  /** 搜索文本（用于定位） */
  searchText?: string
}

/**
 * 文档变更（用于测试）
 */
export interface DocumentChange {
  /** 操作类型 */
  type: 'insert' | 'delete' | 'replace'
  /** 文本范围 */
  range: {
    start: number
    end: number
  }
  /** 原始文本 */
  oldText?: string
  /** 新文本 */
  newText?: string
  /** 变更描述 */
  description: string
}

/**
 * Diff 项
 */
export interface DiffItem {
  /** 唯一 ID */
  id: string
  /** 操作类型 */
  type: 'insert' | 'delete' | 'equal'
  /** 文本内容 */
  text: string
  /** 上下文（前后文本） */
  context?: {
    before: string
    after: string
  }
  /** 是否已应用 */
  applied?: boolean
  /** 状态 */
  status: 'pending' | 'accepted' | 'rejected' | 'error'
}

/**
 * Diff 计算结果
 */
export interface DiffResult {
  /** 原始文本 */
  originalText: string
  /** 修改后的文本 */
  modifiedText: string
  /** Diff 项列表 */
  diffs: DiffItem[]
  /** 统计信息 */
  statistics: {
    insertions: number
    deletions: number
    unchanged: number
  }
}

/**
 * 批量操作选项
 */
export interface BatchOperationOptions {
  /** 操作类型 */
  operation: 'accept' | 'reject'
  /** 要操作的 Diff ID 列表（为空则全部） */
  diffIds?: string[]
  /** 是否显示进度 */
  showProgress?: boolean
}

/**
 * 批量操作结果
 */
export interface BatchOperationResult {
  /** 成功数量 */
  successCount: number
  /** 失败数量 */
  failureCount: number
  /** 错误信息 */
  errors?: Array<{
    diffId: string
    error: string
  }>
}

/**
 * 进度回调函数类型
 */
export type ProgressCallback = (progress: ProgressInfo) => void

/**
 * 进度信息
 */
export interface ProgressInfo {
  /** 当前进度 (0-100) */
  current: number
  /** 总量 */
  total: number
  /** 当前处理的块索引 */
  chunkIndex: number
  /** 总块数 */
  totalChunks: number
  /** 当前阶段描述 */
  stage: 'reading' | 'processing' | 'applying' | 'finalizing'
  /** 详细消息 */
  message?: string
}

/**
 * 文档分块配置
 */
export interface ChunkOptions {
  /** 每块最大字符数 */
  maxChunkSize: number
  /** 是否按段落分块（而非固定字符数） */
  chunkByParagraph: boolean
  /** 进度回调 */
  onProgress?: ProgressCallback
}
