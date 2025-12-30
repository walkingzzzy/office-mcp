/**
 * 配置管理
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { BridgeConfig, McpServerConfig } from '../types/index.js'
import { createLogger } from '../utils/logger.js'
import { encryptValue, decryptValue, isEncrypted } from '../utils/crypto.js'

const logger = createLogger('Config')

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

/**
 * 默认配置
 */
const DEFAULT_CONFIG: BridgeConfig = {
  port: 3001,
  host: 'localhost',
  mcpServers: [],
  logLevel: 'info',
  mcpRequestTimeout: 30000
}

/**
 * 配置缓存
 */
let cachedConfig: BridgeConfig | null = null
let configLoadedAt: number = 0
const CONFIG_CACHE_TTL = 60000 // 缓存有效期 60 秒

/**
 * 配置文件路径
 */
function getConfigPath(): string {
  // 优先使用环境变量
  if (process.env.BRIDGE_CONFIG_PATH) {
    return process.env.BRIDGE_CONFIG_PATH
  }
  // 默认在项目根目录
  return join(__dirname, '../../config.json')
}

/**
 * 解密配置中的敏感信息
 */
function decryptSensitiveFields(config: Partial<BridgeConfig>): Partial<BridgeConfig> {
  const result = { ...config }
  
  // 解密 apiToken
  if (result.apiToken && isEncrypted(result.apiToken)) {
    result.apiToken = decryptValue(result.apiToken)
  }
  
  // 解密 providers 中的 apiKey
  if (result.providers) {
    result.providers = result.providers.map(provider => ({
      ...provider,
      apiKey: provider.apiKey && isEncrypted(provider.apiKey)
        ? decryptValue(provider.apiKey)
        : provider.apiKey
    }))
  }
  
  return result
}

/**
 * 加密配置中的敏感信息
 */
function encryptSensitiveFields(config: BridgeConfig): BridgeConfig {
  const result = { ...config }
  
  // 加密 apiToken
  if (result.apiToken && !isEncrypted(result.apiToken)) {
    result.apiToken = encryptValue(result.apiToken)
  }
  
  // 加密 providers 中的 apiKey
  if (result.providers) {
    result.providers = result.providers.map(provider => ({
      ...provider,
      apiKey: provider.apiKey && !isEncrypted(provider.apiKey)
        ? encryptValue(provider.apiKey)
        : provider.apiKey
    }))
  }
  
  return result
}

/**
 * 加载配置（带缓存）
 * 配置会被缓存，避免频繁读取文件
 * 敏感信息会在加载时自动解密
 */
export function loadConfig(): BridgeConfig {
  const now = Date.now()
  
  // 如果缓存有效，直接返回
  if (cachedConfig && (now - configLoadedAt) < CONFIG_CACHE_TTL) {
    return cachedConfig
  }

  const configPath = getConfigPath()

  if (existsSync(configPath)) {
    try {
      const content = readFileSync(configPath, 'utf-8')
      const config = JSON.parse(content) as Partial<BridgeConfig>
      
      // 只在首次加载或缓存过期时打印日志
      if (!cachedConfig) {
        logger.info('配置文件已加载', { path: configPath })
      }
      
      // 解密敏感信息
      const decryptedConfig = decryptSensitiveFields(config)
      
      cachedConfig = { ...DEFAULT_CONFIG, ...decryptedConfig }
      configLoadedAt = now
      return cachedConfig
    } catch (error) {
      logger.error('配置文件解析失败，使用默认配置', { error })
    }
  } else {
    if (!cachedConfig) {
      logger.info('配置文件不存在，使用默认配置', { path: configPath })
    }
  }

  cachedConfig = DEFAULT_CONFIG
  configLoadedAt = now
  return cachedConfig
}

/**
 * 清除配置缓存
 * 在配置被修改后调用，强制下次读取时重新加载
 */
export function clearConfigCache(): void {
  cachedConfig = null
  configLoadedAt = 0
}

/**
 * 保存配置
 * 敏感信息会在保存时自动加密
 */
export function saveConfig(config: BridgeConfig): void {
  const configPath = getConfigPath()
  try {
    // 保存前加密敏感信息
    const encryptedConfig = encryptSensitiveFields(config)
    
    writeFileSync(configPath, JSON.stringify(encryptedConfig, null, 2), 'utf-8')
    // 保存后更新缓存（使用未加密的版本），避免下次读取时重新加载
    cachedConfig = config
    configLoadedAt = Date.now()
    logger.info('配置文件已保存', { path: configPath })
  } catch (error) {
    logger.error('配置文件保存失败', { error })
  }
}

/**
 * 从环境变量获取 MCP 服务器配置
 */
export function getMcpServersFromEnv(): McpServerConfig[] {
  const servers: McpServerConfig[] = []

  // 检查预定义的 MCP 服务器路径
  const mcpServerPaths = {
    word: process.env.WORD_MCP_SERVER_PATH,
    excel: process.env.EXCEL_MCP_SERVER_PATH,
    powerpoint: process.env.POWERPOINT_MCP_SERVER_PATH
  }

  for (const [name, path] of Object.entries(mcpServerPaths)) {
    if (path && existsSync(path)) {
      servers.push({
        id: `${name}-mcp-server`,
        name: `${name.charAt(0).toUpperCase() + name.slice(1)} MCP Server`,
        command: 'node',
        args: [path],
        enabled: true
      })
    }
  }

  return servers
}

/**
 * 自动发现 MCP 服务器
 */
export function discoverMcpServers(basePath: string): McpServerConfig[] {
  const servers: McpServerConfig[] = []
  const serverNames = ['word-mcp-server', 'excel-mcp-server', 'powerpoint-mcp-server']

  for (const name of serverNames) {
    const serverPath = join(basePath, name, 'dist', 'server.js')
    if (existsSync(serverPath)) {
      servers.push({
        id: name,
        name: name.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
        command: 'node',
        args: [serverPath],
        cwd: join(basePath, name),
        enabled: true
      })
      logger.info('发现 MCP 服务器', { name, path: serverPath })
    }
  }

  return servers
}
