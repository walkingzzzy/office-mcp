/**
 * Office App Adapters 模块入口
 * 
 * 导出所有适配器和相关类型
 */

// 类型
export * from './types'

// 基类
export { BaseOfficeAppAdapter } from './BaseAdapter'

// 具体适配器
export { WordAdapter, wordAdapter } from './WordAdapter'
export { ExcelAdapter, excelAdapter } from './ExcelAdapter'
export { PowerPointAdapter, powerPointAdapter } from './PowerPointAdapter'

// 注册表和工厂
export {
  adapterRegistry,
  getAdapter,
  getActiveAdapter,
  setActiveApp,
  initializeAdapters,
  createAdapter
} from './AdapterRegistry'

// 导出类型
export type {
  IAdapterRegistry,
  IOfficeAppAdapter,
  OfficeAppType
} from './AdapterRegistry'
