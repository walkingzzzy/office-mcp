/**
 * 路径验证工具
 * 防止路径遍历攻击
 */

import * as path from 'path'

/**
 * 路径验证结果
 */
export interface PathValidationResult {
  valid: boolean
  error?: string
  normalizedPath?: string
}

/**
 * 危险路径模式
 */
const DANGEROUS_PATTERNS = [
  /\.\./,           // 父目录遍历
  /^\/etc\//i,      // Linux 系统目录
  /^\/var\//i,      // Linux 系统目录
  /^\/usr\//i,      // Linux 系统目录
  /^\/root/i,       // Linux root 目录
  /^C:\\Windows/i,  // Windows 系统目录
  /^C:\\Program Files/i,  // Windows 程序目录
  /^C:\\ProgramData/i,    // Windows 程序数据
  /^\\\\.*\\/,      // UNC 路径
  /^[a-z]:\\Users\\[^\\]+\\AppData/i,  // Windows AppData
]

/**
 * 允许的文件扩展名（用于导入/导出操作）
 * @internal 供内部验证使用
 */
export const ALLOWED_EXTENSIONS = new Set([
  // 数据文件
  '.csv', '.json', '.xml', '.xlsx', '.xls',
  // 图片文件
  '.png', '.jpg', '.jpeg', '.gif', '.bmp', '.svg', '.webp',
  // 文档文件
  '.docx', '.doc', '.pdf', '.txt', '.rtf',
  // 演示文件
  '.pptx', '.ppt',
])

/**
 * 验证文件路径是否安全
 * @param filePath 要验证的文件路径
 * @param options 验证选项
 * @returns 验证结果
 */
export function validateFilePath(
  filePath: string,
  options: {
    allowedExtensions?: string[]
    requireExtension?: boolean
    allowAbsolute?: boolean
    basePath?: string
  } = {}
): PathValidationResult {
  const {
    allowedExtensions,
    requireExtension = false,
    allowAbsolute = true,
    basePath
  } = options

  // 空路径检查
  if (!filePath || typeof filePath !== 'string') {
    return { valid: false, error: '路径不能为空' }
  }

  // 去除首尾空格
  const trimmedPath = filePath.trim()

  // 检查危险模式
  for (const pattern of DANGEROUS_PATTERNS) {
    if (pattern.test(trimmedPath)) {
      return { valid: false, error: '路径包含不允许的模式' }
    }
  }

  // 规范化路径
  const normalizedPath = path.normalize(trimmedPath)

  // 再次检查规范化后的路径是否包含 ..
  if (normalizedPath.includes('..')) {
    return { valid: false, error: '路径不能包含父目录引用 (..)' }
  }

  // 检查扩展名
  const ext = path.extname(normalizedPath).toLowerCase()
  
  if (requireExtension && !ext) {
    return { valid: false, error: '路径必须包含文件扩展名' }
  }

  if (allowedExtensions && allowedExtensions.length > 0) {
    const normalizedAllowed = allowedExtensions.map(e => e.toLowerCase())
    if (ext && !normalizedAllowed.includes(ext)) {
      return { 
        valid: false, 
        error: `不支持的文件类型: ${ext}，允许的类型: ${normalizedAllowed.join(', ')}` 
      }
    }
  }

  // 如果提供了基础路径，确保目标路径在基础路径内
  if (basePath) {
    const resolvedPath = path.resolve(basePath, normalizedPath)
    const resolvedBase = path.resolve(basePath)
    
    if (!resolvedPath.startsWith(resolvedBase)) {
      return { valid: false, error: '路径超出允许的目录范围' }
    }
  }

  // 检查绝对路径
  if (!allowAbsolute && path.isAbsolute(normalizedPath)) {
    return { valid: false, error: '不允许使用绝对路径' }
  }

  return { valid: true, normalizedPath }
}

/**
 * 验证图片路径
 */
export function validateImagePath(imagePath: string): PathValidationResult {
  return validateFilePath(imagePath, {
    allowedExtensions: ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.svg', '.webp'],
    requireExtension: true
  })
}

/**
 * 验证数据文件路径（CSV、JSON、XML 等）
 */
export function validateDataFilePath(filePath: string): PathValidationResult {
  return validateFilePath(filePath, {
    allowedExtensions: ['.csv', '.json', '.xml', '.xlsx', '.xls', '.txt'],
    requireExtension: true
  })
}

/**
 * 验证文档路径
 */
export function validateDocumentPath(docPath: string): PathValidationResult {
  return validateFilePath(docPath, {
    allowedExtensions: ['.docx', '.doc', '.pdf', '.txt', '.rtf', '.xlsx', '.xls', '.pptx', '.ppt'],
    requireExtension: true
  })
}

/**
 * 过滤敏感信息（用于日志）
 * @param value 要过滤的值
 * @returns 过滤后的值
 */
export function sanitizeForLogging(value: any): any {
  if (typeof value !== 'object' || value === null) {
    return value
  }

  const sensitiveKeys = [
    'password', 'passwd', 'pwd',
    'secret', 'token', 'apikey', 'api_key',
    'connectionstring', 'connection_string',
    'credentials', 'auth', 'authorization',
    'private', 'privatekey', 'private_key'
  ]

  const result: Record<string, any> = Array.isArray(value) ? [] : {}

  for (const [key, val] of Object.entries(value)) {
    const lowerKey = key.toLowerCase()
    
    if (sensitiveKeys.some(sk => lowerKey.includes(sk))) {
      result[key] = '[REDACTED]'
    } else if (typeof val === 'object' && val !== null) {
      result[key] = sanitizeForLogging(val)
    } else {
      result[key] = val
    }
  }

  return result
}
