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
      insertTable: vi.fn().mockReturnValue({
        rowCount: 3,
        load: vi.fn()
      }),
      load: vi.fn()
    },
    getSelection: vi.fn().mockReturnValue({
      text: 'selected text',
      font: {
        bold: false,
        italic: false,
        underline: 'None',
        size: 12,
        name: 'Arial',
        color: '#000000'
      },
      paragraphs: {
        items: [{ alignment: 'left' }],
        load: vi.fn()
      },
      insertText: vi.fn(),
      load: vi.fn()
    })
  },
  sync: vi.fn().mockResolvedValue(undefined)
}

const mockWordRun = vi.fn().mockImplementation(async (callback) => {
  return callback(mockContext)
})

// 设置全局 Word 对象
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

import { officeToolExecutor } from '../OfficeToolExecutor'

describe('OfficeToolExecutor', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('文本操作', () => {
    it('word_insert_text 应成功插入文本', async () => {
      const result = await officeToolExecutor.executeTool('word_insert_text', {
        text: 'hello world',
        location: 'end'
      })

      expect(result.success).toBe(true)
      expect(result.message).toContain('插入成功')
      expect(result.data?.insertedLength).toBe(11)
      expect(mockWordRun).toHaveBeenCalled()
    })

    it('word_insert_text 缺少 text 参数应失败', async () => {
      const result = await officeToolExecutor.executeTool('word_insert_text', {
        location: 'end'
      })

      expect(result.success).toBe(false)
      expect(result.message).toContain('text')
    })

    it('word_add_paragraph 应成功添加段落', async () => {
      const result = await officeToolExecutor.executeTool('word_add_paragraph', {
        text: '新段落内容',
        location: 'end'
      })

      expect(result.success).toBe(true)
      expect(result.message).toContain('段落')
    })
  })

  describe('读取操作', () => {
    it('word_read_document 应成功读取文档', async () => {
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
  })

  describe('格式化操作', () => {
    it('word_format_text 应成功格式化文本', async () => {
      const result = await officeToolExecutor.executeTool('word_format_text', {
        bold: true,
        fontSize: 14
      })

      expect(result.success).toBe(true)
      expect(result.message).toContain('格式化')
    })

    it('word_set_paragraph_alignment 应成功设置对齐', async () => {
      const result = await officeToolExecutor.executeTool('word_set_paragraph_alignment', {
        alignment: 'center'
      })

      expect(result.success).toBe(true)
      expect(result.data?.alignment).toBe('center')
    })

    it('word_set_paragraph_alignment 无效对齐方式应失败', async () => {
      const result = await officeToolExecutor.executeTool('word_set_paragraph_alignment', {
        alignment: 'invalid'
      })

      expect(result.success).toBe(false)
      expect(result.message).toContain('不支持')
    })
  })

  describe('表格操作', () => {
    it('word_insert_table 应成功插入表格', async () => {
      const result = await officeToolExecutor.executeTool('word_insert_table', {
        rows: 3,
        columns: 4
      })

      expect(result.success).toBe(true)
      expect(result.message).toContain('表格')
    })
  })

  describe('错误处理', () => {
    it('未支持的工具应返回失败', async () => {
      const result = await officeToolExecutor.executeTool('word_unknown_tool', {})

      expect(result.success).toBe(false)
      expect(result.message).toContain('Unsupported tool')
    })

    it('应包含执行时间', async () => {
      const result = await officeToolExecutor.executeTool('word_read_document', {})

      expect(result.executionTime).toBeDefined()
      expect(typeof result.executionTime).toBe('number')
    })
  })
})
