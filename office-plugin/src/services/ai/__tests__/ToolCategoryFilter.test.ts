/**
 * ToolCategoryFilter 单元测试
 */

import { describe, expect, it } from 'vitest'
import { ToolCategory, ToolCategoryFilter } from '../ToolCategoryFilter'

describe('ToolCategoryFilter', () => {
  const filter = new ToolCategoryFilter()

  describe('意图识别', () => {
    it('应该识别 Word 文本操作意图', () => {
      const analysis = filter.analyzeIntent('帮我在文档中插入一段文本')

      expect(analysis.categories).toContain(ToolCategory.WORD_TEXT)
      expect(analysis.confidence).toBeGreaterThan(0)
      expect(analysis.isDefault).toBe(false)
      expect(analysis.matchedKeywords).toContain('插入')
    })

    it('应该识别 Excel 公式操作意图', () => {
      const analysis = filter.analyzeIntent('帮我计算这列数据的求和')

      expect(analysis.categories).toContain(ToolCategory.EXCEL_FORMULA)
      expect(analysis.matchedKeywords).toContain('计算')
      expect(analysis.matchedKeywords).toContain('求和')
    })

    it('应该识别 PowerPoint 幻灯片操作意图', () => {
      const analysis = filter.analyzeIntent('添加一张新的幻灯片')

      expect(analysis.categories).toContain(ToolCategory.PPT_SLIDE)
      expect(analysis.matchedKeywords).toContain('添加')
      expect(analysis.matchedKeywords).toContain('幻灯片')
    })

    it('应该识别多个类别', () => {
      const analysis = filter.analyzeIntent('创建一个包含图表的表格')

      expect(analysis.categories.length).toBeGreaterThan(1)
      // 可能包含 Word 表格, Excel 表格, Excel 图表等
    })

    it('应该对无法识别的意图使用默认策略', () => {
      const analysis = filter.analyzeIntent('hello world')

      expect(analysis.isDefault).toBe(true)
      expect(analysis.categories.length).toBeGreaterThan(0)
      expect(analysis.confidence).toBeLessThan(0.5)
    })
  })

  describe('类别筛选', () => {
    it('应该返回相关类别列表', () => {
      const categories = filter.filterCategories('把标题设置为加粗红色')

      expect(categories).toBeInstanceOf(Array)
      expect(categories.length).toBeGreaterThan(0)
      // 应该包含格式化类别
      expect(categories.some(c => c.includes('formatting'))).toBe(true)
    })
  })

  describe('工具函数', () => {
    it('应该返回类别的可读名称', () => {
      const name = filter.getCategoryName(ToolCategory.WORD_TEXT)
      expect(name).toBe('Word 文本操作')
    })

    it('应该估算 token 节省量', () => {
      const savings = filter.estimateTokenSavings([
        ToolCategory.WORD_TEXT,
        ToolCategory.WORD_FORMATTING
      ])

      expect(savings.totalCategories).toBeGreaterThan(0)
      expect(savings.filteredCategories).toBe(2)
      expect(savings.estimatedSavings).toBeGreaterThan(0)
    })
  })

  describe('边界情况', () => {
    it('应该处理空消息', () => {
      const analysis = filter.analyzeIntent('')
      expect(analysis.isDefault).toBe(true)
    })

    it('应该处理纯数字消息', () => {
      const analysis = filter.analyzeIntent('123456')
      expect(analysis.isDefault).toBe(true)
    })

    it('应该处理纯英文消息', () => {
      const analysis = filter.analyzeIntent('insert text into document')
      // 可能识别到 'insert' 关键词 (如果添加了英文支持)
      expect(analysis.categories).toBeDefined()
    })

    it('应该处理混合大小写', () => {
      const analysis = filter.analyzeIntent('帮我INSERT一段TEXT')
      // 应该转换为小写后匹配
      expect(analysis.categories.length).toBeGreaterThan(0)
    })
  })

  describe('性能', () => {
    it('应该快速分析意图 (<10ms)', () => {
      const startTime = Date.now()
      filter.analyzeIntent('帮我创建一个包含图表和表格的复杂文档')
      const elapsed = Date.now() - startTime

      expect(elapsed).toBeLessThan(10)
    })

    it('应该处理长消息', () => {
      const longMessage = '帮我'.repeat(100) + '插入文本'
      const analysis = filter.analyzeIntent(longMessage)

      expect(analysis.categories).toContain(ToolCategory.WORD_TEXT)
    })
  })
})
