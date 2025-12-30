/**
 * BaseAdapter 单元测试
 *
 * 验证 BaseAdapter 默认实现的正确性
 */

import { describe, expect, it, beforeEach, vi } from 'vitest'

import { WordAdapter, ExcelAdapter, PowerPointAdapter } from '../index'
import type { FormattingFunction, FunctionCategory } from '../../ai/types'
import type { ClarificationPolicy, PromptContext, RetryPromptContext, ToolFilterContext } from '../types'

// Mock officeToolExecutor
vi.mock('../../OfficeToolExecutor', () => ({
  officeToolExecutor: {
    executeTool: vi.fn().mockResolvedValue({ success: false, message: 'mock' })
  }
}))

describe('BaseAdapter', () => {
  let wordAdapter: WordAdapter
  let excelAdapter: ExcelAdapter
  let pptAdapter: PowerPointAdapter

  beforeEach(() => {
    wordAdapter = new WordAdapter()
    excelAdapter = new ExcelAdapter()
    pptAdapter = new PowerPointAdapter()
  })

  describe('setAvailable', () => {
    it('should set adapter availability', () => {
      expect(wordAdapter.isAvailable).toBe(false)
      wordAdapter.setAvailable(true)
      expect(wordAdapter.isAvailable).toBe(true)
      wordAdapter.setAvailable(false)
      expect(wordAdapter.isAvailable).toBe(false)
    })
  })

  describe('getAgentPromptTemplates', () => {
    it('WordAdapter should return Word-specific templates', () => {
      const templates = wordAdapter.getAgentPromptTemplates()

      expect(templates.base).toContain('Word')
      expect(templates.base).toContain('文档')
      expect(templates.selectionHint).toBeDefined()
      expect(templates.toolGuide).toBeDefined()
      expect(templates.selectionTypePrompts).toBeDefined()
      expect(templates.scenarioPrompts?.education).toBeDefined()
    })

    it('ExcelAdapter should return Excel-specific templates', () => {
      const templates = excelAdapter.getAgentPromptTemplates()

      expect(templates.base).toContain('Excel')
      expect(templates.base).toContain('电子表格')
      expect(templates.selectionHint).toBeDefined()
      expect(templates.toolGuide).toBeDefined()
    })

    it('PowerPointAdapter should return PowerPoint-specific templates', () => {
      const templates = pptAdapter.getAgentPromptTemplates()

      expect(templates.base).toContain('PowerPoint')
      expect(templates.base).toContain('演示文稿')
      expect(templates.selectionHint).toBeDefined()
      expect(templates.toolGuide).toBeDefined()
    })
  })

  describe('buildAgentSystemPrompt', () => {
    const baseContext: PromptContext = {
      appType: 'word',
      hasSelection: false,
      selectionType: 'none'
    }

    it('should include Agent mode marker', () => {
      const prompt = wordAdapter.buildAgentSystemPrompt(baseContext)
      expect(prompt).toContain('[Agent 模式]')
    })

    it('should include base prompt', () => {
      const prompt = wordAdapter.buildAgentSystemPrompt(baseContext)
      expect(prompt).toContain('Word')
      expect(prompt).toContain('文档')
    })

    it('should include selection hint when has selection', () => {
      const contextWithSelection: PromptContext = {
        ...baseContext,
        hasSelection: true,
        selectionType: 'text'
      }
      const prompt = wordAdapter.buildAgentSystemPrompt(contextWithSelection)
      expect(prompt).toContain('选中')
    })

    it('should include tool execution reminder', () => {
      const prompt = wordAdapter.buildAgentSystemPrompt(baseContext)
      expect(prompt).toContain('必须调用工具')
    })

    it('should include clarification instruction based on policy', () => {
      const strictPolicy: ClarificationPolicy = {
        allowAskingUser: false,
        allowedScenarios: [],
        preferDefaults: true
      }
      const prompt = wordAdapter.buildAgentSystemPrompt(baseContext, strictPolicy)
      expect(prompt).toContain('使用合理的默认值')
    })

    it('Word should add education prompt when relevant keywords detected', () => {
      const eduContext: PromptContext = {
        ...baseContext,
        userMessage: '帮我制作一个课件'
      }
      const prompt = wordAdapter.buildAgentSystemPrompt(eduContext)
      expect(prompt).toContain('教育场景')
    })

    it('Excel should add education prompt for grade-related keywords', () => {
      const eduContext: PromptContext = {
        appType: 'excel',
        hasSelection: false,
        selectionType: 'none',
        userMessage: '计算班级平均分'
      }
      const prompt = excelAdapter.buildAgentSystemPrompt(eduContext)
      expect(prompt).toContain('教育场景')
    })
  })

  describe('buildRetryPrompt', () => {
    const mockTools: FormattingFunction[] = [
      {
        name: 'word_set_bold',
        description: 'Set bold',
        category: 'font' as FunctionCategory,
        inputSchema: {
          type: 'object',
          properties: {
            bold: { type: 'boolean', description: '是否加粗' }
          },
          required: ['bold']
        },
        handler: vi.fn()
      }
    ]

    it('should include diagnosis message', () => {
      const context: RetryPromptContext = {
        userMessage: '加粗文字',
        candidateTools: mockTools
      }
      const prompt = wordAdapter.buildRetryPrompt(context)
      expect(prompt).toContain('系统诊断')
    })

    it('should include user message', () => {
      const context: RetryPromptContext = {
        userMessage: '加粗文字',
        candidateTools: mockTools
      }
      const prompt = wordAdapter.buildRetryPrompt(context)
      expect(prompt).toContain('加粗文字')
    })

    it('should include tool examples', () => {
      const context: RetryPromptContext = {
        userMessage: '加粗文字',
        candidateTools: mockTools
      }
      const prompt = wordAdapter.buildRetryPrompt(context)
      expect(prompt).toContain('word_set_bold')
    })

    it('Word should add selection tip', () => {
      const context: RetryPromptContext = {
        userMessage: '加粗文字',
        candidateTools: mockTools
      }
      const prompt = wordAdapter.buildRetryPrompt(context)
      expect(prompt).toContain('选区提示')
    })

    it('Excel should add address tip', () => {
      const context: RetryPromptContext = {
        userMessage: '设置单元格',
        candidateTools: mockTools
      }
      const prompt = excelAdapter.buildRetryPrompt(context)
      expect(prompt).toContain('地址提示')
    })

    it('PowerPoint should add index tip', () => {
      const context: RetryPromptContext = {
        userMessage: '添加幻灯片',
        candidateTools: mockTools
      }
      const prompt = pptAdapter.buildRetryPrompt(context)
      expect(prompt).toContain('索引提示')
    })
  })

  describe('filterToolsByIntent', () => {
    const mockTools: FormattingFunction[] = [
      { name: 'word_set_bold', description: 'Bold', category: 'font' as FunctionCategory, inputSchema: { type: 'object', properties: {} }, handler: vi.fn() },
      { name: 'word_insert_table', description: 'Table', category: 'table' as FunctionCategory, inputSchema: { type: 'object', properties: {} }, handler: vi.fn() },
      { name: 'excel_set_cell', description: 'Cell', category: 'cell' as FunctionCategory, inputSchema: { type: 'object', properties: {} }, handler: vi.fn() },
      { name: 'ppt_add_slide', description: 'Slide', category: 'slide' as FunctionCategory, inputSchema: { type: 'object', properties: {} }, handler: vi.fn() }
    ]

    it('WordAdapter should filter to only word_ tools', () => {
      const context: ToolFilterContext = {
        userIntent: '加粗',
        selectionType: 'text',
        hasSelection: true
      }
      const filtered = wordAdapter.filterToolsByIntent(mockTools, context)

      expect(filtered.every(t => t.name.startsWith('word_'))).toBe(true)
      expect(filtered.length).toBe(2)
    })

    it('ExcelAdapter should filter to only excel_ tools', () => {
      const context: ToolFilterContext = {
        userIntent: '设置单元格',
        selectionType: 'text',
        hasSelection: true
      }
      const filtered = excelAdapter.filterToolsByIntent(mockTools, context)

      expect(filtered.every(t => t.name.startsWith('excel_'))).toBe(true)
    })

    it('PowerPointAdapter should filter to only ppt_ tools', () => {
      const context: ToolFilterContext = {
        userIntent: '添加幻灯片',
        selectionType: 'text',
        hasSelection: true
      }
      const filtered = pptAdapter.filterToolsByIntent(mockTools, context)

      expect(filtered.every(t => t.name.startsWith('ppt_'))).toBe(true)
    })

    it('WordAdapter should prioritize matched keyword tools', () => {
      const context: ToolFilterContext = {
        userIntent: '加粗',
        selectionType: 'text',
        hasSelection: true,
        keywords: ['加粗']
      }
      const filtered = wordAdapter.filterToolsByIntent(mockTools, context)

      expect(filtered.some(t => t.name === 'word_set_bold')).toBe(true)
    })
  })

  describe('getKeywordToolMappings', () => {
    it('WordAdapter should return Word keyword mappings', () => {
      const mappings = wordAdapter.getKeywordToolMappings()

      expect(mappings['标题']).toContain('word_set_heading')
      expect(mappings['加粗']).toContain('word_set_bold')
      expect(mappings['表格']).toContain('word_insert_table')
    })

    it('ExcelAdapter should return Excel keyword mappings', () => {
      const mappings = excelAdapter.getKeywordToolMappings()

      expect(mappings['单元格']).toContain('excel_set_cell_value')
      expect(mappings['公式']).toContain('excel_set_formula')
      expect(mappings['图表']).toContain('excel_insert_chart')
    })

    it('PowerPointAdapter should return PowerPoint keyword mappings', () => {
      const mappings = pptAdapter.getKeywordToolMappings()

      expect(mappings['幻灯片']).toContain('ppt_add_slide')
      expect(mappings['动画']).toContain('ppt_add_animation')
    })
  })

  describe('getDefaultClarificationPolicy', () => {
    it('should return a valid policy', () => {
      const policy = wordAdapter.getDefaultClarificationPolicy()

      expect(policy).toHaveProperty('allowAskingUser')
      expect(policy).toHaveProperty('allowedScenarios')
      expect(policy).toHaveProperty('preferDefaults')
      expect(Array.isArray(policy.allowedScenarios)).toBe(true)
    })
  })

  describe('Cache functionality', () => {
    it('clearCache should reset caches', () => {
      // Access internal cache via type casting for testing
      const adapter = wordAdapter as any
      adapter.selectionContextCache = { data: {}, timestamp: Date.now() }
      adapter.documentContextCache = { data: {}, timestamp: Date.now() }

      wordAdapter.clearCache()

      expect(adapter.selectionContextCache).toBeNull()
      expect(adapter.documentContextCache).toBeNull()
    })
  })

  describe('Lifecycle', () => {
    it('dispose should clear caches and reset state', () => {
      const adapter = wordAdapter as any
      adapter._isInitialized = true
      adapter.selectionContextCache = { data: {}, timestamp: Date.now() }

      wordAdapter.dispose()

      expect(adapter._isInitialized).toBe(false)
      expect(adapter.selectionContextCache).toBeNull()
    })
  })
})
