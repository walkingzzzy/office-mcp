/**
 * useOfficeContext Hook
 * 处理 Office 应用检测、版本信息收集等上下文逻辑
 * 
 * 🆕 集成 Adapter 架构：
 * - 检测到应用类型后自动设置活跃 Adapter
 * - 初始化对应的 Adapter
 */

import { useEffect, useState, useCallback } from 'react'

import { 
  setActiveApp, 
  getAdapter, 
  adapterRegistry,
  type IOfficeAppAdapter 
} from '../../../../services/adapters'
import Logger from '../../../../utils/logger'

const logger = new Logger('useOfficeContext')

export type OfficeApp = 'word' | 'excel' | 'powerpoint' | 'none'

export interface UseOfficeContextReturn {
  /** 当前 Office 应用类型 */
  currentOfficeApp: OfficeApp
  /** Office 是否可用 */
  isOfficeAvailable: boolean
  /** 是否正在检测 */
  isDetecting: boolean
  /** 🆕 当前应用的 Adapter */
  adapter: IOfficeAppAdapter | undefined
  /** 🆕 获取选区上下文 */
  getSelectionContext: () => Promise<any>
}

export function useOfficeContext(): UseOfficeContextReturn {
  const [currentOfficeApp, setCurrentOfficeApp] = useState<OfficeApp>('none')
  const [isDetecting, setIsDetecting] = useState(true)

  // 检测当前 Office 应用并记录版本信息
  useEffect(() => {
    const detectOffice = async () => {
      setIsDetecting(true)

      try {
        if (typeof Office !== 'undefined' && Office.context && Office.context.host) {
          const host = Office.context.host

          // 检测应用类型
          if (host === Office.HostType.Word) {
            setCurrentOfficeApp('word')
            logger.info('Detected Office app: Word')
          } else if (host === Office.HostType.Excel) {
            setCurrentOfficeApp('excel')
            logger.info('Detected Office app: Excel')
          } else if (host === Office.HostType.PowerPoint) {
            setCurrentOfficeApp('powerpoint')
            logger.info('Detected Office app: PowerPoint')
          } else {
            setCurrentOfficeApp('none')
            logger.info('Office app not recognized')
          }

          // 收集并记录 Office 版本信息
          try {
            const { getOfficeVersionInfo, logOfficeVersionInfo } = await import('../../../../utils/officeVersionInfo')
            const versionInfo = await getOfficeVersionInfo()
            logOfficeVersionInfo(versionInfo)
          } catch (error) {
            logger.warn('Failed to collect Office version info', { error })
          }
        } else {
          setCurrentOfficeApp('none')
          logger.info('Office not available')
        }
      } catch (error) {
        logger.error('Error detecting Office app', { error })
        setCurrentOfficeApp('none')
      } finally {
        setIsDetecting(false)
      }
    }

    detectOffice()
  }, [])

  // 🆕 当应用类型变化时，设置活跃的 Adapter
  useEffect(() => {
    if (currentOfficeApp !== 'none') {
      setActiveApp(currentOfficeApp)
      logger.info('Active adapter set', { appType: currentOfficeApp })
      
      // 初始化 Adapter
      const adapter = getAdapter(currentOfficeApp)
      if (adapter && !adapter.isAvailable) {
        adapter.initialize().catch(error => {
          logger.warn('Failed to initialize adapter', { appType: currentOfficeApp, error })
        })
      }
    }
  }, [currentOfficeApp])

  // 🆕 获取当前应用的 Adapter
  const adapter = getAdapter(currentOfficeApp)

  // 🆕 获取选区上下文的便捷方法
  const getSelectionContext = useCallback(async () => {
    if (!adapter) {
      return {
        hasSelection: false,
        selectionType: 'none',
        documentType: currentOfficeApp === 'none' ? 'word' : currentOfficeApp
      }
    }
    return adapter.getSelectionContext()
  }, [adapter, currentOfficeApp])

  return {
    currentOfficeApp,
    isOfficeAvailable: currentOfficeApp !== 'none',
    isDetecting,
    adapter,
    getSelectionContext
  }
}
