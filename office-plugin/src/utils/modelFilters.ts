/**
 * 模型过滤工具
 * 用于过滤掉不适合聊天的模型（嵌入式模型、图像生成模型等）
 */

import type { Model } from '../types/api'

/**
 * 嵌入式模型的正则表达式
 * 匹配包含 embedding、embed、bge-、e5-、retrieval 等关键词的模型
 */
const EMBEDDING_REGEX =
  /(?:^text-|embed|bge-|e5-|LLM2Vec|retrieval|uae-|gte-|jina-clip|jina-embeddings|voyage-)/i

/**
 * Rerank 模型的正则表达式
 */
const RERANKING_REGEX = /(?:rerank|re-rank|re-ranker|re-ranking|retrieval|retriever)/i

/**
 * 图像生成模型的正则表达式
 */
const TEXT_TO_IMAGE_REGEX = /flux|diffusion|stabilityai|sd-|dall|cogview|janus|midjourney|mj-|image|gpt-image/i

/**
 * 语音模型的正则表达式
 */
const SPEECH_REGEX = /(?:^tts|whisper|speech)/i

/**
 * 获取模型 ID 的小写版本（用于匹配）
 */
function getLowerModelId(modelId: string): string {
  return modelId.toLowerCase().trim()
}

/**
 * Capability 项类型
 */
interface CapabilityItem {
  type: string
  [key: string]: unknown
}

/**
 * 类型守卫：检查 capabilities 是否为数组格式
 */
function isCapabilitiesArray(capabilities: Model['capabilities']): capabilities is CapabilityItem[] {
  return Array.isArray(capabilities)
}

/**
 * 检查模型的 capabilities 字段
 */
function hasCapability(model: Model, type: string): boolean {
  if (!model.capabilities) {
    return false
  }

  // 如果是数组格式
  if (isCapabilitiesArray(model.capabilities)) {
    if (model.capabilities.length === 0) {
      return false
    }
    return model.capabilities.some(cap => cap.type === type)
  }

  // 如果是对象格式，检查对应的布尔值
  const capObj = model.capabilities as Record<string, unknown>
  return capObj[type] === true
}

/**
 * 判断是否是嵌入式模型
 */
export function isEmbeddingModel(model: Model): boolean {
  if (!model) {
    return false
  }

  // 🔧 优先使用 capabilities 字段判断
  if (model.capabilities) {
    if (isCapabilitiesArray(model.capabilities) && model.capabilities.length > 0) {
      return hasCapability(model, 'embedding')
    }
  }

  // 🔧 降级：使用 type 字段判断（向后兼容）
  if (model.type && Array.isArray(model.type)) {
    return model.type.includes('embedding')
  }

  // 🔧 降级：使用模式匹配判断
  const modelId = getLowerModelId(model.id)
  const modelName = model.name?.toLowerCase() || ''

  return EMBEDDING_REGEX.test(modelId) || EMBEDDING_REGEX.test(modelName)
}

/**
 * 判断是否是 Rerank 模型
 */
export function isRerankModel(model: Model): boolean {
  if (!model) {
    return false
  }

  // 🔧 优先使用 capabilities 字段判断
  if (model.capabilities) {
    if (isCapabilitiesArray(model.capabilities) && model.capabilities.length > 0) {
      return hasCapability(model, 'rerank')
    }
  }

  // 🔧 降级：使用 type 字段判断
  if (model.type && Array.isArray(model.type)) {
    return model.type.includes('rerank')
  }

  // 🔧 降级：使用模式匹配判断
  const modelId = getLowerModelId(model.id)
  const modelName = model.name?.toLowerCase() || ''

  return RERANKING_REGEX.test(modelId) || RERANKING_REGEX.test(modelName)
}

/**
 * 判断是否是图像生成模型
 */
export function isImageGenerationModel(model: Model): boolean {
  if (!model) {
    return false
  }

  // 🔧 注意：图像生成模型通常没有专门的 capability type
  // 使用模式匹配判断
  const modelId = getLowerModelId(model.id)
  const modelName = model.name?.toLowerCase() || ''

  return TEXT_TO_IMAGE_REGEX.test(modelId) || TEXT_TO_IMAGE_REGEX.test(modelName)
}

/**
 * 判断是否是语音模型
 */
export function isSpeechModel(model: Model): boolean {
  if (!model) {
    return false
  }

  // 🔧 注意：语音模型通常没有专门的 capability type
  // 使用模式匹配判断
  const modelId = getLowerModelId(model.id)
  const modelName = model.name?.toLowerCase() || ''

  return SPEECH_REGEX.test(modelId) || SPEECH_REGEX.test(modelName)
}

/**
 * 判断是否是聊天模型（排除嵌入式、Rerank、图像生成、语音模型）
 */
export function isChatModel(model: Model): boolean {
  if (!model) {
    return false
  }

  // 排除非聊天模型
  if (
    isEmbeddingModel(model) ||
    isRerankModel(model) ||
    isImageGenerationModel(model) ||
    isSpeechModel(model)
  ) {
    return false
  }

  return true
}

/**
 * 过滤模型列表，只保留聊天模型
 */
export function filterChatModels(models: Model[]): Model[] {
  return models.filter(isChatModel)
}

/**
 * 验证模型是否适合聊天
 * 如果不适合，返回错误消息；否则返回 null
 */
export function validateChatModel(model: Model | null | undefined): string | null {
  if (!model) {
    return '未选择模型'
  }

  if (isEmbeddingModel(model)) {
    return '所选模型是嵌入式模型，不支持聊天功能。请选择聊天模型（如 GPT-4、Claude、Gemini 等）'
  }

  if (isRerankModel(model)) {
    return '所选模型是 Rerank 模型，不支持聊天功能。请选择聊天模型'
  }

  if (isImageGenerationModel(model)) {
    return '所选模型是图像生成模型，不支持聊天功能。请选择聊天模型'
  }

  if (isSpeechModel(model)) {
    return '所选模型是语音模型，不支持聊天功能。请选择聊天模型'
  }

  return null
}

