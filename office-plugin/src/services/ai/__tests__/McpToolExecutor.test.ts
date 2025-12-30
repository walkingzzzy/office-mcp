import { beforeEach, describe, expect, it, vi } from 'vitest'

import { McpToolExecutor } from '../McpToolExecutor'

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

describe('McpToolExecutor', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('executes MCP tool when server is available', async () => {
    getStateMock.mockReturnValue({
      getEnabledMcpServers: () => [{ id: 'server-enabled' }],
      getMcpServers: () => [{ id: 'server-enabled' }]
    })
    callMcpToolMock.mockResolvedValue({ value: 42 })

    const executor = new McpToolExecutor()
    const result = await executor.executeTool('word_insert_text', { text: 'hello' })

    expect(callMcpToolMock).toHaveBeenCalledWith('server-enabled', 'word_insert_text', { text: 'hello' })
    expect(result.success).toBe(true)
    expect(result.data).toEqual({ value: 42 })
  })

  it('returns error when no MCP server is configured', async () => {
    getStateMock.mockReturnValue({
      getEnabledMcpServers: () => [],
      getMcpServers: () => []
    })

    const executor = new McpToolExecutor()
    const result = await executor.executeTool('word_insert_text', {})

    expect(result.success).toBe(false)
    expect(callMcpToolMock).not.toHaveBeenCalled()
    expect(result.message).toMatch(/MCP 服务器/)
  })

  it('handles API errors gracefully', async () => {
    getStateMock.mockReturnValue({
      getEnabledMcpServers: () => [{ id: 'server-enabled' }],
      getMcpServers: () => [{ id: 'server-enabled' }]
    })
    callMcpToolMock.mockRejectedValue(new Error('boom'))

    const executor = new McpToolExecutor()
    const result = await executor.executeTool('word_insert_text', {})

    expect(result.success).toBe(false)
    expect(result.message).toBe('boom')
  })
})
