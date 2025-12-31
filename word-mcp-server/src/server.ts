#!/usr/bin/env node
/**
 * Word MCP Server
 * 专门处理 Microsoft Word 文档操作的 MCP 服务器
 */

import { BaseMCPServer, logger } from '@office-mcp/shared'
import { getWordTools, toolCompressionMap } from './tools/index.js'

/**
 * Word MCP Server 类
 */
class WordMCPServer extends BaseMCPServer {
  getServerName(): string {
    return 'word-mcp-server'
  }

  getServerVersion(): string {
    return '1.0.0'
  }

  getTools() {
    return getWordTools() as unknown as import('@office-mcp/shared').MCPToolDefinition[]
  }

  getToolCompressionMap() {
    return toolCompressionMap
  }
}

// 启动服务器
const server = new WordMCPServer()
server.start().catch((error) => {
  logger.error('服务器启动失败:', error)
  process.exit(1)
})
