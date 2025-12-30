/**
 * AttachmentStore - 附件存储服务
 * 用于在聊天会话期间存储上传的附件数据
 * 工具执行时可以根据附件 ID 获取实际数据
 * 
 * 增强功能：
 * - 支持文档上下文管理
 * - 生成结构化的 AI 上下文
 * - 支持按类型/名称搜索附件
 */

import type { FileAttachmentData } from '../components/molecules/FileAttachment'
import { DocumentParser, type ParseResult, type DocumentSummary } from './DocumentParser'
import Logger from '../utils/logger'

const logger = new Logger('AttachmentStore')

interface StoredAttachment extends FileAttachmentData {
  storedAt: number
  /** 解析结果缓存 */
  parseResult?: ParseResult
}

/** 上下文生成选项 */
interface ContextOptions {
  /** 是否包含完整内容 */
  includeFullContent?: boolean
  /** 最大字符数限制 */
  maxLength?: number
  /** 是否包含摘要 */
  includeSummary?: boolean
  /** 是否包含元数据 */
  includeMetadata?: boolean
}

class AttachmentStoreClass {
  private attachments: Map<string, StoredAttachment> = new Map()
  private readonly EXPIRY_TIME = 30 * 60 * 1000 // 30 分钟过期
  private contextChangeListeners: ((attachments: FileAttachmentData[]) => void)[] = []

  /**
   * 存储附件
   */
  store(attachment: FileAttachmentData): void {
    this.attachments.set(attachment.fileId, {
      ...attachment,
      storedAt: Date.now()
    })
    logger.debug('存储附件', { fileId: attachment.fileId, fileName: attachment.fileName })
    
    // 清理过期附件
    this.cleanup()
  }

  /**
   * 批量存储附件
   */
  storeAll(attachments: FileAttachmentData[]): void {
    attachments.forEach(att => this.store(att))
  }

  /**
   * 获取附件
   */
  get(fileId: string): FileAttachmentData | undefined {
    const stored = this.attachments.get(fileId)
    if (stored) {
      // 检查是否过期
      if (Date.now() - stored.storedAt > this.EXPIRY_TIME) {
        this.attachments.delete(fileId)
        return undefined
      }
      return stored
    }
    return undefined
  }

  /**
   * 获取所有图片附件
   */
  getImageAttachments(): FileAttachmentData[] {
    const result: FileAttachmentData[] = []
    this.attachments.forEach((att) => {
      if (att.type?.startsWith('image/') && att.base64Data) {
        result.push(att)
      }
    })
    return result
  }

  /**
   * 根据占位符解析实际的 base64 数据
   * 占位符格式: ATTACHED_IMAGE:fileId
   */
  resolveImagePlaceholder(value: string): string | null {
    if (typeof value !== 'string') return null
    
    const prefix = 'ATTACHED_IMAGE:'
    if (!value.startsWith(prefix)) return null
    
    const fileId = value.substring(prefix.length)
    const attachment = this.get(fileId)
    
    if (attachment?.base64Data) {
      logger.debug('解析图片占位符', { fileId })
      return attachment.base64Data
    }
    
    return null
  }

  /**
   * 删除附件
   */
  remove(fileId: string): void {
    this.attachments.delete(fileId)
  }

  /**
   * 清空所有附件
   */
  clear(): void {
    this.attachments.clear()
  }

  /**
   * 清理过期附件
   */
  private cleanup(): void {
    const now = Date.now()
    const expiredIds: string[] = []
    
    this.attachments.forEach((att, id) => {
      if (now - att.storedAt > this.EXPIRY_TIME) {
        expiredIds.push(id)
      }
    })
    
    expiredIds.forEach(id => this.attachments.delete(id))
    
    if (expiredIds.length > 0) {
      logger.debug('清理过期附件', { count: expiredIds.length })
      this.notifyContextChange()
    }
  }

  /**
   * 通知上下文变化
   */
  private notifyContextChange(): void {
    const attachments = this.getAll()
    this.contextChangeListeners.forEach(listener => listener(attachments))
  }

  /**
   * 订阅上下文变化
   */
  subscribe(listener: (attachments: FileAttachmentData[]) => void): () => void {
    this.contextChangeListeners.push(listener)
    // 立即通知当前状态
    listener(this.getAll())
    // 返回取消订阅函数
    return () => {
      const index = this.contextChangeListeners.indexOf(listener)
      if (index > -1) {
        this.contextChangeListeners.splice(index, 1)
      }
    }
  }

  /**
   * 获取所有附件
   */
  getAll(): FileAttachmentData[] {
    const result: FileAttachmentData[] = []
    this.attachments.forEach((att) => {
      // 检查是否过期
      if (Date.now() - att.storedAt <= this.EXPIRY_TIME) {
        result.push(att)
      }
    })
    return result
  }

  /**
   * 获取所有文档附件（含文本内容）
   */
  getDocumentAttachments(): FileAttachmentData[] {
    return this.getAll().filter(att => att.textContent)
  }

  /**
   * 按文件类型获取附件
   */
  getByType(type: 'image' | 'document' | 'spreadsheet' | 'presentation' | 'code'): FileAttachmentData[] {
    return this.getAll().filter(att => {
      const ext = att.ext?.toLowerCase() || ''
      switch (type) {
        case 'image':
          return att.type?.startsWith('image/')
        case 'document':
          return ['.doc', '.docx', '.pdf', '.txt', '.md'].includes(ext)
        case 'spreadsheet':
          return ['.xlsx', '.xls', '.csv'].includes(ext)
        case 'presentation':
          return ['.pptx', '.ppt'].includes(ext)
        case 'code':
          return ['.js', '.ts', '.py', '.java', '.go', '.rs', '.c', '.cpp'].includes(ext)
        default:
          return false
      }
    })
  }

  /**
   * 搜索附件（按文件名）
   */
  search(query: string): FileAttachmentData[] {
    const lowerQuery = query.toLowerCase()
    return this.getAll().filter(att => 
      att.fileName.toLowerCase().includes(lowerQuery)
    )
  }

  /**
   * 获取附件数量
   */
  getCount(): number {
    return this.getAll().length
  }

  /**
   * 检查是否有附件
   */
  hasAttachments(): boolean {
    return this.getCount() > 0
  }

  /**
   * 生成 AI 上下文字符串
   * 将所有文档附件的内容格式化为 AI 可理解的上下文
   */
  generateAIContext(options: ContextOptions = {}): string {
    const {
      includeFullContent = true,
      maxLength = 50000,
      includeSummary = true,
      includeMetadata = true
    } = options

    const docAttachments = this.getDocumentAttachments()
    if (docAttachments.length === 0) {
      return ''
    }

    const parts: string[] = []
    parts.push(`【用户上传的文档】共 ${docAttachments.length} 个文件`)
    parts.push('')

    let totalLength = 0
    const maxPerFile = Math.floor(maxLength / docAttachments.length)

    for (const [index, doc] of docAttachments.entries()) {
      const fileParts: string[] = []
      fileParts.push(`=== 文档 ${index + 1}: ${doc.fileName} ===`)

      // 元数据
      if (includeMetadata) {
        const stats: string[] = []
        if (doc.wordCount) stats.push(`${doc.wordCount} 字`)
        if (doc.pageCount) stats.push(`${doc.pageCount} 页`)
        if (doc.sheetCount) stats.push(`${doc.sheetCount} 工作表`)
        if (doc.slideCount) stats.push(`${doc.slideCount} 幻灯片`)
        if (stats.length > 0) {
          fileParts.push(`📊 统计: ${stats.join(', ')}`)
        }
      }

      // 内容
      if (includeFullContent && doc.textContent) {
        let content = doc.textContent
        // 如果内容太长，截断
        if (content.length > maxPerFile) {
          content = content.slice(0, maxPerFile) + '\n[内容已截断...]'
        }
        fileParts.push('')
        fileParts.push(content)
      }

      const fileSection = fileParts.join('\n')
      totalLength += fileSection.length

      if (totalLength > maxLength) {
        parts.push(`[后续 ${docAttachments.length - index} 个文档因长度限制被省略]`)
        break
      }

      parts.push(fileSection)
      parts.push('')
    }

    return parts.join('\n')
  }

  /**
   * 获取附件摘要信息（用于 UI 显示）
   */
  getSummary(): { 
    total: number
    images: number
    documents: number
    totalSize: number
    fileNames: string[]
  } {
    const all = this.getAll()
    return {
      total: all.length,
      images: all.filter(a => a.type?.startsWith('image/')).length,
      documents: all.filter(a => a.textContent).length,
      totalSize: all.reduce((sum, a) => sum + a.size, 0),
      fileNames: all.map(a => a.fileName)
    }
  }
}

// 单例导出
export const AttachmentStore = new AttachmentStoreClass()

