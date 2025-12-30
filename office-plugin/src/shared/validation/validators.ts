/**
 * 输入验证模块
 * 提供统一的输入验证工具和验证规则
 */

import { ErrorHandler, ErrorCode } from '../errors/OfficePluginError'

/**
 * 验证结果接口
 */
export interface ValidationResult {
  /** 是否有效 */
  isValid: boolean
  /** 错误消息列表 */
  errors: string[]
}

/**
 * 验证规则接口
 */
export interface ValidationRule<T = unknown> {
  /** 验证函数 */
  validate: (value: T) => boolean
  /** 错误消息 */
  message: string
}

/**
 * 字符串验证器
 */
export class StringValidator {
  /**
   * 验证非空字符串
   */
  static required(value: string, fieldName: string = '字段'): ValidationResult {
    const isValid = value !== null && value !== undefined && value.trim().length > 0
    return {
      isValid,
      errors: isValid ? [] : [`${fieldName}不能为空`]
    }
  }

  /**
   * 验证字符串长度
   */
  static length(
    value: string,
    min?: number,
    max?: number,
    fieldName: string = '字段'
  ): ValidationResult {
    const errors: string[] = []

    if (min !== undefined && value.length < min) {
      errors.push(`${fieldName}长度不能少于${min}个字符`)
    }

    if (max !== undefined && value.length > max) {
      errors.push(`${fieldName}长度不能超过${max}个字符`)
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  /**
   * 验证正则表达式匹配
   */
  static pattern(
    value: string,
    pattern: RegExp,
    message: string = '格式不正确'
  ): ValidationResult {
    const isValid = pattern.test(value)
    return {
      isValid,
      errors: isValid ? [] : [message]
    }
  }

  /**
   * 验证 URL 格式
   */
  static url(value: string, fieldName: string = 'URL'): ValidationResult {
    try {
      new URL(value)
      return { isValid: true, errors: [] }
    } catch {
      return {
        isValid: false,
        errors: [`${fieldName}格式不正确`]
      }
    }
  }

  /**
   * 验证邮箱格式
   */
  static email(value: string, fieldName: string = '邮箱'): ValidationResult {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return this.pattern(value, emailPattern, `${fieldName}格式不正确`)
  }
}

/**
 * 数字验证器
 */
export class NumberValidator {
  /**
   * 验证数字范围
   */
  static range(
    value: number,
    min?: number,
    max?: number,
    fieldName: string = '数值'
  ): ValidationResult {
    const errors: string[] = []

    if (min !== undefined && value < min) {
      errors.push(`${fieldName}不能小于${min}`)
    }

    if (max !== undefined && value > max) {
      errors.push(`${fieldName}不能大于${max}`)
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  /**
   * 验证正整数
   */
  static positiveInteger(value: number, fieldName: string = '数值'): ValidationResult {
    const isValid = Number.isInteger(value) && value > 0
    return {
      isValid,
      errors: isValid ? [] : [`${fieldName}必须是正整数`]
    }
  }

  /**
   * 验证非负整数
   */
  static nonNegativeInteger(value: number, fieldName: string = '数值'): ValidationResult {
    const isValid = Number.isInteger(value) && value >= 0
    return {
      isValid,
      errors: isValid ? [] : [`${fieldName}必须是非负整数`]
    }
  }
}

/**
 * 数组验证器
 */
export class ArrayValidator {
  /**
   * 验证非空数组
   */
  static required<T>(value: T[], fieldName: string = '数组'): ValidationResult {
    const isValid = Array.isArray(value) && value.length > 0
    return {
      isValid,
      errors: isValid ? [] : [`${fieldName}不能为空`]
    }
  }

  /**
   * 验证数组长度
   */
  static length<T>(
    value: T[],
    min?: number,
    max?: number,
    fieldName: string = '数组'
  ): ValidationResult {
    const errors: string[] = []

    if (!Array.isArray(value)) {
      return {
        isValid: false,
        errors: [`${fieldName}必须是数组`]
      }
    }

    if (min !== undefined && value.length < min) {
      errors.push(`${fieldName}长度不能少于${min}`)
    }

    if (max !== undefined && value.length > max) {
      errors.push(`${fieldName}长度不能超过${max}`)
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  /**
   * 验证数组元素
   */
  static items<T>(
    value: T[],
    validator: (item: T, index: number) => ValidationResult,
    fieldName: string = '数组元素'
  ): ValidationResult {
    if (!Array.isArray(value)) {
      return {
        isValid: false,
        errors: [`${fieldName}必须是数组`]
      }
    }

    const errors: string[] = []

    value.forEach((item, index) => {
      const result = validator(item, index)
      if (!result.isValid) {
        errors.push(...result.errors.map(err => `${fieldName}[${index}]: ${err}`))
      }
    })

    return {
      isValid: errors.length === 0,
      errors
    }
  }
}

/**
 * 对象验证器
 */
export class ObjectValidator {
  /**
   * 验证必需字段
   */
  static requiredFields<T extends Record<string, unknown>>(
    value: T,
    fields: (keyof T)[],
    objectName: string = '对象'
  ): ValidationResult {
    const errors: string[] = []

    fields.forEach(field => {
      if (value[field] === null || value[field] === undefined) {
        errors.push(`${objectName}缺少必需字段: ${String(field)}`)
      }
    })

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  /**
   * 验证字段类型
   */
  static fieldTypes<T extends Record<string, unknown>>(
    value: T,
    types: Partial<Record<keyof T, string>>,
    objectName: string = '对象'
  ): ValidationResult {
    const errors: string[] = []

    Object.entries(types).forEach(([field, expectedType]) => {
      const actualType = typeof value[field as keyof T]
      if (actualType !== expectedType) {
        errors.push(
          `${objectName}.${field} 类型错误: 期望 ${expectedType}, 实际 ${actualType}`
        )
      }
    })

    return {
      isValid: errors.length === 0,
      errors
    }
  }
}

/**
 * 组合验证器
 */
export class Validator {
  private rules: ValidationRule<unknown>[] = []
  private fieldName: string

  constructor(fieldName: string = '字段') {
    this.fieldName = fieldName
  }

  /**
   * 添加验证规则
   */
  addRule(rule: ValidationRule<unknown>): this {
    this.rules.push(rule)
    return this
  }

  /**
   * 执行验证
   */
  validate(value: unknown): ValidationResult {
    const errors: string[] = []

    for (const rule of this.rules) {
      if (!rule.validate(value)) {
        errors.push(rule.message)
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  /**
   * 执行验证并抛出错误
   */
  validateOrThrow(value: unknown): void {
    const result = this.validate(value)
    if (!result.isValid) {
      throw ErrorHandler.createValidationError(
        result.errors.join('; '),
        { fieldName: this.fieldName, value }
      )
    }
  }
}

/**
 * 常用验证规则工厂
 */
export class ValidationRules {
  /**
   * 创建消息内容验证器
   */
  static messageContent(): Validator {
    return new Validator('消息内容')
      .addRule({
        validate: (value: string) => value !== null && value !== undefined && value.trim().length > 0,
        message: '消息内容不能为空'
      })
      .addRule({
        validate: (value: string) => value.length <= 10000,
        message: '消息内容不能超过10000个字符'
      })
  }

  /**
   * 创建 API Key 验证器
   */
  static apiKey(): Validator {
    return new Validator('API Key')
      .addRule({
        validate: (value: string) => value !== null && value !== undefined && value.trim().length > 0,
        message: 'API Key 不能为空'
      })
      .addRule({
        validate: (value: string) => value.length >= 10,
        message: 'API Key 长度不能少于10个字符'
      })
  }

  /**
   * 创建文件路径验证器
   */
  static filePath(): Validator {
    return new Validator('文件路径')
      .addRule({
        validate: (value: string) => value !== null && value !== undefined && value.trim().length > 0,
        message: '文件路径不能为空'
      })
      .addRule({
        validate: (value: string) => !value.includes('..'),
        message: '文件路径不能包含".."'
      })
  }

  /**
   * 创建幻灯片索引验证器
   */
  static slideIndex(maxIndex?: number): Validator {
    const validator = new Validator('幻灯片索引')
      .addRule({
        validate: (value: number) => Number.isInteger(value),
        message: '幻灯片索引必须是整数'
      })
      .addRule({
        validate: (value: number) => value >= 0,
        message: '幻灯片索引不能为负数'
      })

    if (maxIndex !== undefined) {
      validator.addRule({
        validate: (value: number) => value < maxIndex,
        message: `幻灯片索引不能大于${maxIndex - 1}`
      })
    }

    return validator
  }

  /**
   * 创建颜色值验证器（十六进制）
   */
  static hexColor(): Validator {
    return new Validator('颜色值')
      .addRule({
        validate: (value: string) => /^#[0-9A-Fa-f]{6}$/.test(value),
        message: '颜色值必须是有效的十六进制格式（如 #FF0000）'
      })
  }
}

/**
 * 批量验证工具
 */
export class BatchValidator {
  private validators: Array<{ name: string; validator: () => ValidationResult }> = []

  /**
   * 添加验证器
   */
  add(name: string, validator: () => ValidationResult): this {
    this.validators.push({ name, validator })
    return this
  }

  /**
   * 执行所有验证
   */
  validate(): ValidationResult {
    const allErrors: string[] = []

    for (const { name, validator } of this.validators) {
      const result = validator()
      if (!result.isValid) {
        allErrors.push(...result.errors.map(err => `${name}: ${err}`))
      }
    }

    return {
      isValid: allErrors.length === 0,
      errors: allErrors
    }
  }

  /**
   * 执行验证并抛出错误
   */
  validateOrThrow(): void {
    const result = this.validate()
    if (!result.isValid) {
      throw ErrorHandler.createValidationError(result.errors.join('; '))
    }
  }
}
