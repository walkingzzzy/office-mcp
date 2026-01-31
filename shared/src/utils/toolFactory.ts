/**
 * 工具工厂函数
 * 用于创建标准化的 MCP 工具定义，减少代码重复
 */

import { sendIPCCommand } from './ipc.js'
import { validateActionParams, validateParams, type ActionParamRules, type ParamValidationResult } from './paramValidator.js'
import { validateFilePath, validateImagePath, validateDataFilePath } from './pathValidator.js'

/**
 * 工具定义接口
 */
export interface ToolDefinition {
  name: string
  description: string
  category?: string
  application?: 'excel' | 'word' | 'powerpoint'
  inputSchema: {
    type: 'object'
    properties: Record<string, any>
    required: string[]
  }
  metadata?: {
    version?: string
    priority?: string
    intentKeywords?: string[]
    mergedTools?: string[]
    supportedActions?: readonly string[]
  }
  handler: (args: Record<string, any>) => Promise<any>
  examples?: Array<{
    description: string
    input: Record<string, any>
    output: Record<string, any>
  }>
}

/**
 * Action 工具配置
 */
export interface ActionToolConfig<T extends readonly string[]> {
  /** 工具名称 */
  name: string
  /** 工具描述 */
  description: string
  /** 工具分类 */
  category?: string
  /** 应用类型 */
  application?: 'excel' | 'word' | 'powerpoint'
  /** 支持的操作列表 */
  actions: T
  /** 操作到 IPC 命令的映射 */
  commandMap: Record<T[number], string>
  /** 参数验证规则（按 action 分组） */
  paramRules?: ActionParamRules
  /** 需要路径验证的参数 */
  pathParams?: {
    /** 图片路径参数名 */
    imagePath?: string[]
    /** 数据文件路径参数名 */
    dataFilePath?: string[]
    /** 通用文件路径参数名 */
    filePath?: string[]
  }
  /** 输入 Schema 的 properties */
  properties: Record<string, any>
  /** 元数据 */
  metadata?: {
    version?: string
    priority?: string
    intentKeywords?: string[]
    mergedTools?: string[]
  }
  /** 示例 */
  examples?: Array<{
    description: string
    input: Record<string, any>
    output: Record<string, any>
  }>
}

/**
 * 创建不支持的操作错误响应
 */
export function unsupportedActionError(action: string, supportedActions: readonly string[]) {
  return {
    success: false,
    error: `不支持的操作: ${action}，支持的操作: ${supportedActions.join(', ')}`
  }
}

/**
 * 验证 action 是否有效
 */
export function validateAction(action: string, supportedActions: readonly string[]): boolean {
  return supportedActions.includes(action)
}

/**
 * 创建参数验证错误响应
 */
function paramValidationError(result: ParamValidationResult) {
  return {
    success: false,
    error: result.error || '参数验证失败',
    missingParams: result.missingParams
  }
}

/**
 * 创建路径验证错误响应
 */
function pathValidationError(paramName: string, error: string) {
  return {
    success: false,
    error: `路径参数 ${paramName} 验证失败: ${error}`
  }
}

/**
 * 创建基于 Action 的工具
 * 
 * @example
 * ```typescript
 * const excelCommentTool = createActionTool({
 *   name: 'excel_comment',
 *   description: '批注操作工具',
 *   application: 'excel',
 *   actions: ['add', 'edit', 'delete'] as const,
 *   commandMap: {
 *     add: 'excel_add_comment',
 *     edit: 'excel_edit_comment',
 *     delete: 'excel_delete_comment'
 *   },
 *   paramRules: {
 *     add: [required('cell', 'string'), required('text', 'string')],
 *     edit: [required('cell', 'string'), required('text', 'string')],
 *     delete: [required('cell', 'string')]
 *   },
 *   properties: {
 *     action: { type: 'string', enum: ['add', 'edit', 'delete'] },
 *     cell: { type: 'string', description: '单元格地址' },
 *     text: { type: 'string', description: '批注内容' }
 *   }
 * })
 * ```
 */
export function createActionTool<T extends readonly string[]>(
  config: ActionToolConfig<T>
): ToolDefinition {
  const {
    name,
    description,
    category,
    application,
    actions,
    commandMap,
    paramRules,
    pathParams,
    properties,
    metadata,
    examples
  } = config

  return {
    name,
    description,
    category,
    application,
    inputSchema: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: [...actions],
          description: '要执行的操作'
        },
        ...properties
      },
      required: ['action']
    },
    metadata: {
      ...metadata,
      supportedActions: actions
    },
    examples,
    handler: async (args: Record<string, any>) => {
      const { action, ...params } = args

      // 1. 验证 action
      if (!validateAction(action, actions)) {
        return unsupportedActionError(action, actions)
      }

      // 2. 验证参数
      if (paramRules) {
        const validation = validateActionParams(action, params, paramRules)
        if (!validation.valid) {
          return paramValidationError(validation)
        }
      }

      // 3. 验证路径参数
      if (pathParams) {
        // 验证图片路径
        if (pathParams.imagePath) {
          for (const paramName of pathParams.imagePath) {
            const pathValue = params[paramName]
            if (pathValue) {
              const result = validateImagePath(pathValue)
              if (!result.valid) {
                return pathValidationError(paramName, result.error!)
              }
            }
          }
        }

        // 验证数据文件路径
        if (pathParams.dataFilePath) {
          for (const paramName of pathParams.dataFilePath) {
            const pathValue = params[paramName]
            if (pathValue) {
              const result = validateDataFilePath(pathValue)
              if (!result.valid) {
                return pathValidationError(paramName, result.error!)
              }
            }
          }
        }

        // 验证通用文件路径
        if (pathParams.filePath) {
          for (const paramName of pathParams.filePath) {
            const pathValue = params[paramName]
            if (pathValue) {
              const result = validateFilePath(pathValue)
              if (!result.valid) {
                return pathValidationError(paramName, result.error!)
              }
            }
          }
        }
      }

      // 4. 执行命令
      const command = commandMap[action as T[number]]
      const result = await sendIPCCommand(command, params)

      return { ...result, action }
    }
  }
}

/**
 * 创建简单工具（无 action 参数）
 */
export interface SimpleToolConfig {
  name: string
  description: string
  category?: string
  application?: 'excel' | 'word' | 'powerpoint'
  command: string
  properties: Record<string, any>
  required?: string[]
  paramRules?: import('./paramValidator.js').ParamRule[]
  pathParams?: {
    imagePath?: string[]
    dataFilePath?: string[]
    filePath?: string[]
  }
  metadata?: {
    version?: string
    priority?: string
    intentKeywords?: string[]
  }
  examples?: Array<{
    description: string
    input: Record<string, any>
    output: Record<string, any>
  }>
}

export function createSimpleTool(config: SimpleToolConfig): ToolDefinition {
  const {
    name,
    description,
    category,
    application,
    command,
    properties,
    required = [],
    paramRules,
    pathParams,
    metadata,
    examples
  } = config

  return {
    name,
    description,
    category,
    application,
    inputSchema: {
      type: 'object',
      properties,
      required
    },
    metadata,
    examples,
    handler: async (args: Record<string, any>) => {
      // 验证参数
      if (paramRules) {
        const result = validateParams(args, paramRules)
        if (!result.valid) {
          return paramValidationError(result)
        }
      }

      // 验证路径参数
      if (pathParams) {
        if (pathParams.imagePath) {
          for (const paramName of pathParams.imagePath) {
            const pathValue = args[paramName]
            if (pathValue) {
              const result = validateImagePath(pathValue)
              if (!result.valid) {
                return pathValidationError(paramName, result.error!)
              }
            }
          }
        }

        if (pathParams.dataFilePath) {
          for (const paramName of pathParams.dataFilePath) {
            const pathValue = args[paramName]
            if (pathValue) {
              const result = validateDataFilePath(pathValue)
              if (!result.valid) {
                return pathValidationError(paramName, result.error!)
              }
            }
          }
        }

        if (pathParams.filePath) {
          for (const paramName of pathParams.filePath) {
            const pathValue = args[paramName]
            if (pathValue) {
              const result = validateFilePath(pathValue)
              if (!result.valid) {
                return pathValidationError(paramName, result.error!)
              }
            }
          }
        }
      }

      // 执行命令
      return await sendIPCCommand(command, args)
    }
  }
}
