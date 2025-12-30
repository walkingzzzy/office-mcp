/**
 * IndexedDBKeyStore 单元测试
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { storeKey, retrieveKey, deleteKey, hasKey } from './IndexedDBKeyStore'

describe('IndexedDBKeyStore', () => {
  // 测试用的 JWK 密钥
  const testJwk: JsonWebKey = {
    kty: 'oct',
    k: 'test-key-data',
    alg: 'A256GCM',
    ext: true,
    key_ops: ['encrypt', 'decrypt']
  }

  beforeEach(async () => {
    // 清理测试数据
    try {
      await deleteKey()
    } catch {
      // 忽略删除失败
    }
  })

  afterEach(async () => {
    // 清理测试数据
    try {
      await deleteKey()
    } catch {
      // 忽略删除失败
    }
  })

  it('应该能够存储密钥', async () => {
    await storeKey(testJwk)
    const hasKeyResult = await hasKey()
    expect(hasKeyResult).toBe(true)
  })

  it('应该能够读取存储的密钥', async () => {
    await storeKey(testJwk)
    const retrievedKey = await retrieveKey()
    expect(retrievedKey).toEqual(testJwk)
  })

  it('应该在密钥不存在时返回 null', async () => {
    const retrievedKey = await retrieveKey()
    expect(retrievedKey).toBeNull()
  })

  it('应该能够删除密钥', async () => {
    await storeKey(testJwk)
    await deleteKey()
    const hasKeyResult = await hasKey()
    expect(hasKeyResult).toBe(false)
  })

  it('应该能够覆盖已存在的密钥', async () => {
    await storeKey(testJwk)

    const newJwk: JsonWebKey = {
      ...testJwk,
      k: 'new-key-data'
    }

    await storeKey(newJwk)
    const retrievedKey = await retrieveKey()
    expect(retrievedKey).toEqual(newJwk)
  })

  it('hasKey 应该在密钥存在时返回 true', async () => {
    await storeKey(testJwk)
    const result = await hasKey()
    expect(result).toBe(true)
  })

  it('hasKey 应该在密钥不存在时返回 false', async () => {
    const result = await hasKey()
    expect(result).toBe(false)
  })
})
