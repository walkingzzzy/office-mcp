/**
 * useConnection Hook
 * 提供连接状态检测的 React Hook 接口
 * 
 * @updated 2025-12-29 - 实现指数退避策略 (修复 P8)
 */

import { useEffect, useRef, useCallback } from 'react'

import { useConfigStore } from '../store/configStore'

/**
 * 连接状态检测配置
 */
interface UseConnectionOptions {
  /**
   * 初始心跳检测间隔（毫秒）
   * @default 5000 (5秒)
   */
  interval?: number

  /**
   * 最大心跳检测间隔（毫秒）- 用于指数退避
   * @default 60000 (60秒)
   */
  maxInterval?: number

  /**
   * 是否启用自动检测
   * @default true
   */
  enabled?: boolean

  /**
   * 连接状态变化回调
   */
  onConnectionChange?: (connected: boolean) => void

  /**
   * 是否启用指数退避
   * @default true
   */
  useExponentialBackoff?: boolean
}

/**
 * 连接状态检测 Hook
 * 
 * 特性：
 * - 指数退避：连接正常时逐渐增加检测间隔，减少网络开销
 * - 快速恢复：连接断开时立即恢复到初始间隔，快速检测恢复
 *
 * @example
 * ```tsx
 * const { connected, checkNow } = useConnection({
 *   interval: 5000,
 *   maxInterval: 60000,
 *   onConnectionChange: (connected) => {
 *     console.log('Connection status:', connected)
 *   }
 * })
 * ```
 */
export function useConnection(options: UseConnectionOptions = {}) {
  const { 
    interval = 5000, 
    maxInterval = 60000,
    enabled = true, 
    onConnectionChange,
    useExponentialBackoff = true
  } = options

  const { connected, checkConnection } = useConfigStore()
  const previousConnected = useRef<boolean>(connected)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const currentIntervalRef = useRef<number>(interval)
  const consecutiveSuccessRef = useRef<number>(0)

  // 计算下一次检测间隔（指数退避）
  const getNextInterval = useCallback((wasSuccessful: boolean): number => {
    if (!useExponentialBackoff) {
      return interval
    }

    if (wasSuccessful) {
      // 连接成功：逐渐增加间隔（每次成功后增加 50%，最大不超过 maxInterval）
      consecutiveSuccessRef.current++
      if (consecutiveSuccessRef.current >= 3) {
        // 连续成功 3 次后开始增加间隔
        const newInterval = Math.min(
          currentIntervalRef.current * 1.5,
          maxInterval
        )
        return newInterval
      }
      return currentIntervalRef.current
    } else {
      // 连接失败：立即恢复到初始间隔
      consecutiveSuccessRef.current = 0
      return interval
    }
  }, [interval, maxInterval, useExponentialBackoff])

  // 执行检测并调度下一次
  const scheduleNextCheck = useCallback(async () => {
    await checkConnection()
    // 检测后从 store 获取最新的连接状态
    const isConnected = useConfigStore.getState().connected
    const nextInterval = getNextInterval(isConnected)
    currentIntervalRef.current = nextInterval

    timeoutRef.current = setTimeout(() => {
      scheduleNextCheck()
    }, nextInterval)
  }, [checkConnection, getNextInterval])

  // 监听连接状态变化
  useEffect(() => {
    if (previousConnected.current !== connected && onConnectionChange) {
      onConnectionChange(connected)
      previousConnected.current = connected

      // 连接状态变化时重置退避
      if (!connected) {
        currentIntervalRef.current = interval
        consecutiveSuccessRef.current = 0
      }
    }
  }, [connected, onConnectionChange, interval])

  // 启动心跳检测
  useEffect(() => {
    if (!enabled) {
      return
    }

    // 重置状态
    currentIntervalRef.current = interval
    consecutiveSuccessRef.current = 0

    // 立即执行一次检测并开始调度
    scheduleNextCheck()

    // 清理函数
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
    }
  }, [enabled, interval, scheduleNextCheck])

  // 手动检查（重置退避）
  const checkNow = useCallback(async () => {
    // 清除当前调度
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    
    // 重置退避状态
    currentIntervalRef.current = interval
    consecutiveSuccessRef.current = 0
    
    // 立即检查并重新调度
    await scheduleNextCheck()
  }, [interval, scheduleNextCheck])

  return {
    /**
     * 当前连接状态
     */
    connected,

    /**
     * 立即检查连接状态（重置退避）
     */
    checkNow,

    /**
     * 当前检测间隔（毫秒）
     */
    currentInterval: currentIntervalRef.current,

    /**
     * 连接状态文本
     */
    statusText: connected ? '已连接' : '未连接',

    /**
     * 连接状态颜色（用于 UI）
     */
    statusColor: (connected ? 'success' : 'warning') as 'success' | 'warning'
  }
}

/**
 * 导出默认 Hook
 */
export default useConnection
