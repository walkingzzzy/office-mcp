/**
 * AI提供商配置管理
 */

import { existsSync } from 'node:fs'
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import { homedir } from 'node:os'
import type { AIProviderConfig } from '../types/index.js'
import { createLogger } from '../utils/logger.js'
import { decryptValue, encryptValue, isEncrypted } from '../utils/crypto.js'

const logger = createLogger('ProvidersConfig')
const MASKED_VALUE = '******'

/**
 * 获取配置目录路径
 */
function getConfigDir(): string {
  return join(homedir(), '.office-local-bridge')
}

/**
 * 获取providers配置文件路径
 */
function getProvidersConfigPath(): string {
  return join(getConfigDir(), 'providers.json')
}

function decryptProviders(providers: AIProviderConfig[]): AIProviderConfig[] {
  return providers.map(provider => ({
    ...provider,
    apiKey: provider.apiKey && isEncrypted(provider.apiKey)
      ? decryptValue(provider.apiKey)
      : provider.apiKey
  }))
}

function encryptProviders(providers: AIProviderConfig[]): AIProviderConfig[] {
  return providers.map(provider => ({
    ...provider,
    apiKey: provider.apiKey && !isEncrypted(provider.apiKey)
      ? encryptValue(provider.apiKey)
      : provider.apiKey
  }))
}

/**
 * 确保配置目录存在（异步版本）
 */
async function ensureConfigDir(): Promise<void> {
  const configDir = getConfigDir()
  if (!existsSync(configDir)) {
    await mkdir(configDir, { recursive: true, mode: 0o700 })
    logger.info('创建配置目录', { path: configDir })
  }
}

/**
 * 加载providers配置（异步版本）
 */
export async function loadProvidersConfig(): Promise<AIProviderConfig[]> {
  const configPath = getProvidersConfigPath()

  if (existsSync(configPath)) {
    try {
      const content = await readFile(configPath, 'utf-8')
      const data = JSON.parse(content) as { providers: AIProviderConfig[] }
      const providers = Array.isArray(data.providers) ? data.providers : []
      logger.info('Providers配置已加载', { count: providers.length })
      return decryptProviders(providers)
    } catch (error) {
      logger.error('Providers配置解析失败', { error })
      return []
    }
  }

  logger.info('Providers配置文件不存在，返回空列表')
  return []
}

/**
 * 加载providers配置（同步版本，用于需要同步加载的场景）
 * @deprecated 建议使用异步版本 loadProvidersConfig
 */
export function loadProvidersConfigSync(): AIProviderConfig[] {
  const { readFileSync } = require('node:fs')
  const configPath = getProvidersConfigPath()

  if (existsSync(configPath)) {
    try {
      const content = readFileSync(configPath, 'utf-8')
      const data = JSON.parse(content) as { providers: AIProviderConfig[] }
      const providers = Array.isArray(data.providers) ? data.providers : []
      logger.info('Providers配置已加载（同步）', { count: providers.length })
      return decryptProviders(providers)
    } catch (error) {
      logger.error('Providers配置解析失败', { error })
      return []
    }
  }

  logger.info('Providers配置文件不存在，返回空列表')
  return []
}

/**
 * 保存providers配置（异步版本）
 */
export async function saveProvidersConfig(providers: AIProviderConfig[]): Promise<void> {
  await ensureConfigDir()
  const configPath = getProvidersConfigPath()

  try {
    const data = {
      version: 1,
      providers: encryptProviders(providers)
    }
    await writeFile(configPath, JSON.stringify(data, null, 2), {
      encoding: 'utf-8',
      mode: 0o600
    })
    logger.info('Providers配置已保存', { count: providers.length })
  } catch (error) {
    logger.error('Providers配置保存失败', { error })
    throw error
  }
}

/**
 * 获取指定provider（异步版本）
 */
export async function getProvider(id: string): Promise<AIProviderConfig | undefined> {
  const providers = await loadProvidersConfig()
  return providers.find(p => p.id === id)
}

/**
 * 添加provider（异步版本）
 */
export async function addProvider(provider: AIProviderConfig): Promise<AIProviderConfig> {
  const providers = await loadProvidersConfig()

  // 检查ID是否已存在
  if (providers.some(p => p.id === provider.id)) {
    throw new Error(`Provider ID已存在: ${provider.id}`)
  }

  // 如果是第一个provider，自动设为默认
  if (providers.length === 0) {
    provider.isDefault = true
  }

  providers.push(provider)
  await saveProvidersConfig(providers)

  logger.info('Provider已添加', { id: provider.id, name: provider.name })
  return provider
}

/**
 * 更新provider（异步版本）
 */
export async function updateProvider(id: string, updates: Partial<AIProviderConfig>): Promise<AIProviderConfig> {
  const providers = await loadProvidersConfig()
  const index = providers.findIndex(p => p.id === id)

  if (index === -1) {
    throw new Error(`Provider不存在: ${id}`)
  }

  if (updates.apiKey === undefined || updates.apiKey === '' || updates.apiKey === MASKED_VALUE) {
    delete updates.apiKey
  }

  // 合并更新
  providers[index] = {
    ...providers[index],
    ...updates,
    id // 确保ID不被修改
  }

  await saveProvidersConfig(providers)

  logger.info('Provider已更新', { id })
  return providers[index]
}

/**
 * 删除provider（异步版本）
 */
export async function deleteProvider(id: string): Promise<void> {
  const providers = await loadProvidersConfig()
  const index = providers.findIndex(p => p.id === id)

  if (index === -1) {
    throw new Error(`Provider不存在: ${id}`)
  }

  const wasDefault = providers[index].isDefault

  providers.splice(index, 1)

  // 如果删除的是默认provider，将第一个provider设为默认
  if (wasDefault && providers.length > 0) {
    providers[0].isDefault = true
  }

  await saveProvidersConfig(providers)

  logger.info('Provider已删除', { id })
}

/**
 * 设置默认provider（异步版本）
 */
export async function setDefaultProvider(id: string): Promise<void> {
  const providers = await loadProvidersConfig()
  const provider = providers.find(p => p.id === id)

  if (!provider) {
    throw new Error(`Provider不存在: ${id}`)
  }

  // 取消所有provider的默认状态
  providers.forEach(p => {
    p.isDefault = false
  })

  // 设置新的默认provider
  provider.isDefault = true

  await saveProvidersConfig(providers)

  logger.info('默认Provider已设置', { id })
}

/**
 * 获取默认provider（异步版本）
 */
export async function getDefaultProvider(): Promise<AIProviderConfig | undefined> {
  const providers = await loadProvidersConfig()
  return providers.find(p => p.isDefault)
}
