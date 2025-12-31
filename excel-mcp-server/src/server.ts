#!/usr/bin/env node
/**
 * Excel MCP Server
 * 专门处理 Microsoft Excel 电子表格操作的 MCP 服务器
 */

import { BaseMCPServer, logger } from '@office-mcp/shared'
import { getExcelTools, toolCompressionMap } from './tools/index.js'

/**
 * Excel MCP Server 类
 */
class ExcelMCPServer extends BaseMCPServer {
  getServerName(): string {
    return 'excel-mcp-server'
  }

  getServerVersion(): string {
    return '1.0.0'
  }

  getTools() {
    return getExcelTools() as unknown as import('@office-mcp/shared').MCPToolDefinition[]
  }

  getToolCompressionMap() {
    return toolCompressionMap
  }
}

// 启动服务器
const server = new ExcelMCPServer()
server.start().catch((error) => {
  logger.error('服务器启动失败:', error)
  process.exit(1)
})
