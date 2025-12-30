/**
 * 模型配置管理
 */

import { existsSync, mkdirSync } from 'node:fs'
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import { homedir } from 'node:os'
import type { ModelConfig, ModelPreset, AIProviderType } from '../types/index.js'
import { createLogger } from '../utils/logger.js'

const logger = createLogger('ModelsConfig')

/**
 * 获取配置目录路径
 */
function getConfigDir(): string {
  return join(homedir(), '.office-local-bridge')
}

/**
 * 获取models配置文件路径
 */
function getModelsConfigPath(): string {
  return join(getConfigDir(), 'models.json')
}

/**
 * 确保配置目录存在（同步版本）
 */
function ensureConfigDirSync(): void {
  const configDir = getConfigDir()
  if (!existsSync(configDir)) {
    mkdirSync(configDir, { recursive: true })
    logger.info('创建配置目录', { path: configDir })
  }
}

/**
 * 确保配置目录存在（异步版本）
 */
async function ensureConfigDir(): Promise<void> {
  const configDir = getConfigDir()
  if (!existsSync(configDir)) {
    await mkdir(configDir, { recursive: true })
    logger.info('创建配置目录', { path: configDir })
  }
}

/**
 * 预设模型模板
 */
export const MODEL_PRESETS: Record<AIProviderType, ModelPreset[]> = {
  openai: [
    {
      name: 'gpt-4o',
      displayName: 'GPT-4o',
      contextWindow: 128000,
      supportsVision: true,
      supportsTools: true,
      recommended: true
    },
    {
      name: 'gpt-4-turbo',
      displayName: 'GPT-4 Turbo',
      contextWindow: 128000,
      supportsVision: true,
      supportsTools: true,
      recommended: false
    },
    {
      name: 'gpt-3.5-turbo',
      displayName: 'GPT-3.5 Turbo',
      contextWindow: 16385,
      supportsVision: false,
      supportsTools: true,
      recommended: false
    }
  ],
  anthropic: [
    {
      name: 'claude-3-opus-20240229',
      displayName: 'Claude 3 Opus',
      contextWindow: 200000,
      supportsVision: true,
      supportsTools: true,
      recommended: true
    },
    {
      name: 'claude-3-sonnet-20240229',
      displayName: 'Claude 3 Sonnet',
      contextWindow: 200000,
      supportsVision: true,
      supportsTools: true,
      recommended: false
    }
  ],
  azure: [],
  ollama: [
    {
      name: 'llama3',
      displayName: 'Llama 3',
      contextWindow: 8192,
      supportsVision: false,
      supportsTools: false,
      recommended: true
    },
    {
      name: 'qwen2',
      displayName: 'Qwen 2',
      contextWindow: 32768,
      supportsVision: false,
      supportsTools: false,
      recommended: false
    }
  ],
  custom: []
}

/**
 * 加载models配置（异步版本）
 */
export async function loadModelsConfig(): Promise<ModelConfig[]> {
  const configPath = getModelsConfigPath()

  if (existsSync(configPath)) {
    try {
      const content = await readFile(configPath, 'utf-8')
      const data = JSON.parse(content) as { models: ModelConfig[] }
      logger.info('Models配置已加载', { count: data.models.length })
      return data.models
    } catch (error) {
      logger.error('Models配置解析失败', { error })
      return []
    }
  }

  logger.info('Models配置文件不存在，返回空列表')
  return []
}

/**
 * 加载models配置（同步版本，用于需要同步加载的场景）
 * @deprecated 建议使用异步版本 loadModelsConfig
 */
export function loadModelsConfigSync(): ModelConfig[] {
  const { readFileSync } = require('node:fs')
  const configPath = getModelsConfigPath()

  if (existsSync(configPath)) {
    try {
      const content = readFileSync(configPath, 'utf-8')
      const data = JSON.parse(content) as { models: ModelConfig[] }
      logger.info('Models配置已加载（同步）', { count: data.models.length })
      return data.models
    } catch (error) {
      logger.error('Models配置解析失败', { error })
      return []
    }
  }

  logger.info('Models配置文件不存在，返回空列表')
  return []
}

/**
 * 保存models配置（异步版本）
 */
export async function saveModelsConfig(models: ModelConfig[]): Promise<void> {
  await ensureConfigDir()
  const configPath = getModelsConfigPath()

  try {
    const data = {
      version: 1,
      models
    }
    await writeFile(configPath, JSON.stringify(data, null, 2), 'utf-8')
    logger.info('Models配置已保存', { count: models.length })
  } catch (error) {
    logger.error('Models配置保存失败', { error })
    throw error
  }
}

/**
 * 获取指定model（异步版本）
 */
export async function getModel(id: string): Promise<ModelConfig | undefined> {
  const models = await loadModelsConfig()
  return models.find(m => m.id === id)
}

/**
 * 根据providerId获取models（异步版本）
 */
export async function getModelsByProvider(providerId: string): Promise<ModelConfig[]> {
  const models = await loadModelsConfig()
  return models.filter(m => m.providerId === providerId)
}

/**
 * 添加model（异步版本）
 */
export async function addModel(model: ModelConfig): Promise<ModelConfig> {
  const models = await loadModelsConfig()

  // 检查ID是否已存在
  if (models.some(m => m.id === model.id)) {
    throw new Error(`Model ID已存在: ${model.id}`)
  }

  // 如果是第一个model，自动设为默认
  if (models.length === 0) {
    model.isDefault = true
  }

  models.push(model)
  await saveModelsConfig(models)

  logger.info('Model已添加', { id: model.id, name: model.name })
  return model
}

/**
 * 更新model（异步版本）
 */
export async function updateModel(id: string, updates: Partial<ModelConfig>): Promise<ModelConfig> {
  const models = await loadModelsConfig()
  const index = models.findIndex(m => m.id === id)

  if (index === -1) {
    throw new Error(`Model不存在: ${id}`)
  }

  // 合并更新
  models[index] = {
    ...models[index],
    ...updates,
    id // 确保ID不被修改
  }

  await saveModelsConfig(models)

  logger.info('Model已更新', { id })
  return models[index]
}

/**
 * 删除model（异步版本）
 */
export async function deleteModel(id: string): Promise<void> {
  const models = await loadModelsConfig()
  const index = models.findIndex(m => m.id === id)

  if (index === -1) {
    throw new Error(`Model不存在: ${id}`)
  }

  const wasDefault = models[index].isDefault

  models.splice(index, 1)

  // 如果删除的是默认model，将第一个model设为默认
  if (wasDefault && models.length > 0) {
    models[0].isDefault = true
  }

  await saveModelsConfig(models)

  logger.info('Model已删除', { id })
}

/**
 * 设置默认model（异步版本）
 */
export async function setDefaultModel(id: string): Promise<void> {
  const models = await loadModelsConfig()
  const model = models.find(m => m.id === id)

  if (!model) {
    throw new Error(`Model不存在: ${id}`)
  }

  // 取消所有model的默认状态
  models.forEach(m => {
    m.isDefault = false
  })

  // 设置新的默认model
  model.isDefault = true

  await saveModelsConfig(models)

  logger.info('默认Model已设置', { id })
}

/**
 * 获取默认model（异步版本）
 */
export async function getDefaultModel(): Promise<ModelConfig | undefined> {
  const models = await loadModelsConfig()
  return models.find(m => m.isDefault)
}

/**
 * 获取预设模型列表
 */
export function getModelPresets(providerType: AIProviderType): ModelPreset[] {
  return MODEL_PRESETS[providerType] || []
}
