/**
 * 缓存服务统一导出
 * 
 * @updated 2025-12-30 - 添加性能优化相关缓存
 */

// 配置缓存
export { configCache } from './ConfigCache'
export type { default as ConfigCache } from './ConfigCache'

// 分析结果缓存（P0 优化）
export { analysisCache } from './AnalysisCache'

// 文档内容缓存（P1 优化）
export { documentContextCache } from './DocumentContextCache'

// 选区上下文缓存（P1 优化）
export { selectionContextCache } from './SelectionContextCache'
