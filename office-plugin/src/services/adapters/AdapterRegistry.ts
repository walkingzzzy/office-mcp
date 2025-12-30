/**
 * Office App Adapter 注册表
 * 
 * 管理所有 Office 应用适配器，提供统一的访问接口
 */

import Logger from '../../utils/logger'
import { ExcelAdapter, excelAdapter } from './ExcelAdapter'
import { PowerPointAdapter, powerPointAdapter } from './PowerPointAdapter'
import { WordAdapter, wordAdapter } from './WordAdapter'
import type { IAdapterRegistry, IOfficeAppAdapter, OfficeAppType } from './types'

const logger = new Logger('AdapterRegistry')

/**
 * Adapter 注册表实现
 */
class AdapterRegistryImpl implements IAdapterRegistry {
  private adapters: Map<OfficeAppType, IOfficeAppAdapter> = new Map()
  private activeAppType: OfficeAppType = 'none'
  private isInitialized: boolean = false

  constructor() {
    // 注册默认适配器
    this.registerDefaults()
  }

  /**
   * 注册默认适配器
   */
  private registerDefaults(): void {
    this.register(wordAdapter)
    this.register(excelAdapter)
    this.register(powerPointAdapter)
    logger.info('Default adapters registered', {
      adapters: Array.from(this.adapters.keys())
    })
  }

  /**
   * 注册适配器
   */
  register(adapter: IOfficeAppAdapter): void {
    this.adapters.set(adapter.appType, adapter)
    logger.debug(`Adapter registered: ${adapter.appType}`)
  }

  /**
   * 获取指定类型的适配器
   */
  get(appType: OfficeAppType): IOfficeAppAdapter | undefined {
    if (appType === 'none') {
      // 默认返回 Word 适配器
      return this.adapters.get('word')
    }
    return this.adapters.get(appType)
  }

  /**
   * 获取当前活跃的适配器
   */
  getActive(): IOfficeAppAdapter | undefined {
    if (this.activeAppType === 'none') {
      return this.adapters.get('word') // 默认返回 Word
    }
    return this.adapters.get(this.activeAppType)
  }

  /**
   * 设置当前活跃的应用类型
   */
  setActiveApp(appType: OfficeAppType): void {
    this.activeAppType = appType
    logger.info(`Active app set to: ${appType}`)
  }

  /**
   * 获取所有已注册的适配器
   */
  getAll(): IOfficeAppAdapter[] {
    return Array.from(this.adapters.values())
  }

  /**
   * 初始化所有适配器
   */
  async initializeAll(): Promise<void> {
    if (this.isInitialized) {
      return
    }

    logger.info('Initializing all adapters...')
    
    const initPromises = Array.from(this.adapters.values()).map(async (adapter) => {
      try {
        await adapter.initialize()
        logger.debug(`Adapter initialized: ${adapter.appType}`, {
          isAvailable: adapter.isAvailable
        })
      } catch (error) {
        logger.error(`Failed to initialize adapter: ${adapter.appType}`, { error })
      }
    })

    await Promise.all(initPromises)
    this.isInitialized = true
    
    logger.info('All adapters initialized', {
      available: this.getAll().filter(a => a.isAvailable).map(a => a.appType)
    })
  }

  /**
   * 清理所有适配器
   */
  disposeAll(): void {
    for (const adapter of this.adapters.values()) {
      try {
        adapter.dispose()
      } catch (error) {
        logger.warn(`Failed to dispose adapter: ${adapter.appType}`, { error })
      }
    }
    this.isInitialized = false
    logger.info('All adapters disposed')
  }

  /**
   * 获取可用的适配器
   */
  getAvailableAdapters(): IOfficeAppAdapter[] {
    return this.getAll().filter(a => a.isAvailable)
  }

  /**
   * 根据工具名称获取对应的适配器
   */
  getAdapterForTool(toolName: string): IOfficeAppAdapter | undefined {
    for (const adapter of this.adapters.values()) {
      if (adapter.isToolForThisApp(toolName)) {
        return adapter
      }
    }
    return undefined
  }
}

// 导出单例
export const adapterRegistry = new AdapterRegistryImpl()

// ==================== 工厂函数 ====================

/**
 * 获取指定应用类型的适配器
 */
export function getAdapter(appType: OfficeAppType): IOfficeAppAdapter | undefined {
  return adapterRegistry.get(appType)
}

/**
 * 获取当前活跃的适配器
 */
export function getActiveAdapter(): IOfficeAppAdapter | undefined {
  return adapterRegistry.getActive()
}

/**
 * 设置当前活跃的应用类型
 */
export function setActiveApp(appType: OfficeAppType): void {
  adapterRegistry.setActiveApp(appType)
}

/**
 * 初始化所有适配器
 */
export async function initializeAdapters(): Promise<void> {
  await adapterRegistry.initializeAll()
}

/**
 * 创建新的适配器实例（用于测试或特殊场景）
 */
export function createAdapter(appType: OfficeAppType): IOfficeAppAdapter {
  switch (appType) {
    case 'word':
      return new WordAdapter()
    case 'excel':
      return new ExcelAdapter()
    case 'powerpoint':
      return new PowerPointAdapter()
    default:
      return new WordAdapter() // 默认返回 Word
  }
}

// 导出类型
export type { IAdapterRegistry, IOfficeAppAdapter, OfficeAppType }
