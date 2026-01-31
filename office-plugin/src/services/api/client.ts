/**
 * API Client - 基础 HTTP 客户端
 * 使用 fetch API，符合现代化标准
 * 集成全局错误处理机制
 */

import { AppError, ErrorType, globalErrorHandler } from '../errors/GlobalErrorHandler'
import Logger from '../../utils/logger'

const logger = new Logger('ApiClient')

/**
 * API 客户端配置
 */
export interface ApiClientConfig {
  baseUrl: string
  timeout: number
  headers?: Record<string, string>
}

/**
 * 获取默认配置
 * 支持环境变量配置
 * 开发模式下使用相对路径（通过 Vite 代理），生产模式使用完整 URL
 */
function getDefaultConfig(): ApiClientConfig {
  // 开发模式下使用空字符串（相对路径），让 Vite 代理处理
  // 生产模式下使用环境变量或默认值
  const isDev = import.meta.env?.DEV ?? true
  const baseUrl = isDev
    ? '' // 开发模式：使用相对路径，通过 Vite 代理
    : (import.meta.env?.VITE_API_BASE_URL || 'http://localhost:3001')
  const apiToken =
    import.meta.env?.VITE_API_KEY ||
    (typeof process !== 'undefined' && process.env?.REACT_APP_API_KEY) ||
    ''

  return {
    baseUrl,
    timeout:
      parseInt(import.meta.env?.VITE_API_TIMEOUT || '30000') ||
      30000,
    headers: {
      'Content-Type': 'application/json',
      ...(apiToken ? { Authorization: `Bearer ${apiToken}` } : {})
    },
  }
}

/**
 * 创建带超时的 fetch
 */
function fetchWithTimeout(
  url: string,
  options: RequestInit & { timeout?: number }
): Promise<Response> {
  const { timeout = 30000, ...fetchOptions } = options

  return new Promise((resolve, reject) => {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => {
      controller.abort()
      reject(new Error(`Request timeout after ${timeout}ms`))
    }, timeout)

    fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
    })
      .then((response) => {
        clearTimeout(timeoutId)
        resolve(response)
      })
      .catch((error) => {
        clearTimeout(timeoutId)
        reject(error)
      })
  })
}

/**
 * API 客户端类
 */
export class ApiClient {
  private config: ApiClientConfig

  constructor(config?: Partial<ApiClientConfig>) {
    this.config = { ...getDefaultConfig(), ...config }
  }

  /**
   * 通用请求方法
   */
  async request<T>(
    endpoint: string,
    options?: RequestInit & { timeout?: number }
  ): Promise<T> {
    const url = `${this.config.baseUrl}${endpoint}`

    try {
      const response = await fetchWithTimeout(url, {
        ...options,
        timeout: options?.timeout || this.config.timeout,
        headers: {
          ...this.config.headers,
          ...options?.headers,
        },
      })

      if (!response.ok) {
        const errorMessage = `HTTP ${response.status}: ${response.statusText}`
        throw new AppError(
          errorMessage,
          ErrorType.API,
          response,
          `请求失败 (${response.status})`
        )
      }

      const json = await response.json()

      // 检查是否为标准 API 响应格式
      if (json && typeof json === 'object' && 'success' in json) {
        if (!json.success) {
          const errorMessage = json.error?.message || json.error || 'API request failed'
          throw new AppError(
            errorMessage,
            ErrorType.API,
            json.error,
            errorMessage
          )
        }
        // 只有当 data 字段明确存在时才解包
        if ('data' in json) {
          return json.data as T
        }
        // 如果没有 data 字段但 success 为 true，返回空对象
        return {} as T
      }

      // 否则直接返回原始响应
      return json as T
    } catch (error) {
      // 处理网络错误
      if (error instanceof TypeError) {
        const networkError = new AppError(
          '网络请求失败',
          ErrorType.NETWORK,
          error,
          '无法连接到服务器，请检查网络连接'
        )
        globalErrorHandler.handleError(networkError, `API: ${endpoint}`)
        throw networkError
      }

      // 处理已知的 AppError
      if (error instanceof AppError) {
        globalErrorHandler.handleError(error, `API: ${endpoint}`)
        throw error
      }

      // 处理其他未知错误
      logger.error('API请求失败', { endpoint, error })
      throw error
    }
  }

  /**
   * GET 请求
   */
  async get<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'GET',
    })
  }

  /**
   * POST 请求
   */
  async post<T>(endpoint: string, data?: object, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  /**
   * PUT 请求
   */
  async put<T>(endpoint: string, data?: object, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  /**
   * DELETE 请求
   */
  async delete<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'DELETE',
    })
  }

  /**
   * 更新配置
   */
  setConfig(config: Partial<ApiClientConfig>) {
    this.config = {
      ...this.config,
      ...config,
      headers: {
        ...this.config.headers,
        ...config.headers
      }
    }
  }

  /**
   * 设置或清除认证 token
   */
  setAuthToken(token?: string): void {
    const headers = { ...this.config.headers }
    if (token) {
      headers.Authorization = `Bearer ${token}`
    } else {
      delete headers.Authorization
    }
    this.config = { ...this.config, headers }
  }

  /**
   * 验证配置
   */
  validateConfig(): {
    isValid: boolean
    error?: string
  } {
    try {
      new URL(this.config.baseUrl)
      return { isValid: true }
    } catch {
      return {
        isValid: false,
        error: '无效的 API 基础 URL 格式'
      }
    }
  }

  /**
   * 测试连接
   */
  async testConnection(): Promise<{
    success: boolean
    message: string
    responseTime?: number
  }> {
    const startTime = Date.now()

    try {
      const response = await fetch(`${this.config.baseUrl}/health`, {
        method: 'GET',
        headers: {
          ...this.config.headers,
          'Content-Type': 'application/json'
        },
        signal: AbortSignal.timeout(5000)
      })

      const responseTime = Date.now() - startTime

      if (response.ok) {
        return {
          success: true,
          message: '连接成功',
          responseTime
        }
      } else {
        return {
          success: false,
          message: `连接失败: HTTP ${response.status}`,
          responseTime
        }
      }
    } catch (error) {
      const responseTime = Date.now() - startTime
      return {
        success: false,
        message: `连接错误: ${(error as Error).message}`,
        responseTime
      }
    }
  }
}

// 导出单例实例
export const apiClient = new ApiClient()
