/**
 * 工具参数验证器
 * 提供统一的参数验证功能
 */

/**
 * 参数验证结果
 */
export interface ParamValidationResult {
  valid: boolean
  error?: string
  missingParams?: string[]
  invalidParams?: Array<{
    param: string
    expected: string
    actual: string
  }>
}

/**
 * 参数规则定义
 */
export interface ParamRule {
  /** 参数名 */
  name: string
  /** 是否必需 */
  required?: boolean
  /** 期望类型 */
  type?: 'string' | 'number' | 'boolean' | 'object' | 'array'
  /** 枚举值 */
  enum?: readonly string[]
  /** 最小值（数字类型） */
  min?: number
  /** 最大值（数字类型） */
  max?: number
  /** 最小长度（字符串/数组类型） */
  minLength?: number
  /** 最大长度（字符串/数组类型） */
  maxLength?: number
  /** 正则表达式（字符串类型） */
  pattern?: RegExp
  /** 自定义验证函数 */
  validate?: (value: any) => boolean | string
}

/**
 * Action 参数映射
 */
export type ActionParamRules = Record<string, ParamRule[]>

/**
 * 验证单个参数
 */
function validateParam(value: any, rule: ParamRule): string | null {
  // 检查必需参数
  if (rule.required && (value === undefined || value === null || value === '')) {
    return `缺少必需参数: ${rule.name}`
  }

  // 如果值为空且非必需，跳过后续验证
  if (value === undefined || value === null) {
    return null
  }

  // 类型检查
  if (rule.type) {
    const actualType = Array.isArray(value) ? 'array' : typeof value
    if (actualType !== rule.type) {
      return `参数 ${rule.name} 类型错误: 期望 ${rule.type}，实际 ${actualType}`
    }
  }

  // 枚举检查
  if (rule.enum && !rule.enum.includes(value)) {
    return `参数 ${rule.name} 值无效: 期望 [${rule.enum.join(', ')}]，实际 ${value}`
  }

  // 数值范围检查
  if (typeof value === 'number') {
    if (rule.min !== undefined && value < rule.min) {
      return `参数 ${rule.name} 值过小: 最小值 ${rule.min}，实际 ${value}`
    }
    if (rule.max !== undefined && value > rule.max) {
      return `参数 ${rule.name} 值过大: 最大值 ${rule.max}，实际 ${value}`
    }
  }

  // 长度检查
  if (typeof value === 'string' || Array.isArray(value)) {
    if (rule.minLength !== undefined && value.length < rule.minLength) {
      return `参数 ${rule.name} 长度过短: 最小长度 ${rule.minLength}，实际 ${value.length}`
    }
    if (rule.maxLength !== undefined && value.length > rule.maxLength) {
      return `参数 ${rule.name} 长度过长: 最大长度 ${rule.maxLength}，实际 ${value.length}`
    }
  }

  // 正则表达式检查
  if (rule.pattern && typeof value === 'string' && !rule.pattern.test(value)) {
    return `参数 ${rule.name} 格式无效`
  }

  // 自定义验证
  if (rule.validate) {
    const result = rule.validate(value)
    if (result !== true) {
      return typeof result === 'string' ? result : `参数 ${rule.name} 验证失败`
    }
  }

  return null
}

/**
 * 验证参数对象
 * @param params 参数对象
 * @param rules 验证规则
 * @returns 验证结果
 */
export function validateParams(
  params: Record<string, any>,
  rules: ParamRule[]
): ParamValidationResult {
  const errors: string[] = []
  const missingParams: string[] = []

  for (const rule of rules) {
    const value = params[rule.name]
    const error = validateParam(value, rule)
    
    if (error) {
      errors.push(error)
      if (rule.required && (value === undefined || value === null || value === '')) {
        missingParams.push(rule.name)
      }
    }
  }

  if (errors.length > 0) {
    return {
      valid: false,
      error: errors.join('; '),
      missingParams: missingParams.length > 0 ? missingParams : undefined
    }
  }

  return { valid: true }
}

/**
 * 验证 Action 参数
 * @param action 操作名称
 * @param params 参数对象
 * @param actionRules Action 参数规则映射
 * @returns 验证结果
 */
export function validateActionParams(
  action: string,
  params: Record<string, any>,
  actionRules: ActionParamRules
): ParamValidationResult {
  const rules = actionRules[action]
  
  if (!rules) {
    // 如果没有定义规则，默认通过
    return { valid: true }
  }

  return validateParams(params, rules)
}

/**
 * 创建必需参数规则
 */
export function required(name: string, type?: ParamRule['type']): ParamRule {
  return { name, required: true, type }
}

/**
 * 创建可选参数规则
 */
export function optional(name: string, type?: ParamRule['type']): ParamRule {
  return { name, required: false, type }
}

/**
 * 创建字符串参数规则
 */
export function stringParam(name: string, options: Partial<ParamRule> = {}): ParamRule {
  return { name, type: 'string', ...options }
}

/**
 * 创建数字参数规则
 */
export function numberParam(name: string, options: Partial<ParamRule> = {}): ParamRule {
  return { name, type: 'number', ...options }
}

/**
 * 创建布尔参数规则
 */
export function booleanParam(name: string, options: Partial<ParamRule> = {}): ParamRule {
  return { name, type: 'boolean', ...options }
}

// ============ 常用参数规则预设 ============

/** 单元格地址参数 */
export const cellParam = (required = true): ParamRule => ({
  name: 'cell',
  required,
  type: 'string',
  pattern: /^[A-Za-z]+\d+$/,
  validate: (v) => /^[A-Za-z]{1,3}\d{1,7}$/.test(v) || '无效的单元格地址格式'
})

/** 区域范围参数 */
export const rangeParam = (required = true): ParamRule => ({
  name: 'range',
  required,
  type: 'string',
  pattern: /^[A-Za-z]+\d+:[A-Za-z]+\d+$/,
  validate: (v) => /^[A-Za-z]{1,3}\d{1,7}:[A-Za-z]{1,3}\d{1,7}$/.test(v) || '无效的区域范围格式'
})

/** 文件路径参数 */
export const filePathParam = (required = true): ParamRule => ({
  name: 'filePath',
  required,
  type: 'string',
  minLength: 1,
  validate: (v) => !v.includes('..') || '路径不能包含 ..'
})

/** 图片路径参数 */
export const imagePathParam = (required = true): ParamRule => ({
  name: 'path',
  required,
  type: 'string',
  minLength: 1,
  validate: (v) => {
    if (v.includes('..')) return '路径不能包含 ..'
    const ext = v.toLowerCase().split('.').pop()
    const validExts = ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'svg', 'webp']
    if (!validExts.includes(ext || '')) return `不支持的图片格式，支持: ${validExts.join(', ')}`
    return true
  }
})

/** 文本内容参数 */
export const textParam = (required = true, maxLength = 100000): ParamRule => ({
  name: 'text',
  required,
  type: 'string',
  maxLength
})

/** 索引参数 */
export const indexParam = (name = 'index', required = true): ParamRule => ({
  name,
  required,
  type: 'number',
  min: 0
})
