/**
 * 全局类型声明
 * 用于支持浏览器环境和 Office.js 的类型检查
 */

// 声明 window 对象（在 Node.js 环境中可能不存在）
declare const window: any | undefined

// 声明 Office 对象（Office.js 全局对象）
declare const Office: any | undefined
