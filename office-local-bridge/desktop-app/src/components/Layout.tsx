/**
 * 布局组件 - AI 科技感设计
 * 包含侧边栏导航和主内容区
 * 支持响应式布局和主题切换
 */

import { ReactNode, useState } from 'react'
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Bot,
  Cpu,
  Server,
  Settings,
  Search,
  Database,
  Sparkles,
  Sun,
  Moon,
  Palette,
  Menu,
  X
} from 'lucide-react'
import clsx from 'clsx'
import { useTheme, themeColorOptions } from '../contexts/ThemeContext'

interface LayoutProps {
  children: ReactNode
}

const navItems = [
  { path: '/', icon: LayoutDashboard, label: '仪表盘' },
  { path: '/ai-config', icon: Bot, label: 'AI 服务' },
  { path: '/model-config', icon: Cpu, label: '模型管理' },
  { path: '/mcp-config', icon: Server, label: 'MCP 服务器' },
  { path: '/office-config', icon: Sparkles, label: 'Office 插件' },
  { path: '/search-config', icon: Search, label: '联网搜索' },
  { path: '/knowledge-config', icon: Database, label: '知识库' },
  { path: '/settings', icon: Settings, label: '系统设置' },
]

export default function Layout({ children }: LayoutProps) {
  const { theme, setTheme, toggleMode } = useTheme()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <div className="flex h-screen w-full cyber-grid-bg bg-theme-bg">
      {/* 移动端菜单按钮 */}
      <button
        className="lg:hidden fixed top-4 left-4 z-50 p-2.5 rounded-xl glass border border-theme-primary shadow-lg"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        aria-label="切换菜单"
      >
        {isMobileMenuOpen ? (
          <X className="w-5 h-5" style={{ color: `rgb(var(--color-text))` }} />
        ) : (
          <Menu className="w-5 h-5" style={{ color: `rgb(var(--color-text))` }} />
        )}
      </button>

      {/* 移动端遮罩层 */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30 backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* 侧边栏 */}
      <aside
        className={clsx(
          'fixed lg:relative inset-y-0 left-0 z-40 w-64 glass flex flex-col border-r border-theme-primary',
          'transform transition-transform duration-300 ease-in-out lg:transform-none',
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Logo */}
        <div className="h-20 flex items-center px-5 border-b border-theme-primary">
          <div className="flex items-center space-x-3">
            <div className="relative flex-shrink-0">
              <div className="w-11 h-11 rounded-xl bg-white/10 p-1.5 backdrop-blur-sm border border-white/20">
                <img
                  src="/logo.png"
                  alt="Logo"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="absolute -inset-1 rounded-xl blur-lg -z-10" style={{ backgroundColor: `rgba(var(--color-primary), 0.3)` }} />
            </div>
            <div>
              <span className="font-bold text-lg gradient-text">Office Bridge</span>
              <div className="flex items-center text-xs text-theme-muted">
                <Sparkles className="w-3 h-3 mr-1 text-theme-accent" style={{ color: `rgb(var(--color-accent))` }} />
                <span>AI 智能助手</span>
              </div>
            </div>
          </div>
        </div>

        {/* 主题切换 */}
        <div className="px-4 py-3 border-b border-theme-primary">
          <div className="flex items-center justify-between">
            {/* 明暗模式切换 */}
            <button
              onClick={toggleMode}
              className={clsx(
                'p-2.5 rounded-xl transition-all duration-200',
                'hover:bg-white/10 hover:scale-105 active:scale-95',
                theme.mode === 'light' ? 'bg-amber-500/10' : ''
              )}
              style={{ color: `rgb(var(--color-text-secondary))` }}
              title={theme.mode === 'dark' ? '切换到浅色模式' : '切换到深色模式'}
            >
              {theme.mode === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            {/* 主题色选择 - 增大点击区域 */}
            <div className="flex items-center space-x-1.5">
              <Palette className="w-4 h-4 mr-1" style={{ color: `rgb(var(--color-text-muted))` }} />
              {themeColorOptions.map((color) => (
                <button
                  key={color.value}
                  onClick={() => setTheme({ color: color.value })}
                  className={clsx(
                    'w-7 h-7 rounded-full transition-all duration-200 border-2',
                    theme.color === color.value
                      ? 'scale-110 border-white shadow-lg ring-2 ring-white/30'
                      : 'border-transparent hover:scale-110 opacity-70 hover:opacity-100'
                  )}
                  style={{
                    backgroundColor: color.preview,
                    boxShadow: theme.color === color.value ? `0 0 12px ${color.preview}` : undefined
                  }}
                  title={color.label}
                />
              ))}
            </div>
          </div>
        </div>

        {/* 导航菜单 */}
        <nav className="flex-1 py-6 px-4 overflow-y-auto">
          <ul className="space-y-1.5">
            {navItems.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    clsx(
                      'group relative flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300',
                      isActive
                        ? 'nav-active text-white'
                        : 'text-theme-secondary hover:text-theme hover:bg-white/5 border border-transparent'
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <div
                        className={clsx(
                          'p-2 rounded-lg mr-3 transition-all duration-300',
                          isActive
                            ? 'bg-white/20'
                            : 'bg-white/5 group-hover:bg-white/10'
                        )}
                        style={{
                          color: isActive ? `rgb(var(--color-primary))` : `rgb(var(--color-text-muted))`
                        }}
                      >
                        <item.icon className="w-4 h-4" />
                      </div>
                      <span className={isActive ? 'font-semibold' : ''}>{item.label}</span>
                      {isActive && (
                        <div
                          className="ml-auto w-2 h-2 rounded-full status-running"
                          style={{ backgroundColor: `rgb(var(--color-accent))` }}
                        />
                      )}
                    </>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* 底部状态 */}
        <div className="p-4 mx-4 mb-4 rounded-xl glass-light">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-2.5 h-2.5 rounded-full bg-green-500 mr-2 status-running" />
              <span className="text-sm text-theme-secondary">服务运行中</span>
            </div>
            <span className="text-xs px-2 py-1 rounded-full bg-green-500/10 text-green-400 border border-green-500/20">
              在线
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-theme-muted">
            <span>端口</span>
            <span className="font-mono" style={{ color: `rgb(var(--color-primary))` }}>3001</span>
          </div>
        </div>
      </aside>

      {/* 主内容区 */}
      <main className="flex-1 overflow-auto lg:ml-0">
        <div className="p-4 pt-16 sm:p-6 lg:p-8 lg:pt-8 min-h-full max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
}
