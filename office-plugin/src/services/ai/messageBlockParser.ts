/**
 * 消息块解析器
 * 负责解析特殊标记块（\x00TYPE\x00{JSON}\x00）
 */

import type { StreamOptions } from '../../types/ai'
import Logger from '../../utils/logger'

const logger = new Logger('MessageBlockParser')

export class MessageBlockParser {
  /**
   * 解析特殊标记块
   * 格式：\x00TYPE\x00{JSON}\x00
   */
  parseSpecialChunks(content: string, options: StreamOptions): void {
     
    const regex = /\x00([A-Z_]+)\x00(.*?)\x00/g
    let match: RegExpExecArray | null

    while ((match = regex.exec(content)) !== null) {
      const type = match[1]
      const jsonData = match[2]

      try {
        switch (type) {
          case 'KNOWLEDGE_REFS': {
            const refs = JSON.parse(jsonData)
            logger.info('Knowledge refs received', { count: refs.length })
            options.onKnowledgeRefs?.(refs)
            break
          }

          case 'MCP_TOOL': {
            const responses = JSON.parse(jsonData)
            logger.info('MCP tool responses received', { count: responses.length })
            options.onMCPTool?.(responses)
            break
          }

          case 'THINKING': {
            const thinking = JSON.parse(jsonData)
            logger.debug('Thinking received', {
              preview: thinking.text?.substring(0, 50) || '...'
            })
            options.onThinking?.(thinking)
            break
          }

          case 'ERROR': {
            const error = JSON.parse(jsonData)
            logger.error('Error chunk received', { message: error.message })
            options.onError?.(new Error(error.message || 'Unknown error'))
            break
          }

          default:
            logger.warn('Unknown special chunk type', { type })
        }
      } catch (parseError) {
        logger.error(`Failed to parse ${type} chunk`, {
          type,
          dataPreview: jsonData.substring(0, 100),
          error: parseError
        })
      }
    }
  }

  /**
   * 清除特殊标记块，返回纯文本内容
   */
  cleanSpecialChunks(content: string): string {
     
    return content.replace(/\x00[A-Z_]+\x00.*?\x00/g, '')
  }

  /**
   * 检查内容是否包含特殊标记块
   */
  hasSpecialChunks(content: string): boolean {
    return content.includes('\x00')
  }
}

export const messageBlockParser = new MessageBlockParser()
