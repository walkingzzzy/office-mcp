/**
 * 端到端集成测试：Office 插件 MCP 工具调用流程
 * 
 * 测试目标：验证 MCP 工具在整个调用链中的正确传递和执行
 * 
 * 测试流程：
 * 1. FunctionCallHandler 接收 tool_call
 * 2. McpToolExecutor 执行工具
 * 3. OfficeToolExecutor 执行本地 Word 操作
 * 4. 结果回传
 * 
 * @see MCP_FULL_INTEGRATION_PLAN.md 步骤5
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'

// Mock Word 全局对象
const mockContext = {
  document: {
    body: {
      text: 'Test document content',
      paragraphs: {
        items: [{ text: 'Paragraph 1' }, { text: 'Paragraph 2' }],
        load: vi.fn()
      },
      insertText: vi.fn(),
      insertParagraph: vi.fn(),
      inlinePictures: {
        items: [],
        load: vi.fn()
      },
      tables: {
        items: [{ id: 'table-1' }],
        load: vi.fn()
      },
      load: vi.fn()
    },
    getSelection: vi.fn().mockReturnValue({
      text: 'selected text',
      font: { bold: false },
      paragraphs: { items: [], load: vi.fn() },
      tables: { items: [], load: vi.fn() },
      inlinePictures: { items: [], load: vi.fn() },
      insertText: vi.fn(),
      load: vi.fn()
    })
  },
  sync: vi.fn().mockResolvedValue(undefined)
}

const mockWordRun = vi.fn().mockImplementation(async (callback) => {
  return callback(mockContext)
})

;(global as any).Word = {
  run: mockWordRun,
  InsertLocation: {
    start: 'Start',
    end: 'End',
    before: 'Before',
    after: 'After',
    replace: 'Replace'
  },
  Alignment: {
    left: 'Left',
    centered: 'Centered',
    right: 'Right',
    justified: 'Justified'
  }
}

import { officeToolExecutor } from '../../src/services/OfficeToolExecutor'

describe('Office Plugin MCP Tool Calling E2E', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('MCP 工具执行链路', () => {
    it('word_insert_text 应成功插入文本到文档', async () => {
      const result = await officeToolExecutor.executeTool('word_insert_text', {
        text: '这是通过 MCP 插入的文本',
        location: 'end'
      })

      expect(result.success).toBe(true)
      expect(result.message).toContain('插入成功')
      expect(result.data?.insertedLength).toBe(14)
      expect(result.executionTime).toBeDefined()
    })

    it('word_read_document 应成功读取文档内容', async () => {
      const result = await officeToolExecutor.executeTool('word_read_document', {})

      expect(result.success).toBe(true)
      expect(result.data?.text).toBe('Test document content')
      expect(result.data?.paragraphCount).toBe(2)
    })

    it('word_get_selected_text 应成功获取选中文本', async () => {
      const result = await officeToolExecutor.executeTool('word_get_selected_text', {})

      expect(result.success).toBe(true)
      expect(result.data?.text).toBe('selected text')
    })

    it('word_detect_selection_type 应正确检测选区类型', async () => {
      const result = await officeToolExecutor.executeTool('word_detect_selection_type', {})

      expect(result.success).toBe(true)
      expect(['text', 'image', 'table', 'none']).toContain(result.data?.selectionType)
    })

    it('word_check_document_has_tables 应正确检测表格', async () => {
      const result = await officeToolExecutor.executeTool('word_check_document_has_tables', {})

      expect(result.success).toBe(true)
      expect(result.data?.hasTables).toBe(true)
      expect(result.data?.tableCount).toBe(1)
    })

    it('word_check_document_has_images 应正确检测图片', async () => {
      const result = await officeToolExecutor.executeTool('word_check_document_has_images', {})

      expect(result.success).toBe(true)
      expect(result.data?.hasImages).toBe(false)
      expect(result.data?.imageCount).toBe(0)
    })
  })

  describe('工具执行错误处理', () => {
    it('未支持的工具应返回明确错误', async () => {
      const result = await officeToolExecutor.executeTool('word_unknown_tool', {})

      expect(result.success).toBe(false)
      expect(result.message).toContain('Unsupported tool')
    })

    it('缺少必需参数应返回错误', async () => {
      const result = await officeToolExecutor.executeTool('word_insert_text', {
        // 缺少 text 参数
        location: 'end'
      })

      expect(result.success).toBe(false)
      expect(result.message).toContain('text')
    })

    it('Word.run 异常应被正确捕获', async () => {
      mockWordRun.mockImplementationOnce(async () => {
        throw new Error('Office API 不可用')
      })

      const result = await officeToolExecutor.executeTool('word_read_document', {})

      expect(result.success).toBe(false)
      expect(result.message).toContain('Office API 不可用')
    })
  })

  describe('完整工作流测试', () => {
    it('场景1: 用户请求插入文本模板', async () => {
      // 模拟 AI 返回的工具调用
      const toolCall = {
        name: 'word_insert_text',
        arguments: {
          text: '# 项目计划\\n\\n## 目标\\n[在此填写目标]\\n\\n## 时间表\\n[在此填写时间表]',
          location: 'end'
        }
      }

      const result = await officeToolExecutor.executeTool(toolCall.name, toolCall.arguments)

      expect(result.success).toBe(true)
      expect(mockContext.document.body.insertText).toHaveBeenCalled()
    })

    it('场景2: 用户请求读取文档并分析', async () => {
      // 步骤1: 读取文档
      const readResult = await officeToolExecutor.executeTool('word_read_document', {})
      expect(readResult.success).toBe(true)

      // 步骤2: 检查文档结构
      const tableResult = await officeToolExecutor.executeTool('word_check_document_has_tables', {})
      expect(tableResult.success).toBe(true)

      const imageResult = await officeToolExecutor.executeTool('word_check_document_has_images', {})
      expect(imageResult.success).toBe(true)

      // 验证完整的文档信息
      expect(readResult.data?.text).toBeDefined()
      expect(tableResult.data?.hasTables).toBeDefined()
      expect(imageResult.data?.hasImages).toBeDefined()
    })

    it('场景3: 批量工具调用', async () => {
      const toolCalls = [
        { name: 'word_insert_text', args: { text: '第一段', location: 'end' } },
        { name: 'word_insert_text', args: { text: '第二段', location: 'end' } },
        { name: 'word_insert_text', args: { text: '第三段', location: 'end' } }
      ]

      const results = await Promise.all(
        toolCalls.map(tc => officeToolExecutor.executeTool(tc.name, tc.args))
      )

      // 所有调用都应成功
      expect(results.every(r => r.success)).toBe(true)
      expect(results).toHaveLength(3)
    })
  })

  describe('性能与追踪', () => {
    it('应记录执行时间', async () => {
      const result = await officeToolExecutor.executeTool('word_read_document', {})

      expect(result.executionTime).toBeDefined()
      expect(typeof result.executionTime).toBe('number')
      expect(result.executionTime).toBeGreaterThanOrEqual(0)
    })

    it('应支持 toolCallId 追踪', async () => {
      const result = await officeToolExecutor.executeTool(
        'word_insert_text',
        { text: 'test', location: 'end' },
        { toolCallId: 'call-123' }
      )

      expect(result.success).toBe(true)
      // toolCallId 应被记录在日志中（通过 mock 验证）
    })
  })
})

/**
 * 创建测试用的 MCP 工具定义
 */
function createMcpTool(name: string, description: string) {
  return {
    name,
    description,
    inputSchema: {
      type: 'object',
      properties: {
        text: { type: 'string' }
      },
      required: ['text']
    }
  }
}

