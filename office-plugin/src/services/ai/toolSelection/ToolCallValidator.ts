/**
 * 工具调用验证器
 * 在执行前验证工具调用参数，并尝试自动修复常见错误
 */

import type { FormattingFunction, ToolCall, ToolInputSchema } from '../types'
import Logger from '../../../utils/logger'

const logger = new Logger('ToolCallValidator')

/** 属性 Schema 类型 */
interface PropertySchema {
  type?: string
  enum?: unknown[]
  default?: unknown
}

export interface ValidationResult {
  /** 是否验证通过 */
  valid: boolean
  /** 错误列表（阻止执行） */
  errors: string[]
  /** 警告列表（不阻止执行） */
  warnings: string[]
  /** 修复后的工具调用（如果进行了修复） */
  fixedToolCall?: ToolCall
}

export class ToolCallValidator {
  /**
   * 验证工具调用
   */
  validate(toolCall: ToolCall, tool: FormattingFunction): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []

    try {
      const args = JSON.parse(toolCall.function.arguments)
      const schema = tool.inputSchema

      // 1. 检查必填参数
      const required = schema?.required || []
      for (const param of required) {
        if (!(param in args) || args[param] === undefined || args[param] === null) {
          errors.push(`缺少必填参数: ${param}`)
        }
      }

      // 2. 检查参数类型
      for (const [key, value] of Object.entries(args)) {
        const propSchema = schema?.properties?.[key] as PropertySchema | undefined
        if (propSchema) {
          const typeError = this.checkType(value, propSchema)
          if (typeError) {
            warnings.push(`参数 ${key}: ${typeError}`)
          }
        }
      }

      // 3. 检查枚举值
      for (const [key, value] of Object.entries(args)) {
        const propSchema = schema?.properties?.[key] as PropertySchema | undefined
        if (propSchema?.enum && !propSchema.enum.includes(value)) {
          errors.push(`参数 ${key} 的值 "${value}" 不在允许范围内，可选: ${propSchema.enum.join(', ')}`)
        }
      }

      // 4. 特殊验证：索引参数
      this.validateIndexParams(args, schema, warnings)

      return {
        valid: errors.length === 0,
        errors,
        warnings
      }
    } catch (e) {
      return {
        valid: false,
        errors: [`参数解析失败: ${(e as Error).message}`],
        warnings: []
      }
    }
  }

  /**
   * 尝试自动修复工具调用
   */
  autoFix(toolCall: ToolCall, tool: FormattingFunction): ToolCall | null {
    try {
      const args = JSON.parse(toolCall.function.arguments)
      const schema = tool.inputSchema
      let modified = false

      // 1. 填充缺失的必填参数
      for (const param of schema?.required || []) {
        if (!(param in args) || args[param] === undefined) {
          const propSchema = schema?.properties?.[param] as PropertySchema | undefined
          const defaultValue = this.getDefaultValue(propSchema, param)

          if (defaultValue !== undefined) {
            args[param] = defaultValue
            modified = true
            logger.info(`[AUTO_FIX] 填充缺失参数 ${param} = ${JSON.stringify(defaultValue)}`)
          }
        }
      }

      // 2. 修复类型错误
      for (const [key, value] of Object.entries(args)) {
        const propSchema = schema?.properties?.[key] as PropertySchema | undefined
        if (propSchema) {
          const fixedValue = this.fixType(value, propSchema)
          if (fixedValue !== value) {
            args[key] = fixedValue
            modified = true
            logger.info(`[AUTO_FIX] 修复参数类型 ${key}: ${JSON.stringify(value)} → ${JSON.stringify(fixedValue)}`)
          }
        }
      }

      // 3. 修复索引偏移（用户说"第1行"，实际应该是 index=0）
      const indexFixResult = this.fixIndexOffset(args, schema)
      if (indexFixResult.modified) {
        modified = true
      }

      if (!modified) {
        return toolCall
      }

      return {
        ...toolCall,
        function: {
          ...toolCall.function,
          arguments: JSON.stringify(args)
        }
      }
    } catch (e) {
      logger.error('[AUTO_FIX] 修复失败', { error: e })
      return null
    }
  }

  /**
   * 验证并自动修复（组合方法）
   */
  validateAndFix(toolCall: ToolCall, tool: FormattingFunction): {
    result: ValidationResult
    fixedToolCall: ToolCall | null
  } {
    const result = this.validate(toolCall, tool)

    if (result.valid) {
      return { result, fixedToolCall: toolCall }
    }

    // 尝试自动修复
    const fixedToolCall = this.autoFix(toolCall, tool)

    if (fixedToolCall) {
      // 重新验证修复后的调用
      const revalidation = this.validate(fixedToolCall, tool)
      return { result: revalidation, fixedToolCall }
    }

    return { result, fixedToolCall: null }
  }

  private checkType(value: unknown, schema: PropertySchema): string | null {
    const expectedType = schema.type
    const actualType = Array.isArray(value) ? 'array' : typeof value

    if (expectedType === 'integer' && !Number.isInteger(value)) {
      return `期望整数，实际为 ${actualType}`
    }

    if (expectedType && expectedType !== actualType) {
      if (!(expectedType === 'number' && actualType === 'number')) {
        return `期望 ${expectedType}，实际为 ${actualType}`
      }
    }

    return null
  }

  private validateIndexParams(args: Record<string, unknown>, schema: ToolInputSchema | undefined, warnings: string[]): void {
    const indexParams = ['rowIndex', 'columnIndex', 'tableIndex', 'slideIndex', 'paragraphIndex']

    for (const param of indexParams) {
      if (param in args) {
        const value = args[param]
        if (typeof value === 'number' && value < 0) {
          warnings.push(`${param} 为负数 (${value})，可能导致意外行为`)
        }
      }
    }
  }

  private getDefaultValue(schema: PropertySchema | undefined, paramName: string): unknown {
    // 优先使用 schema 中的默认值
    if (schema?.default !== undefined) return schema.default

    // 使用枚举的第一个值
    if (schema?.enum && schema.enum.length > 0) return schema.enum[0]

    // 根据参数名推断
    const nameLower = paramName.toLowerCase()
    if (nameLower.includes('index')) return 0
    if (nameLower.includes('text') || nameLower.includes('value')) return ''
    if (nameLower.includes('enabled') || nameLower.includes('bold') || nameLower.includes('italic')) return false
    if (nameLower.includes('location')) return 'end'

    // 根据类型推断
    switch (schema?.type) {
      case 'string': return ''
      case 'number':
      case 'integer': return 0
      case 'boolean': return false
      case 'array': return []
      case 'object': return {}
      default: return undefined
    }
  }

  private fixType(value: unknown, schema: PropertySchema): unknown {
    const expectedType = schema.type

    // 字符串转数字
    if ((expectedType === 'number' || expectedType === 'integer') && typeof value === 'string') {
      const num = Number(value)
      if (!isNaN(num)) {
        return expectedType === 'integer' ? Math.floor(num) : num
      }
    }

    // 数字转字符串
    if (expectedType === 'string' && typeof value === 'number') {
      return String(value)
    }

    // 字符串转布尔
    if (expectedType === 'boolean' && typeof value === 'string') {
      return value.toLowerCase() === 'true' || value === '1'
    }

    return value
  }

  /**
   * 修复索引偏移
   * 用户通常说"第1行"，但程序需要 index=0
   * 这个方法检测并修复这种情况
   */
  private fixIndexOffset(args: Record<string, unknown>, schema: ToolInputSchema | undefined): { modified: boolean } {
    // 注意：这个修复比较危险，因为我们不确定用户是否已经使用了 0-based 索引
    // 目前只记录警告，不自动修复
    // 如果需要启用自动修复，可以取消下面的注释

    /*
    const indexParams = ['rowIndex', 'columnIndex']
    let modified = false
    
    for (const param of indexParams) {
      if (param in args && typeof args[param] === 'number' && args[param] > 0) {
        // 假设用户使用的是 1-based 索引，转换为 0-based
        // args[param] = args[param] - 1
        // modified = true
        // logger.info(`[AUTO_FIX] 索引偏移修复 ${param}: ${args[param] + 1} → ${args[param]}`)
      }
    }
    
    return { modified }
    */

    return { modified: false }
  }
}

export const toolCallValidator = new ToolCallValidator()
