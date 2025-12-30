/**
 * 预览生成器测试
 */

import { describe, expect, it } from 'vitest'
import { PreviewGenerator, previewGenerator } from '../PreviewGenerator'
import { createTaskPlan } from '../ConversationState'

describe('PreviewGenerator', () => {
  const generator = new PreviewGenerator()

  describe('generateOperationPreview', () => {
    it('should generate preview for font color change', () => {
      const preview = generator.generateOperationPreview(
        'word_set_font_color',
        { color: '#FF0000' },
        '设置文字颜色为红色'
      )

      expect(preview.id).toBeDefined()
      expect(preview.description).toBe('设置文字颜色为红色')
      expect(preview.type).toBe('format_change')
      expect(preview.riskLevel).toBe('low')
      expect(preview.canUndo).toBe(true)
      expect(preview.requiresConfirmation).toBe(false)
    })

    it('should generate preview for high-risk operation', () => {
      const preview = generator.generateOperationPreview(
        'word_find_replace',
        { find: 'A', replace: 'B' }
      )

      expect(preview.riskLevel).toBe('high')
      expect(preview.requiresConfirmation).toBe(true)
      expect(preview.warnings).toBeDefined()
      expect(preview.warnings!.length).toBeGreaterThan(0)
    })

    it('should generate format changes for formatting operations', () => {
      const preview = generator.generateOperationPreview(
        'word_set_font_color',
        { color: 'red' }
      )

      expect(preview.formatChanges).toBeDefined()
      expect(preview.formatChanges!.length).toBeGreaterThan(0)
      expect(preview.formatChanges![0].type).toBe('color')
      expect(preview.formatChanges![0].newValue).toBe('red')
    })

    it('should generate description for unknown tool', () => {
      const preview = generator.generateOperationPreview(
        'unknown_tool',
        {}
      )

      expect(preview.description).toContain('unknown_tool')
      expect(preview.riskLevel).toBe('medium') // default
    })
  })

  describe('generatePlanPreview', () => {
    it('should generate preview for task plan', () => {
      const plan = createTaskPlan('测试计划', '测试意图', [
        { description: '步骤1', toolName: 'word_set_font_color', toolArgs: { color: 'red' } },
        { description: '步骤2', toolName: 'word_set_bold', toolArgs: {} },
        { description: '步骤3', toolName: 'word_find_replace', toolArgs: { find: 'A', replace: 'B' } }
      ])

      const preview = generator.generatePlanPreview(plan)

      expect(preview.planId).toBe(plan.id)
      expect(preview.title).toBe('测试计划')
      expect(preview.stepPreviews.length).toBe(3)
      expect(preview.totalEstimatedTime).toBeGreaterThan(0)
      expect(preview.undoableSteps).toBe(3)
      expect(preview.confirmationRequired).toBe(1) // 只有 find_replace 需要确认
    })

    it('should calculate overall risk correctly', () => {
      const lowRiskPlan = createTaskPlan('低风险计划', '意图', [
        { description: '步骤1', toolName: 'word_set_font_color', toolArgs: {} },
        { description: '步骤2', toolName: 'word_set_bold', toolArgs: {} }
      ])

      const highRiskPlan = createTaskPlan('高风险计划', '意图', [
        { description: '步骤1', toolName: 'word_find_replace', toolArgs: {} },
        { description: '步骤2', toolName: 'word_delete_paragraph', toolArgs: {} }
      ])

      const lowPreview = generator.generatePlanPreview(lowRiskPlan)
      const highPreview = generator.generatePlanPreview(highRiskPlan)

      expect(lowPreview.overallRisk).toBe('low')
      expect(highPreview.overallRisk).toBe('high')
    })

    it('should aggregate warnings from all steps', () => {
      const plan = createTaskPlan('计划', '意图', [
        { description: '步骤1', toolName: 'word_find_replace', toolArgs: {} },
        { description: '步骤2', toolName: 'word_clear_formatting', toolArgs: {} }
      ])

      const preview = generator.generatePlanPreview(plan)

      expect(preview.warnings.length).toBeGreaterThan(0)
    })
  })

  describe('singleton instance', () => {
    it('should export singleton previewGenerator', () => {
      expect(previewGenerator).toBeInstanceOf(PreviewGenerator)
    })

    it('should generate preview using singleton', () => {
      const preview = previewGenerator.generateOperationPreview(
        'word_set_bold',
        {}
      )
      
      expect(preview).toBeDefined()
      expect(preview.type).toBe('format_change')
    })
  })
})
