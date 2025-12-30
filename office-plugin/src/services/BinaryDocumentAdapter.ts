/**
 * 二进制文档适配器
 *
 * 封装 Office.js 的文档读取功能，提供统一的二进制文档访问接口
 */

import Logger from '../utils/logger'

const logger = new Logger('OfficeBinaryDoc')

/**
 * 文档类型
 */
export type DocumentType = 'word' | 'excel' | 'powerpoint'

/**
 * 文档数据接口
 */
export interface DocumentData {
  base64: string
  type: DocumentType
  filename?: string
  size: number
}

/**
 * 二进制文档适配器类
 */
export class BinaryDocumentAdapter {
  private static instance: BinaryDocumentAdapter | null = null
  private maxFileSize = 50 * 1024 * 1024 // 50MB 限制

  /**
   * 获取单例实例
   */
  static getInstance(): BinaryDocumentAdapter {
    if (!BinaryDocumentAdapter.instance) {
      BinaryDocumentAdapter.instance = new BinaryDocumentAdapter()
    }
    return BinaryDocumentAdapter.instance
  }

  /**
   * 检测当前 Office 应用类型
   */
  private detectOfficeApp(): DocumentType {
    if (typeof Office === 'undefined') {
      throw new Error('Office.js not available')
    }

    // 检测当前 Office 应用
    if (Office.context.host === Office.HostType.Word) {
      return 'word'
    } else if (Office.context.host === Office.HostType.Excel) {
      return 'excel'
    } else if (Office.context.host === Office.HostType.PowerPoint) {
      return 'powerpoint'
    } else {
      throw new Error(`Unsupported Office application: ${Office.context.host}`)
    }
  }

  /**
   * 读取当前文档的二进制数据
   */
  async readCurrentDocument(): Promise<DocumentData> {
    return new Promise((resolve, reject) => {
      try {
        const startTime = Date.now()
        const documentType = this.detectOfficeApp()

        logger.info('Starting document read', {
          documentType,
          startTime,
          maxFileSize: this.maxFileSize
        })

        Office.context.document.getFileAsync(
          Office.FileType.Compressed,
          { sliceSize: 65536 }, // 64KB 切片
          async (result) => {
            if (result.status === Office.AsyncResultStatus.Failed) {
              logger.error('Failed to get document file', { error: result.error })
              reject(new Error(`Failed to read document: ${result.error?.message}`))
              return
            }

            const file = result.value

            try {
              // 检查文件大小
              if (file.size > this.maxFileSize) {
                file.closeAsync()
                reject(new Error(`Document too large: ${file.size} bytes (max: ${this.maxFileSize})`))
                return
              }

              logger.info('Document file info', {
                size: file.size,
                sliceCount: file.sliceCount
              })

              // 读取所有切片
              const slices: ArrayBuffer[] = []
              let currentSlice = 0

              const readNextSlice = () => {
                file.getSliceAsync(currentSlice, (sliceResult) => {
                  if (sliceResult.status === Office.AsyncResultStatus.Failed) {
                    file.closeAsync()
                    reject(new Error(`Failed to read slice ${currentSlice}: ${sliceResult.error?.message}`))
                    return
                  }

                  slices.push(sliceResult.value.data)
                  currentSlice++

                  if (currentSlice < file.sliceCount) {
                    // 继续读取下一个切片
                    readNextSlice()
                  } else {
                    // 所有切片读取完成，合并数据
                    try {
                      const totalSize = slices.reduce((sum, slice) => sum + slice.byteLength, 0)
                      const combinedBuffer = new ArrayBuffer(totalSize)
                      const combinedView = new Uint8Array(combinedBuffer)

                      let offset = 0
                      for (const slice of slices) {
                        combinedView.set(new Uint8Array(slice), offset)
                        offset += slice.byteLength
                      }

                      // 转换为 Base64
                      const base64 = this.arrayBufferToBase64(combinedBuffer)

                      // 获取文档名称（如果可用）
                      const filename = this.getDocumentFilename()

                      const documentData: DocumentData = {
                        base64,
                        type: documentType,
                        filename,
                        size: totalSize
                      }

                      const processingTime = Date.now() - startTime

                      logger.info('Document read successfully', {
                        type: documentType,
                        size: totalSize,
                        base64Length: base64.length,
                        filename,
                        processingTimeMs: processingTime,
                        sliceCount: file.sliceCount,
                        compressionRatio: ((base64.length / totalSize) * 0.75).toFixed(2) // Base64 is ~33% larger
                      })

                      file.closeAsync()
                      resolve(documentData)
                    } catch (error) {
                      file.closeAsync()
                      logger.error('Failed to process document data', { error })
                      reject(error)
                    }
                  }
                })
              }

              // 开始读取第一个切片
              readNextSlice()
            } catch (error) {
              file.closeAsync()
              logger.error('Error during document processing', { error })
              reject(error)
            }
          }
        )
      } catch (error) {
        logger.error('Error reading document', { error })
        reject(error)
      }
    })
  }

  /**
   * 将 ArrayBuffer 转换为 Base64
   */
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer)
    let binary = ''

    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i])
    }

    return btoa(binary)
  }

  /**
   * 获取文档文件名（尽力而为）
   */
  private getDocumentFilename(): string | undefined {
    try {
      // 尝试从 Office.context 获取文档信息
      if (Office.context.document && 'url' in Office.context.document) {
        const url = (Office.context.document as any).url
        if (url) {
          const urlParts = url.split('/')
          return urlParts[urlParts.length - 1]
        }
      }

      // 如果无法获取，返回默认名称
      const type = this.detectOfficeApp()
      const extensions = {
        word: '.docx',
        excel: '.xlsx',
        powerpoint: '.pptx'
      }

      return `document${extensions[type]}`
    } catch (error) {
      logger.warn('Could not determine document filename', { error })
      return undefined
    }
  }

  /**
   * 检查是否支持当前 Office 环境
   */
  isSupported(): boolean {
    try {
      if (typeof Office === 'undefined') {
        return false
      }

      // 检查必要的 API
      return !!(
        Office.context &&
        Office.context.document &&
        Office.context.document.getFileAsync &&
        Office.FileType &&
        Office.AsyncResultStatus
      )
    } catch (error) {
      logger.warn('Office environment check failed', { error })
      return false
    }
  }

  /**
   * 将 Base64 转换为 ArrayBuffer
   */
  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binaryString = atob(base64)
    const bytes = new Uint8Array(binaryString.length)

    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }

    return bytes.buffer
  }

  /**
   * 从文件路径读取文档并写回到当前 Office 文档
   */
  async writeDocumentFromPath(filePath: string): Promise<void> {
    try {
      logger.info('Starting document write from path', { filePath })

      // 通过 fetch 读取文件（假设主应用提供了文件访问端点）
      const response = await fetch(`http://localhost:3001/v1/office/document/${encodeURIComponent(filePath)}`)

      if (!response.ok) {
        throw new Error(`Failed to fetch document: ${response.status} ${response.statusText}`)
      }

      const base64Data = await response.text()
      await this.writeDocumentFromBase64(base64Data)

      logger.info('Document write from path completed', { filePath })
    } catch (error) {
      logger.error('Failed to write document from path', { filePath, error })
      throw error
    }
  }

  /**
   * 从 Base64 数据写回到当前 Office 文档
   */
  async writeDocumentFromBase64(base64Data: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        logger.info('Starting document write from base64', {
          dataLength: base64Data.length
        })

        // 转换 Base64 为 ArrayBuffer
        const arrayBuffer = this.base64ToArrayBuffer(base64Data)

        logger.info('Converted base64 to ArrayBuffer', {
          bufferSize: arrayBuffer.byteLength
        })

        // 将 ArrayBuffer 转换为 Base64 字符串用于 OOXML
        const ooxmlString = base64Data

        // 使用 Office.js 的 setSelectedDataAsync 方法替换整个文档
        Office.context.document.setSelectedDataAsync(
          ooxmlString,
          {
            coercionType: Office.CoercionType.Ooxml,
            asyncContext: { operation: 'writeDocument' }
          },
          (result) => {
            if (result.status === Office.AsyncResultStatus.Failed) {
              logger.error('Failed to write document', {
                error: result.error,
                asyncContext: result.asyncContext
              })
              reject(new Error(`Failed to write document: ${result.error?.message}`))
              return
            }

            logger.info('Document write completed successfully', {
              asyncContext: result.asyncContext
            })
            resolve()
          }
        )
      } catch (error) {
        logger.error('Error during document write', { error })
        reject(error)
      }
    })
  }

  /**
   * 替换当前文档内容（整体替换策略）
   */
  async replaceCurrentDocument(documentData: DocumentData): Promise<void> {
    try {
      logger.info('Starting document replacement', {
        type: documentData.type,
        size: documentData.size,
        filename: documentData.filename
      })

      // 验证文档类型匹配
      const currentType = this.detectOfficeApp()
      if (currentType !== documentData.type) {
        throw new Error(`Document type mismatch: current=${currentType}, provided=${documentData.type}`)
      }

      await this.writeDocumentFromBase64(documentData.base64)

      logger.info('Document replacement completed', {
        type: documentData.type,
        size: documentData.size
      })
    } catch (error) {
      logger.error('Failed to replace document', { error })
      throw error
    }
  }

  /**
   * 设置最大文件大小限制
   */
  setMaxFileSize(sizeInBytes: number): void {
    this.maxFileSize = sizeInBytes
    logger.info('Max file size updated', { maxFileSize: sizeInBytes })
  }
}

/**
 * 导出单例实例
 */
export const binaryDocumentAdapter = BinaryDocumentAdapter.getInstance()
