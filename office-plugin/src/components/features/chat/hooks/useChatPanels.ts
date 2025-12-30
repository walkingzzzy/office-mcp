/**
 * useChatPanels - 面板状态管理 Hook
 * 管理侧边栏、编辑面板等UI面板的状态
 */

import { useCallback,useState } from 'react'

export interface UseChatPanelsReturn {
  sidebarOpen: boolean
  wordEditPanelOpen: boolean
  excelEditPanelOpen: boolean
  powerPointEditPanelOpen: boolean
  selectedMessageForEdit: string
  selectedMessageForWordEdit: string
  wordEditSelectionContext: Record<string, boolean>
  selectedWordEditIsSelection: boolean
  toggleSidebar: () => void
  openWordEditPanel: (messageId: string, isSelection: boolean) => void
  closeWordEditPanel: () => void
  openExcelEditPanel: (messageId: string) => void
  closeExcelEditPanel: () => void
  openPowerPointEditPanel: (messageId: string) => void
  closePowerPointEditPanel: () => void
  setWordEditSelectionContext: (messageId: string, isSelection: boolean) => void
}

export function useChatPanels(): UseChatPanelsReturn {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [wordEditPanelOpen, setWordEditPanelOpen] = useState(false)
  const [excelEditPanelOpen, setExcelEditPanelOpen] = useState(false)
  const [powerPointEditPanelOpen, setPowerPointEditPanelOpen] = useState(false)
  const [selectedMessageForEdit, setSelectedMessageForEdit] = useState('')
  const [selectedMessageForWordEdit, setSelectedMessageForWordEdit] = useState('')
  const [wordEditSelectionContext, setWordEditSelectionContextState] = useState<Record<string, boolean>>({})
  const [selectedWordEditIsSelection, setSelectedWordEditIsSelection] = useState(false)

  const toggleSidebar = useCallback(() => {
    setSidebarOpen(prev => !prev)
  }, [])

  const openWordEditPanel = useCallback((messageId: string, isSelection: boolean) => {
    setSelectedMessageForWordEdit(messageId)
    setSelectedWordEditIsSelection(isSelection)
    setWordEditPanelOpen(true)
  }, [])

  const closeWordEditPanel = useCallback(() => {
    setWordEditPanelOpen(false)
    setSelectedMessageForWordEdit('')
  }, [])

  const openExcelEditPanel = useCallback((messageId: string) => {
    setSelectedMessageForEdit(messageId)
    setExcelEditPanelOpen(true)
  }, [])

  const closeExcelEditPanel = useCallback(() => {
    setExcelEditPanelOpen(false)
    setSelectedMessageForEdit('')
  }, [])

  const openPowerPointEditPanel = useCallback((messageId: string) => {
    setSelectedMessageForEdit(messageId)
    setPowerPointEditPanelOpen(true)
  }, [])

  const closePowerPointEditPanel = useCallback(() => {
    setPowerPointEditPanelOpen(false)
    setSelectedMessageForEdit('')
  }, [])

  const setWordEditSelectionContext = useCallback((messageId: string, isSelection: boolean) => {
    setWordEditSelectionContextState(prev => ({
      ...prev,
      [messageId]: isSelection
    }))
  }, [])

  return {
    sidebarOpen,
    wordEditPanelOpen,
    excelEditPanelOpen,
    powerPointEditPanelOpen,
    selectedMessageForEdit,
    selectedMessageForWordEdit,
    wordEditSelectionContext,
    selectedWordEditIsSelection,
    toggleSidebar,
    openWordEditPanel,
    closeWordEditPanel,
    openExcelEditPanel,
    closeExcelEditPanel,
    openPowerPointEditPanel,
    closePowerPointEditPanel,
    setWordEditSelectionContext
  }
}
