/**
 * AI API 代理路由
 * 提供 HTTP 端点供 Office 插件调用 AI 服务
 */

import { Router } from 'express'
import type { Request, Response } from 'express'
import { aiProxy } from '../proxy/AIProxy.js'
import { getSupportedProviders } from '../proxy/providers/index.js'
import type { AIRequestConfig, ChatCompletionRequest } from '../proxy/types.js'
import { createLogger } from '../utils/logger.js'
import { loadProvidersConfig, getProvider } from '../config/providers.js'

const logger = createLogger('AIAPI')
const router = Router()

/**
 * AI 请求体（传统格式，需要 config）
 */
interface AIProxyRequest {
  config: AIRequestConfig
  request: ChatCompletionRequest
}

/**
 * 简化的 AI 请求体（自动从配置获取 provider 信息）
 * model 格式: "providerId/modelName" 或 "providerId:modelName"
 */
interface SimplifiedAIRequest extends Omit<ChatCompletionRequest, 'model'> {
  model: string
}

/**
 * 从 model 字符串解析 providerId 和 modelName
 * 支持格式: "providerId/modelName" 或 "providerId:modelName"
 */
function parseModelId(model: string): { providerId: string; modelName: string } | null {
  // 尝试用 / 分割
  let parts = model.split('/')
  if (parts.length === 2 && parts[0] && parts[1]) {
    return { providerId: parts[0], modelName: parts[1] }
  }
  
  // 尝试用 : 分割
  parts = model.split(':')
  if (parts.length === 2 && parts[0] && parts[1]) {
    return { providerId: parts[0], modelName: parts[1] }
  }
  
  return null
}

/**
 * 从配置中获取 provider 的 AI 配置
 */
async function getProviderConfig(providerId: string): Promise<AIRequestConfig | null> {
  const provider = await getProvider(providerId)
  if (!provider) {
    return null
  }
  
  return {
    provider: provider.type,
    apiKey: provider.apiKey,
    baseUrl: provider.baseUrl,
    model: '' // 将在调用时设置
  }
}

/**
 * GET /ai/providers
 * 获取支持的 AI 提供商列表
 */
router.get('/providers', (_req: Request, res: Response) => {
  res.json({
    providers: getSupportedProviders()
  })
})

/**
 * POST /ai/chat/completions
 * 聊天完成请求
 * 
 * 支持两种请求格式：
 * 1. 传统格式: { config: AIRequestConfig, request: ChatCompletionRequest }
 * 2. 简化格式: { model: "providerId/modelName", messages: [...], ... }
 *    - 自动从配置中获取 provider 的 apiKey 和 baseUrl
 */
router.post('/chat/completions', async (req: Request, res: Response) => {
  const body = req.body as Record<string, unknown>
  
  // 运行时类型验证
  if (!body || typeof body !== 'object') {
    res.status(400).json({ error: '请求体必须是一个对象' })
    return
  }
  
  let config: AIRequestConfig
  let request: ChatCompletionRequest
  
  // 检查是否是传统格式（有 config 和 request 字段）
  if (body.config && body.request) {
    const legacyConfig = body.config as AIProxyRequest['config']
    const legacyRequest = body.request as AIProxyRequest['request']
    
    // 验证传统格式
    if (typeof legacyConfig !== 'object' || legacyConfig === null) {
      res.status(400).json({ error: 'config 必须是一个对象' })
      return
    }
    if (!legacyConfig.provider || typeof legacyConfig.provider !== 'string') {
      res.status(400).json({ error: '缺少有效的 provider 字段' })
      return
    }
    if (!legacyConfig.apiKey || typeof legacyConfig.apiKey !== 'string') {
      res.status(400).json({ error: '缺少有效的 apiKey 字段' })
      return
    }
    
    config = legacyConfig
    request = legacyRequest
  } else if (body.model && body.messages) {
    // 简化格式：从 model 字段解析 providerId，自动获取配置
    const model = body.model as string
    const parsed = parseModelId(model)
    
    if (!parsed) {
      res.status(400).json({ 
        error: '无效的 model 格式，应为 "providerId/modelName" 或 "providerId:modelName"',
        received: model
      })
      return
    }
    
    const { providerId, modelName } = parsed
    
    // 从配置中获取 provider 信息
    const providerConfig = await getProviderConfig(providerId)
    if (!providerConfig) {
      res.status(400).json({ 
        error: `未找到 provider: ${providerId}`,
        hint: '请先在 Bridge 配置中添加该 AI 提供商'
      })
      return
    }
    
    config = {
      ...providerConfig,
      model: modelName
    }
    
    // 构建 request
    request = {
      model: modelName,
      messages: body.messages as ChatCompletionRequest['messages'],
      stream: body.stream as boolean | undefined,
      temperature: body.temperature as number | undefined,
      max_tokens: body.max_tokens as number | undefined,
      tools: body.tools as ChatCompletionRequest['tools'],
      tool_choice: body.tool_choice as ChatCompletionRequest['tool_choice']
    }
    
    logger.info('使用简化格式处理请求', { 
      providerId, 
      modelName, 
      providerType: config.provider 
    })
  } else {
    res.status(400).json({ 
      error: '请求格式无效',
      hint: '需要 { config, request } 或 { model: "providerId/modelName", messages: [...] }'
    })
    return
  }

  // 验证 request 结构
  if (typeof request !== 'object' || request === null) {
    res.status(400).json({ error: 'request 必须是一个对象' })
    return
  }

  try {
    logger.info('处理聊天完成请求', { provider: config.provider, model: request.model })

    // 检查是否请求流式响应
    if (request.stream) {
      // 流式响应
      res.setHeader('Content-Type', 'text/event-stream')
      res.setHeader('Cache-Control', 'no-cache')
      res.setHeader('Connection', 'keep-alive')
      res.setHeader('X-Content-Type-Options', 'nosniff')

      try {
        for await (const chunk of aiProxy.chatCompletionStream(config, request)) {
          res.write(`data: ${JSON.stringify(chunk)}\n\n`)
        }
        res.write('data: [DONE]\n\n')
        res.end()
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        logger.error('流式响应错误', { error: errorMessage })
        // 如果响应头尚未发送，返回错误状态码
        if (!res.headersSent) {
          res.status(500).json({ error: errorMessage })
        } else {
          // 响应头已发送，通过 SSE 发送错误
          res.write(`data: ${JSON.stringify({ error: errorMessage })}\n\n`)
          res.end()
        }
      }
    } else {
      // 非流式响应
      const response = await aiProxy.chatCompletion(config, request)
      res.json(response)
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    logger.error('聊天完成请求失败', { error: errorMessage })
    res.status(500).json({ error: errorMessage })
  }
})

/**
 * POST /ai/chat/completions/stream
 * 聊天完成请求（强制流式）
 * 
 * 支持两种请求格式：
 * 1. 传统格式: { config: AIRequestConfig, request: ChatCompletionRequest }
 * 2. 简化格式: { model: "providerId/modelName", messages: [...], ... }
 */
router.post('/chat/completions/stream', async (req: Request, res: Response) => {
  const body = req.body as Record<string, unknown>
  
  // 运行时类型验证
  if (!body || typeof body !== 'object') {
    res.status(400).json({ error: '请求体必须是一个对象' })
    return
  }
  
  let config: AIRequestConfig
  let request: ChatCompletionRequest
  
  // 检查是否是传统格式
  if (body.config && body.request) {
    const legacyConfig = body.config as AIProxyRequest['config']
    const legacyRequest = body.request as AIProxyRequest['request']
    
    if (typeof legacyConfig !== 'object' || legacyConfig === null) {
      res.status(400).json({ error: 'config 必须是一个对象' })
      return
    }
    if (!legacyConfig.provider || typeof legacyConfig.provider !== 'string') {
      res.status(400).json({ error: '缺少有效的 provider 字段' })
      return
    }
    if (!legacyConfig.apiKey || typeof legacyConfig.apiKey !== 'string') {
      res.status(400).json({ error: '缺少有效的 apiKey 字段' })
      return
    }
    
    config = legacyConfig
    request = legacyRequest
  } else if (body.model && body.messages) {
    // 简化格式
    const model = body.model as string
    const parsed = parseModelId(model)
    
    if (!parsed) {
      res.status(400).json({ 
        error: '无效的 model 格式，应为 "providerId/modelName" 或 "providerId:modelName"',
        received: model
      })
      return
    }
    
    const { providerId, modelName } = parsed
    const providerConfig = await getProviderConfig(providerId)
    
    if (!providerConfig) {
      res.status(400).json({ 
        error: `未找到 provider: ${providerId}`,
        hint: '请先在 Bridge 配置中添加该 AI 提供商'
      })
      return
    }
    
    config = { ...providerConfig, model: modelName }
    request = {
      model: modelName,
      messages: body.messages as ChatCompletionRequest['messages'],
      stream: true,
      temperature: body.temperature as number | undefined,
      max_tokens: body.max_tokens as number | undefined,
      tools: body.tools as ChatCompletionRequest['tools'],
      tool_choice: body.tool_choice as ChatCompletionRequest['tool_choice']
    }
    
    logger.info('使用简化格式处理流式请求', { providerId, modelName, providerType: config.provider })
  } else {
    res.status(400).json({ 
      error: '请求格式无效',
      hint: '需要 { config, request } 或 { model: "providerId/modelName", messages: [...] }'
    })
    return
  }

  if (typeof request !== 'object' || request === null) {
    res.status(400).json({ error: 'request 必须是一个对象' })
    return
  }

  try {
    logger.info('处理流式聊天完成请求', { provider: config.provider, model: request.model })

    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')
    res.setHeader('X-Content-Type-Options', 'nosniff')

    for await (const chunk of aiProxy.chatCompletionStream(config, request)) {
      res.write(`data: ${JSON.stringify(chunk)}\n\n`)
    }
    res.write('data: [DONE]\n\n')
    res.end()
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    logger.error('流式聊天完成请求失败', { error: errorMessage })
    if (!res.headersSent) {
      res.status(500).json({ error: errorMessage })
    } else {
      res.write(`data: ${JSON.stringify({ error: errorMessage })}\n\n`)
      res.end()
    }
  }
})

export default router
