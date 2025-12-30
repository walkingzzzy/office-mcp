/**
 * LocalConfigManager 单元测试
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { localConfigManager, type AIProviderConfig, type ModelConfig } from './LocalConfigManager'

describe('LocalConfigManager', () => {
  beforeEach(async () => {
    await localConfigManager.clear()
  })

  afterEach(async () => {
    await localConfigManager.clear()
  })

  describe('Provider 管理', () => {
    it('应该成功添加 AI 提供商', async () => {
      const provider: Omit<AIProviderConfig, 'id'> = {
        type: 'openai',
        name: 'OpenAI',
        enabled: true,
        apiKey: 'sk-test-key',
        baseUrl: 'https://api.openai.com/v1'
      }

      const added = await localConfigManager.addProvider(provider)

      expect(added.id).toBeDefined()
      expect(added.name).toBe('OpenAI')
      expect(added.apiKey).toBe('sk-test-key')
    })

    it('应该成功更新提供商', async () => {
      const provider = await localConfigManager.addProvider({
        type: 'openai',
        name: 'OpenAI',
        enabled: true,
        apiKey: 'old-key'
      })

      await localConfigManager.updateProvider(provider.id, {
        apiKey: 'new-key'
      })

      const config = await localConfigManager.getConfig()
      const updated = config.providers.find(p => p.id === provider.id)

      expect(updated?.apiKey).toBe('new-key')
    })

    it('应该成功删除提供商', async () => {
      const provider = await localConfigManager.addProvider({
        type: 'openai',
        name: 'OpenAI',
        enabled: true,
        apiKey: 'test-key'
      })

      await localConfigManager.deleteProvider(provider.id)

      const config = await localConfigManager.getConfig()
      const found = config.providers.find(p => p.id === provider.id)

      expect(found).toBeUndefined()
    })
  })

  describe('Model 管理', () => {
    it('应该成功添加模型', async () => {
      const provider = await localConfigManager.addProvider({
        type: 'openai',
        name: 'OpenAI',
        enabled: true,
        apiKey: 'test-key'
      })

      const model: Omit<ModelConfig, 'id'> = {
        providerId: provider.id,
        name: 'gpt-4',
        displayName: 'GPT-4',
        enabled: true,
        maxTokens: 8192
      }

      const added = await localConfigManager.addModel(model)

      expect(added.id).toBeDefined()
      expect(added.name).toBe('gpt-4')
    })
  })

  describe('默认设置', () => {
    it('应该成功设置默认提供商', async () => {
      const provider = await localConfigManager.addProvider({
        type: 'openai',
        name: 'OpenAI',
        enabled: true,
        apiKey: 'test-key'
      })

      await localConfigManager.setDefaultProvider(provider.id)

      const config = await localConfigManager.getConfig()
      expect(config.defaultProviderId).toBe(provider.id)
    })
  })
})
