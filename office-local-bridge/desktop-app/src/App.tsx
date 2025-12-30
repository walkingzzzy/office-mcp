import { Routes, Route } from 'react-router-dom'
import { ThemeProvider } from './contexts/ThemeContext'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import AIConfig from './pages/AIConfig'
import ModelConfig from './pages/ModelConfig'
import McpConfig from './pages/McpConfig'
import SearchConfig from './pages/SearchConfig'
import KnowledgeConfig from './pages/KnowledgeConfig'
import OfficeConfig from './pages/OfficeConfig'
import Settings from './pages/Settings'

function App() {
  return (
    <ThemeProvider>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/ai-config" element={<AIConfig />} />
          <Route path="/model-config" element={<ModelConfig />} />
          <Route path="/mcp-config" element={<McpConfig />} />
          <Route path="/search-config" element={<SearchConfig />} />
          <Route path="/knowledge-config" element={<KnowledgeConfig />} />
          <Route path="/office-config" element={<OfficeConfig />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </Layout>
    </ThemeProvider>
  )
}

export default App
