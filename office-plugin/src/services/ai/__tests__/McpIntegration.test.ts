/**
 * MCP 集成测试
 * 
 * 验证 MCP 工具执行链路：
 * POST /api/office-plugin/execute-tool → McpCommandPoller → McpToolExecutor → MCP Server → 回传结果
 * 
 * @see MCP_FULL_INTEGRATION_PLAN.md 步骤5
 */

import { beforeEach, describe, expect, it, vi, afterEach } from 'vitest'

// Mock fetch for API calls
const fetchMock = vi.fn()
global.fetch = fetchMock

// Mock configStore
const { getStateMock, callMcpToolMock } = vi.hoisted(() => ({
  getStateMock: vi.fn(),
  callMcpToolMock: vi.fn()
}))

vi.mock('../../../store/configStore', () => ({
  __esModule: true,
  default: {
    getState: getStateMock
  }
}))

vi.mock('../../api/endpoints/mcp.api', () => ({
  mcpApi: {
    callMCPTool: callMcpToolMock
  }
}))

// Mock window for setInterval
vi.stubGlobal('window', {
  setInterval: vi.fn(),
  clearInterval: vi.fn()
})

import { McpToolExecutor } from '../McpToolExecutor'
import { FunctionCallHandler } from '../FunctionCallHandler'
import { getFunctionRegistry } from '../FormattingFunctionRegistry'

describe('MCP Integration Tests', () => {
  let mcpToolExecutor: McpToolExecutor
  let functionCallHandler: FunctionCallHandler

  beforeEach(async () => {
    vi.clearAllMocks()
    
    // 配置 MCP 服务器可用
    getStateMock.mockReturnValue({
      getEnabledMcpServers: () => [{ id: 'test-mcp-server' }],
      getMcpServers: () => [{ id: 'test-mcp-server' }]
    })

    // 初始化 Registry
    const registry = getFunctionRegistry()
    await registry.initialize()

    // 创建执行器和处理器
    mcpToolExecutor = new McpToolExecutor()
    functionCallHandler = new FunctionCallHandler(registry)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('McpToolExecutor 执行链路', () => {
    it('word_insert_text 应通过 MCP Server 执行成功', async () => {
      // 模拟 MCP Server 返回成功
      callMcpToolMock.mockResolvedValue({
        success: true,
        message: '文本插入成功',
        data: { insertedLength: 11 }
      })

      const result = await mcpToolExecutor.executeTool('word_insert_text', {
        text: 'Hello World',
        location: 'end'
      })

      // 验证调用
      expect(callMcpToolMock).toHaveBeenCalledWith(
        'test-mcp-server',
        'word_insert_text',
        { text: 'Hello World', location: 'end' }
      )

      // 验证结果
      expect(result.success).toBe(true)
      expect(result.executionTime).toBeDefined()
    })

    it('word_read_document 应通过 MCP Server 执行成功', async () => {
      callMcpToolMock.mockResolvedValue({
        text: 'Document content',
        paragraphs: [{ text: 'Paragraph 1', index: 0 }],
        characterCount: 16
      })

      const result = await mcpToolExecutor.executeTool('word_read_document', {})

      expect(callMcpToolMock).toHaveBeenCalledWith(
        'test-mcp-server',
        'word_read_document',
        {}
      )
      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
    })

    it('word_get_selected_text 应通过 MCP Server 执行成功', async () => {
      callMcpToolMock.mockResolvedValue({
        text: 'Selected text'
      })

      const result = await mcpToolExecutor.executeTool('word_get_selected_text', {})

      expect(callMcpToolMock).toHaveBeenCalledWith(
        'test-mcp-server',
        'word_get_selected_text',
        {}
      )
      expect(result.success).toBe(true)
    })

    it('无 MCP Server 时应返回明确错误', async () => {
      getStateMock.mockReturnValue({
        getEnabledMcpServers: () => [],
        getMcpServers: () => []
      })

      const result = await mcpToolExecutor.executeTool('word_insert_text', {
        text: 'test'
      })

      expect(result.success).toBe(false)
      expect(result.message).toContain('MCP')
      expect(callMcpToolMock).not.toHaveBeenCalled()
    })

    it('MCP Server 错误应被正确捕获', async () => {
      callMcpToolMock.mockRejectedValue(new Error('MCP Server 连接失败'))

      const result = await mcpToolExecutor.executeTool('word_insert_text', {
        text: 'test'
      })

      expect(result.success).toBe(false)
      expect(result.message).toBe('MCP Server 连接失败')
      expect(result.error).toBeDefined()
    })
  })

  describe('FunctionCallHandler MCP 优先执行', () => {
    it('所有工具调用应统一走 MCP 链路', async () => {
      callMcpToolMock.mockResolvedValue({
        success: true,
        message: '执行成功'
      })

      const toolCall = {
        id: 'test-call-001',
        type: 'function' as const,
        function: {
          name: 'word_insert_text',
          arguments: JSON.stringify({ text: 'MCP Test', location: 'end' })
        }
      }

      const result = await functionCallHandler.handleToolCall(toolCall)

      // 验证通过 MCP 执行
      expect(callMcpToolMock).toHaveBeenCalledWith(
        'test-mcp-server',
        'word_insert_text',
        { text: 'MCP Test', location: 'end' }
      )

      // 验证返回格式
      expect(result.tool_call_id).toBe('test-call-001')
      expect(result.role).toBe('tool')
      
      const content = JSON.parse(result.content)
      expect(content.success).toBe(true)
    })

    it('Registry 中的 mcpOnly 工具不应本地执行', async () => {
      const registry = getFunctionRegistry()
      const func = registry.getFunction('word_insert_text')
      
      // 验证工具标记为 mcpOnly
      expect(func?.mcpOnly).toBe(true)

      // 直接调用 registry.executeFunction 应返回 MCP_ONLY_ERROR
      const result = await registry.executeFunction('word_insert_text', { text: 'test' })
      
      expect(result.success).toBe(false)
      expect(result.message).toContain('MCP')
    })

    it('批量工具调用应全部走 MCP', async () => {
      callMcpToolMock.mockResolvedValue({
        success: true,
        message: '执行成功'
      })

      const toolCalls = [
        {
          id: 'call-1',
          type: 'function' as const,
          function: {
            name: 'word_insert_text',
            arguments: JSON.stringify({ text: 'First' })
          }
        },
        {
          id: 'call-2',
          type: 'function' as const,
          function: {
            name: 'word_insert_text',
            arguments: JSON.stringify({ text: 'Second' })
          }
        }
      ]

      const results = await functionCallHandler.handleToolCalls(toolCalls, undefined, {
        skipBatchConfirm: true
      })

      // 验证所有调用都通过 MCP
      expect(callMcpToolMock).toHaveBeenCalledTimes(2)
      expect(results).toHaveLength(2)
    })
  })

  describe('FormattingFunctionRegistry MCP-only 约束', () => {
    it('所有注册的工具都应标记为 mcpOnly', async () => {
      const registry = getFunctionRegistry()
      await registry.initialize()

      const allFunctions = registry.getAllFunctions()
      
      // 验证所有工具都标记为 mcpOnly
      for (const func of allFunctions) {
        expect(func.mcpOnly).toBe(true)
      }
    })

    it('executeFunction 应返回废弃警告', async () => {
      const registry = getFunctionRegistry()
      await registry.initialize()

      // 直接调用 executeFunction 应该返回 MCP_ONLY_ERROR
      const result = await registry.executeFunction('word_add_paragraph', { text: 'test' })
      
      expect(result.success).toBe(false)
      expect(result.message).toContain('MCP')
    })
  })

  describe('工具执行超时处理', () => {
    it('MCP 调用超时应返回明确错误', async () => {
      // 模拟超时
      callMcpToolMock.mockImplementation(() => 
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout')), 100)
        )
      )

      const result = await mcpToolExecutor.executeTool('word_insert_text', {
        text: 'timeout test'
      })

      expect(result.success).toBe(false)
      expect(result.message).toBe('Request timeout')
    })
  })
})

describe('端到端 MCP 工具调用场景', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    getStateMock.mockReturnValue({
      getEnabledMcpServers: () => [{ id: 'office-mcp-server' }],
      getMcpServers: () => [{ id: 'office-mcp-server' }]
    })
  })

  it('场景1: 用户请求插入文本模板', async () => {
    // 模拟 MCP Server 成功执行
    callMcpToolMock.mockResolvedValue({
      success: true,
      message: '模板插入成功',
      data: {
        insertedText: '# 项目计划\n\n## 目标\n\n## 时间线\n',
        characterCount: 30
      }
    })

    const executor = new McpToolExecutor()
    const result = await executor.executeTool('word_insert_text', {
      text: '# 项目计划\n\n## 目标\n\n## 时间线\n',
      location: 'end'
    })

    expect(result.success).toBe(true)
    expect(callMcpToolMock).toHaveBeenCalledWith(
      'office-mcp-server',
      'word_insert_text',
      expect.objectContaining({ text: expect.stringContaining('项目计划') })
    )
  })

  it('场景2: AI 生成内容并替换选区', async () => {
    callMcpToolMock.mockResolvedValue({
      success: true,
      message: '选区替换成功'
    })

    const executor = new McpToolExecutor()
    const result = await executor.executeTool('word_insert_text', {
      text: 'AI 生成的优化文本内容',
      location: 'replace'
    })

    expect(result.success).toBe(true)
    expect(callMcpToolMock).toHaveBeenCalledWith(
      'office-mcp-server',
      'word_insert_text',
      { text: 'AI 生成的优化文本内容', location: 'replace' }
    )
  })

  it('场景3: 读取文档内容供 AI 分析', async () => {
    callMcpToolMock.mockResolvedValue({
      text: '这是一份测试文档的内容...',
      paragraphs: [
        { text: '第一段', index: 0 },
        { text: '第二段', index: 1 }
      ],
      characterCount: 500
    })

    const executor = new McpToolExecutor()
    const result = await executor.executeTool('word_read_document', {})

    expect(result.success).toBe(true)
    expect(result.data).toBeDefined()
    expect(callMcpToolMock).toHaveBeenCalledWith(
      'office-mcp-server',
      'word_read_document',
      {}
    )
  })
})
