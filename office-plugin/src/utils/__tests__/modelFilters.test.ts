/**
 * 模型过滤工具测试
 */

import { describe, expect, it } from 'vitest'

import type { Model } from '../../types/api'
import {
  filterChatModels,
  isChatModel,
  isEmbeddingModel,
  isImageGenerationModel,
  isRerankModel,
  isSpeechModel,
  validateChatModel
} from '../modelFilters'

describe('modelFilters', () => {
  describe('isEmbeddingModel', () => {
    it('should detect embedding models by name pattern', () => {
      const embeddingModel: Model = {
        id: 'text-embedding-ada-002',
        name: 'Text Embedding Ada 002',
        providerId: 'openai'
      }
      expect(isEmbeddingModel(embeddingModel)).toBe(true)
    })

    it('should detect embedding models by capabilities', () => {
      const embeddingModel: Model = {
        id: 'custom-model',
        name: 'Custom Model',
        providerId: 'custom',
        capabilities: [{ type: 'embedding' }]
      }
      expect(isEmbeddingModel(embeddingModel)).toBe(true)
    })

    it('should not detect chat models as embedding models', () => {
      const chatModel: Model = {
        id: 'gpt-4o',
        name: 'GPT-4o',
        providerId: 'openai'
      }
      expect(isEmbeddingModel(chatModel)).toBe(false)
    })
  })

  describe('isRerankModel', () => {
    it('should detect rerank models by name pattern', () => {
      const rerankModel: Model = {
        id: 'jina-rerank-v1',
        name: 'Jina Rerank V1',
        providerId: 'jina'
      }
      expect(isRerankModel(rerankModel)).toBe(true)
    })

    it('should detect rerank models by capabilities', () => {
      const rerankModel: Model = {
        id: 'custom-rerank',
        name: 'Custom Rerank',
        providerId: 'custom',
        capabilities: [{ type: 'rerank' }]
      }
      expect(isRerankModel(rerankModel)).toBe(true)
    })
  })

  describe('isImageGenerationModel', () => {
    it('should detect image generation models', () => {
      const imageModel: Model = {
        id: 'dall-e-3',
        name: 'DALL-E 3',
        providerId: 'openai'
      }
      expect(isImageGenerationModel(imageModel)).toBe(true)
    })

    it('should not detect chat models as image models', () => {
      const chatModel: Model = {
        id: 'gpt-4o',
        name: 'GPT-4o',
        providerId: 'openai'
      }
      expect(isImageGenerationModel(chatModel)).toBe(false)
    })
  })

  describe('isSpeechModel', () => {
    it('should detect speech models', () => {
      const speechModel: Model = {
        id: 'tts-1',
        name: 'TTS 1',
        providerId: 'openai'
      }
      expect(isSpeechModel(speechModel)).toBe(true)
    })

    it('should detect whisper models', () => {
      const whisperModel: Model = {
        id: 'whisper-1',
        name: 'Whisper 1',
        providerId: 'openai'
      }
      expect(isSpeechModel(whisperModel)).toBe(true)
    })
  })

  describe('isChatModel', () => {
    it('should identify chat models', () => {
      const chatModels: Model[] = [
        { id: 'gpt-4o', name: 'GPT-4o', providerId: 'openai' },
        { id: 'claude-3.5-sonnet', name: 'Claude 3.5 Sonnet', providerId: 'anthropic' },
        { id: 'gemini-pro', name: 'Gemini Pro', providerId: 'google' }
      ]

      chatModels.forEach(model => {
        expect(isChatModel(model)).toBe(true)
      })
    })

    it('should exclude embedding models', () => {
      const embeddingModel: Model = {
        id: 'text-embedding-ada-002',
        name: 'Text Embedding Ada 002',
        providerId: 'openai'
      }
      expect(isChatModel(embeddingModel)).toBe(false)
    })

    it('should exclude rerank models', () => {
      const rerankModel: Model = {
        id: 'jina-rerank-v1',
        name: 'Jina Rerank V1',
        providerId: 'jina'
      }
      expect(isChatModel(rerankModel)).toBe(false)
    })

    it('should exclude image generation models', () => {
      const imageModel: Model = {
        id: 'dall-e-3',
        name: 'DALL-E 3',
        providerId: 'openai'
      }
      expect(isChatModel(imageModel)).toBe(false)
    })
  })

  describe('filterChatModels', () => {
    it('should filter out non-chat models', () => {
      const models: Model[] = [
        { id: 'gpt-4o', name: 'GPT-4o', providerId: 'openai' },
        { id: 'text-embedding-ada-002', name: 'Text Embedding', providerId: 'openai' },
        { id: 'claude-3.5-sonnet', name: 'Claude 3.5 Sonnet', providerId: 'anthropic' },
        { id: 'dall-e-3', name: 'DALL-E 3', providerId: 'openai' },
        { id: 'jina-rerank-v1', name: 'Jina Rerank', providerId: 'jina' }
      ]

      const chatModels = filterChatModels(models)

      expect(chatModels).toHaveLength(2)
      expect(chatModels.map(m => m.id)).toEqual(['gpt-4o', 'claude-3.5-sonnet'])
    })
  })

  describe('validateChatModel', () => {
    it('should return null for valid chat models', () => {
      const chatModel: Model = {
        id: 'gpt-4o',
        name: 'GPT-4o',
        providerId: 'openai'
      }
      expect(validateChatModel(chatModel)).toBeNull()
    })

    it('should return error for embedding models', () => {
      const embeddingModel: Model = {
        id: 'text-embedding-ada-002',
        name: 'Text Embedding',
        providerId: 'openai'
      }
      const error = validateChatModel(embeddingModel)
      expect(error).toContain('嵌入式模型')
      expect(error).toContain('不支持聊天功能')
    })

    it('should return error for null model', () => {
      const error = validateChatModel(null)
      expect(error).toBe('未选择模型')
    })
  })
})

