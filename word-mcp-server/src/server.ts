#!/usr/bin/env node
/**
 * Word MCP Server
 * 专门处理 Microsoft Word 文档操作的 MCP 服务器
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js'

import { ConfigManager } from './config/ConfigManager.js'
import { getWordTools, toolCompressionMap } from './tools/index.js'
import { logger } from './utils/logger.js'
import { globalHealthChecker } from '@office-mcp/shared'

/**
 * Word MCP Server 类
 */
class WordMCPServer {
  private server: Server
  private config = ConfigManager.getInstance().getConfig()
  private tools = getWordTools()
  private startTime = Date.now()

  constructor() {
    this.server = new Server(
      {
        name: 'word-mcp-server',
        version: '1.0.0'
      },
      { capabilities: { tools: {} } }
    )
    this.setupHandlers()
  }

  /**
   * 获取包含健康检查工具的完整工具列表
   */
  private getAllTools() {
    const healthCheckTool = {
      name: 'wordHealthCheck',
      description: '检查 Word MCP Server 的健康状态，返回服务器运行状态、内存使用等信息',
      inputSchema: {
        type: 'object',
        properties: {},
        required: []
      },
      handler: async () => {
        const health = await globalHealthChecker.runHealthChecks()
        return {
          success: true,
          data: {
            ...health,
            uptime: Math.round((Date.now() - this.startTime) / 1000),
            toolCount: this.tools.length
          }
        }
      }
    }
    return [...this.tools, healthCheckTool]
  }

  /**
   * 设置 MCP 协议处理器
   */
  private setupHandlers(): void {
    const allTools = this.getAllTools()

    // 列出所有工具
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      logger.info(`列出 ${allTools.length} 个 Word 工具`)
      return {
        tools: allTools.map(tool => ({
          name: tool.name,
          description: tool.description,
          inputSchema: tool.inputSchema
        }))
      }
    })

    // 执行工具
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      let { name, arguments: args } = request.params
      let finalArgs = args || {}
      
      // 向后兼容：检查是否是旧版工具名，自动转换为新版工具名+action
      const compression = toolCompressionMap[name]
      if (compression) {
        logger.info(`[兼容层] 转换旧工具名 ${name} -> ${compression.newTool} (action: ${compression.action})`)
        name = compression.newTool
        finalArgs = { action: compression.action, ...finalArgs }
      }
      
      const tool = allTools.find(t => t.name === name)

      if (!tool) {
        throw new Error(`未知工具: ${name}`)
      }

      logger.info(`执行工具: ${name}`, { action: finalArgs.action })
      const result = await tool.handler(finalArgs)
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }]
      }
    })
  }

  /**
   * 启动服务器
   */
  async start(): Promise<void> {
    const transport = new StdioServerTransport()
    await this.server.connect(transport)

    logger.info('='.repeat(50))
    logger.info('Word MCP Server 已启动')
    logger.info(`可用工具: ${this.tools.length} 个`)
    logger.info('='.repeat(50))
  }
}

// 启动服务器
const server = new WordMCPServer()
server.start().catch((error) => {
  logger.error('服务器启动失败:', error)
  process.exit(1)
})
