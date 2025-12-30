/**
 * Fluent UI 主题配置
 * 将武汉问津品牌色映射到 Fluent UI Token 系统
 */

import {
  type BrandVariants,
  createDarkTheme,
  createLightTheme,
  type Theme} from '@fluentui/react-components'

// 武汉问津品牌色
const brandColors: BrandVariants = {
  10: '#F5FDF9',
  20: '#E6FAF1',
  30: '#D1F7E6',
  40: '#B3F2D7',
  50: '#8CEDC3',
  60: '#5EE6AA',
  70: '#00b96b',  // 主品牌色
  80: '#009a5b',
  90: '#00804d',
  100: '#006640',
  110: '#005034',
  120: '#003D28',
  130: '#002D1E',
  140: '#001F15',
  150: '#00140D',
  160: '#000905'
}

/**
 * 浅色主题 (Light Theme)
 */
export const wuhanwenjinLightTheme: Theme = createLightTheme(brandColors)

/**
 * 深色主题 (Dark Theme)
 */
export const wuhanwenjinDarkTheme: Theme = createDarkTheme(brandColors)

/**
 * 默认导出浅色主题
 */
export default wuhanwenjinLightTheme
