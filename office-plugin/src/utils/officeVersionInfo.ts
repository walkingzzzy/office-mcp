/**
 * Office 版本信息工具
 * 收集和显示 Office 环境的详细信息
 */

import Logger from './logger'

const logger = new Logger('OfficeVersionInfo')

export interface OfficeVersionInfo {
  /** Office 主机类型 */
  hostType: string
  /** Office 平台 */
  platform: string
  /** 是否为 Office Online */
  isOnline: boolean
  /** Office 版本（如果可获取） */
  version?: string
  /** 支持的 API 集合 */
  supportedApis: {
    wordApi?: string
    excelApi?: string
    powerPointApi?: string
    outlookApi?: string
  }
  /** 诊断信息 */
  diagnostics: {
    officeInitialized: boolean
    contextAvailable: boolean
    requirementsAvailable: boolean
  }
}

/**
 * 获取 Office 版本信息
 */
export async function getOfficeVersionInfo(): Promise<OfficeVersionInfo> {
  const info: OfficeVersionInfo = {
    hostType: 'unknown',
    platform: 'unknown',
    isOnline: false,
    supportedApis: {},
    diagnostics: {
      officeInitialized: false,
      contextAvailable: false,
      requirementsAvailable: false
    }
  }

  try {
    if (typeof Office === 'undefined') {
      logger.warn('Office.js not loaded')
      return info
    }

    info.diagnostics.officeInitialized = true

    if (!Office.context) {
      logger.warn('Office.context not available')
      return info
    }

    info.diagnostics.contextAvailable = true

    // 获取主机类型
    if (Office.context.host) {
      switch (Office.context.host) {
        case Office.HostType.Word:
          info.hostType = 'Word'
          break
        case Office.HostType.Excel:
          info.hostType = 'Excel'
          break
        case Office.HostType.PowerPoint:
          info.hostType = 'PowerPoint'
          break
        case Office.HostType.Outlook:
          info.hostType = 'Outlook'
          break
        case Office.HostType.OneNote:
          info.hostType = 'OneNote'
          break
        case Office.HostType.Project:
          info.hostType = 'Project'
          break
        default:
          info.hostType = 'Other'
      }
    }

    // 获取平台
    if (Office.context.platform) {
      switch (Office.context.platform) {
        case Office.PlatformType.PC:
          info.platform = 'Windows'
          break
        case Office.PlatformType.Mac:
          info.platform = 'Mac'
          break
        case Office.PlatformType.OfficeOnline:
          info.platform = 'Office Online'
          info.isOnline = true
          break
        case Office.PlatformType.iOS:
          info.platform = 'iOS'
          break
        case Office.PlatformType.Android:
          info.platform = 'Android'
          break
        case Office.PlatformType.Universal:
          info.platform = 'Universal'
          break
        default:
          info.platform = 'Unknown'
      }
    }

    // 检查 Requirements API
    if (Office.context.requirements) {
      info.diagnostics.requirementsAvailable = true

      // 检测支持的 API 版本
      const apiVersions = [
        '1.1', '1.2', '1.3', '1.4', '1.5', '1.6', '1.7', '1.8'
      ]

      // Word API
      if (info.hostType === 'Word') {
        for (let i = apiVersions.length - 1; i >= 0; i--) {
          if (Office.context.requirements.isSetSupported('WordApi', apiVersions[i])) {
            info.supportedApis.wordApi = apiVersions[i]
            break
          }
        }
      }

      // Excel API
      if (info.hostType === 'Excel') {
        for (let i = apiVersions.length - 1; i >= 0; i--) {
          if (Office.context.requirements.isSetSupported('ExcelApi', apiVersions[i])) {
            info.supportedApis.excelApi = apiVersions[i]
            break
          }
        }
      }

      // PowerPoint API
      if (info.hostType === 'PowerPoint') {
        for (let i = apiVersions.length - 1; i >= 0; i--) {
          if (Office.context.requirements.isSetSupported('PowerPointApi', apiVersions[i])) {
            info.supportedApis.powerPointApi = apiVersions[i]
            break
          }
        }
      }
    }

    // 尝试获取诊断信息（如果可用）
    if (Office.context.diagnostics) {
      try {
        info.version = Office.context.diagnostics.version
      } catch (e) {
        logger.warn('Cannot get Office version from diagnostics')
      }
    }

    logger.info('Office version info collected', info)
    return info
  } catch (error) {
    logger.error('Failed to collect Office version info', { error })
    return info
  }
}

/**
 * 格式化版本信息为可读字符串
 */
export function formatOfficeVersionInfo(info: OfficeVersionInfo): string {
  const lines: string[] = []

  lines.push(`📱 Office 环境信息`)
  lines.push(`─────────────────────`)
  lines.push(`应用: ${info.hostType}`)
  lines.push(`平台: ${info.platform}${info.isOnline ? ' (在线版)' : ''}`)

  if (info.version) {
    lines.push(`版本: ${info.version}`)
  }

  if (info.supportedApis.wordApi) {
    lines.push(`WordApi: ${info.supportedApis.wordApi}`)
  }
  if (info.supportedApis.excelApi) {
    lines.push(`ExcelApi: ${info.supportedApis.excelApi}`)
  }
  if (info.supportedApis.powerPointApi) {
    lines.push(`PowerPointApi: ${info.supportedApis.powerPointApi}`)
  }

  lines.push(``)
  lines.push(`🔍 诊断信息`)
  lines.push(`─────────────────────`)
  lines.push(`Office.js: ${info.diagnostics.officeInitialized ? '✅' : '❌'}`)
  lines.push(`Office.context: ${info.diagnostics.contextAvailable ? '✅' : '❌'}`)
  lines.push(`Requirements API: ${info.diagnostics.requirementsAvailable ? '✅' : '❌'}`)

  return lines.join('\n')
}

/**
 * 检查是否支持 Track Changes API
 */
export function supportsTrackChanges(info: OfficeVersionInfo): boolean {
  if (info.hostType !== 'Word') {
    return false
  }

  if (!info.supportedApis.wordApi) {
    return false
  }

  // Track Changes 需要 WordApi 1.6+
  const version = parseFloat(info.supportedApis.wordApi)
  return version >= 1.6
}

/**
 * 将版本信息记录到控制台
 */
export function logOfficeVersionInfo(info: OfficeVersionInfo): void {
  logger.info('Office Version Info', { formattedInfo: formatOfficeVersionInfo(info) })
}
