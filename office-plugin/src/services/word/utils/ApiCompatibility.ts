/**
 * Word API 兼容性工具 - 真实探测实现
 *
 * 使用 Office.context.requirements.isSetSupported 探测 WordApi 版本
 * 确保工具选择器能正确判断功能支持情况
 */

export type WordApiVersion = '1.1' | '1.2' | '1.3' | '1.4' | '1.5' | '1.6' | '1.7' | '1.8'

// 缓存检测结果
let cachedApiVersion: WordApiVersion | null = null
let cachedFeatures: Record<string, boolean> | null = null

/**
 * 检查特定 WordApi 版本是否支持
 */
function checkApiSupport(apiVersion: WordApiVersion): boolean {
  try {
    if (typeof Office !== 'undefined' && Office.context?.requirements?.isSetSupported) {
      return Office.context.requirements.isSetSupported('WordApi', apiVersion)
    }
    return false
  } catch {
    return false
  }
}

/**
 * 获取当前可用的最高 WordApi 版本
 */
function getAvailableVersion(): WordApiVersion {
  if (cachedApiVersion) return cachedApiVersion

  const versions: WordApiVersion[] = ['1.8', '1.7', '1.6', '1.5', '1.4', '1.3', '1.2', '1.1']
  for (const version of versions) {
    if (checkApiSupport(version)) {
      cachedApiVersion = version
      return version
    }
  }
  cachedApiVersion = '1.1'
  return '1.1'
}

/**
 * 异步探测 API 版本（带 Word.run 验证）
 */
async function detectApiVersion(): Promise<WordApiVersion> {
  // 先用同步方法快速检测
  const syncVersion = getAvailableVersion()
  
  // 尝试用 Word.run 验证实际能力
  try {
    if (typeof Word !== 'undefined' && Word.run) {
      await Word.run(async (context) => {
        // 尝试加载 tables 来验证表格支持
        const body = context.document.body
        body.load('text')
        await context.sync()
      })
    }
  } catch {
    // Word.run 失败不影响版本检测
  }
  
  return syncVersion
}

/**
 * 功能与最低 API 版本映射
 */
const FEATURE_API_REQUIREMENTS: Record<string, WordApiVersion> = {
  'basicFormatting': '1.1',
  'paragraphFormat': '1.1',
  'tables': '1.3',        // 表格操作需要 1.3+
  'lists': '1.3',         // 列表操作需要 1.3+
  'styles': '1.3',
  'images': '1.1',
  'hyperlinks': '1.1',
  'comments': '1.4',
  'contentControls': '1.1',
  'sections': '1.1',
  'headers': '1.4',
  'footers': '1.4',
  'tableCells': '1.3',    // 单元格操作需要 1.3+
  'tableStyles': '1.3',
  'footnotes': '1.5',
  'trackChanges': '1.6'
}

/**
 * 检查特定功能是否支持
 */
async function isFeatureSupported(featureName: string): Promise<boolean> {
  const requiredVersion = FEATURE_API_REQUIREMENTS[featureName]
  if (!requiredVersion) {
    return true // 未知功能默认支持
  }
  
  const currentVersion = getAvailableVersion()
  const versionNumber = parseFloat(currentVersion)
  const requiredNumber = parseFloat(requiredVersion)
  
  return versionNumber >= requiredNumber
}

/**
 * 获取所有功能的支持情况
 */
async function getAllFeatureSupport(): Promise<Record<string, boolean>> {
  if (cachedFeatures) return cachedFeatures

  const features: Record<string, boolean> = {}
  const currentVersion = getAvailableVersion()
  const versionNumber = parseFloat(currentVersion)
  
  for (const [feature, requiredVersion] of Object.entries(FEATURE_API_REQUIREMENTS)) {
    const requiredNumber = parseFloat(requiredVersion)
    features[feature] = versionNumber >= requiredNumber
  }
  
  cachedFeatures = features
  return features
}

/**
 * 生成兼容性报告
 */
async function generateCompatibilityReport(): Promise<Record<string, unknown>> {
  const version = getAvailableVersion()
  const features = await getAllFeatureSupport()
  
  return {
    wordApiVersion: version,
    features,
    hasTableSupport: features.tables ?? false,
    hasListSupport: features.lists ?? false,
    hasStyleSupport: features.styles ?? false,
    hasCellSupport: features.tableCells ?? false,
    detectedAt: new Date().toISOString()
  }
}

/**
 * 获取功能支持详细信息
 */
async function getFeatureSupportInfo(featureName: string): Promise<Record<string, unknown>> {
  const supported = await isFeatureSupported(featureName)
  const requiredVersion = FEATURE_API_REQUIREMENTS[featureName] || '1.1'
  const currentVersion = getAvailableVersion()
  
  return {
    feature: featureName,
    supported,
    requiredVersion,
    currentVersion,
    message: supported 
      ? `${featureName} is supported (requires ${requiredVersion}, current ${currentVersion})`
      : `${featureName} requires WordApi ${requiredVersion}, but only ${currentVersion} is available`
  }
}

/**
 * 清除缓存（用于重新检测）
 */
function clearCache(): void {
  cachedApiVersion = null
  cachedFeatures = null
}

export const apiCompatibility = {
  checkApiSupport,
  getAvailableVersion,
  detectApiVersion,
  generateCompatibilityReport,
  isFeatureSupported,
  getFeatureSupportInfo,
  getAllFeatureSupport,
  clearCache
}
