import './index.css'
import '../styles/global.css'
import '../styles/index.css' // 引入主应用设计系统

import React from 'react'
import ReactDOM from 'react-dom/client'

import App from '../app/App'
import { AppProviders } from '../app/providers'
import { ErrorBoundary } from '../components/ErrorBoundary'
import { logger } from '../utils/logger'

// 初始化全局错误捕获
logger.initGlobalErrorHandling()

logger.info('🚀 Office 插件正在加载...')
logger.info(`📍 当前 URL: ${window.location.href}`)
logger.info(`🔍 Office 对象: ${typeof Office !== 'undefined' ? '已加载' : '未加载'}`)

// 显示加载提示
const rootElement = document.getElementById('root')
if (rootElement) {
  rootElement.innerHTML = '<div style="padding: 20px; text-align: center;">正在初始化 Office.js...</div>'
}

// 等待 Office.js 初始化
if (typeof Office !== 'undefined') {
  logger.info('⏳ 等待 Office.js 初始化...')

  Office.onReady((info) => {
    logger.info('✅ Office.js 已初始化')
    logger.info(`📱 Office 应用: ${info.host}`)
    logger.info(`💻 平台: ${info.platform}`)

    // 渲染 React 应用
    const root = ReactDOM.createRoot(document.getElementById('root')!)
    root.render(
      // 暂时禁用 StrictMode 以排查问题
      // <React.StrictMode>
      <AppProviders>
        <ErrorBoundary>
          <App officeInfo={info} />
        </ErrorBoundary>
      </AppProviders>
      // </React.StrictMode>
    )
  }).catch((error) => {
    logger.error('❌ Office.js 初始化失败', error)
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
