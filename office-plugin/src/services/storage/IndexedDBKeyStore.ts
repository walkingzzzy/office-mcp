/**
 * IndexedDB 密钥存储
 * 使用 IndexedDB 安全存储加密密钥，比 localStorage 更安全
 */

const DB_NAME = 'office_plugin_secure_db'
const DB_VERSION = 1
const STORE_NAME = 'encryption_keys'
const KEY_ID = 'master_encryption_key'

/**
 * 打开 IndexedDB 数据库
 */
function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME)
      }
    }
  })
}

/**
 * 从 IndexedDB 存储密钥
 */
export async function storeKey(jwk: JsonWebKey): Promise<void> {
  const db = await openDatabase()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.put(jwk, KEY_ID)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve()
    transaction.oncomplete = () => db.close()
  })
}

/**
 * 从 IndexedDB 读取密钥
 */
export async function retrieveKey(): Promise<JsonWebKey | null> {
  const db = await openDatabase()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.get(KEY_ID)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result || null)
    transaction.oncomplete = () => db.close()
  })
}

/**
 * 从 IndexedDB 删除密钥
 */
export async function deleteKey(): Promise<void> {
  const db = await openDatabase()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.delete(KEY_ID)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve()
    transaction.oncomplete = () => db.close()
  })
}

/**
 * 检查密钥是否存在
 */
export async function hasKey(): Promise<boolean> {
  const key = await retrieveKey()
  return key !== null
}
