/**
 * IntentExtractor 单元测试
 * 
 * 测试意图识别的准确性，特别是查询意图和执行意图的区分
 */

import { describe, expect, it } from 'vitest'
import { IntentExtractor } from '../IntentExtractor'
import { EnhancedIntentType } from '../types'

describe('IntentExtractor', () => {
  const extractor = new IntentExtractor()

  describe('extractEnhancedIntent - 查询意图检测', () => {
    it('应该将"了解文档问题"识别为查询意图', () => {
      const testCases = [
        '我需要你对现在文档的格式和排版进行深入了解，告诉我文档排版当中存在的问题',
        '告诉我文档有什么问题',
        '查看文档的格式问题',
        '分析一下文档存在的问题',
        '检查文档的排版情况',
        '文档有哪些需要改进的地方',
        '看看文档存在什么错误'
      ]

      for (const input of testCases) {
        const result = extractor.extractEnhancedIntent(input)
        expect(result.enhancedType).toBe(EnhancedIntentType.QUERY)
      }
    })

    it('应该将"修改文档"识别为执行意图', () => {
      const testCases = [
        '修改文档中的问题',
        '根据审查结果修改文档',
        '执行修改操作',
        '应用这些修改',
        '修复文档中的格式问题',
        '调整文档的排版',
        '解决这些存在的问题',  // 🆕 新增"解决"关键词测试
        '解决文档中的格式问题',
        '纠正这些错误',
        '改正文档的问题'
      ]

      for (const input of testCases) {
        const result = extractor.extractEnhancedIntent(input)
        expect(result.enhancedType).not.toBe(EnhancedIntentType.QUERY)
      }
    })

    it('应该正确处理混合意图（查询+执行）', () => {
      const testCases = [
        { input: '分析并修改文档', expectedNotQuery: true },
        { input: '检查问题然后修复', expectedNotQuery: true },
        { input: '告诉我问题并执行修改', expectedNotQuery: true }
      ]

      for (const { input, expectedNotQuery } of testCases) {
        const result = extractor.extractEnhancedIntent(input)
        if (expectedNotQuery) {
          expect(result.enhancedType).not.toBe(EnhancedIntentType.QUERY)
        }
      }
    })
  })

  describe('extractEnhancedIntent - 对话控制意图', () => {
    it('应该识别确认意图', () => {
      const confirmations = ['好的', '可以', '行', '是的', '确认', 'ok', 'yes']
      for (const input of confirmations) {
        const result = extractor.extractEnhancedIntent(input)
        expect(result.enhancedType).toBe(EnhancedIntentType.CONFIRMATION)
      }
    })

    it('应该识别取消意图', () => {
      const cancellations = ['取消', '不要了', '算了', 'cancel']
      for (const input of cancellations) {
        const result = extractor.extractEnhancedIntent(input)
        expect(result.enhancedType).toBe(EnhancedIntentType.CANCEL_REQUEST)
      }
    })
  })

  describe('extractEnhancedIntent - 复杂任务检测', () => {
    it('应该识别复杂任务', () => {
      const complexTasks = [
        '帮我制作一份专业简历',
        '创建一个项目报告模板',
        '首先读取文档，然后格式化，最后保存'
      ]

      for (const input of complexTasks) {
        const result = extractor.extractEnhancedIntent(input)
        expect(result.enhancedType).toBe(EnhancedIntentType.COMPLEX_TASK)
      }
    })
  })
})
