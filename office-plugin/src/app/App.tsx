import { useEffect, useState, useMemo, useCallback } from 'react'

import { Button as FluentButton, Spinner, Text } from '../components/atoms'
import { GlobalBackground } from '../components/atoms/GlobalBackground'
import { ErrorBoundary } from '../components/ErrorBoundary'
import { ChatInterface } from '../components/features/chat'
import { ConversationSidebar } from '../components/organisms/ConversationSidebar'
import { TopBar } from '../components/layout'
import { useConfirmDialog } from '../hooks/useConfirmDialog'
import { useOfficeCompatibility } from '../hooks/useOfficeCompatibility'
import { useConversationStore } from '../store/conversationStore'
import { useConfig } from '../hooks/useConfig'
import { useConnection } from '../hooks/useConnection'
import { filterChatModels } from '../utils/modelFilters'
import Logger from '../utils/logger'

// 导入增强样式
import '../styles/enhanced.css'

const logger = new Logger('App')

interface AppProps {
  officeInfo: {
    host: Office.HostType
    platform: Office.PlatformType
  }
}

// 本地存储键
const STORAGE_KEY_DEFAULT_MODEL = 'wuhanwenjin_default_model'

function App({ officeInfo }: AppProps) {
  const [isReady, setIsReady] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showCompatibilityWarning, setShowCompatibilityWarning] = useState(false)
  const [selectedModelId, setSelectedModelId] = useState<string>(() => {
    // 从 localStorage 加载默认模型
    try {
      return localStorage.getItem(STORAGE_KEY_DEFAULT_MODEL) || ''
    } catch {
      return ''
    }
  })
  const [defaultModelId, setDefaultModelId] = useState<string>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY_DEFAULT_MODEL) || ''
    } catch {
      return ''
    }
  })

  // 使用确认对话框
  const { confirm, ConfirmDialog } = useConfirmDialog()

  // 使用 Office 兼容性检测
  const compatibility = useOfficeCompatibility()

  // 使用对话历史管理 Store
  const {
    conversations,
    currentConversationId,
    createConversation,
    selectConversation,
    deleteConversation,
    updateConversation,
    loadConversations,
    loading: conversationsLoading
  } = useConversationStore()

  // 初始化获取对话历史信息
  useEffect(() => {
    loadConversations()
  }, [loadConversations])

  // 确保有一个当前对话的ID，如果没有对话时自动创建一个
  useEffect(() => {
    if (conversationsLoading) return

    if (!currentConversationId) {
      if (conversations.length > 0) {
        selectConversation(conversations[0].id)
      } else {
        try {
          const newConversation = createConversation('新对话', selectedModelId)
          logger.info('Auto created default conversation', { id: newConversation.id })
        } catch (error) {
          logger.error('Failed to auto create conversation', { error })
        }
      }
    }
  }, [
    conversationsLoading,
    conversations,
    currentConversationId,
    createConversation,
    selectConversation,
    selectedModelId
  ])

  // 使用配置和连接
  const { models, providers, connected } = useConfig()
  const { connected: wsConnected } = useConnection()

  // 模型选项列表 - 只显示聊天模型
  const modelOptions = useMemo(() => {
    if (!models || !providers) return []
    
    // 过滤启用的提供商
    const enabledProviderIds = new Set(
      providers.filter(p => p.enabled !== false).map(p => p.id)
    )
    
    // 过滤聊天模型
    const chatModels = filterChatModels(
      models.filter(m => enabledProviderIds.has(m.providerId))
    )
    
    logger.debug('Filtered chat models', { filtered: chatModels.length, total: models.length })
    
    return chatModels.map(model => {
      const provider = providers.find(p => p.id === model.providerId)
      return {
        // 使用 providerId:id 格式，与 ChatInterface 验证逻辑一致
        id: `${model.providerId}:${model.id}`,
        name: model.name,
        provider: provider?.name || model.providerId || 'Unknown'
      }
    })
  }, [models, providers])

  // 设置默认模型
  useEffect(() => {
    if (modelOptions.length > 0 && !selectedModelId) {
      // 优先使用保存的默认模型
      const savedDefault = defaultModelId
      const modelExists = modelOptions.some(m => m.id === savedDefault)
      
      if (savedDefault && modelExists) {
        setSelectedModelId(savedDefault)
        logger.debug('Using saved default model', { modelId: savedDefault })
      } else {
        // 否则使用第一个模型
        setSelectedModelId(modelOptions[0].id)
        logger.debug('Using first available model', { modelId: modelOptions[0].id })
      }
    }
  }, [modelOptions, selectedModelId, defaultModelId])

  // 设为默认模型
  const handleSetDefaultModel = useCallback((modelId: string) => {
    try {
      localStorage.setItem(STORAGE_KEY_DEFAULT_MODEL, modelId)
      setDefaultModelId(modelId)
      logger.info('Default model saved', { modelId })
    } catch (e) {
      logger.error('Failed to save default model', { error: e })
    }
  }, [])

  useEffect(() => {
    logger.info('Component mounted')

    // 检测平台并添加 CSS 类
    const isMac = /Mac|iPhone|iPod|iPad/i.test(navigator.platform)
    const isOutlook = officeInfo.host === Office.HostType.Outlook

    if (isMac) {
      document.documentElement.classList.add('platform-mac')
    }

    if (isOutlook) {
      document.documentElement.classList.add('host-outlook')
    }

    // 等待兼容性检测完成
    if (compatibility.isInitialized && !compatibility.isLoading) {
      // 如果有兼容性问题，显示警告
      if (compatibility.error || compatibility.featuresNeedingFallback.length > 0) {
        setShowCompatibilityWarning(true)
      }

      // 模拟初始化延迟
      setTimeout(() => {
        logger.debug('Setting isReady to true')
        setIsReady(true)
      }, 500)
    }

    return () => {
      logger.debug('Component unmounting')
    }
  }, [
    compatibility.isInitialized,
    compatibility.isLoading,
    compatibility.error,
    compatibility.featuresNeedingFallback,
    officeInfo
  ])

  // 处理新建对话
  const handleCreateConversation = () => {
    const newConv = createConversation('新对话')
    logger.info('Created new conversation', { id: newConv.id })
  }

  // 处理选择对话
  const handleSelectConversation = (conversationId: string) => {
    selectConversation(conversationId)
    logger.debug('Selected conversation', { id: conversationId })
  }

  // 处理删除对话
  const handleDeleteConversation = async (conversationId: string) => {
    const confirmed = await confirm('确定要删除这个对话吗？')
    if (confirmed) {
      deleteConversation(conversationId)
      logger.info('Deleted conversation', { id: conversationId })
    }
  }

  if (!isReady) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <Spinner size="large" label="正在加载..." />
        <Text size={300} className="text-muted-foreground">初始化 Fluent UI...</Text>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen w-full overflow-hidden relative text-foreground">
      {/* 全局背景层 */}
      <GlobalBackground />
      
      {/* 顶部栏 - 使用新的 TopBar 组件 */}
      <TopBar
        models={modelOptions}
        selectedModelId={selectedModelId}
        defaultModelId={defaultModelId}
        onModelChange={setSelectedModelId}
        onSetDefault={handleSetDefaultModel}
        isConnected={connected && wsConnected}
        isLoading={!isReady}
        onMenuClick={() => setSidebarOpen(true)}
      />

      {/* 对话历史侧边栏 */}
      <ConversationSidebar
        open={sidebarOpen}
        onOpenChange={setSidebarOpen}
        conversations={conversations}
        currentConversationId={currentConversationId || undefined}
        onSelectConversation={handleSelectConversation}
        onCreateConversation={handleCreateConversation}
        onDeleteConversation={handleDeleteConversation}
        onToggleFavorite={(conversationId, next) => updateConversation(conversationId, { favorite: next })}
      />

      {/* 聊天界面 - 顶部栏已经是固定高度48px，不需要额外padding */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        <ErrorBoundary
          fallback={
            <div className="flex flex-col items-center justify-center h-full gap-4">
              <Text size={500} className="text-destructive">
                应用程序出现错误
              </Text>
              <Text size={300} className="text-muted-foreground">请刷新页面重试</Text>
              <FluentButton variant="default" onClick={() => window.location.reload()}>
                刷新页面
              </FluentButton>
            </div>
          }>
          <ChatInterface 
            selectedModelId={selectedModelId}
            onModelChange={setSelectedModelId}
          />
        </ErrorBoundary>
      </div>

      {/* 确认对话框 */}
      <ConfirmDialog />

      {/* 调试信息 - 仅开发环境且在 Office 环境中显示 */}
      {import.meta.env.DEV && officeInfo.host && officeInfo.host !== Office.HostType.Word && (
        <div className="fixed top-[60px] right-2 p-2 bg-content2 rounded-lg text-xs opacity-70 pointer-events-none z-[1000]">
          {getHostName(officeInfo.host)} • {getPlatformName(officeInfo.platform)}
        </div>
      )}
    </div>
  )
}

// 辅助函数
function getHostName(host: Office.HostType): string {
  switch (host) {
    case Office.HostType.Word:
      return 'Word'
    case Office.HostType.Excel:
      return 'Excel'
    case Office.HostType.PowerPoint:
      return 'PowerPoint'
    case Office.HostType.Outlook:
      return 'Outlook'
    default:
      return '未知'
  }
}

function getPlatformName(platform: Office.PlatformType): string {
  switch (platform) {
    case Office.PlatformType.PC:
      return 'Windows'
    case Office.PlatformType.Mac:
      return 'macOS'
    case Office.PlatformType.OfficeOnline:
      return 'Office Online'
    default:
      return '未知'
  }
}

export default App
