import { WordService } from '../WordService'

/**
 * 文档服务工厂
 * 提供单例模式的文档服务实例
 *
 * 注意：延迟初始化以避免在 Office.js 初始化前创建实例
 * 不在模块加载时创建实例，只在第一次使用时创建
 */
export class DocumentServiceFactory {
  private static wordServiceInstance: WordService | null = null

  /**
   * 获取 WordService 单例实例
   * 延迟初始化：只在第一次调用时创建实例
   */
  static getWordService(): WordService {
    if (!this.wordServiceInstance) {
      this.wordServiceInstance = new WordService()
    }
    return this.wordServiceInstance
  }

  /**
   * 重置实例（主要用于测试）
   */
  static resetWordService(): void {
    this.wordServiceInstance = null
  }
}

/**
 * 导出 wordService 单例
 * 使用 Proxy 实现延迟初始化，保持 API 兼容性
 *
 * 关键：不在模块加载时创建实例，只在第一次访问属性时创建
 */
export const wordService = new Proxy({} as WordService, {
  get(_target, prop) {
    const instance = DocumentServiceFactory.getWordService()
    const value = instance[prop as keyof WordService]
    // 如果是方法，绑定 this 上下文
    if (typeof value === 'function') {
      return value.bind(instance)
    }
    return value
  }
})
