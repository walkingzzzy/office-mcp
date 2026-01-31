import './index.css'
import '../styles/global.css'
import '../styles/index.css' // 引入主应用设计系统

import React from 'react'
import ReactDOM from 'react-dom/client'

import App from '../app/App'
import { AppProviders } from '../app/providers'
import { ErrorBoundary } from '../components/ErrorBoundary'
import { logger } from '../utils/logger'

// 声明全局变量类型
declare global {
  interface Window {
    __officeReadyPromise: Promise<{ host: Office.HostType; platform: Office.PlatformType }> | null
    __officeInfo: { host: Office.HostType; platform: Office.PlatformType } | null
  }
}

// 初始化全局错误捕获
logger.initGlobalErrorHandling()

logger.info('🚀 Office 插件 React 模块正在加载...')
logger.info(`📍 当前 URL: ${window.location.href}`)
logger.info(`🔍 Office 对象: ${typeof Office !== 'undefined' ? '已加载' : '未加载'}`)

// 渲染 React 应用的函数
function renderApp(officeInfo: { host: Office.HostType; platform: Office.PlatformType }) {
  logger.info('✅ 开始渲染 React 应用')
  logger.info(`📱 Office 应用: ${officeInfo.host}`)
  logger.info(`💻 平台: ${officeInfo.platform}`)

  const root = ReactDOM.createRoot(document.getElementById('root')!)
  root.render(
    <AppProviders>
      <ErrorBoundary>
        <App officeInfo={officeInfo} />
      </ErrorBoundary>
    </AppProviders>
  )
}

// 检查 Office.onReady 是否已经在 HTML 中注册并完成
if (window.__officeInfo) {
  // Office.onReady 已经完成，直接渲染
  logger.info('📌 Office.onReady 已完成，直接渲染')
  renderApp(window.__officeInfo)
} else if (window.__officeReadyPromise) {
  // Office.onReady 已注册但未完成，等待 Promise
  logger.info('⏳ 等待 Office.onReady Promise...')
  window.__officeReadyPromise
    .then((info) => {
      renderApp(info)
    })
    .catch((error) => {
      logger.error('❌ Office.onReady Promise 失败', error)
      const rootElement = document.getElementById('root')
      if (rootElement) {
        rootElement.innerHTML = `
          <div style="padding: 20px; color: red;">
            <h3>Office.js 初始化失败</h3>
            <p>${error.message || error}</p>
          </div>
        `
      }
    })
} else if (typeof Office !== 'undefined') {
  // 备用方案：如果 HTML 中的注册失败，在这里重新注册
  logger.warn('⚠️ HTML 中的 Office.onReady 未注册，使用备用方案')
  Office.onReady((info) => {
    renderApp(info)
  }).catch((error) => {
    logger.error('❌ Office.js 初始化失败', error)
    const rootElement = document.getElementById('root')
    if (rootElement) {
      rootElement.innerHTML = `
        <div style="padding: 20px; color: red;">
          <h3>Office.js 初始化失败</h3>
          <p>${error.message || error}</p>
        </div>
      `
    }
  })
} else {
  logger.error('❌ Office 对象未定义，可能是 Office.js 加载失败')
  const rootElement = document.getElementById('root')
  if (rootElement) {
    rootElement.innerHTML = `
      <div style="padding: 20px; color: red;">
        <h3>Office.js 加载失败</h3>
        <p>请确保在 Office 应用中打开此插件</p>
        <p>当前 URL: ${window.location.href}</p>
      </div>
    `
  }
}
