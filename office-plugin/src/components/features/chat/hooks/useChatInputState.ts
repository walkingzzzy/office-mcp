/**
 * useChatInputState Hook
 * 
 * 管理聊天输入相关的状态
 * 解决 P6 问题：将分散在 ChatInterface 中的输入状态集中管理
 * 
 * @created 2025-12-29 - 修复 P6 (组件过大)
 */

import { useState, useCallback } from 'react'
import type { FileAttachmentData } from '../../../molecules/FileAttachment'
import type { ChatMode } from '../../../../types/ai'

/**
 * Hook 返回类型
 */
export interface ChatInputStateReturn {
  // ==================== 状态 ====================
  /** 输入文本 */
  inputText: string
  /** 附件文件列表 */
  attachedFiles: FileAttachmentData[]
  /** 选中的知识库 ID 列表 */
  selectedKnowledgeBases: string[]
  /** 选中的 MCP 工具 ID 列表 */
  selectedMCPTools: string[]
  /** 是否启用网络搜索 */
  webSearchEnabled: boolean
  /** 网络搜索提供商 ID */
  webSearchProviderId: string | undefined
  /** 聊天模式 */
  chatMode: ChatMode

  // ==================== 操作 ====================
  /** 设置输入文本 */
  setInputText: (text: string) => void
  /** 设置附件文件 */
  setAttachedFiles: (files: FileAttachmentData[]) => void
  /** 添加附件文件 */
  addAttachedFile: (file: FileAttachmentData) => void
  /** 移除附件文件 */
  removeAttachedFile: (fileId: string) => void
  /** 清空附件 */
  clearAttachedFiles: () => void
  /** 设置选中的知识库 */
  setSelectedKnowledgeBases: (ids: string[]) => void
  /** 设置选中的 MCP 工具 */
  setSelectedMCPTools: (ids: string[]) => void
  /** 设置网络搜索状态 */
  setWebSearchEnabled: (enabled: boolean) => void
  /** 设置网络搜索提供商 */
  setWebSearchProviderId: (id: string | undefined) => void
  /** 设置聊天模式 */
  setChatMode: (mode: ChatMode) => void
  /** 清空输入状态 */
  clearInputState: () => void
}

/**
 * 聊天输入状态管理 Hook
 */
export function useChatInputState(): ChatInputStateReturn {
  const [inputText, setInputText] = useState('')
  const [attachedFiles, setAttachedFiles] = useState<FileAttachmentData[]>([])
  const [selectedKnowledgeBases, setSelectedKnowledgeBases] = useState<string[]>([])
  const [selectedMCPTools, setSelectedMCPTools] = useState<string[]>([])
  const [webSearchEnabled, setWebSearchEnabled] = useState(false)
  const [webSearchProviderId, setWebSearchProviderId] = useState<string | undefined>(undefined)
  const [chatMode, setChatMode] = useState<ChatMode>('agent')

  const addAttachedFile = useCallback((file: FileAttachmentData) => {
    setAttachedFiles(prev => [...prev, file])
  }, [])

  const removeAttachedFile = useCallback((fileId: string) => {
    setAttachedFiles(prev => prev.filter(f => f.fileId !== fileId))
  }, [])

  const clearAttachedFiles = useCallback(() => {
    setAttachedFiles([])
  }, [])

  const clearInputState = useCallback(() => {
    setInputText('')
    setAttachedFiles([])
  }, [])

  return {
    // 状态
    inputText,
    attachedFiles,
    selectedKnowledgeBases,
    selectedMCPTools,
    webSearchEnabled,
    webSearchProviderId,
    chatMode,

    // 操作
    setInputText,
    setAttachedFiles,
    addAttachedFile,
    removeAttachedFile,
    clearAttachedFiles,
    setSelectedKnowledgeBases,
    setSelectedMCPTools,
    setWebSearchEnabled,
    setWebSearchProviderId,
    setChatMode,
    clearInputState
  }
}

export default useChatInputState
