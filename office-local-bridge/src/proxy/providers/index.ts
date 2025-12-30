/**
 * AI 提供商注册表
 */

import type { AIProvider, AIProviderAdapter } from '../types.js'
import { openaiAdapter } from './openai.js'
import { azureAdapter } from './azure.js'
import { anthropicAdapter } from './anthropic.js'
import { ollamaAdapter } from './ollama.js'
import { customAdapter } from './custom.js'

/**
 * 提供商适配器映射
 */
const adapters = new Map<AIProvider, AIProviderAdapter>()
adapters.set('openai', openaiAdapter)
adapters.set('azure', azureAdapter)
adapters.set('anthropic', anthropicAdapter)
adapters.set('ollama', ollamaAdapter)
adapters.set('custom', customAdapter)

/**
 * 获取提供商适配器
 */
export function getAdapter(provider: AIProvider): AIProviderAdapter {
  const adapter = adapters.get(provider)
  if (!adapter) {
    throw new Error(`不支持的 AI 提供商: ${provider}`)
  }
  return adapter
}

/**
 * 获取所有支持的提供商
 */
export function getSupportedProviders(): AIProvider[] {
  return Array.from(adapters.keys())
}

export { openaiAdapter, azureAdapter, anthropicAdapter, ollamaAdapter, customAdapter }
