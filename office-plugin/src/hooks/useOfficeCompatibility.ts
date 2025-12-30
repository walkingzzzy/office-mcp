/**
 * Office 兼容性检测 Hook
 * 在应用启动时检测 Office API 版本和功能支持
 * 
 * @updated 2025-12-29 - 统一错误处理 (修复 P2)
 */

import { useEffect,useState } from 'react'

import type { WordApiVersion } from '../services/word/utils/ApiCompatibility'
import { apiCompatibility } from '../services/word/utils/ApiCompatibility'
import Logger from '../utils/logger'

const logger = new Logger('useOfficeCompatibility')

interface OfficeCompatibilityState {
  isInitialized: boolean
  isLoading: boolean
  error: string | null
  
  // Office 环境信息
  hostType: string
  platform: string
  officeVersion: string | undefined
  wordApiVersion: WordApiVersion | null
  
  // 功能支持状态
  featuresSupported: {
    basicFormatting: boolean
    paragraphFormat: boolean
    tables: boolean
    lists: boolean
    styles: boolean
    trackChanges: boolean
  }
  
  // 需要降级的功能
  featuresNeedingFallback: string[]
  
  // 兼容性报告
  compatibilityReport: any | null
}

export function useOfficeCompatibility() {
  const [state, setState] = useState<OfficeCompatibilityState>({
    isInitialized: false,
    isLoading: true,
    error: null,
    hostType: 'Unknown',
    platform: 'Unknown',
    officeVersion: undefined,
    wordApiVersion: null,
    featuresSupported: {
      basicFormatting: false,
      paragraphFormat: false,
      tables: false,
      lists: false,
      styles: false,
      trackChanges: false
    },
    featuresNeedingFallback: [],
    compatibilityReport: null
  })

  useEffect(() => {
    initializeCompatibilityCheck()
  }, [])

  const initializeCompatibilityCheck = async () => {
    try {
      logger.info('开始 Office 兼容性检测')
      
      // 检查 Office 环境
      if (typeof Office === 'undefined') {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: 'Office.js 未加载，请在 Office 应用中打开此插件',
          isInitialized: true
        }))
        return
      }

      // 获取 Office 环境信息
      const hostType = Office.context?.host || 'Unknown'
      const platform = Office.context?.diagnostics?.platform || 'Unknown'
      const officeVersion = Office.context?.diagnostics?.version

      logger.info('Office 环境信息', {
        hostType,
        platform,
        officeVersion: officeVersion || 'Unknown'
      })

      // 只对 Word 进行深度兼容性检测
      let wordApiVersion: WordApiVersion | null = null
      let compatibilityReport = null
      const featuresSupported = { ...state.featuresSupported }
      const featuresNeedingFallback: string[] = []

      if (hostType === Office.HostType.Word) {
        try {
          // 检测 Word API 版本
          wordApiVersion = await apiCompatibility.detectApiVersion()
          logger.info('Word API 版本检测完成', { wordApiVersion })

          // 生成兼容性报告
          compatibilityReport = await apiCompatibility.generateCompatibilityReport()
          logger.debug('兼容性报告', { compatibilityReport })

          // 检查各个功能的支持状态
          const features = [
            { name: 'contentControl', key: 'basicFormatting' as keyof typeof featuresSupported },
            { name: 'paragraphFormat', key: 'paragraphFormat' as keyof typeof featuresSupported },
            { name: 'table', key: 'tables' as keyof typeof featuresSupported },
            { name: 'list', key: 'lists' as keyof typeof featuresSupported },
            { name: 'style', key: 'styles' as keyof typeof featuresSupported },
            { name: 'trackChanges', key: 'trackChanges' as keyof typeof featuresSupported }
          ]

          for (const feature of features) {
            const isSupported = await apiCompatibility.isFeatureSupported(feature.name)
            featuresSupported[feature.key] = isSupported
            
            if (!isSupported) {
              const info = await apiCompatibility.getFeatureSupportInfo(feature.name)
              if (info.needsFallback) {
                featuresNeedingFallback.push(feature.name)
              }
            }
          }

          logger.info('功能支持状态检测完成', {
            featuresSupported,
            featuresNeedingFallback
          })

        } catch (error) {
          logger.warn('Word API 兼容性检测失败', { error })
          // 设置基本格式化功能为默认支持
          featuresSupported.basicFormatting = true
        }
      } else {
        // 非 Word 应用，启用基本格式化
        featuresSupported.basicFormatting = true
        logger.info('非 Word 应用，使用基础功能模式')
      }

      setState({
        isInitialized: true,
        isLoading: false,
        error: null,
        hostType: hostType as string,
        platform: platform as string,
        officeVersion,
        wordApiVersion,
        featuresSupported,
        featuresNeedingFallback,
        compatibilityReport
      })

      logger.info('Office 兼容性检测完成')

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知错误'
      logger.error('Office 兼容性检测失败', { error })
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: `兼容性检测失败: ${errorMessage}`,
        isInitialized: true
      }))
    }
  }

  const retryCompatibilityCheck = () => {
    setState(prev => ({
      ...prev,
      isLoading: true,
      error: null
    }))
    initializeCompatibilityCheck()
  }

  const isFeatureSupported = (featureName: string): boolean => {
    const featureKey = featureName as keyof typeof state.featuresSupported
    return state.featuresSupported[featureKey] || false
  }

  const getCompatibilityLevel = (): 'full' | 'partial' | 'basic' => {
    if (!state.isInitialized || state.error) return 'basic'
    
    const supportedFeatures = Object.values(state.featuresSupported).filter(Boolean).length
    const totalFeatures = Object.keys(state.featuresSupported).length
    
    if (supportedFeatures === totalFeatures) return 'full'
    if (supportedFeatures >= totalFeatures / 2) return 'partial'
    return 'basic'
  }

  return {
    ...state,
    retryCompatibilityCheck,
    isFeatureSupported,
    getCompatibilityLevel
  }
}