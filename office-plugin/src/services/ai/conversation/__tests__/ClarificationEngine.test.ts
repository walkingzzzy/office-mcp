/**
 * 澄清引擎测试
 */

import { describe, expect, it } from 'vitest'
import { ClarificationEngine } from '../ClarificationEngine'

describe('ClarificationEngine', () => {
  const engine = new ClarificationEngine()

  describe('needsClarification', () => {
    it('should detect vague requests', () => {
      // 模糊请求 - 应该需要澄清
      expect(engine.needsClarification('帮我整理一下')).toBe(true)
      expect(engine.needsClarification('美化这个文档')).toBe(true)  // 匹配 "(美化|...).*(\u6587\u6863|...)"
      expect(engine.needsClarification('优化一下')).toBe(true)
      expect(engine.needsClarification('处理一下')).toBe(true)  // 匹配 "^处理一下"
      expect(engine.needsClarification('让文档更好')).toBe(true)  // 匹配 "让...文档...好"
    })

    it('should not trigger clarification for direct commands', () => {
      // 直接命令 - 不需要澄清
      expect(engine.needsClarification('把标题加粗')).toBe(false)
      expect(engine.needsClarification('将第一段变红色')).toBe(false)
      expect(engine.needsClarification('删除第二段')).toBe(false)
      expect(engine.needsClarification('插入表格')).toBe(false)
      expect(engine.needsClarification('替换A为B')).toBe(false)
    })
  })

  describe('isDirectCommand', () => {
    it('should identify direct formatting commands', () => {
      expect(engine.isDirectCommand('把标题加粗')).toBe(true)
      expect(engine.isDirectCommand('将文字变红')).toBe(true)  // 匹配 "将...文字...变红"
      expect(engine.isDirectCommand('把第一段居中')).toBe(true)
    })

    it('should identify direct action commands', () => {
      expect(engine.isDirectCommand('删除第一段')).toBe(true)
      expect(engine.isDirectCommand('插入一个表格')).toBe(true)
      expect(engine.isDirectCommand('查找A替换为B')).toBe(true)
    })
  })

  describe('generateClarificationQuestion', () => {
    it('should generate appropriate question for "整理"', () => {
      const question = engine.generateClarificationQuestion('帮我整理一下')
      expect(question.question).toContain('整理')
      expect(question.type).toBe('single_choice')
      expect(question.options).toBeDefined()
      expect(question.options!.length).toBeGreaterThan(0)
    })

    it('should generate appropriate question for "美化"', () => {
      const question = engine.generateClarificationQuestion('美化这份文档')
      expect(question.question).toContain('美化')
      expect(question.options).toBeDefined()
    })

    it('should generate generic question for unknown patterns', () => {
      const question = engine.generateClarificationQuestion('弄一下这个')
      expect(question.question).toContain('操作')
      expect(question.type).toBe('free_text')
    })
  })

  describe('getRecommendedTools', () => {
    it('should return tools for sort option', () => {
      const tools = engine.getRecommendedTools('sort')
      expect(tools).toContain('excel_sort_range')
    })

    it('should return tools for format option', () => {
      const tools = engine.getRecommendedTools('format')
      expect(tools.length).toBeGreaterThan(0)
    })

    it('should return empty array for unknown option', () => {
      const tools = engine.getRecommendedTools('unknown_option')
      expect(tools).toEqual([])
    })
  })

  describe('buildEnhancedIntent', () => {
    it('should return original intent when no clarifications', () => {
      const result = engine.buildEnhancedIntent('帮我整理一下', [])
      expect(result).toBe('帮我整理一下')
    })

    it('should enhance intent with clarification answers', () => {
      const clarifications = [
        {
          id: 'q1',
          question: '如何整理？',
          type: 'single_choice' as const,
          options: [
            { id: 'sort', text: '排序' }
          ],
          required: true,
          answered: true,
          answer: '排序',
          selectedOptionId: 'sort',
          createdAt: new Date()
        }
      ]
      
      const result = engine.buildEnhancedIntent('帮我整理一下', clarifications)
      expect(result).toContain('帮我整理一下')
      expect(result).toContain('排序')
    })
  })
})
