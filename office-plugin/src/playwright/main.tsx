import React, { useMemo, useState } from 'react'
import ReactDOM from 'react-dom/client'

import '../taskpane/index.css'
import '../styles/global.css'
import '../styles/index.css'

import { Inputbar } from '../components/input/Inputbar'
import { ConversationSidebar } from '../components/organisms/ConversationSidebar'
import type { Conversation } from '../services/conversation'

const knowledgeBases = [
  { id: 'kb-1', name: '教案知识库', itemCount: 12 },
  { id: 'kb-2', name: '题库知识库', itemCount: 8 },
]

const mcpServers = [
  { id: 'mcp-1', name: '通用工具集', description: '包含翻译与抽取工具' },
  { id: 'mcp-2', name: 'Office 工具集', description: '面向 Word/Excel 的操作' },
]

const seedConversations: Conversation[] = [
  {
    id: 'conv-1',
    title: '课程设计讨论',
    messages: [],
    createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    favorite: true,
  },
  {
    id: 'conv-2',
    title: '自动生成教案',
    messages: [],
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    favorite: false,
  },
]

function HarnessApp() {
  const [value, setValue] = useState('')
  const [selectedKnowledge, setSelectedKnowledge] = useState<string[]>([])
  const [selectedMcpTools, setSelectedMcpTools] = useState<string[]>([])
  const [webSearchEnabled, setWebSearchEnabled] = useState(false)
  const [webSearchProviderId, setWebSearchProviderId] = useState<string | undefined>(undefined)
  const [conversations, setConversations] = useState<Conversation[]>(seedConversations)
  const [currentConversationId, setCurrentConversationId] = useState<string>('conv-1')

  const selectedConversation = useMemo(
    () => conversations.find((conv) => conv.id === currentConversationId),
    [conversations, currentConversationId],
  )

  return (
    <div className="flex min-h-screen w-full flex-col gap-6 bg-slate-950/60 p-6 text-white">
      <header>
        <p className="text-sm text-slate-300">Playwright UI Harness</p>
        <h1 className="text-2xl font-semibold text-white">输入区与收藏逻辑自动化测试</h1>
      </header>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-xl">
          <h2 className="mb-4 text-lg font-medium text-white/90">Inputbar 交互</h2>
          <Inputbar
            className="bg-transparent"
            value={value}
            onChange={setValue}
            onSubmit={() => setValue('')}
            knowledgeBases={knowledgeBases}
            selectedKnowledgeBases={selectedKnowledge}
            onKnowledgeBasesChange={setSelectedKnowledge}
            mcpServers={mcpServers}
            selectedMCPTools={selectedMcpTools}
            onMCPToolsChange={setSelectedMcpTools}
            webSearchEnabled={webSearchEnabled}
            webSearchProviderId={webSearchProviderId}
            onWebSearchChange={(enabled, providerId) => {
              setWebSearchEnabled(enabled)
              setWebSearchProviderId(providerId)
            }}
          />
        </div>

        <div className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-xl">
          <h2 className="text-lg font-medium text-white/90">收藏逻辑</h2>
          <div className="flex flex-wrap gap-2 text-sm text-slate-300">
            <span>当前对话：</span>
            <strong className="text-white">{selectedConversation?.title ?? '无'}</strong>
          </div>
          <ConversationSidebar
            inline
            open
            conversations={conversations}
            currentConversationId={currentConversationId}
            onOpenChange={() => undefined}
            onCreateConversation={() => {
              const newConv: Conversation = {
                id: `conv-${Date.now()}`,
                title: '新建对话',
                messages: [],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                favorite: false,
              }
              setConversations((prev) => [newConv, ...prev])
              setCurrentConversationId(newConv.id)
            }}
            onSelectConversation={(id) => setCurrentConversationId(id)}
            onDeleteConversation={(id) =>
              setConversations((prev) => prev.filter((conv) => conv.id !== id))
            }
            onToggleFavorite={(id, next) =>
              setConversations((prev) =>
                prev.map((conv) => (conv.id === id ? { ...conv, favorite: next } : conv)),
              )
            }
          />
        </div>
      </section>
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <HarnessApp />
  </React.StrictMode>,
)
