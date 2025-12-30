/**
 * TaskComplexityDetector 与任务规划流程整合测试
 */

import { describe, expect, it } from 'vitest'
import { detectTaskComplexity, type ComplexityResult } from '../TaskComplexityDetector'
import { IntentExtractor } from '../IntentExtractor'
import { EnhancedIntentType } from '../types'

describe('TaskComplexityDetector Integration', () => {
  const intentExtractor = new IntentExtractor()

  describe('复杂度检测触发任务规划', () => {
    // 测试用例：复杂度检测器能识别出需要规划的任务
    const complexCases = [
      {
        input: '首先把标题加粗，然后调整段落间距，最后统一字体颜色',
        description: '多步骤关键词',
        expectedComplexity: 'complex' as const,
        expectNeedsPlanning: true
      },
      {
        input: '对所有表格进行批量格式化，首先调整边框，然后设置对齐，最后修改颜色',
        description: '批量操作+多步骤',
        expectedComplexity: 'complex' as const,
        expectNeedsPlanning: true
      },
      {
        input: '1. 检查文档格式\n2. 修改标题样式\n3. 调整段落\n4. 添加页眉',
        description: '列表/编号格式',
        expectNeedsPlanning: true
      },
      {
        input: '重新排版整个文档，统一标题、正文、表格和图片的格式',
        description: '多文档部分',
        expectNeedsPlanning: true
      }
    ]

    complexCases.forEach(({ input, description, expectNeedsPlanning }) => {
      it(`应该检测为需要规划: ${description}`, () => {
        const result = detectTaskComplexity(input)
        expect(result.needsPlanning).toBe(expectNeedsPlanning)
        if (expectNeedsPlanning) {
          expect(result.suggestedStepCount).toBeGreaterThan(0)
        }
      })
    })
  })

  describe('简单任务不触发规划', () => {
    const simpleCases = [
      { input: '加粗', description: '单一格式操作' },
      { input: '设置字体为宋体', description: '单一设置操作' },
      { input: '什么是段落间距？', description: '问题查询' },
      { input: '删除这个', description: '简单删除' }
    ]

    simpleCases.forEach(({ input, description }) => {
      it(`不应该触发规划: ${description}`, () => {
        const result = detectTaskComplexity(input)
        expect(result.needsPlanning).toBe(false)
        expect(result.complexity).toBe('simple')
      })
    })
  })

  describe('复杂度检测与意图分析的协同', () => {
    it('复杂度检测可以覆盖意图分析的判断', () => {
      // 这个输入可能被 IntentExtractor 判断为 DIRECT_COMMAND
      // 但 TaskComplexityDetector 应该识别出它需要规划
      const input = '修改标题样式，调整段落间距，然后统一字体格式，最后设置页边距'
      
      const intentResult = intentExtractor.extractEnhancedIntent(input)
      const complexityResult = detectTaskComplexity(input)

      // 复杂度检测应该识别出需要规划
      expect(complexityResult.needsPlanning).toBe(true)
      expect(complexityResult.indicators.length).toBeGreaterThan(0)
      
      // 如果意图分析没有判断为复杂任务，复杂度检测应该覆盖它
      if (intentResult.enhancedType !== EnhancedIntentType.COMPLEX_TASK) {
        // 这说明复杂度检测的逻辑比意图分析更全面
        console.log('意图分析判断:', intentResult.enhancedType)
        console.log('复杂度检测结果:', complexityResult)
      }
    })

    it('建议步骤数应该合理', () => {
      const inputs = [
        '首先加粗标题，然后调整间距',  // 简单多步骤
        '1. 格式化标题 2. 修改段落 3. 添加页眉 4. 插入页脚 5. 调整边距',  // 明确的5步
        '全面重新排版文档，包括标题、正文、表格、图片、页眉、页脚'  // 复杂任务
      ]

      inputs.forEach(input => {
        const result = detectTaskComplexity(input)
        if (result.needsPlanning && result.suggestedStepCount) {
          // 建议步骤数应该在 2-8 之间
          expect(result.suggestedStepCount).toBeGreaterThanOrEqual(2)
          expect(result.suggestedStepCount).toBeLessThanOrEqual(8)
        }
      })
    })
  })

  describe('复杂度指标检测', () => {
    it('应该检测多个操作动词', () => {
      const input = '修改标题，删除表格，添加图片，替换文本'
      const result = detectTaskComplexity(input)
      
      expect(result.indicators.some(i => i.includes('操作动词'))).toBe(true)
    })

    it('应该检测多步骤关键词', () => {
      const input = '首先检查文档，然后修改格式，最后保存'
      const result = detectTaskComplexity(input)
      
      expect(result.indicators.some(i => i.includes('关键词'))).toBe(true)
    })

    it('应该检测多文档部分', () => {
      const input = '调整标题、正文和表格的格式'
      const result = detectTaskComplexity(input)
      
      expect(result.indicators.some(i => i.includes('文档部分'))).toBe(true)
    })

    it('检测到上下文引用时应触发规划', () => {
      const input = '请根据审查结果修改这些问题并应用刚才的建议'
      const result = detectTaskComplexity(input)

      expect(result.needsPlanning).toBe(true)
      expect(result.hasContextReference).toBe(true)
      expect(result.contextReferenceType).toBe('review')
      expect(result.contextReferenceTokens).toContain('审查结果')
    })
  })
})
