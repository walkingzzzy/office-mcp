/**
 * 安全存储服务
 * 使用 Web Crypto API 加密敏感数据（如 API Key）
 * 密钥存储在 IndexedDB 中，比 localStorage 更安全
 */

import { storeKey, retrieveKey, deleteKey } from './IndexedDBKeyStore'
import Logger from '../../utils/logger'

const logger = new Logger('SecureStorage')
const STORAGE_KEY_PREFIX = 'office_plugin_secure_'

/**
 * 生成加密密钥
 */
async function generateKey(): Promise<CryptoKey> {
  return crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  )
}

/**
 * 导出密钥为 JWK 格式
 */
async function exportKey(key: CryptoKey): Promise<JsonWebKey> {
  return crypto.subtle.exportKey('jwk', key)
}

/**
 * 从 JWK 格式导入密钥
 */
async function importKey(jwk: JsonWebKey): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'jwk',
    jwk,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  )
}

/**
 * 获取或创建加密密钥
 * 使用 IndexedDB 存储密钥，提供更好的安全性
 */
async function getOrCreateKey(): Promise<CryptoKey> {
  try {
    // 尝试从 IndexedDB 读取密钥
    const storedJwk = await retrieveKey()

    if (storedJwk) {
      try {
        return await importKey(storedJwk)
      } catch (error) {
        // 密钥损坏，记录错误并重新生成
        logger.error('加密密钥损坏，将重新生成', error)
        await deleteKey()
      }
    }

    // 生成新密钥并存储到 IndexedDB
    const key = await generateKey()
    const jwk = await exportKey(key)
    await storeKey(jwk)
    logger.info('已生成新的加密密钥')
    return key
  } catch (error) {
    logger.error('密钥管理失败', error)
    throw new Error('无法初始化加密密钥，请检查浏览器权限')
  }
}

/**
 * 加密数据
 */
async function encrypt(data: string, key: CryptoKey): Promise<string> {
  const encoder = new TextEncoder()
  const iv = crypto.getRandomValues(new Uint8Array(12))

  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoder.encode(data)
  )

  // 将 IV 和加密数据合并
  const combined = new Uint8Array(iv.length + encrypted.byteLength)
  combined.set(iv)
  combined.set(new Uint8Array(encrypted), iv.length)

  // 转换为 Base64
  return btoa(String.fromCharCode(...combined))
}

/**
 * 解密数据
 */
async function decrypt(encryptedData: string, key: CryptoKey): Promise<string> {
  // 从 Base64 解码
  const combined = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0))

  // 分离 IV 和加密数据
  const iv = combined.slice(0, 12)
  const data = combined.slice(12)

  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    data
  )

  const decoder = new TextDecoder()
  return decoder.decode(decrypted)
}

/**
 * 安全存储类
 */
class SecureStorage {
  private keyPromise: Promise<CryptoKey> | null = null

  /**
   * 获取加密密钥（懒加载）
   */
  private async getKey(): Promise<CryptoKey> {
    if (!this.keyPromise) {
      this.keyPromise = getOrCreateKey()
    }
    return this.keyPromise
  }

  /**
   * 安全存储数据
   */
  async setItem(key: string, value: string): Promise<void> {
    const cryptoKey = await this.getKey()
    const encrypted = await encrypt(value, cryptoKey)
    localStorage.setItem(STORAGE_KEY_PREFIX + key, encrypted)
  }

  /**
   * 安全读取数据
   */
  async getItem(key: string): Promise<string | null> {
    const encrypted = localStorage.getItem(STORAGE_KEY_PREFIX + key)
    if (!encrypted) return null

    try {
      const cryptoKey = await this.getKey()
      return await decrypt(encrypted, cryptoKey)
    } catch (error) {
      logger.error('解密失败', { key, error })
      // 解密失败时删除损坏的数据
      this.removeItem(key)
      return null
    }
  }

  /**
   * 删除数据
   */
  removeItem(key: string): void {
    localStorage.removeItem(STORAGE_KEY_PREFIX + key)
  }

  /**
   * 检查数据是否存在
   */
  hasItem(key: string): boolean {
    return localStorage.getItem(STORAGE_KEY_PREFIX + key) !== null
  }

  /**
   * 清除所有安全存储的数据
   */
  clear(): void {
    const keysToRemove: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key?.startsWith(STORAGE_KEY_PREFIX)) {
        keysToRemove.push(key)
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key))
  }

  /**
   * 重置加密密钥（会导致所有已加密数据无法解密）
   */
  async resetKey(): Promise<void> {
    try {
      await deleteKey()
      this.keyPromise = null
      this.clear()
      logger.info('加密密钥已重置')
    } catch (error) {
      logger.error('重置密钥失败', error)
      throw new Error('无法重置加密密钥')
    }
  }
}

export const secureStorage = new SecureStorage()
export default secureStorage
