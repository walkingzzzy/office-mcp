/**
 * 提示词构建器 - 动态组合和构建最终提示词
 */

import Logger from '../../../utils/logger'
import type { PromptTemplate } from './types'

const logger = new Logger('PromptBuilder')

export class PromptBuilder {
  /**
   * 构建系统提示词
   */
  buildSystemPrompt(templates: PromptTemplate[]): string {
    if (templates.length === 0) {
      return ''
    }

    // 按优先级排序
    const sortedTemplates = templates.sort((a, b) => a.priority - b.priority)

    // 组合提示词内容
    const combinedContent = sortedTemplates
      .map(template => template.content)
      .join(' ')

    // 🎯 精简版强制执行指令（从 ~1500 字符优化到 ~400 字符）
    // 保留核心规则，移除冗余示例
    const forceExecutionInstruction = `

【执行规则 - CRITICAL】
1. 用户命令 → 立即调用工具，不询问确认
2. 参数不明确 → 使用合理默认值（如对齐默认居中）
3. 禁止返回"我可以帮你..."、"请问需要..."等询问文本
4. 工具调用 = 成功，纯文本回复 = 失败
5. 选中内容 + 格式命令 → 直接应用到选区

⚠️ 错误示例：用户说"图片居中"，你回复"请问要居中还是左对齐？" ← 这是错误的
✅ 正确做法：直接调用 align_images({alignment: "center"})`

    const enhancedContent = `${combinedContent}${forceExecutionInstruction}`

    const totalTokens = sortedTemplates.reduce((sum, t) => sum + (t.tokenCount || 0), 0)

    logger.debug('System prompt built', {
      templateCount: templates.length,
      totalTokens,
      contentLength: enhancedContent.length,
      hasForceInstruction: true,
      forcedInstructionLength: forceExecutionInstruction.length
    })

    return enhancedContent
  }

  /**
   * 优化用户提示词 - 移除冗余上下文
   */
  optimizeUserPrompt(rawInput: string): string {
    // 🎯 方案二：更智能地提取用户真实意图，移除系统生成的冗余包装

    // 第一步：检测图片操作命令（最高优先级）
    const imageAlignmentMatch = rawInput.match(/图片.{0,10}?(居中|左对齐|右对齐|对齐)/)
    if (imageAlignmentMatch) {
      const operation = imageAlignmentMatch[1]
      let optimized = `图片${operation}`

      // 检查是否还有其他操作（如边框）
      if (rawInput.includes('边框')) {
        optimized += '并添加边框'
      }

      logger.debug('Image alignment intent extracted', {
        original: rawInput.length,
        optimized: optimized.length,
        operation
      })
      return optimized
    }

    // 第二步：检测图片边框操作
    if (rawInput.includes('图片') && rawInput.includes('边框')) {
      const optimized = '图片添加边框'
      logger.debug('Image border intent extracted', {
        original: rawInput.length,
        optimized: optimized.length
      })
      return optimized
    }

    // 第三步：检测图片大小调整
    if (rawInput.includes('图片') && (rawInput.includes('大小') || rawInput.includes('调整') || rawInput.includes('缩放'))) {
      const optimized = '调整图片大小'
      logger.debug('Image size intent extracted', {
        original: rawInput.length,
        optimized: optimized.length
      })
      return optimized
    }

    // 第四步：通用的系统包装清理
    const cleaned = rawInput
      // 移除系统生成的完整说明段落
      .replace(/你是一个专业的文档格式化助手.*?【操作说明】/g, '')
      .replace(/【选中的.*?信息】.*?【操作说明】/g, '')
      // 移除所有【】标记的系统信息
      .replace(/【.*?】/g, '')
      // 移除系统指令
      .replace(/请立即调用相应的格式化函数来执行用户的命令。/g, '')
      .replace(/必须调用.*?工具/g, '')
      .replace(/你必须直接调用/g, '')
      // 移除过多的换行和空格
      .replace(/\n+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()

    // 第五步：如果清理后内容合理且明显更短，使用清理后的内容
    if (cleaned && cleaned.length > 0 && cleaned.length < rawInput.length * 0.5) {
      logger.debug('User intent cleaned successfully', {
        original: rawInput.length,
        optimized: cleaned.length,
        reductionPercent: Math.round((1 - cleaned.length / rawInput.length) * 100)
      })
      return cleaned
    }

    // 第六步：如果清理后仍然很长，尝试提取最后的用户输入部分
    if (rawInput.length > 100) {
      const lines = rawInput.split('\n').filter(line => line.trim())
      const lastLine = lines[lines.length - 1]?.trim()

      // 如果最后一行看起来像是用户的命令（不含系统标记）
      if (lastLine && !lastLine.includes('【') && lastLine.length < 50) {
        logger.debug('Extracted last line as user intent', {
          original: rawInput.length,
          extracted: lastLine.length
        })
        return lastLine
      }
    }

    // 兜底：如果清理效果不明显，返回原始输入
    logger.debug('Using original input (no significant optimization)', {
      originalLength: rawInput.length
    })
    return rawInput
  }

  /**
   * 计算提示词Token数量（估算）
   */
  estimateTokenCount(text: string): number {
    // 简单估算：中文字符*1.5 + 英文单词*1
    const chineseChars = (text.match(/[\u4e00-\u9fff]/g) || []).length
    const englishWords = (text.match(/[a-zA-Z]+/g) || []).length

    return Math.ceil(chineseChars * 1.5 + englishWords)
  }
}