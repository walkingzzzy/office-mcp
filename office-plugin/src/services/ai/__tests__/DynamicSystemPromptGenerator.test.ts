/**
 * DynamicSystemPromptGenerator 单元测试
 */

import { describe, expect, it } from 'vitest'
import { DynamicSystemPromptGenerator } from '../DynamicSystemPromptGenerator'

describe('DynamicSystemPromptGenerator', () => {
  const generator = new DynamicSystemPromptGenerator()

  describe('提示词生成', () => {
    it('应该生成包含相关工具的提示词', () => {
      const prompt = generator.generate('帮我在文档中插入文本')

      expect(prompt).toContain('Word')
      expect(prompt).toContain('word_insert_text')
      expect(prompt.length).toBeGreaterThan(100)
    })

    it('应该为 Excel 操作生成提示词', () => {
      const prompt = generator.generate('创建一个图表显示数据趋势')

      expect(prompt).toContain('Excel')
      expect(prompt).toContain('图表')
    })

    it('应该为 PowerPoint 操作生成提示词', () => {
      const prompt = generator.generate('添加一张幻灯片')

      expect(prompt).toContain('PowerPoint')
      expect(prompt).toContain('ppt_add_slide')
    })

    it('应该为无法识别的意图生成默认提示词', () => {
      const prompt = generator.generate('hello')

      expect(prompt).toContain('默认模式')
      expect(prompt).toContain('Word')
    })
  })

  describe('提示词结构', () => {
    it('应该包含头部说明', () => {
      const prompt = generator.generate('插入文本')

      expect(prompt).toContain('Office 文档助手')
      expect(prompt).toContain('当前模式')
    })

    it('应该包含工具列表', () => {
      const prompt = generator.generate('插入文本')

      expect(prompt).toMatch(/- `\w+_\w+`:/gi) // 工具定义格式
    })

    it('应该包含意图识别规则', () => {
      const prompt = generator.generate('插入文本')

      expect(prompt).toContain('意图识别规则')
      expect(prompt).toContain('必须调用工具')
    })
  })

  describe('token 优化', () => {
    it('应该根据意图减少工具数量', () => {
      const specificPrompt = generator.generate('把文本设置为加粗')
      const defaultPrompt = generator.generate('hello')

      // 特定意图的提示词应该比默认提示词短
      expect(specificPrompt.length).toBeLessThan(defaultPrompt.length * 0.8)
    })

    it('应该显著减少 token 消耗', () => {
      const fullPromptApprox = 4000 // 完整提示词约 4000 tokens
      const prompt = generator.generate('插入文本')

      // 估算: 假设平均每个字符约 0.5 token (中文)
      const estimatedTokens = prompt.length * 0.5

      // 应该至少减少 40%
      expect(estimatedTokens).toBeLessThan(fullPromptApprox * 0.6)
    })
  })

  describe('多类别处理', () => {
    it('应该包含多个相关类别的工具', () => {
      const prompt = generator.generate('创建一个包含图表的表格并设置格式')

      // 应该包含多个类别
      const categoryCount = (prompt.match(/### /g) || []).length
      expect(categoryCount).toBeGreaterThan(2)
    })

    it('应该跨应用类型生成提示词', () => {
      const prompt = generator.generate('从 Excel 中提取数据插入到 Word 文档')

      expect(prompt).toContain('Word')
      expect(prompt).toContain('Excel')
    })
  })

  describe('性能', () => {
    it('应该快速生成提示词 (<50ms)', () => {
      const startTime = Date.now()
      generator.generate('帮我创建一个复杂的文档')
      const elapsed = Date.now() - startTime

      expect(elapsed).toBeLessThan(50)
    })
  })

  describe('边界情况', () => {
    it('应该处理空消息', () => {
      const prompt = generator.generate('')
      expect(prompt).toContain('默认模式')
    })

    it('应该处理极长消息', () => {
      const longMessage = '帮我'.repeat(1000) + '插入文本'
      const prompt = generator.generate(longMessage)

      expect(prompt).toContain('word_insert_text')
    })

    it('应该处理特殊字符', () => {
      const prompt = generator.generate('插入文本@#$%^&*()')
      expect(prompt).toContain('word_insert_text')
    })
  })
})
