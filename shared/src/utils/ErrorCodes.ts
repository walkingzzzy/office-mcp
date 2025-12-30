/**
 * 统一错误码体系
 * 用于提供友好的错误提示和恢复建议
 */

/**
 * 错误类别
 */
export enum ErrorCategory {
  /** 参数错误 */
  PARAMETER = 'PARAMETER',
  /** API 错误 */
  API = 'API',
  /** 权限错误 */
  PERMISSION = 'PERMISSION',
  /** 平台不支持 */
  PLATFORM = 'PLATFORM',
  /** 网络错误 */
  NETWORK = 'NETWORK',
  /** 内部错误 */
  INTERNAL = 'INTERNAL',
  /** 资源不存在 */
  NOT_FOUND = 'NOT_FOUND',
  /** 操作冲突 */
  CONFLICT = 'CONFLICT'
}

/**
 * 错误码定义
 */
export enum ErrorCode {
  // 参数错误 (1000-1999)
  /** 缺少必需参数 */
  MISSING_REQUIRED_PARAM = 'ERR_1001',
  /** 参数类型错误 */
  INVALID_PARAM_TYPE = 'ERR_1002',
  /** 参数值超出范围 */
  PARAM_OUT_OF_RANGE = 'ERR_1003',
  /** 参数格式错误 */
  INVALID_PARAM_FORMAT = 'ERR_1004',

  // API 错误 (2000-2999)
  /** Office.js API 调用失败 */
  OFFICE_API_ERROR = 'ERR_2001',
  /** API 版本不支持 */
  API_VERSION_NOT_SUPPORTED = 'ERR_2002',
  /** API 调用超时 */
  API_TIMEOUT = 'ERR_2003',
  /** 文档未打开 */
  DOCUMENT_NOT_OPEN = 'ERR_2004',
  /** 文档只读 */
  DOCUMENT_READONLY = 'ERR_2005',

  // 权限错误 (3000-3999)
  /** 无权限执行操作 */
  PERMISSION_DENIED = 'ERR_3001',
  /** 文档被保护 */
  DOCUMENT_PROTECTED = 'ERR_3002',
  /** 内容控件被锁定 */
  CONTENT_CONTROL_LOCKED = 'ERR_3003',

  // 平台不支持 (4000-4999)
  /** 功能仅桌面版支持 */
  DESKTOP_ONLY = 'ERR_4001',
  /** 功能仅 Web 版支持 */
  WEB_ONLY = 'ERR_4002',
  /** 功能仅 Windows 支持 */
  WINDOWS_ONLY = 'ERR_4003',
  /** 功能仅 Mac 支持 */
  MAC_ONLY = 'ERR_4004',

  // 网络错误 (5000-5999)
  /** IPC 通信失败 */
  IPC_COMMUNICATION_ERROR = 'ERR_5001',
  /** 网络请求失败 */
  NETWORK_REQUEST_FAILED = 'ERR_5002',
  /** 连接超时 */
  CONNECTION_TIMEOUT = 'ERR_5003',

  // 内部错误 (6000-6999)
  /** 未知错误 */
  UNKNOWN_ERROR = 'ERR_6001',
  /** 工具未注册 */
  TOOL_NOT_REGISTERED = 'ERR_6002',
  /** 内部状态错误 */
  INTERNAL_STATE_ERROR = 'ERR_6003',

  // 资源不存在 (7000-7999)
  /** 资源未找到 */
  RESOURCE_NOT_FOUND = 'ERR_7001',
  /** 书签不存在 */
  BOOKMARK_NOT_FOUND = 'ERR_7002',
  /** 内容控件不存在 */
  CONTENT_CONTROL_NOT_FOUND = 'ERR_7003',
  /** 图片不存在 */
  IMAGE_NOT_FOUND = 'ERR_7004',
  /** 批注不存在 */
  COMMENT_NOT_FOUND = 'ERR_7005',
  /** 切片器不存在 */
  SLICER_NOT_FOUND = 'ERR_7006',
  /** 形状不存在 */
  SHAPE_NOT_FOUND = 'ERR_7007',

  // 操作冲突 (8000-8999)
  /** 资源已存在 */
  RESOURCE_ALREADY_EXISTS = 'ERR_8001',
  /** 操作冲突 */
  OPERATION_CONFLICT = 'ERR_8002',
  /** 文档正在编辑 */
  DOCUMENT_IN_USE = 'ERR_8003'
}

/**
 * 错误信息定义
 */
export interface ErrorDefinition {
  /** 错误码 */
  code: ErrorCode
  /** 错误类别 */
  category: ErrorCategory
  /** 错误消息模板 */
  message: string
  /** 恢复建议 */
  suggestion?: string
  /** 是否可重试 */
  retryable: boolean
}

/**
 * 错误定义映射表
 */
export const ERROR_DEFINITIONS: Record<ErrorCode, ErrorDefinition> = {
  // 参数错误
  [ErrorCode.MISSING_REQUIRED_PARAM]: {
    code: ErrorCode.MISSING_REQUIRED_PARAM,
    category: ErrorCategory.PARAMETER,
    message: '缺少必需参数：{param}',
    suggestion: '请检查工具调用参数，确保提供了所有必需参数',
    retryable: false
  },
  [ErrorCode.INVALID_PARAM_TYPE]: {
    code: ErrorCode.INVALID_PARAM_TYPE,
    category: ErrorCategory.PARAMETER,
    message: '参数类型错误：{param} 应为 {expected}，实际为 {actual}',
    suggestion: '请检查参数类型是否正确',
    retryable: false
  },
  [ErrorCode.PARAM_OUT_OF_RANGE]: {
    code: ErrorCode.PARAM_OUT_OF_RANGE,
    category: ErrorCategory.PARAMETER,
    message: '参数值超出范围：{param} 应在 {min} 到 {max} 之间',
    suggestion: '请调整参数值到有效范围内',
    retryable: false
  },
  [ErrorCode.INVALID_PARAM_FORMAT]: {
    code: ErrorCode.INVALID_PARAM_FORMAT,
    category: ErrorCategory.PARAMETER,
    message: '参数格式错误：{param}',
    suggestion: '请检查参数格式是否符合要求',
    retryable: false
  },

  // API 错误
  [ErrorCode.OFFICE_API_ERROR]: {
    code: ErrorCode.OFFICE_API_ERROR,
    category: ErrorCategory.API,
    message: 'Office.js API 调用失败：{details}',
    suggestion: '请检查文档状态，确保 Office 应用正常运行',
    retryable: true
  },
  [ErrorCode.API_VERSION_NOT_SUPPORTED]: {
    code: ErrorCode.API_VERSION_NOT_SUPPORTED,
    category: ErrorCategory.API,
    message: 'API 版本不支持：需要 {required}，当前为 {current}',
    suggestion: '请升级 Office 应用到支持的版本',
    retryable: false
  },
  [ErrorCode.API_TIMEOUT]: {
    code: ErrorCode.API_TIMEOUT,
    category: ErrorCategory.API,
    message: 'API 调用超时',
    suggestion: '请稍后重试，或检查文档大小是否过大',
    retryable: true
  },
  [ErrorCode.DOCUMENT_NOT_OPEN]: {
    code: ErrorCode.DOCUMENT_NOT_OPEN,
    category: ErrorCategory.API,
    message: '文档未打开',
    suggestion: '请先打开一个文档',
    retryable: false
  },
  [ErrorCode.DOCUMENT_READONLY]: {
    code: ErrorCode.DOCUMENT_READONLY,
    category: ErrorCategory.API,
    message: '文档为只读模式',
    suggestion: '请以编辑模式打开文档',
    retryable: false
  },

  // 权限错误
  [ErrorCode.PERMISSION_DENIED]: {
    code: ErrorCode.PERMISSION_DENIED,
    category: ErrorCategory.PERMISSION,
    message: '无权限执行此操作',
    suggestion: '请检查文档权限设置',
    retryable: false
  },
  [ErrorCode.DOCUMENT_PROTECTED]: {
    code: ErrorCode.DOCUMENT_PROTECTED,
    category: ErrorCategory.PERMISSION,
    message: '文档已被保护',
    suggestion: '请先解除文档保护',
    retryable: false
  },
  [ErrorCode.CONTENT_CONTROL_LOCKED]: {
    code: ErrorCode.CONTENT_CONTROL_LOCKED,
    category: ErrorCategory.PERMISSION,
    message: '内容控件已被锁定',
    suggestion: '请先解锁内容控件',
    retryable: false
  },

  // 平台不支持
  [ErrorCode.DESKTOP_ONLY]: {
    code: ErrorCode.DESKTOP_ONLY,
    category: ErrorCategory.PLATFORM,
    message: '此功能仅在 Windows/Mac 桌面版 Office 中可用',
    suggestion: '请在桌面版 Office 中使用此功能，或使用替代方案',
    retryable: false
  },
  [ErrorCode.WEB_ONLY]: {
    code: ErrorCode.WEB_ONLY,
    category: ErrorCategory.PLATFORM,
    message: '此功能仅在 Web 版 Office 中可用',
    suggestion: '请在 Web 版 Office 中使用此功能',
    retryable: false
  },
  [ErrorCode.WINDOWS_ONLY]: {
    code: ErrorCode.WINDOWS_ONLY,
    category: ErrorCategory.PLATFORM,
    message: '此功能仅在 Windows 版 Office 中可用',
    suggestion: '请在 Windows 系统上使用此功能',
    retryable: false
  },
  [ErrorCode.MAC_ONLY]: {
    code: ErrorCode.MAC_ONLY,
    category: ErrorCategory.PLATFORM,
    message: '此功能仅在 Mac 版 Office 中可用',
    suggestion: '请在 Mac 系统上使用此功能',
    retryable: false
  },

  // 网络错误
  [ErrorCode.IPC_COMMUNICATION_ERROR]: {
    code: ErrorCode.IPC_COMMUNICATION_ERROR,
    category: ErrorCategory.NETWORK,
    message: 'IPC 通信失败：{details}',
    suggestion: '请检查 MCP Server 是否正常运行',
    retryable: true
  },
  [ErrorCode.NETWORK_REQUEST_FAILED]: {
    code: ErrorCode.NETWORK_REQUEST_FAILED,
    category: ErrorCategory.NETWORK,
    message: '网络请求失败：{details}',
    suggestion: '请检查网络连接',
    retryable: true
  },
  [ErrorCode.CONNECTION_TIMEOUT]: {
    code: ErrorCode.CONNECTION_TIMEOUT,
    category: ErrorCategory.NETWORK,
    message: '连接超时',
    suggestion: '请检查网络连接，稍后重试',
    retryable: true
  },

  // 内部错误
  [ErrorCode.UNKNOWN_ERROR]: {
    code: ErrorCode.UNKNOWN_ERROR,
    category: ErrorCategory.INTERNAL,
    message: '未知错误：{details}',
    suggestion: '请联系技术支持',
    retryable: true
  },
  [ErrorCode.TOOL_NOT_REGISTERED]: {
    code: ErrorCode.TOOL_NOT_REGISTERED,
    category: ErrorCategory.INTERNAL,
    message: '工具未注册：{toolName}',
    suggestion: '请检查工具名称是否正确',
    retryable: false
  },
  [ErrorCode.INTERNAL_STATE_ERROR]: {
    code: ErrorCode.INTERNAL_STATE_ERROR,
    category: ErrorCategory.INTERNAL,
    message: '内部状态错误：{details}',
    suggestion: '请重启应用后重试',
    retryable: true
  },

  // 资源不存在
  [ErrorCode.RESOURCE_NOT_FOUND]: {
    code: ErrorCode.RESOURCE_NOT_FOUND,
    category: ErrorCategory.NOT_FOUND,
    message: '资源未找到：{resource}',
    suggestion: '请检查资源是否存在',
    retryable: false
  },
  [ErrorCode.BOOKMARK_NOT_FOUND]: {
    code: ErrorCode.BOOKMARK_NOT_FOUND,
    category: ErrorCategory.NOT_FOUND,
    message: '书签不存在：{name}',
    suggestion: '请检查书签名称是否正确',
    retryable: false
  },
  [ErrorCode.CONTENT_CONTROL_NOT_FOUND]: {
    code: ErrorCode.CONTENT_CONTROL_NOT_FOUND,
    category: ErrorCategory.NOT_FOUND,
    message: '内容控件不存在：{tag}',
    suggestion: '请检查内容控件标签是否正确',
    retryable: false
  },
  [ErrorCode.IMAGE_NOT_FOUND]: {
    code: ErrorCode.IMAGE_NOT_FOUND,
    category: ErrorCategory.NOT_FOUND,
    message: '图片不存在：{name}',
    suggestion: '请检查图片名称或索引是否正确',
    retryable: false
  },
  [ErrorCode.COMMENT_NOT_FOUND]: {
    code: ErrorCode.COMMENT_NOT_FOUND,
    category: ErrorCategory.NOT_FOUND,
    message: '批注不存在：{id}',
    suggestion: '请检查批注 ID 是否正确',
    retryable: false
  },
  [ErrorCode.SLICER_NOT_FOUND]: {
    code: ErrorCode.SLICER_NOT_FOUND,
    category: ErrorCategory.NOT_FOUND,
    message: '切片器不存在：{name}',
    suggestion: '请检查切片器名称是否正确',
    retryable: false
  },
  [ErrorCode.SHAPE_NOT_FOUND]: {
    code: ErrorCode.SHAPE_NOT_FOUND,
    category: ErrorCategory.NOT_FOUND,
    message: '形状不存在：{name}',
    suggestion: '请检查形状名称或索引是否正确',
    retryable: false
  },

  // 操作冲突
  [ErrorCode.RESOURCE_ALREADY_EXISTS]: {
    code: ErrorCode.RESOURCE_ALREADY_EXISTS,
    category: ErrorCategory.CONFLICT,
    message: '资源已存在：{resource}',
    suggestion: '请使用不同的名称或先删除现有资源',
    retryable: false
  },
  [ErrorCode.OPERATION_CONFLICT]: {
    code: ErrorCode.OPERATION_CONFLICT,
    category: ErrorCategory.CONFLICT,
    message: '操作冲突：{details}',
    suggestion: '请等待当前操作完成后重试',
    retryable: true
  },
  [ErrorCode.DOCUMENT_IN_USE]: {
    code: ErrorCode.DOCUMENT_IN_USE,
    category: ErrorCategory.CONFLICT,
    message: '文档正在被其他操作使用',
    suggestion: '请等待当前操作完成后重试',
    retryable: true
  }
}

/**
 * 格式化错误消息
 * @param code 错误码
 * @param params 参数对象
 * @returns 格式化后的错误消息
 */
export function formatErrorMessage(code: ErrorCode, params?: Record<string, any>): string {
  const definition = ERROR_DEFINITIONS[code]
  if (!definition) {
    return `未知错误码：${code}`
  }

  let message = definition.message
  if (params) {
    Object.keys(params).forEach(key => {
      message = message.replace(`{${key}}`, String(params[key]))
    })
  }

  return message
}

/**
 * 获取错误建议
 * @param code 错误码
 * @returns 恢复建议
 */
export function getErrorSuggestion(code: ErrorCode): string | undefined {
  return ERROR_DEFINITIONS[code]?.suggestion
}

/**
 * 检查错误是否可重试
 * @param code 错误码
 * @returns 是否可重试
 */
export function isRetryable(code: ErrorCode): boolean {
  return ERROR_DEFINITIONS[code]?.retryable ?? false
}
