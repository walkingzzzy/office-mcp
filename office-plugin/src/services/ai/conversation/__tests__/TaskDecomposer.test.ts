/**
 * 任务分解器测试
 */

import { describe, expect, it } from 'vitest'
import { TaskDecomposer } from '../TaskDecomposer'
import type { ReviewResult } from '../ReviewContextExtractor'

describe('TaskDecomposer', () => {
  const decomposer = new TaskDecomposer()

  describe('canDecompose', () => {
    it('should return true for complex tasks with keywords', () => {
      expect(decomposer.canDecompose('帮我整理文档')).toBe(true)
      expect(decomposer.canDecompose('美化这份报告')).toBe(true)
      expect(decomposer.canDecompose('制作简历')).toBe(true)
      expect(decomposer.canDecompose('整理成绩表')).toBe(true)
    })

    it('should return true for long tasks', () => {
      const longTask = '请帮我把这份文档格式化一下，统一字体和段落间距，然后添加页码'
      expect(decomposer.canDecompose(longTask)).toBe(true)
    })

    it('should return false for simple commands', () => {
      expect(decomposer.canDecompose('把标题加粗')).toBe(false)
      expect(decomposer.canDecompose('删除第一段')).toBe(false)
    })
  })

  describe('decompose', () => {
    it('should decompose document formatting task', () => {
      const plan = decomposer.decompose('帮我整理文档')
      
      expect(plan).not.toBeNull()
      expect(plan!.title).toBe('文档全面整理')
      expect(plan!.steps.length).toBeGreaterThan(0)
    })

    it('should decompose grade table task', () => {
      const plan = decomposer.decompose('处理学生成绩表')
      
      expect(plan).not.toBeNull()
      expect(plan!.title).toBe('成绩表处理')
      expect(plan!.steps.length).toBeGreaterThan(0)
      
      // 应该包含排序步骤
      const sortStep = plan!.steps.find(s => s.toolName === 'excel_sort_range')
      expect(sortStep).toBeDefined()
    })

    it('should decompose resume task', () => {
      const plan = decomposer.decompose('帮我制作简历')
      
      expect(plan).not.toBeNull()
      expect(plan!.title).toBe('简历制作')
      expect(plan!.steps.length).toBeGreaterThan(0)
    })

    it('should return null for undecomposable tasks', () => {
      const plan = decomposer.decompose('你好')
      expect(plan).toBeNull()
    })

    it('should create steps with correct structure', () => {
      const plan = decomposer.decompose('整理教案')
      
      expect(plan).not.toBeNull()
      
      for (const step of plan!.steps) {
        expect(step.id).toBeDefined()
        expect(step.description).toBeDefined()
        expect(step.toolName).toBeDefined()
        expect(step.status).toBe('pending')
      }
    })
  })

  describe('estimateTotalTime', () => {
    it('should calculate total estimated time', () => {
      const plan = decomposer.decompose('帮我整理文档')
      
      expect(plan).not.toBeNull()
      
      const totalTime = decomposer.estimateTotalTime(plan!)
      expect(totalTime).toBeGreaterThan(0)
      
      // 总时间应该是所有步骤时间的总和
      const expectedTime = plan!.steps.reduce((sum, step) => sum + (step.estimatedTime || 2000), 0)
      expect(totalTime).toBe(expectedTime)
    })
  })

  describe('getAvailableTemplates', () => {
    it('should return list of templates', () => {
      const templates = decomposer.getAvailableTemplates()
      
      expect(templates.length).toBeGreaterThan(0)
      
      for (const template of templates) {
        expect(template.name).toBeDefined()
        expect(template.description).toBeDefined()
        expect(template.keywords).toBeDefined()
        expect(template.keywords.length).toBeGreaterThan(0)
      }
    })
  })

  describe('dynamic decomposition', () => {
    it('should dynamically decompose based on keywords', () => {
      // 包含多个动作词的任务
      const plan = decomposer.decompose('格式化文档并添加页码和目录')
      
      expect(plan).not.toBeNull()
      expect(plan!.steps.length).toBeGreaterThan(0)
      
      // 应该包含格式化、页码、目录相关步骤
      const toolNames = plan!.steps.map(s => s.toolName)
      expect(toolNames.some(t => t.includes('style') || t.includes('font'))).toBe(true)
    })
  })

  describe('decomposeFromReviewResults', () => {
    it('should preserve review issue metadata on steps', () => {
      const reviewResult: ReviewResult = {
        messageId: 'msg-1',
        timestamp: new Date(),
        type: 'document_review',
        issues: [
          {
            index: 1,
            issue: '标题格式不一致，需要统一为二号黑体',
            location: '第 1 页',
            suggestion: '统一为二号黑体',
            type: 'format',
            expectedTools: ['word_apply_style']
          }
        ],
        rawText: '1. 标题格式不一致，需要统一为二号黑体'
      }

      const plan = decomposer.decomposeFromReviewResults(reviewResult, '根据审查结果修改文档')
      expect(plan).not.toBeNull()
      expect(plan!.steps.length).toBe(1)

      const firstStep = plan!.steps[0]
      expect(firstStep.sourceIssueId).toBe('issue-1')
      expect(firstStep.sourceIssueText).toContain('标题格式不一致')
      expect(firstStep.locationHint).toBe('第 1 页')
      expect(firstStep.expectedTools).toContain('word_apply_style')
    })
  })
})
