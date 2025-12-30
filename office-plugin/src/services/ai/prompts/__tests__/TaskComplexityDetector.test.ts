/**
 * TaskComplexityDetector 单元测试
 * 
 * 测试任务复杂度检测的准确性，特别是查询意图的识别
 */

import { describe, expect, it } from 'vitest'
import { detectTaskComplexity, isQueryOnlyIntent } from '../TaskComplexityDetector'

describe('TaskComplexityDetector', () => {
  describe('isQueryOnlyIntent', () => {
    it('应该将纯查询请求识别为查询意图', () => {
      const queryInputs = [
        '我需要你对现在文档的格式和排版进行深入了解，告诉我文档排版当中存在的问题',
        '告诉我文档有什么问题',
        '查看文档的格式问题',
        '分析一下文档存在的问题',
        '检查文档的排版情况',
        '文档有哪些需要改进的地方',
        '看看文档存在什么错误',
        '有什么问题需要改进',
        '存在哪些格式问题'
      ]

      for (const input of queryInputs) {
        expect(isQueryOnlyIntent(input)).toBe(true)
      }
    })

    it('应该将执行请求识别为非查询意图', () => {
      const executeInputs = [
        '修改文档中的问题',
        '根据审查结果修改文档',
        '执行修改操作',
        '应用这些修改',
        '修复文档中的格式问题',
        '调整文档的排版',
        '删除多余的空格',
        '添加页码',
        '格式化整个文档',
        '解决这些存在的问题',  // 🆕 新增"解决"关键词测试
        '解决文档中的格式问题',
        '纠正这些错误',
        '改正文档的问题'
      ]

      for (const input of executeInputs) {
        expect(isQueryOnlyIntent(input)).toBe(false)
      }
    })
  })

  describe('detectTaskComplexity', () => {
    it('应该将查询请求标记为不需要规划', () => {
      const queryInputs = [
        '告诉我文档有什么问题',
        '查看文档的格式问题',
        '分析一下文档存在的问题'
      ]

      for (const input of queryInputs) {
        const result = detectTaskComplexity(input)
        expect(result.needsPlanning).toBe(false)
        expect(result.isQueryOnly).toBe(true)
      }
    })

    it('应该将简单任务标记为不需要规划', () => {
      const simpleInputs = [
        '加粗',
        '设置字体为宋体',
        '删除这个'
      ]

      for (const input of simpleInputs) {
        const result = detectTaskComplexity(input)
        expect(result.needsPlanning).toBe(false)
        expect(result.complexity).toBe('simple')
      }
    })

    it('应该将复杂任务标记为需要规划', () => {
      const complexInputs = [
        '首先读取文档，然后格式化所有标题，最后添加目录',
        '重新排版整个文档，统一所有字体和间距',
        '批量处理所有表格，调整列宽和对齐方式'
      ]

      for (const input of complexInputs) {
        const result = detectTaskComplexity(input)
        expect(result.needsPlanning).toBe(true)
        expect(result.complexity).not.toBe('simple')
      }
    })
  })
})
