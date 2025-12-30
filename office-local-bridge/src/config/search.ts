/**
 * 联网搜索配置管理
 */

import { existsSync } from 'node:fs'
import { readFile, writeFile } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { WebSearchConfig } from '../types/index.js'
import { createLogger } from '../utils/logger.js'
import { encryptValue, decryptValue, isEncrypted } from '../utils/crypto.js'

const logger = createLogger('SearchConfig')

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

/**
 * 默认搜索配置
 */
const DEFAULT_SEARCH_CONFIG: WebSearchConfig = {
  enabled: false,
  provider: 'tavily',
  apiKey: '',
  maxResults: 5,
  searchDepth: 'basic',
  includeImages: false,
  includeDomains: [],
  excludeDomains: [],
  region: 'auto',
  language: 'zh-CN'
}

/**
 * 搜索配置文件路径
 */
function getSearchConfigPath(): string {
  if (process.env.SEARCH_CONFIG_PATH) {
    return process.env.SEARCH_CONFIG_PATH
  }
  return join(__dirname, '../../search-config.json')
}

/**
 * 加载搜索配置（异步版本）
 * apiKey 会在加载时自动解密
 */
export async function loadSearchConfig(): Promise<WebSearchConfig> {
  const configPath = getSearchConfigPath()

  if (existsSync(configPath)) {
    try {
      const content = await readFile(configPath, 'utf-8')
      const config = JSON.parse(content) as Partial<WebSearchConfig>
      logger.info('搜索配置已加载', { path: configPath })
      
      // 解密 apiKey
      const result = { ...DEFAULT_SEARCH_CONFIG, ...config }
      if (result.apiKey && isEncrypted(result.apiKey)) {
        result.apiKey = decryptValue(result.apiKey)
      }
      
      return result
    } catch (error) {
      logger.error('搜索配置解析失败，使用默认配置', { error })
    }
  } else {
    logger.info('搜索配置文件不存在，使用默认配置', { path: configPath })
  }

  return DEFAULT_SEARCH_CONFIG
}

/**
 * 加载搜索配置（同步版本，用于需要同步加载的场景）
 * @deprecated 建议使用异步版本 loadSearchConfig
 */
export function loadSearchConfigSync(): WebSearchConfig {
  const { existsSync: existsSyncFn, readFileSync } = require('node:fs')
  const configPath = getSearchConfigPath()

  if (existsSyncFn(configPath)) {
    try {
      const content = readFileSync(configPath, 'utf-8')
      const config = JSON.parse(content) as Partial<WebSearchConfig>
      logger.info('搜索配置已加载（同步）', { path: configPath })
      
      // 解密 apiKey
      const result = { ...DEFAULT_SEARCH_CONFIG, ...config }
      if (result.apiKey && isEncrypted(result.apiKey)) {
        result.apiKey = decryptValue(result.apiKey)
      }
      
      return result
    } catch (error) {
      logger.error('搜索配置解析失败，使用默认配置', { error })
    }
  }

  return DEFAULT_SEARCH_CONFIG
}

/**
 * 保存搜索配置（异步版本）
 * apiKey 会在保存时自动加密
 */
export async function saveSearchConfig(config: WebSearchConfig): Promise<void> {
  const configPath = getSearchConfigPath()
  try {
    // 保存前加密 apiKey
    const encryptedConfig = { ...config }
    if (encryptedConfig.apiKey && !isEncrypted(encryptedConfig.apiKey)) {
      encryptedConfig.apiKey = encryptValue(encryptedConfig.apiKey)
    }
    
    await writeFile(configPath, JSON.stringify(encryptedConfig, null, 2), 'utf-8')
    logger.info('搜索配置已保存', { path: configPath })
  } catch (error) {
    logger.error('搜索配置保存失败', { error })
    throw error
  }
}
