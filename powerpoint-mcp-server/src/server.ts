#!/usr/bin/env node
/**
 * PowerPoint MCP Server
 * 专门处理 Microsoft PowerPoint 演示文稿操作的 MCP 服务器
 */

import { BaseMCPServer, logger } from '@office-mcp/shared'
import { getPowerPointTools, toolCompressionMap } from './tools/index.js'

/**
 * PowerPoint MCP Server 类
 */
class PowerPointMCPServer extends BaseMCPServer {
  getServerName(): string {
    return 'powerpoint-mcp-server'
  }

  getServerVersion(): string {
    return '1.0.0'
  }

  getTools() {
    return getPowerPointTools() as unknown as import('@office-mcp/shared').MCPToolDefinition[]
  }

  getToolCompressionMap() {
    return toolCompressionMap
  }
}

// 启动服务器
const server = new PowerPointMCPServer()
server.start().catch((error) => {
  logger.error('服务器启动失败:', error)
  process.exit(1)
})
