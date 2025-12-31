/**
 * BaseMCPServer - MCP 服务器抽象基类
 * 
 * 封装所有 MCP 服务器共享的逻辑：
 * - 健康检查工具
 * - MCP 协议处理器
 * - 向后兼容的工具名映射
 * - 服务器启动逻辑
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js'
import { logger } from '../utils/logger.js'
import { HealthChecker } from '../utils/healthCheck.js'

/**
 * 工具定义接口 - 宽松类型，兼容各 MCP 服务器的工具类型
 */
export interface MCPToolDefinition {
    name: string
    description?: string
    inputSchema: {
        type: string
        properties?: Record<string, unknown>
        required?: string[]
        [key: string]: unknown
    }
    handler: (args: Record<string, unknown>) => Promise<unknown>
    [key: string]: unknown // 允许额外属性
}

/**
 * 工具压缩映射类型
 */
export interface ToolCompressionMap {
    [oldToolName: string]: {
        newTool: string
        action: string
    }
}

/**
 * MCP 服务器抽象基类
 */
export abstract class BaseMCPServer {
    protected server: Server
    protected startTime: number = Date.now()
    protected healthChecker: HealthChecker

    constructor() {
        this.server = new Server(
            {
                name: this.getServerName(),
                version: this.getServerVersion()
            },
            { capabilities: { tools: {} } }
        )
        this.healthChecker = new HealthChecker(this.getServerName())
        this.setupHandlers()
    }

    /**
     * 获取服务器名称 - 子类必须实现
     */
    abstract getServerName(): string

    /**
     * 获取服务器版本 - 子类必须实现
     */
    abstract getServerVersion(): string

    /**
     * 获取工具列表 - 子类必须实现
     */
    abstract getTools(): MCPToolDefinition[]

    /**
     * 获取工具压缩映射 - 子类必须实现
     */
    abstract getToolCompressionMap(): ToolCompressionMap

    /**
     * 获取健康检查工具名称前缀
     * 子类可覆盖，默认使用服务器名称
     */
    protected getHealthCheckToolName(): string {
        // 从 "excel-mcp-server" 提取 "excel" 并转换为 "excelHealthCheck"
        const prefix = this.getServerName().split('-')[0]
        return `${prefix}HealthCheck`
    }

    /**
     * 创建健康检查工具
     */
    protected createHealthCheckTool(): MCPToolDefinition {
        const toolName = this.getHealthCheckToolName()
        const serverName = this.getServerName()

        return {
            name: toolName,
            description: `检查 ${serverName} 的健康状态，返回服务器运行状态、内存使用等信息`,
            category: 'system',
            inputSchema: {
                type: 'object',
                properties: {},
                required: []
            },
            handler: async () => {
                const health = await this.healthChecker.runHealthChecks()
                return {
                    success: true,
                    message: '健康检查完成',
                    data: {
                        ...health,
                        uptime: Math.round((Date.now() - this.startTime) / 1000),
                        toolCount: this.getTools().length
                    }
                }
            }
        }
    }

    /**
     * 获取包含健康检查工具的完整工具列表
     */
    protected getAllTools(): MCPToolDefinition[] {
        return [...this.getTools(), this.createHealthCheckTool()]
    }

    /**
     * 设置 MCP 协议处理器
     */
    protected setupHandlers(): void {
        const allTools = this.getAllTools()
        const compressionMap = this.getToolCompressionMap()

        // 列出所有工具
        this.server.setRequestHandler(ListToolsRequestSchema, async () => {
            logger.info(`列出 ${allTools.length} 个 ${this.getServerName()} 工具`)
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
            const compression = compressionMap[name]
            if (compression) {
                logger.info(`[兼容层] 转换旧工具名 ${name} -> ${compression.newTool} (action: ${compression.action})`)
                name = compression.newTool
                finalArgs = { action: compression.action, ...finalArgs }
            }

            const tool = allTools.find(t => t.name === name)

            if (!tool) {
                throw new Error(`未知工具: ${name}`)
            }

            logger.info(`执行工具: ${name}`, { action: (finalArgs as Record<string, unknown>).action })
            const result = await tool.handler(finalArgs as Record<string, unknown>)
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
        logger.info(`${this.getServerName()} 已启动`)
        logger.info(`可用工具: ${this.getTools().length} 个`)
        logger.info('='.repeat(50))
    }
}
