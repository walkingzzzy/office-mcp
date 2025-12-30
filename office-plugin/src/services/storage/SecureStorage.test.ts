/**
 * SecureStorage 单元测试
 */

import { describe, it, expect, beforeEach } from 'vitest'

describe('SecureStorage', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('应该能够存储和读取数据', async () => {
    const { secureStorage } = await import('./SecureStorage')
    await secureStorage.setItem('test_key', 'test_value')
    const value = await secureStorage.getItem('test_key')
    expect(value).toBe('test_value')
  })

  it('应该在数据不存在时返回 null', async () => {
    const { secureStorage } = await import('./SecureStorage')
    const value = await secureStorage.getItem('non_existent')
    expect(value).toBeNull()
  })

  it('应该加密存储的数据', async () => {
    const { secureStorage } = await import('./SecureStorage')
    await secureStorage.setItem('test', 'sensitive')
    const raw = localStorage.getItem('office_plugin_secure_test')
    expect(raw).not.toBe('sensitive')
    expect(raw).toBeTruthy()
  })
})
