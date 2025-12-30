/**
 * ToolSelector Excel/PPT 工具选择测试
 * 
 * 确保 ToolSelector 能正确根据 documentType 选出 Excel/PPT 工具
 */

import { describe, expect, it, beforeEach } from 'vitest'

import { ToolSelector } from '../ToolSelector'
import type { FormattingFunction, SelectionContext } from '../types'
import { FunctionCategory } from '../types'

describe('ToolSelector Excel/PPT Support', () => {
  let toolSelector: ToolSelector

  // 模拟工具集合
  const mockTools: FormattingFunction[] = [
    // Word 工具
    {
      name: 'word_insert_text',
      description: '插入文本到 Word 文档',
      category: FunctionCategory.PARAGRAPH,
      inputSchema: { type: 'object', properties: {}, required: [] },
      handler: async () => ({ success: true, message: 'ok' }),
      metadata: {
        documentTypes: ['word'],
        intentKeywords: ['插入', '文本', '输入']
      }
    },
    {
      name: 'word_set_heading',
      description: '设置标题级别',
      category: FunctionCategory.STYLE,
      inputSchema: { type: 'object', properties: {}, required: [] },
      handler: async () => ({ success: true, message: 'ok' }),
      metadata: {
        documentTypes: ['word'],
        intentKeywords: ['标题', '设置', 'heading']
      }
    },
    // Excel 工具
    {
      name: 'excel_set_cell_value',
      description: '设置 Excel 单元格值',
      category: FunctionCategory.TABLE,
      inputSchema: { type: 'object', properties: {}, required: [] },
      handler: async () => ({ success: true, message: 'ok' }),
      metadata: {
        documentTypes: ['excel'],
        intentKeywords: ['单元格', '写入', '设置值', 'cell', 'value']
      }
    },
    {
      name: 'excel_insert_chart',
      description: '在 Excel 中插入图表',
      category: FunctionCategory.IMAGE,
      inputSchema: { type: 'object', properties: {}, required: [] },
      handler: async () => ({ success: true, message: 'ok' }),
      metadata: {
        documentTypes: ['excel'],
        intentKeywords: ['图表', '柱状图', '折线图', 'chart']
      }
    },
    // PowerPoint 工具
    {
      name: 'ppt_add_slide',
      description: '添加幻灯片',
      category: FunctionCategory.LAYOUT,
      inputSchema: { type: 'object', properties: {}, required: [] },
      handler: async () => ({ success: true, message: 'ok' }),
      metadata: {
        documentTypes: ['powerpoint'],
        intentKeywords: ['幻灯片', '添加', 'slide']
      }
    },
    {
      name: 'ppt_add_text_box',
      description: '添加文本框',
      category: FunctionCategory.PARAGRAPH,
      inputSchema: { type: 'object', properties: {}, required: [] },
      handler: async () => ({ success: true, message: 'ok' }),
      metadata: {
        documentTypes: ['powerpoint'],
        intentKeywords: ['文本框', '添加', 'textbox']
      }
    }
  ]

  beforeEach(() => {
    toolSelector = new ToolSelector(mockTools)
  })

  describe('matchesDocumentType filtering', () => {
    it('should select only Word tools when documentType is word', () => {
      const context: SelectionContext = {
        hasSelection: false,
        selectionType: 'none',
        documentType: 'word'
      }

      const result = toolSelector.selectCandidateTools('插入文本', context, 10)
      
      // 应该只包含 Word 工具
      const toolNames = result.map(t => t.name)
      expect(toolNames).toContain('word_insert_text')
      expect(toolNames).not.toContain('excel_set_cell_value')
      expect(toolNames).not.toContain('ppt_add_slide')
    })

    it('should select only Excel tools when documentType is excel', () => {
      const context: SelectionContext = {
        hasSelection: false,
        selectionType: 'none',
        documentType: 'excel'
      }

      const result = toolSelector.selectCandidateTools('设置单元格值', context, 10)
      
      // 应该只包含 Excel 工具
      const toolNames = result.map(t => t.name)
      expect(toolNames).toContain('excel_set_cell_value')
      expect(toolNames).not.toContain('word_insert_text')
      expect(toolNames).not.toContain('ppt_add_slide')
    })

    it('should select only PowerPoint tools when documentType is powerpoint', () => {
      const context: SelectionContext = {
        hasSelection: false,
        selectionType: 'none',
        documentType: 'powerpoint'
      }

      const result = toolSelector.selectCandidateTools('添加幻灯片', context, 10)
      
      // 应该只包含 PPT 工具
      const toolNames = result.map(t => t.name)
      expect(toolNames).toContain('ppt_add_slide')
      expect(toolNames).not.toContain('word_insert_text')
      expect(toolNames).not.toContain('excel_set_cell_value')
    })
  })

  describe('intentKeywords matching for Excel', () => {
    it('should match Excel tools by Chinese keywords', () => {
      const context: SelectionContext = {
        hasSelection: false,
        selectionType: 'none',
        documentType: 'excel'
      }

      const result = toolSelector.selectCandidateTools('在单元格A1写入数据', context, 10)
      const toolNames = result.map(t => t.name)
      
      expect(toolNames).toContain('excel_set_cell_value')
    })

    it('should match Excel chart tools', () => {
      const context: SelectionContext = {
        hasSelection: false,
        selectionType: 'none',
        documentType: 'excel'
      }

      const result = toolSelector.selectCandidateTools('插入一个柱状图', context, 10)
      const toolNames = result.map(t => t.name)
      
      expect(toolNames).toContain('excel_insert_chart')
    })
  })

  describe('intentKeywords matching for PowerPoint', () => {
    it('should match PowerPoint tools by Chinese keywords', () => {
      const context: SelectionContext = {
        hasSelection: false,
        selectionType: 'none',
        documentType: 'powerpoint'
      }

      const result = toolSelector.selectCandidateTools('添加一张新幻灯片', context, 10)
      const toolNames = result.map(t => t.name)
      
      expect(toolNames).toContain('ppt_add_slide')
    })

    it('should match PowerPoint text box tools', () => {
      const context: SelectionContext = {
        hasSelection: false,
        selectionType: 'none',
        documentType: 'powerpoint'
      }

      const result = toolSelector.selectCandidateTools('添加文本框', context, 10)
      const toolNames = result.map(t => t.name)
      
      expect(toolNames).toContain('ppt_add_text_box')
    })
  })

  describe('tools without documentTypes metadata', () => {
    it('should include tools without documentTypes in all document types', () => {
      // 添加一个没有 documentTypes 的通用工具
      const toolsWithGeneric = [
        ...mockTools,
        {
          name: 'generic_tool',
          description: '通用工具',
          category: FunctionCategory.SMART,
          inputSchema: { type: 'object' as const, properties: {}, required: [] },
          handler: async () => ({ success: true, message: 'ok' }),
          metadata: {
            intentKeywords: ['通用', '帮助']
          }
          // 没有 documentTypes
        }
      ]

      const selector = new ToolSelector(toolsWithGeneric)
      
      // Excel 文档中应该能选到通用工具
      const excelContext: SelectionContext = {
        hasSelection: false,
        selectionType: 'none',
        documentType: 'excel'
      }
      const excelResult = selector.selectCandidateTools('需要通用帮助', excelContext, 10)
      expect(excelResult.map(t => t.name)).toContain('generic_tool')

      // PPT 文档中也应该能选到通用工具
      const pptContext: SelectionContext = {
        hasSelection: false,
        selectionType: 'none',
        documentType: 'powerpoint'
      }
      const pptResult = selector.selectCandidateTools('需要通用帮助', pptContext, 10)
      expect(pptResult.map(t => t.name)).toContain('generic_tool')
    })
  })

  describe('cross-app tool selection prevention', () => {
    it('should NOT select Word tools when in Excel document', () => {
      const context: SelectionContext = {
        hasSelection: false,
        selectionType: 'none',
        documentType: 'excel'
      }

      // 即使用户输入了 Word 相关的关键词
      const result = toolSelector.selectCandidateTools('设置标题', context, 10)
      const toolNames = result.map(t => t.name)
      
      // Word 的 heading 工具不应该被选中
      expect(toolNames).not.toContain('word_set_heading')
    })

    it('should NOT select Excel tools when in PowerPoint document', () => {
      const context: SelectionContext = {
        hasSelection: false,
        selectionType: 'none',
        documentType: 'powerpoint'
      }

      const result = toolSelector.selectCandidateTools('设置单元格', context, 10)
      const toolNames = result.map(t => t.name)
      
      // Excel 工具不应该被选中
      expect(toolNames).not.toContain('excel_set_cell_value')
    })
  })
})
