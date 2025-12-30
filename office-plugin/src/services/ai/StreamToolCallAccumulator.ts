/**
 * 流式 Tool Call 累积器
 * 处理 AI 返回的增量 tool_calls 数据，累积成完整的函数调用
 */

import Logger from '../../utils/logger'
import {
  AccumulatedToolCall,
  ToolCall,
  ToolCallDelta} from './types'

const logger = new Logger('StreamToolCallAccumulator')

/**
 * 流式 Tool Call 累积器类
 */
export class StreamToolCallAccumulator {
  private accumulatedCalls = new Map<number, AccumulatedToolCall>()
  private isComplete = false

  /**
   * 累积 Tool Call 增量数据
   */
  accumulateToolCallDelta(delta: ToolCallDelta): void {
    const { index } = delta

    if (!this.accumulatedCalls.has(index)) {
      // 初始化新的累积调用
      this.accumulatedCalls.set(index, {
        id: '',
        name: '',
        arguments: '',
        isComplete: false
      })
    }

    const accumulated = this.accumulatedCalls.get(index)!

    // 累积 ID
    if (delta.id) {
      accumulated.id = delta.id
    }

    // 累积函数名称
    if (delta.function?.name) {
      accumulated.name = delta.function.name
    }

    // 累积参数字符串
    if (delta.function?.arguments) {
      accumulated.arguments += delta.function.arguments
    }

    logger.debug(`Accumulated tool call delta`, {
      index,
      id: accumulated.id,
      name: accumulated.name,
      argumentsLength: accumulated.arguments.length,
      partialArguments: accumulated.arguments.slice(-50) // 只记录最后50个字符避免日志过长
    })
  }

  /**
   * 标记累积完成
   */
  markComplete(): void {
    this.isComplete = true
    logger.info(`Stream accumulation completed, collected ${this.accumulatedCalls.size} tool calls`)
  }

  /**
   * 获取完整的 Tool Calls
   */
  getCompletedToolCalls(): ToolCall[] {
    // 只有当有数据但未完成时才警告
    if (!this.isComplete && this.accumulatedCalls.size > 0) {
      logger.warn('Getting tool calls before accumulation is complete', {
        totalCalls: this.accumulatedCalls.size,
        isComplete: this.isComplete
      })
    }

    const toolCalls: ToolCall[] = []

    for (const [index, accumulated] of this.accumulatedCalls) {
      if (!accumulated.id || !accumulated.name) {
        logger.warn(`Incomplete tool call at index ${index}`, {
          id: accumulated.id,
          name: accumulated.name,
          hasArguments: !!accumulated.arguments
        })
        continue
      }

      // 验证 JSON 参数
      let isValidArguments = true
      let parsedArgs: Record<string, any> = {}

      if (accumulated.arguments) {
        try {
          // 🔧 修复：在解析前移除 JSON 注释
          const cleanedArgs = this.removeJsonComments(accumulated.arguments)
          parsedArgs = JSON.parse(cleanedArgs)
        } catch (parseError) {
          logger.error(`Invalid JSON arguments for tool call ${accumulated.name}`, {
            arguments: accumulated.arguments,
            error: parseError instanceof Error ? parseError.message : String(parseError)
          })
          isValidArguments = false
        }
      } else {
        // 空参数也是有效的
        parsedArgs = {}
      }

      if (!isValidArguments) {
        // 尝试修复常见的 JSON 问题
        try {
          // 如果 JSON 不完整，尝试补全
          const fixedArgs = this.attemptJsonFix(accumulated.arguments)
          parsedArgs = JSON.parse(fixedArgs)
          logger.info(`Successfully fixed JSON arguments for tool call ${accumulated.name}`)
        } catch (fixError) {
          logger.error(`Failed to fix JSON arguments for tool call ${accumulated.name}`, {
            arguments: accumulated.arguments,
            error: fixError instanceof Error ? fixError.message : String(fixError)
          })
          continue // 跳过无效的工具调用
        }
      }

      const toolCall: ToolCall = {
        id: accumulated.id,
        type: 'function',
        function: {
          name: accumulated.name,
          arguments: JSON.stringify(parsedArgs)
        }
      }

      toolCalls.push(toolCall)
    }

    logger.info(`Generated ${toolCalls.length} complete tool calls`)

    return toolCalls
  }

  /**
   * 移除 JSON 字符串中的注释
   * 支持单行注释和多行注释
   */
  private removeJsonComments(jsonString: string): string {
    // 移除单行注释 (//)
    // 注意：只移除不在字符串内的注释
    let result = jsonString.replace(/("(?:[^"\\]|\\.)*")|\/\/.*$/gm, (match, stringMatch) => {
      // 如果匹配到的是字符串，保留它；否则移除注释
      return stringMatch || ''
    })

    // 移除多行注释
    // 注意：只移除不在字符串内的注释
    // 使用构造函数创建正则以避免解析器混淆
    const multilineCommentRegex = new RegExp('("(?:[^"\\\\]|\\\\.)*")|\\/\\*[\\s\\S]*?\\*\\/', 'g')
    result = result.replace(multilineCommentRegex, (match, stringMatch) => {
      // 如果匹配到的是字符串，保留它；否则移除注释
      return stringMatch || ''
    })

    return result
  }

  /**
   * 尝试修复常见的 JSON 问题
   */
  private attemptJsonFix(incompleteJson: string): string {
    let fixed = incompleteJson.trim()

    // 移除末尾的逗号
    fixed = fixed.replace(/,(\s*[}\]])/g, '$1')

    // 补全缺失的引号
    const openQuotes = (fixed.match(/"/g) || []).length
    if (openQuotes % 2 !== 0) {
      fixed += '"'
    }

    // 补全缺失的大括号
    const openBraces = (fixed.match(/{/g) || []).length
    const closeBraces = (fixed.match(/}/g) || []).length
    const missingBraces = openBraces - closeBraces
    for (let i = 0; i < missingBraces; i++) {
      fixed += '}'
    }

    // 补全缺失的方括号
    const openBrackets = (fixed.match(/\[/g) || []).length
    const closeBrackets = (fixed.match(/\]/g) || []).length
    const missingBrackets = openBrackets - closeBrackets
    for (let i = 0; i < missingBrackets; i++) {
      fixed += ']'
    }

    return fixed
  }

  /**
   * 检查是否有正在累积的调用
   */
  hasActiveAccumulation(): boolean {
    return this.accumulatedCalls.size > 0 && !this.isComplete
  }

  /**
   * 获取当前累积状态
   */
  getAccumulationStatus(): {
    totalCalls: number
    completedCalls: number
    isComplete: boolean
    callDetails: Array<{
      index: number
      id: string
      name: string
      hasId: boolean
      hasName: boolean
      hasArguments: boolean
      argumentsLength: number
    }>
  } {
    const callDetails = Array.from(this.accumulatedCalls.entries()).map(([index, call]) => ({
      index,
      id: call.id,
      name: call.name,
      hasId: !!call.id,
      hasName: !!call.name,
      hasArguments: !!call.arguments,
      argumentsLength: call.arguments.length
    }))

    return {
      totalCalls: this.accumulatedCalls.size,
      completedCalls: callDetails.filter(call => call.hasId && call.hasName).length,
      isComplete: this.isComplete,
      callDetails
    }
  }

  /**
   * 重置累积器
   */
  reset(): void {
    this.accumulatedCalls.clear()
    this.isComplete = false
    logger.debug('Stream accumulator reset')
  }

  /**
   * 验证累积的完整性
   */
  validate(): {
    isValid: boolean
    issues: string[]
  } {
    const issues: string[] = []

    // 检查是否有调用
    if (this.accumulatedCalls.size === 0) {
      issues.push('No tool calls accumulated')
    }

    // 检查每个调用的完整性
    for (const [index, call] of this.accumulatedCalls) {
      if (!call.id) {
        issues.push(`Tool call at index ${index} missing ID`)
      }
      if (!call.name) {
        issues.push(`Tool call at index ${index} missing function name`)
      }
      if (call.arguments) {
        try {
          JSON.parse(call.arguments)
        } catch (parseError) {
          issues.push(`Tool call ${call.name} has invalid JSON arguments: ${parseError instanceof Error ? parseError.message : String(parseError)}`)
        }
      }
    }

    return {
      isValid: issues.length === 0,
      issues
    }
  }

  /**
   * 获取统计信息
   */
  getStats(): {
    totalCalls: number
    totalArgumentChars: number
    averageArgumentLength: number
    hasIdCount: number
    hasNameCount: number
    hasArgumentsCount: number
  } {
    const calls = Array.from(this.accumulatedCalls.values())
    const totalCalls = calls.length
    const totalArgumentChars = calls.reduce((sum, call) => sum + call.arguments.length, 0)
    const averageArgumentLength = totalCalls > 0 ? totalArgumentChars / totalCalls : 0

    return {
      totalCalls,
      totalArgumentChars,
      averageArgumentLength,
      hasIdCount: calls.filter(call => !!call.id).length,
      hasNameCount: calls.filter(call => !!call.name).length,
      hasArgumentsCount: calls.filter(call => !!call.arguments).length
    }
  }
}