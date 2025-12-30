/**
 * useChatState Hook
 * 管理 ChatInterface 的基础状态（输入、模型、附件、横幅等）
 * 避免在组件内部散落大量 useState 调用
 */

import { useState } from 'react'

import type { FileAttachmentData } from '../../../molecules/FileAttachment'

export interface UseChatStateReturn {
  // 输入相关
  inputText: string
  setInputText: (text: string) => void

  // 模型与配置
  selectedModelId: string
  setSelectedModelId: (id: string) => void
  selectedKnowledgeBases: string[]
  setSelectedKnowledgeBases: (bases: string[]) => void
  selectedMCPTools: string[]
  setSelectedMCPTools: (tools: string[]) => void
  webSearchEnabled: boolean
  setWebSearchEnabled: (enabled: boolean) => void

  // 附件
  attachedFiles: FileAttachmentData[]
  setAttachedFiles: (files: FileAttachmentData[]) => void

  // UI 状态
  showBanner: boolean
  setShowBanner: (show: boolean) => void
  // showPreprocessingBanner: boolean
  // setShowPreprocessingBanner: (show: boolean) => void
}

export function useChatState(initialModelId?: string): UseChatStateReturn {
  // 输入相关
  const [inputText, setInputText] = useState('')

  // 模型与配置
  const [selectedModelId, setSelectedModelId] = useState(initialModelId || '')
  const [selectedKnowledgeBases, setSelectedKnowledgeBases] = useState<string[]>([])
  const [selectedMCPTools, setSelectedMCPTools] = useState<string[]>([])
  const [webSearchEnabled, setWebSearchEnabled] = useState<boolean>(false)

  // 附件
  const [attachedFiles, setAttachedFiles] = useState<FileAttachmentData[]>([])

  // UI 状态
  const [showBanner, setShowBanner] = useState(true)
  // const [showPreprocessingBanner, setShowPreprocessingBanner] = useState(true)

  return {
    inputText,
    setInputText,

    selectedModelId,
    setSelectedModelId,
    selectedKnowledgeBases,
    setSelectedKnowledgeBases,
    selectedMCPTools,
    setSelectedMCPTools,
    webSearchEnabled,
    setWebSearchEnabled,

    attachedFiles,
    setAttachedFiles,

    showBanner,
    setShowBanner,
    // showPreprocessingBanner,
    // setShowPreprocessingBanner
  }
}
