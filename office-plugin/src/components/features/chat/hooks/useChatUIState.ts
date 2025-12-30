/**
 * useChatUIState Hook
 * 
 * 管理聊天界面 UI 相关的状态
 * 解决 P6 问题：将分散在 ChatInterface 中的 UI 状态集中管理
 * 
 * @created 2025-12-29 - 修复 P6 (组件过大)
 */

import { useState, useCallback, useEffect } from 'react'
import { useConnection } from '../../../../hooks/useConnection'

/**
 * Hook 返回类型
 */
export interface ChatUIStateReturn {
  // ==================== 状态 ====================
  /** 是否显示连接状态横幅 */
  showBanner: boolean
  /** 是否正在加载 */
  isLoading: boolean
  /** Excel 编辑面板是否打开 */
  excelEditPanelOpen: boolean
  /** PowerPoint 编辑面板是否打开 */
  powerPointEditPanelOpen: boolean
  /** 选中用于编辑的消息 ID */
  selectedMessageForEdit: string
  /** 连接状态 */
  connected: boolean

  // ==================== 操作 ====================
  /** 设置横幅显示状态 */
  setShowBanner: (show: boolean) => void
  /** 设置加载状态 */
  setIsLoading: (loading: boolean) => void
  /** 打开 Excel 编辑面板 */
  openExcelEditPanel: (messageId?: string) => void
  /** 关闭 Excel 编辑面板 */
  closeExcelEditPanel: () => void
  /** 打开 PowerPoint 编辑面板 */
  openPowerPointEditPanel: (messageId?: string) => void
  /** 关闭 PowerPoint 编辑面板 */
  closePowerPointEditPanel: () => void
  /** 设置选中用于编辑的消息 */
  setSelectedMessageForEdit: (messageId: string) => void
}

/**
 * 聊天 UI 状态管理 Hook
 */
export function useChatUIState(): ChatUIStateReturn {
  const [showBanner, setShowBanner] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [excelEditPanelOpen, setExcelEditPanelOpen] = useState(false)
  const [powerPointEditPanelOpen, setPowerPointEditPanelOpen] = useState(false)
  const [selectedMessageForEdit, setSelectedMessageForEdit] = useState('')

  // 连接状态
  const { connected } = useConnection({ interval: 5000, enabled: true })

  // 连接状态变化时更新横幅显示
  useEffect(() => {
    if (connected) {
      setShowBanner(false)
    } else {
      setShowBanner(true)
    }
  }, [connected])

  const openExcelEditPanel = useCallback((messageId?: string) => {
    if (messageId) {
      setSelectedMessageForEdit(messageId)
    }
    setExcelEditPanelOpen(true)
  }, [])

  const closeExcelEditPanel = useCallback(() => {
    setExcelEditPanelOpen(false)
    setSelectedMessageForEdit('')
  }, [])

  const openPowerPointEditPanel = useCallback((messageId?: string) => {
    if (messageId) {
      setSelectedMessageForEdit(messageId)
    }
    setPowerPointEditPanelOpen(true)
  }, [])

  const closePowerPointEditPanel = useCallback(() => {
    setPowerPointEditPanelOpen(false)
    setSelectedMessageForEdit('')
  }, [])

  return {
    // 状态
    showBanner,
    isLoading,
    excelEditPanelOpen,
    powerPointEditPanelOpen,
    selectedMessageForEdit,
    connected,

    // 操作
    setShowBanner,
    setIsLoading,
    openExcelEditPanel,
    closeExcelEditPanel,
    openPowerPointEditPanel,
    closePowerPointEditPanel,
    setSelectedMessageForEdit
  }
}

export default useChatUIState
