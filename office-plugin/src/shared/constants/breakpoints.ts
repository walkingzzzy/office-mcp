/**
 * 响应式断点常量
 * 基于 Office Add-in Taskpane 尺寸
 */

export const BREAKPOINTS = {
  xs: 320, // Excel/Word/PowerPoint 最小宽度
  sm: 350, // Office Web 典型宽度
  md: 400, // 用户调整后常见宽度
  lg: 600, // 舒适宽度
} as const

// 媒体查询辅助函数
export const mediaQuery = {
  xs: `@media (max-width: ${BREAKPOINTS.xs}px)`,
  sm: `@media (max-width: ${BREAKPOINTS.sm}px)`,
  md: `@media (max-width: ${BREAKPOINTS.md}px)`,
  lg: `@media (min-width: ${BREAKPOINTS.lg}px)`,
}
