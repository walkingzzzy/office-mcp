/**
 * 加密工具模块
 * 提供敏感信息（API 密钥等）的加密和解密功能
 */

import crypto from 'node:crypto'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

// 加密值前缀，用于识别是否已加密
const ENCRYPTED_PREFIX = 'enc:'

// 密钥存储路径
const KEY_DIR = path.join(os.homedir(), '.office-local-bridge')
const KEY_FILE = path.join(KEY_DIR, 'encryption.key')

// 缓存的密钥
let cachedKey: Buffer | null = null

/**
 * 获取加密密钥
 * 首次运行时生成随机密钥并持久化存储，后续运行时读取已存储的密钥
 */
function getEncryptionKey(): Buffer {
  if (cachedKey) {
    return cachedKey
  }

  try {
    // 尝试读取已存储的密钥
    if (fs.existsSync(KEY_FILE)) {
      cachedKey = fs.readFileSync(KEY_FILE)
      if (cachedKey.length === 32) {
        return cachedKey
      }
    }
  } catch {
    // 读取失败，将生成新密钥
  }

  // 生成新的随机密钥
  cachedKey = crypto.randomBytes(32)

  try {
    // 确保目录存在
    if (!fs.existsSync(KEY_DIR)) {
      fs.mkdirSync(KEY_DIR, { recursive: true, mode: 0o700 })
    }
    // 保存密钥，设置仅用户可读写权限
    fs.writeFileSync(KEY_FILE, cachedKey, { mode: 0o600 })
  } catch (error) {
    console.error('保存加密密钥失败:', error)
  }

  return cachedKey
}

/**
 * 加密敏感值
 * 使用 AES-256-GCM 算法进行加密
 * @param value - 要加密的明文值
 * @returns 加密后的字符串（带有 enc: 前缀）
 */
export function encryptValue(value: string): string {
  if (!value || value.length === 0) {
    return value
  }

  // 如果已经是加密格式，直接返回
  if (isEncrypted(value)) {
    return value
  }

  try {
    const key = getEncryptionKey()
    const iv = crypto.randomBytes(16)
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv)

    let encrypted = cipher.update(value, 'utf8', 'base64')
    encrypted += cipher.final('base64')

    const authTag = cipher.getAuthTag()

    // 格式: enc:<iv>:<authTag>:<encrypted>
    const result = `${ENCRYPTED_PREFIX}${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted}`
    return result
  } catch (error) {
    // 加密失败时返回原值，避免数据丢失
    console.error('加密失败:', error)
    return value
  }
}

/**
 * 解密敏感值
 * @param encrypted - 加密后的字符串（带有 enc: 前缀）
 * @returns 解密后的明文值
 */
export function decryptValue(encrypted: string): string {
  if (!encrypted || encrypted.length === 0) {
    return encrypted
  }

  // 如果不是加密格式，直接返回（向后兼容）
  if (!isEncrypted(encrypted)) {
    return encrypted
  }

  try {
    const key = getEncryptionKey()

    // 解析加密格式: enc:<iv>:<authTag>:<encrypted>
    const data = encrypted.slice(ENCRYPTED_PREFIX.length)
    const parts = data.split(':')

    if (parts.length !== 3) {
      // 格式不正确，返回原值
      return encrypted
    }

    const iv = Buffer.from(parts[0], 'base64')
    const authTag = Buffer.from(parts[1], 'base64')
    const encryptedData = parts[2]

    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv)
    decipher.setAuthTag(authTag)

    let decrypted = decipher.update(encryptedData, 'base64', 'utf8')
    decrypted += decipher.final('utf8')

    return decrypted
  } catch (error) {
    // 解密失败时返回原值（可能是未加密的旧数据）
    console.error('解密失败，可能是未加密的数据:', error)
    return encrypted
  }
}

/**
 * 检查值是否已加密
 * @param value - 要检查的值
 * @returns 是否为加密格式
 */
export function isEncrypted(value: string): boolean {
  if (!value || typeof value !== 'string') {
    return false
  }
  return value.startsWith(ENCRYPTED_PREFIX)
}

/**
 * 确保值被加密（如果尚未加密）
 * @param value - 可能已加密或未加密的值
 * @returns 加密后的值
 */
export function ensureEncrypted(value: string): string {
  if (!value || value.length === 0) {
    return value
  }
  if (isEncrypted(value)) {
    return value
  }
  return encryptValue(value)
}

/**
 * 确保值被解密（如果已加密）
 * @param value - 可能已加密或未加密的值
 * @returns 解密后的值
 */
export function ensureDecrypted(value: string): string {
  if (!value || value.length === 0) {
    return value
  }
  if (!isEncrypted(value)) {
    return value
  }
  return decryptValue(value)
}
