import { Routes, Route, Link, useLocation } from 'react-router-dom'
import { Settings, Cpu, Server, Search } from 'lucide-react'
import ProvidersPage from './pages/ProvidersPage'

const navItems = [
  { path: '/providers', label: 'AI 供应商', icon: Cpu },
  { path: '/models', label: '模型配置', icon: Settings },
  { path: '/mcp', label: 'MCP 服务器', icon: Server },
  { path: '/search', label: '联网搜索', icon: Search },
]

export default function App() {
  const location = useLocation()

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center h-14">
            <h1 className="text-lg font-semibold text-gray-800 mr-8">Office Local Bridge</h1>
            <div className="flex space-x-1">
              {navItems.map(({ path, label, icon: Icon }) => (
                <Link
                  key={path}
                  to={path}
                  className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    location.pathname === path
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-4 h-4 mr-1.5" />
                  {label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <Routes>
          <Route path="/" element={<ProvidersPage />} />
          <Route path="/providers" element={<ProvidersPage />} />
          <Route path="/models" element={<div className="text-gray-500">模型配置页面（开发中）</div>} />
          <Route path="/mcp" element={<div className="text-gray-500">MCP 服务器页面（开发中）</div>} />
          <Route path="/search" element={<div className="text-gray-500">联网搜索页面（开发中）</div>} />
        </Routes>
      </main>
    </div>
  )
}
