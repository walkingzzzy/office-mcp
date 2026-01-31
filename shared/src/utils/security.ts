/**
 * 安全工具函数
 * 提供路径验证、敏感信息过滤等安全相关功能
 */

import { createHash, timingSafeEqual, randomBytes, pbkdf2Sync } from 'crypto'

/**
 * 验证文件路径是否安全（防止路径遍历攻击）
 * @param path 要验证的路径
 * @param allowedExtensions 允许的文件扩展名（可选）
 * @returns 验证结果
 */
export function validateFilePath(
  path: string,
  allowedExtensions?: string[]
): { valid: boolean; error?: string } {
  if (!path || typeof path !== 'string') {
    return { valid: false, error: '路径不能为空' }
  }

  // 检查路径遍历攻击
  if (path.includes('..') || path.includes('..\\')) {
    return { valid: false, error: '路径不能包含 ".."' }
  }

  // 检查绝对路径（可选，根据需求调整）
  const isAbsolute = path.startsWith('/') || /^[A-Za-z]:[\\/]/.test(path)
  if (isAbsolute) {
    // 允许绝对路径，但需要额外验证
    // 检查是否包含敏感系统目录
    const sensitivePatterns = [
      /^\/etc\//i,
      /^\/root\//i,
      /^\/var\/log\//i,
      /^C:\\Windows\\/i,
      /^C:\\Program Files\\/i,
      /^C:\\Users\\[^\\]+\\AppData\\/i
    ]
    for (const pattern of sensitivePatterns) {
      if (pattern.test(path)) {
        return { valid: false, error: '不允许访问系统敏感目录' }
      }
    }
  }

  // 检查文件扩展名
  if (allowedExtensions && allowedExtensions.length > 0) {
    const ext = path.split('.').pop()?.toLowerCase()
    if (!ext || !allowedExtensions.includes(ext)) {
      return { 
        valid: false, 
        error: `不支持的文件类型，允许的类型: ${allowedExtensions.join(', ')}` 
      }
    }
  }

  return { valid: true }
}

/**
 * 安全的 Token 比较（防止时序攻击）
 * @param a 第一个 token
 * @param b 第二个 token
 * @returns 是否相等
 */
export function secureCompare(a: string, b: string): boolean {
  if (typeof a !== 'string' || typeof b !== 'string') {
    return false
  }
  
  // 确保两个字符串长度相同（使用哈希）
  const hashA = createHash('sha256').update(a).digest()
  const hashB = createHash('sha256').update(b).digest()
  
  return timingSafeEqual(hashA, hashB)
}

/**
 * 生成安全的加密密钥（使用 PBKDF2）
 * @param password 密码或基础材料
 * @param salt 盐值（如果不提供则生成随机盐）
 * @returns 派生的密钥和盐值
 */
export function deriveSecureKey(
  password: string,
  salt?: string
): { key: string; salt: string } {
  const actualSalt = salt || randomBytes(32).toString('hex')
  const key = pbkdf2Sync(password, actualSalt, 100000, 32, 'sha256').toString('hex')
  return { key, salt: actualSalt }
}

/**
 * 敏感字段列表
 */
const SENSITIVE_FIELDS = [
  'password',
  'apiKey',
  'api_key',
  'apikey',
  'secret',
  'token',
  'accessToken',
  'access_token',
  'refreshToken',
  'refresh_token',
  'connectionString',
  'connection_string',
  'privateKey',
  'private_key',
  'credentials',
  'auth',
  'authorization'
]

/**
 * 过滤敏感信息（用于日志记录）
 * @param data 要过滤的数据
 * @param maxLength 最大长度（可选）
 * @returns 过滤后的数据
 */
export function filterSensitiveData(
  data: Record<string, unknown>,
  maxLength?: number
): Record<string, unknown> {
  if (!data || typeof data !== 'object') {
    return data
  }

  const filtered: Record<string, unknown> = {}
  
  for (const [key, value] of Object.entries(data)) {
    const lowerKey = key.toLowerCase()
    
    // 检查是否是敏感字段
    const isSensitive = SENSITIVE_FIELDS.some(field => 
      lowerKey.includes(field.toLowerCase())
    )
    
    if (isSensitive) {
      filtered[key] = '[REDACTED]'
    } else if (typeof value === 'object' && value !== null) {
      // 递归处理嵌套对象
      filtered[key] = filterSensitiveData(value as Record<string, unknown>, maxLength)
    } else if (typeof value === 'string' && maxLength && value.length > maxLength) {
      filtered[key] = value.substring(0, maxLength) + '...'
    } else {
      filtered[key] = value
    }
  }
  
  return filtered
}

/**
 * 验证必需参数
 * @param params 参数对象
 * @param required 必需参数列表
 * @returns 验证结果
 */
export function validateRequiredParams(
  params: Record<string, unknown>,
  required: string[]
): { valid: boolean; missing?: string[] } {
  const missing: string[] = []
  
  for (const param of required) {
    if (params[param] === undefined || params[param] === null || params[param] === '') {
      missing.push(param)
    }
  }
  
  if (missing.length > 0) {
    return { valid: false, missing }
  }
  
  return { valid: true }
}

/**
 * 各 action 的必需参数映射（示例）
 */
export const ACTION_REQUIRED_PARAMS: Record<string, Record<string, string[]>> = {
  excel: {
    setValue: ['cell', 'value'],
    setFormula: ['cell', 'formula'],
    insertImage: ['path'],
    importData: ['filePath'],
    exportData: ['filePath'],
    protectWorksheet: ['sheetName'],
    protectWorkbook: []
  },
  word: {
    open: ['path'],
    insertText: ['text'],
    insertImage: ['path'],
    replaceText: ['searchText', 'replaceText']
  },
  powerpoint: {
    insertImage: ['slideIndex', 'source'],
    insertVideo: ['slideIndex', 'source'],
    exportToPdf: ['outputPath']
  }
}
