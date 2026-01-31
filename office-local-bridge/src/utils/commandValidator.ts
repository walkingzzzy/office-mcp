/**
 * 命令验证工具
 * 防止命令注入攻击
 */

import { createLogger } from './logger.js'

const logger = createLogger('CommandValidator')

/**
 * 允许的命令白名单
 * 只允许执行这些命令
 */
const ALLOWED_COMMANDS = new Set([
  // Node.js 相关
  'node',
  'node.exe',
  'npx',
  'npx.cmd',
  'npm',
  'npm.cmd',
  // Python 相关
  'python',
  'python.exe',
  'python3',
  'python3.exe',
  'uvx',
  'uvx.exe',
  'uv',
  'uv.exe',
  // 其他常用工具
  'deno',
  'deno.exe',
  'bun',
  'bun.exe'
])

/**
 * 危险字符模式
 * 这些字符可能被用于命令注入
 */
const DANGEROUS_PATTERNS = [
  /[;&|`$(){}[\]<>]/,  // Shell 特殊字符
  /\.\./,              // 路径遍历
  /\n|\r/,             // 换行符
  /\\(?!\\)/           // 单个反斜杠（Windows 路径除外）
]

/**
 * 危险参数模式
 */
const DANGEROUS_ARG_PATTERNS = [
  /^-.*=.*[;&|`$(){}[\]<>]/,  // 带有危险字符的参数值
  /\$\(/,                      // 命令替换
  /`/,                         // 反引号命令替换
  /\|\|/,                      // 逻辑或
  /&&/,                        // 逻辑与
  /;/,                         // 命令分隔符
  /\|(?!\|)/,                  // 管道（非逻辑或）
  />/,                         // 重定向
  /</                          // 重定向
]

/**
 * 命令验证结果
 */
export interface CommandValidationResult {
  valid: boolean
  error?: string
  sanitizedCommand?: string
  sanitizedArgs?: string[]
}

/**
 * 验证命令是否安全
 */
export function validateCommand(command: string): CommandValidationResult {
  if (!command || typeof command !== 'string') {
    return { valid: false, error: '命令不能为空' }
  }

  // 提取命令名（去除路径）
  const commandName = command.split(/[/\\]/).pop()?.toLowerCase() || ''

  // 检查是否在白名单中
  if (!ALLOWED_COMMANDS.has(commandName)) {
    logger.warn('命令不在白名单中', { command, commandName })
    return { valid: false, error: `不允许执行的命令: ${commandName}` }
  }

  // 检查命令路径是否包含危险字符
  for (const pattern of DANGEROUS_PATTERNS) {
    if (pattern.test(command)) {
      logger.warn('命令包含危险字符', { command, pattern: pattern.toString() })
      return { valid: false, error: '命令包含不安全的字符' }
    }
  }

  return { valid: true, sanitizedCommand: command }
}

/**
 * 验证命令参数是否安全
 */
export function validateArgs(args: string[]): CommandValidationResult {
  if (!Array.isArray(args)) {
    return { valid: false, error: '参数必须是数组' }
  }

  const sanitizedArgs: string[] = []

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]

    if (typeof arg !== 'string') {
      return { valid: false, error: `参数 ${i} 必须是字符串` }
    }

    // 检查危险模式
    for (const pattern of DANGEROUS_ARG_PATTERNS) {
      if (pattern.test(arg)) {
        logger.warn('参数包含危险字符', { arg, index: i, pattern: pattern.toString() })
        return { valid: false, error: `参数 ${i} 包含不安全的字符` }
      }
    }

    // 检查路径遍历
    if (arg.includes('..')) {
      // 允许相对路径，但记录警告
      logger.debug('参数包含相对路径', { arg, index: i })
    }

    sanitizedArgs.push(arg)
  }

  return { valid: true, sanitizedArgs }
}

/**
 * 验证完整的命令和参数
 */
export function validateCommandWithArgs(
  command: string,
  args?: string[]
): CommandValidationResult {
  // 验证命令
  const commandResult = validateCommand(command)
  if (!commandResult.valid) {
    return commandResult
  }

  // 验证参数
  if (args && args.length > 0) {
    const argsResult = validateArgs(args)
    if (!argsResult.valid) {
      return argsResult
    }
    return {
      valid: true,
      sanitizedCommand: commandResult.sanitizedCommand,
      sanitizedArgs: argsResult.sanitizedArgs
    }
  }

  return {
    valid: true,
    sanitizedCommand: commandResult.sanitizedCommand,
    sanitizedArgs: []
  }
}

/**
 * 验证环境变量是否安全
 */
export function validateEnv(env?: Record<string, string>): CommandValidationResult {
  if (!env) {
    return { valid: true }
  }

  for (const [key, value] of Object.entries(env)) {
    // 检查键名
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) {
      return { valid: false, error: `无效的环境变量名: ${key}` }
    }

    // 检查值是否包含危险字符
    if (typeof value === 'string') {
      for (const pattern of DANGEROUS_ARG_PATTERNS) {
        if (pattern.test(value)) {
          logger.warn('环境变量值包含危险字符', { key, pattern: pattern.toString() })
          return { valid: false, error: `环境变量 ${key} 的值包含不安全的字符` }
        }
      }
    }
  }

  return { valid: true }
}
