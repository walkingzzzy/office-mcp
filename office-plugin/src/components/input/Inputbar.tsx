/**
 * Inputbar - 重构后的输入区域组件
 * 基于主应用设计，添加增强视觉效果
 * 
 * Phase 3: 更新样式，添加玻璃拟态和渐变按钮
 * @updated 2025-12-30 - 迁移到 @fluentui/react-icons
 */

import {
  SendRegular,
  AttachRegular,
  DocumentTextRegular,
  GlobeRegular,
  FolderRegular,
  SparkleRegular,
  SpinnerIosRegular,
  ChatAddRegular,
  DismissRegular,
  BotRegular,
  CommentRegular,
} from '@fluentui/react-icons'
import type { ChatMode } from '../../types/ai'
import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react'

import { cn } from '@/lib/utils'
import { Button } from '../ui/button'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '../ui/tooltip'
import { ScrollArea, ScrollBar } from '../ui/scroll-area'
import { DocumentParser } from '../../services/DocumentParser'
import { FileAttachmentData } from '../molecules/FileAttachment'
import { toastManager } from '../molecules/ToastNotifications'
import Logger from '../../utils/logger'

const logger = new Logger('Inputbar')

// ==================== 类型定义 ====================

export interface KnowledgeBaseItem {
  id: string
  name: string
  itemCount?: number
}

export interface MCPServerItem {
  id: string
  name: string
  description?: string
  tools?: any[]
}

export interface WebSearchProvider {
  id: string
  name: string
  icon?: string
}

// 默认的联网搜索提供商
export const DEFAULT_WEB_SEARCH_PROVIDERS: WebSearchProvider[] = [
  { id: 'model-builtin', name: '模型内置', icon: '🤖' },
  { id: 'google', name: 'Google', icon: 'G' },
  { id: 'bing', name: 'Bing', icon: 'b' },
  { id: 'baidu', name: 'Baidu', icon: '☀' }
]

export interface InputbarProps {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  disabled?: boolean
  placeholder?: string
  isLoading?: boolean
  
  // 附件
  attachedFiles?: FileAttachmentData[]
  onFileAttach?: (file: FileAttachmentData) => void
  onFileRemove?: (fileId: string) => void
  
  // 知识库
  knowledgeBases?: KnowledgeBaseItem[]
  selectedKnowledgeBases?: string[]
  onKnowledgeBasesChange?: (ids: string[]) => void
  
  // MCP工具
  mcpServers?: MCPServerItem[]
  selectedMCPTools?: string[]
  onMCPToolsChange?: (ids: string[]) => void
  
  // 联网搜索
  webSearchEnabled?: boolean
  webSearchProviderId?: string
  onWebSearchChange?: (enabled: boolean, providerId?: string) => void
  
  // 新建话题
  onNewTopic?: () => void
  
  // 聊天模式 (Agent/Ask)
  chatMode?: ChatMode
  onChatModeChange?: (mode: ChatMode) => void
  
  className?: string
}

// ==================== 标签组件 ====================

interface TagProps {
  label: string
  type: 'knowledge' | 'mcp' | 'model' | 'file' | 'websearch'
  onRemove: () => void
}

// 使用 Tailwind 类替代 Fluent UI tokens
const tagStyles: Record<string, string> = {
  knowledge: 'bg-green-50 border-green-200 text-green-700',
  mcp: 'bg-orange-50 border-orange-200 text-orange-700',
  model: 'bg-purple-50 border-purple-200 text-purple-700',
  file: 'bg-gray-50 border-gray-200 text-gray-600',
  websearch: 'bg-blue-50 border-blue-200 text-blue-700',
}

const tagIcons: Record<string, React.ReactNode> = {
  knowledge: <DocumentTextRegular className="h-3 w-3" />,
  mcp: <FolderRegular className="h-3 w-3" />,
  model: <SparkleRegular className="h-3 w-3" />,
  file: <AttachRegular className="h-3 w-3" />,
  websearch: <GlobeRegular className="h-3 w-3" />,
}

const Tag: React.FC<TagProps> = ({ label, type, onRemove }) => {
  const [isRemoving, setIsRemoving] = useState(false)

  const handleRemove = () => {
    setIsRemoving(true)
    setTimeout(onRemove, 200)
  }

  return (
    <span 
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border transition-all duration-200',
        tagStyles[type],
        isRemoving && 'opacity-0 scale-75 -translate-x-2'
      )}
    >
      {tagIcons[type]}
      <span className="max-w-[100px] truncate">{label}</span>
      <button 
        type="button"
        onClick={handleRemove}
        className="w-4 h-4 flex items-center justify-center rounded-full hover:bg-black/5 transition"
      >
        <DismissRegular className="h-3 w-3" />
      </button>
    </span>
  )
}

// ==================== 工具按钮组件 ====================

interface ToolButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode
  tooltip?: string
  active?: boolean
  badge?: number
  withTooltip?: boolean
  ariaLabel?: string
  testId?: string
}

// 使用 forwardRef 解决 "Function components cannot be given refs" 警告
// 使用 rest props 传递 DropdownMenuTrigger 的属性（如 aria-expanded, data-state）
const ToolButton = React.forwardRef<HTMLButtonElement, ToolButtonProps>(({
  icon,
  tooltip,
  active = false,
  badge,
  onClick,
  disabled = false,
  withTooltip = true,
  ariaLabel,
  testId,
  className: extraClassName,
  ...restProps
}, ref) => {
  const button = (
    <Button
      ref={ref}
      data-testid={testId}
      type="button"
      variant="ghost"
      size="icon"
      disabled={disabled}
      onClick={onClick}
      aria-label={ariaLabel || tooltip}
      className={cn(
        'relative h-9 w-9 rounded-xl border border-transparent transition-all duration-200',
        active
          ? 'bg-primary/10 text-primary hover:bg-primary/20 hover:border-primary/40 shadow-sm'
          : 'text-muted-foreground hover:text-foreground hover:bg-muted/60 hover:border-border/40',
        'hover:scale-105 active:scale-95', // 添加缩放反馈
        extraClassName,
      )}
      {...restProps}>
      {icon}
      {badge !== undefined && badge > 0 && (
        <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground shadow-sm">
          {badge > 9 ? '9+' : badge}
        </span>
      )}
    </Button>
  )

  if (!withTooltip || !tooltip) {
    return button
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>{button}</TooltipTrigger>
      <TooltipContent side="top">{tooltip}</TooltipContent>
    </Tooltip>
  )
})
ToolButton.displayName = 'ToolButton'

// ==================== 发送按钮组件 ====================

interface SendButtonProps {
  onClick: () => void
  disabled?: boolean
  isLoading?: boolean
}

const SendButton: React.FC<SendButtonProps> = ({ onClick, disabled = false, isLoading = false }) => {
  return (
    <Button
      type="button"
      size="icon"
      onClick={onClick}
      disabled={disabled || isLoading}
      className={cn(
        'h-10 w-10 rounded-2xl text-white transition-all duration-300',
        disabled || isLoading
          ? 'bg-gray-200 text-gray-400 cursor-not-allowed dark:bg-gray-700 dark:text-gray-500'
          : 'bg-gradient-to-r from-primary to-accent shadow-lg shadow-primary/30 hover:shadow-primary/40 hover:scale-105'
      )}>
      {isLoading ? <SpinnerIosRegular className="h-4 w-4 animate-spin" /> : <SendRegular className="h-4 w-4" />}
    </Button>
  )
}

// ==================== 主组件 ====================

export const Inputbar: React.FC<InputbarProps> = ({
  value,
  onChange,
  onSubmit,
  disabled = false,
  placeholder = '在这里输入消息，按 Enter 发送',
  isLoading = false,
  attachedFiles = [],
  onFileAttach,
  onFileRemove,
  knowledgeBases = [],
  selectedKnowledgeBases = [],
  onKnowledgeBasesChange,
  mcpServers = [],
  selectedMCPTools = [],
  onMCPToolsChange,
  webSearchEnabled = false,
  webSearchProviderId,
  onWebSearchChange,
  onNewTopic,
  chatMode = 'agent',
  onChatModeChange,
  className
}) => {
  const [isUploading, setIsUploading] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 处理文件选择
  const handleFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !onFileAttach) return

    // 验证文件类型（支持图片和多种文档格式）
    const allowedMimeTypes = [
      // 图片
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      // 文档
      'application/pdf',
      'application/msword',  // .doc
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',  // .docx
      'application/vnd.ms-excel',  // .xls
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',  // .xlsx
      'application/vnd.ms-powerpoint',  // .ppt
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',  // .pptx
      // 文本
      'text/plain', 'text/markdown', 'text/csv', 'text/html', 'text/xml',
      'application/json', 'application/xml'
    ]
    
    // 支持的文件扩展名（用于 MIME 类型未知的情况）
    const allowedExtensions = [
      '.jpg', '.jpeg', '.png', '.gif', '.webp',
      '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
      '.txt', '.md', '.csv', '.json', '.xml', '.yaml', '.yml',
      '.html', '.htm', '.css', '.js', '.ts', '.py', '.java', '.go', '.rs', '.sql'
    ]
    
    const ext = '.' + file.name.split('.').pop()?.toLowerCase()
    const isAllowed = allowedMimeTypes.includes(file.type) || allowedExtensions.includes(ext)
    
    if (!isAllowed) {
      console.warn('不支持的文件类型:', file.type, ext)
      toastManager.error('不支持的文件格式', `${ext} 格式暂不支持。支持：图片、PDF、Word、Excel、PPT、文本、代码文件`)
      return
    }

    // 验证文件大小（10MB）
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      toastManager.error('文件过大', '文件大小不能超过 10MB')
      return
    }

    setIsUploading(true)
    
    // 显示加载提示
    const loadingToastId = toastManager.loading('正在处理文件', `解析 ${file.name}...`)

    try {
      // 对于图片，读取为 base64
      if (file.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onload = (e) => {
          const base64Data = e.target?.result as string
          const ext = '.' + file.name.split('.').pop()?.toLowerCase()
          
          const fileData: FileAttachmentData = {
            fileId: `local-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
            fileName: file.name,
            size: file.size,
            type: file.type,
            ext: ext,
            // 存储 base64 数据用于后续插入文档
            base64Data: base64Data
          }
          
          onFileAttach(fileData)
          toastManager.removeToast(loadingToastId)
          toastManager.success('图片已添加', file.name)
          console.log('📎 图片已附加 (base64):', fileData.fileName)
        }
        reader.onerror = () => {
          toastManager.removeToast(loadingToastId)
          toastManager.error('图片读取失败', '请重试')
        }
        reader.readAsDataURL(file)
      } else {
        // 对于文档文件，解析内容
        const ext = '.' + file.name.split('.').pop()?.toLowerCase()
        
        console.log('📄 开始解析文档:', file.name)
        const parseResult = await DocumentParser.parse(file)
        
        toastManager.removeToast(loadingToastId)
        
        if (!parseResult.success) {
          console.warn('文档解析失败:', parseResult.error)
          toastManager.error('文档解析失败', parseResult.error)
          return
        }
        
        // 截断过长的文本（防止 token 超限）
        const textContent = DocumentParser.truncateText(parseResult.text, 50000)
        
        const fileData: FileAttachmentData = {
          fileId: `doc-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
          fileName: file.name,
          size: file.size,
          type: file.type,
          ext: ext,
          textContent: textContent,
          pageCount: parseResult.pageCount,
          wordCount: parseResult.wordCount,
          sheetCount: parseResult.sheetCount,
          slideCount: parseResult.slideCount
        }
        
        onFileAttach(fileData)
        
        // 显示成功提示，包含文档统计信息
        const stats: string[] = []
        if (parseResult.wordCount) stats.push(`${parseResult.wordCount} 字`)
        if (parseResult.pageCount) stats.push(`${parseResult.pageCount} 页`)
        if (parseResult.sheetCount) stats.push(`${parseResult.sheetCount} 工作表`)
        if (parseResult.slideCount) stats.push(`${parseResult.slideCount} 幻灯片`)
        const statsStr = stats.length > 0 ? ` (${stats.join(', ')})` : ''
        
        toastManager.success('文档已解析', `${file.name}${statsStr}`)
        
        console.log('📄 文档已解析:', {
          fileName: fileData.fileName,
          wordCount: parseResult.wordCount,
          pageCount: parseResult.pageCount,
          sheetCount: parseResult.sheetCount,
          slideCount: parseResult.slideCount,
          textLength: textContent.length
        })
      }
    } catch (error) {
      logger.error('文件处理失败', { error })
      toastManager.removeToast(loadingToastId)
      toastManager.error('文件处理失败', '请重试')
    } finally {
      setIsUploading(false)
      // 清空文件输入，允许重复选择同一文件
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }, [onFileAttach])

  // 打开文件选择对话框
  const handleAttachClick = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  // 处理键盘事件
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      onSubmit()
    }
  }

  // 切换知识库选择
  const toggleKnowledgeBase = useCallback((id: string) => {
    if (!onKnowledgeBasesChange) return
    const newSelection = selectedKnowledgeBases.includes(id)
      ? selectedKnowledgeBases.filter(k => k !== id)
      : [...selectedKnowledgeBases, id]
    onKnowledgeBasesChange(newSelection)
  }, [selectedKnowledgeBases, onKnowledgeBasesChange])

  // 切换MCP服务
  const toggleMCPServer = useCallback((id: string) => {
    if (!onMCPToolsChange) return
    const newSelection = selectedMCPTools.includes(id)
      ? selectedMCPTools.filter((m: string) => m !== id)
      : [...selectedMCPTools, id]
    onMCPToolsChange(newSelection)
  }, [selectedMCPTools, onMCPToolsChange])

  // 选择联网搜索提供商
  const selectWebSearchProvider = useCallback((providerId: string) => {
    if (!onWebSearchChange) return
    // 如果选择同一个，则关闭；否则切换
    if (webSearchEnabled && webSearchProviderId === providerId) {
      onWebSearchChange(false, undefined)
    } else {
      onWebSearchChange(true, providerId)
    }
  }, [webSearchEnabled, webSearchProviderId, onWebSearchChange])

  // 获取当前选中的搜索提供商名称
  const selectedWebSearchName = useMemo(() => {
    if (!webSearchEnabled || !webSearchProviderId) return null
    const provider = DEFAULT_WEB_SEARCH_PROVIDERS.find(p => p.id === webSearchProviderId)
    return provider?.name || webSearchProviderId
  }, [webSearchEnabled, webSearchProviderId])

  // 获取已选知识库名称
  const selectedKBNames = useMemo(() => {
    return knowledgeBases
      .filter(kb => selectedKnowledgeBases.includes(kb.id))
      .map(kb => ({ id: kb.id, name: kb.name }))
  }, [knowledgeBases, selectedKnowledgeBases])

  // 获取已选MCP名称
  const selectedMCPNames = useMemo(() => {
    return mcpServers
      .filter((m: MCPServerItem) => selectedMCPTools.includes(m.id))
      .map((m: MCPServerItem) => ({ id: m.id, name: m.name }))
  }, [mcpServers, selectedMCPTools])

  // 知识库面板数据
  const hasSelectedTags = selectedKBNames.length > 0 || selectedMCPNames.length > 0 || attachedFiles.length > 0 || webSearchEnabled

  return (
    <TooltipProvider delayDuration={150}>
    <div className={cn('relative', className)}>
      {/* 隐藏的文件输入 */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.md,.csv,.json,.xml,.yaml,.yml,.html,.htm,.css,.js,.ts,.py,.java,.go,.rs,.sql"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />

      {/* 输入容器 - 匹配设计稿样式，增加底部安全边距和焦点状态（与主应用统一） */}
      <div
        className={cn(
          'relative rounded-2xl overflow-hidden bg-white border border-gray-200/80 shadow-lg shadow-gray-200/40 transition-all duration-300',
          'dark:bg-gray-800/95 dark:border-gray-600 dark:shadow-gray-900/50',
          'mb-3', // 底部安全边距
          // 焦点状态增强 - 双层阴影 + 光晕效果（与主应用统一）
          'focus-within:border-primary/50 focus-within:shadow-[0_0_0_2px_rgba(99,102,241,0.4),0_0_20px_rgba(99,102,241,0.15)]',
          'dark:focus-within:border-primary/60 dark:focus-within:shadow-[0_0_0_2px_rgba(99,102,241,0.5),0_0_25px_rgba(99,102,241,0.2)]',
          disabled && 'opacity-60'
        )}
      >
        {/* 已选标签区域 */}
        {hasSelectedTags && (
          <div className="flex flex-wrap gap-1.5 px-3 pt-3 pb-1" data-testid="inputbar-selected-tags">
            {selectedKBNames.map(kb => (
              <Tag 
                key={kb.id} 
                label={kb.name} 
                type="knowledge"
                onRemove={() => toggleKnowledgeBase(kb.id)}
              />
            ))}
            {selectedMCPNames.map(m => (
              <Tag 
                key={m.id} 
                label={m.name} 
                type="mcp"
                onRemove={() => toggleMCPServer(m.id)}
              />
            ))}
            {attachedFiles.map(f => (
              <Tag 
                key={f.fileId} 
                label={f.fileName} 
                type="file"
                onRemove={() => onFileRemove?.(f.fileId)}
              />
            ))}
            {webSearchEnabled && selectedWebSearchName && (
              <Tag 
                label={`联网: ${selectedWebSearchName}`} 
                type="websearch"
                onRemove={() => onWebSearchChange?.(false, undefined)}
              />
            )}
          </div>
        )}

        {/* 文本输入区 - 使用原生 textarea + Tailwind 样式，增强 placeholder 对比度 */}
        <textarea
          value={value}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => onChange(e.target.value)}
          placeholder={placeholder}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          className={cn(
            'w-full min-h-[60px] max-h-[200px] px-4 py-3 text-sm resize-none',
            'bg-transparent border-none outline-none',
            'placeholder:text-gray-500 dark:placeholder:text-gray-400', // 增强 placeholder 对比度
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
        />

        {/* 工具栏 */}
        <div className="flex items-center justify-between px-3 pb-2.5 pt-1.5">
          {/* 左侧工具按钮 - 增加间距 */}
          <div className="flex items-center gap-1.5">
            {/* 新建话题 */}
            {onNewTopic && (
              <ToolButton
                icon={<ChatAddRegular className="h-4 w-4" />}
                tooltip="新建话题"
                onClick={onNewTopic}
                disabled={disabled}
                ariaLabel="新建话题"
              />
            )}

            {/* 🆕 模式切换 (Agent/Ask) - AI 自动判断是否需要任务规划 */}
            {onChatModeChange && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => onChatModeChange(chatMode === 'agent' ? 'ask' : 'agent')}
                    disabled={disabled}
                    className={cn(
                      'h-9 px-3 rounded-xl border transition-all duration-200 gap-1.5 font-medium',
                      chatMode === 'agent'
                        ? 'bg-gradient-to-r from-primary/15 to-accent/15 text-primary border-primary/40 hover:border-primary/60 shadow-sm'
                        : 'bg-blue-50 text-blue-600 border-blue-300 hover:bg-blue-100 hover:border-blue-400'
                    )}
                  >
                    {chatMode === 'agent' ? (
                      <>
                        <BotRegular className="h-4 w-4" />
                        <span className="text-xs font-medium">Agent</span>
                      </>
                    ) : (
                      <>
                        <CommentRegular className="h-4 w-4" />
                        <span className="text-xs font-medium">Ask</span>
                      </>
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  {chatMode === 'agent' 
                    ? 'Agent 模式：AI 会自动分析任务复杂度，复杂任务会自动创建任务列表逐步执行' 
                    : 'Ask 模式：只回答问题，不执行文档操作'}
                </TooltipContent>
              </Tooltip>
            )}

            {/* 附件 */}
            <ToolButton
              icon={<AttachRegular className="h-4 w-4" />}
              tooltip={isUploading ? '上传中...' : '上传图片/文件'}
              onClick={handleAttachClick}
              disabled={disabled || isUploading}
              badge={attachedFiles.length > 0 ? attachedFiles.length : undefined}
              ariaLabel="上传图片或文件"
            />

            {/* 联网搜索 */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <ToolButton
                  icon={<GlobeRegular className="h-4 w-4" />}
                  active={webSearchEnabled}
                  disabled={disabled}
                  ariaLabel="联网搜索"
                  testId="inputbar-websearch-trigger"
                />
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                sideOffset={12}
                className="w-[calc(100vw-24px)] max-w-72 rounded-2xl border border-border/40 bg-card/95 p-0 shadow-2xl backdrop-blur-xl dark:bg-card/98 dark:border-border/60">
                <div className="flex items-center justify-between border-b border-border/30 px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">联网搜索</p>
                    <p className="text-xs text-muted-foreground">
                      {webSearchEnabled ? `当前：${selectedWebSearchName}` : '选择搜索提供商'}
                    </p>
                  </div>
                  {webSearchEnabled && (
                    <button
                      type="button"
                      onClick={() => onWebSearchChange?.(false, undefined)}
                      className="text-xs text-muted-foreground transition hover:text-foreground">
                      关闭
                    </button>
                  )}
                </div>
                <DropdownMenuRadioGroup
                  value={webSearchEnabled && webSearchProviderId ? webSearchProviderId : 'off'}
                  onValueChange={(value) => {
                    if (value === 'off') {
                      onWebSearchChange?.(false, undefined)
                    } else {
                      onWebSearchChange?.(true, value)
                    }
                  }}>
                  <DropdownMenuRadioItem
                    data-testid="websearch-option-off"
                    value="off"
                    className="cursor-pointer px-4 py-2 text-sm text-muted-foreground data-[state=checked]:text-foreground">
                    不启用联网
                  </DropdownMenuRadioItem>
                  <DropdownMenuSeparator className="mx-4 my-1" />
                  {DEFAULT_WEB_SEARCH_PROVIDERS.map((provider) => (
                    <DropdownMenuRadioItem
                      data-testid={`websearch-option-${provider.id}`}
                      key={provider.id}
                      value={provider.id}
                      className="flex cursor-pointer items-center gap-3 rounded-xl px-4 py-2 text-sm font-medium text-foreground data-[state=checked]:bg-primary/10 data-[highlighted]:bg-muted/80">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                        {provider.icon}
                      </span>
                      <div className="flex-1">
                        <p>{provider.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {provider.id === 'model-builtin' ? '使用模型内置联网能力' : '实时搜索'}
                        </p>
                      </div>
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* 知识库 */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <ToolButton
                  icon={<DocumentTextRegular className="h-4 w-4" />}
                  active={selectedKnowledgeBases.length > 0}
                  badge={selectedKnowledgeBases.length || undefined}
                  disabled={disabled}
                  ariaLabel="知识库"
                  testId="inputbar-knowledge-trigger"
                />
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                sideOffset={12}
                className="w-[calc(100vw-24px)] max-w-80 rounded-2xl border border-border/40 bg-card/95 p-0 shadow-2xl backdrop-blur-xl dark:bg-card/98 dark:border-border/60">
                <div className="flex items-center justify-between border-b border-border/30 px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">知识库</p>
                    <p className="text-xs text-muted-foreground">
                      {selectedKnowledgeBases.length > 0 ? `已选 ${selectedKnowledgeBases.length} 个` : '选择知识来源'}
                    </p>
                  </div>
                  {selectedKnowledgeBases.length > 0 && (
                    <button
                      type="button"
                      onClick={() => onKnowledgeBasesChange?.([])}
                      className="text-xs text-muted-foreground transition hover:text-foreground">
                      清除
                    </button>
                  )}
                </div>
                <ScrollArea className="max-h-64">
                  <div className="py-1">
                    {knowledgeBases.length === 0 ? (
                      <div className="px-4 py-6 text-center">
                        <div className="text-sm text-muted-foreground mb-1">暂无知识库</div>
                        <div className="text-xs text-muted-foreground/70 leading-relaxed">
                          可在桌面端添加知识库<br />增强 AI 回答准确性
                        </div>
                      </div>
                    ) : (
                      knowledgeBases.map((kb) => (
                        <DropdownMenuCheckboxItem
                          data-testid={`knowledge-option-${kb.id}`}
                          key={kb.id}
                          checked={selectedKnowledgeBases.includes(kb.id)}
                          onCheckedChange={() => toggleKnowledgeBase(kb.id)}
                          className="group flex cursor-pointer select-none items-start gap-3 rounded-xl px-4 py-3 text-sm font-medium text-foreground data-[state=checked]:bg-primary/10 data-[highlighted]:bg-muted/80">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                            <DocumentTextRegular className="h-4 w-4" />
                          </div>
                          <div className="flex-1">
                            <p className="leading-tight">{kb.name}</p>
                            {kb.itemCount !== undefined && (
                              <p className="text-xs text-muted-foreground">{kb.itemCount} 个文档</p>
                            )}
                          </div>
                        </DropdownMenuCheckboxItem>
                      ))
                    )}
                  </div>
                  <ScrollBar orientation="vertical" />
                </ScrollArea>
                <div className="flex items-center justify-between border-t border-border/30 px-4 py-2 text-[11px] text-muted-foreground">
                  <span>Enter 立即应用</span>
                  <span>ESC 关闭</span>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* MCP工具 */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <ToolButton
                  icon={<FolderRegular className="h-4 w-4" />}
                  active={selectedMCPTools.length > 0}
                  badge={selectedMCPTools.length || undefined}
                  disabled={disabled}
                  ariaLabel="MCP 工具"
                  testId="inputbar-mcp-trigger"
                />
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                sideOffset={12}
                className="w-[calc(100vw-24px)] max-w-80 rounded-2xl border border-border/40 bg-card/95 p-0 shadow-2xl backdrop-blur-xl dark:bg-card/98 dark:border-border/60">
                <div className="flex items-center justify-between border-b border-border/30 px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">MCP 工具</p>
                    <p className="text-xs text-muted-foreground">
                      {selectedMCPTools.length > 0 ? `已选 ${selectedMCPTools.length} 个` : '选择可用服务'}
                    </p>
                  </div>
                  {selectedMCPTools.length > 0 && (
                    <button
                      type="button"
                      onClick={() => onMCPToolsChange?.([])}
                      className="text-xs text-muted-foreground transition hover:text-foreground">
                      清除
                    </button>
                  )}
                </div>
                <ScrollArea className="max-h-64">
                  <div className="py-1">
                    {mcpServers.length === 0 ? (
                      <div className="px-4 py-8 text-center text-xs text-muted-foreground">暂无可用 MCP 服务</div>
                    ) : (
                      mcpServers.map((server) => (
                        <DropdownMenuCheckboxItem
                          data-testid={`mcp-option-${server.id}`}
                          key={server.id}
                          checked={selectedMCPTools.includes(server.id)}
                          onCheckedChange={() => toggleMCPServer(server.id)}
                          className="group flex cursor-pointer select-none items-start gap-3 rounded-xl px-4 py-3 text-sm font-medium text-foreground data-[state=checked]:bg-primary/10 data-[highlighted]:bg-muted/80">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/15 text-accent-foreground">
                            <FolderRegular className="h-4 w-4" />
                          </div>
                          <div className="flex-1">
                            <p className="leading-tight">{server.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {server.description || (server.tools ? `${server.tools.length} 个工具` : '自定义服务')}
                            </p>
                          </div>
                        </DropdownMenuCheckboxItem>
                      ))
                    )}
                  </div>
                  <ScrollBar orientation="vertical" />
                </ScrollArea>
                <div className="flex items-center justify-between border-t border-border/30 px-4 py-2 text-[11px] text-muted-foreground">
                  <span>Enter 立即应用</span>
                  <span>ESC 关闭</span>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* 发送按钮 */}
          <SendButton onClick={onSubmit} disabled={disabled || !value.trim()} isLoading={isLoading} />
        </div>
      </div>
    </div>
    </TooltipProvider>
  )
}

export default Inputbar

