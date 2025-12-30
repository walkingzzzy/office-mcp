import {
  Button,
  Textarea,
  Tooltip,
  tokens
} from '@fluentui/react-components'
import {
  ArrowUpRegular,
  AttachRegular,
  DatabaseRegular,
  GlobeRegular,
  GlobeOffRegular,
  ToolboxRegular,
  DismissRegular,
  CheckmarkRegular
} from '@fluentui/react-icons'
import React, { useState, useRef, useEffect } from 'react'

import { FileAttachmentData } from '../../molecules/FileAttachment'

export interface InputIslandProps {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  disabled?: boolean
  placeholder?: string
  attachedFiles?: FileAttachmentData[]
  onFileAttached?: (file: FileAttachmentData) => void
  onFileRemoved?: (fileId: string) => void
  
  knowledgeBases?: any[]
  selectedKnowledgeBases?: string[]
  onKnowledgeBasesChange?: (ids: string[]) => void
  
  mcpServers?: any[]
  selectedMCPTools?: string[]
  onMCPToolsChange?: (ids: string[]) => void
  
  webSearchEnabled?: boolean
  onWebSearchChange?: (enabled: boolean) => void
  
  onFileUploadError?: (error: Error) => void
  className?: string
}

export const InputIsland: React.FC<InputIslandProps> = ({
  value,
  onChange,
  onSubmit,
  disabled,
  placeholder = 'Message Wuhan Wenjin...',
  attachedFiles = [],
  onFileRemoved,
  knowledgeBases = [],
  selectedKnowledgeBases = [],
  onKnowledgeBasesChange,
  mcpServers = [],
  selectedMCPTools = [],
  onMCPToolsChange,
  webSearchEnabled = false,
  onWebSearchChange
}) => {
  const [showKBPicker, setShowKBPicker] = useState(false)
  const [showMCPPicker, setShowMCPPicker] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // 点击外部关闭 Popover
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowKBPicker(false)
        setShowMCPPicker(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      onSubmit()
    }
  }

  const toggleKB = (id: string) => {
    if (!onKnowledgeBasesChange) return
    if (selectedKnowledgeBases.includes(id)) {
      onKnowledgeBasesChange(selectedKnowledgeBases.filter(k => k !== id))
    } else {
      onKnowledgeBasesChange([...selectedKnowledgeBases, id])
    }
  }

  const toggleMCP = (id: string) => {
    if (!onMCPToolsChange) return
    if (selectedMCPTools.includes(id)) {
      onMCPToolsChange(selectedMCPTools.filter(t => t !== id))
    } else {
      onMCPToolsChange([...selectedMCPTools, id])
    }
  }

  // 扁平化 MCP 工具列表
  const allMcpTools = mcpServers?.flatMap(server => 
    server.tools?.map((tool: any) => ({
      ...tool,
      uniqueId: `${server.name}:${tool.name}`, // 确保 ID 唯一
      serverName: server.name
    })) || []
  ) || []

  return (
    <div ref={containerRef} className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-gradient-to-t from-white via-white to-transparent pb-6">
      {/* 附件预览区域 */}
      {attachedFiles.length > 0 && (
        <div className="flex gap-2 overflow-x-auto mb-2 px-1 pb-1">
          {attachedFiles.map((file) => (
            <div key={file.fileId} className="flex items-center gap-2 bg-default-100 px-3 py-1.5 rounded-lg text-xs border border-default-200 flex-shrink-0 shadow-sm">
              <span className="truncate max-w-[120px]">{file.fileName}</span>
              <button 
                onClick={() => onFileRemoved?.(file.fileId)}
                className="text-default-400 hover:text-danger cursor-pointer p-0.5 rounded-full hover:bg-default-200 transition-colors"
              >
                <DismissRegular fontSize={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* 弹出选择器：知识库 */}
      {showKBPicker && (
        <div className="absolute bottom-[calc(100%-10px)] left-4 w-64 bg-white border border-default-200 rounded-xl shadow-xl p-2 mb-2 animate-in slide-in-from-bottom-2 fade-in-50 z-50 max-h-60 overflow-y-auto">
          <div className="text-xs font-semibold text-default-500 px-2 py-1 mb-1">选择知识库</div>
          {knowledgeBases.length === 0 ? (
            <div className="px-2 py-3 text-center">
              <div className="text-xs text-default-500 mb-1">暂无知识库</div>
              <div className="text-[10px] text-default-400 leading-relaxed">可在桌面端添加</div>
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              {knowledgeBases.map(kb => (
                <button
                  key={kb.id}
                  onClick={() => toggleKB(kb.id)}
                  className={`flex items-center justify-between px-2 py-1.5 rounded-lg text-sm transition-colors ${
                    selectedKnowledgeBases.includes(kb.id) 
                      ? 'bg-primary/10 text-primary' 
                      : 'hover:bg-default-100 text-default-700'
                  }`}
                >
                  <span className="truncate">{kb.name}</span>
                  {selectedKnowledgeBases.includes(kb.id) && <CheckmarkRegular fontSize={14} />}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 弹出选择器：MCP 工具 */}
      {showMCPPicker && (
        <div className="absolute bottom-[calc(100%-10px)] left-16 w-72 bg-white border border-default-200 rounded-xl shadow-xl p-2 mb-2 animate-in slide-in-from-bottom-2 fade-in-50 z-50 max-h-80 overflow-y-auto">
          <div className="text-xs font-semibold text-default-500 px-2 py-1 mb-1">选择 MCP 工具</div>
          {allMcpTools.length === 0 ? (
            <div className="text-xs text-default-400 px-2 py-2 text-center">暂无可用工具</div>
          ) : (
            <div className="flex flex-col gap-1">
              {allMcpTools.map(tool => (
                <button
                  key={tool.uniqueId}
                  onClick={() => toggleMCP(tool.uniqueId)}
                  className={`flex items-center justify-between px-2 py-1.5 rounded-lg text-sm transition-colors text-left group ${
                    selectedMCPTools.includes(tool.uniqueId) 
                      ? 'bg-primary/10 text-primary' 
                      : 'hover:bg-default-100 text-default-700'
                  }`}
                >
                  <div className="flex flex-col overflow-hidden">
                    <span className="truncate font-medium">{tool.name}</span>
                    <span className="truncate text-[10px] opacity-70">{tool.description || '无描述'}</span>
                  </div>
                  {selectedMCPTools.includes(tool.uniqueId) && <CheckmarkRegular fontSize={14} className="flex-shrink-0 ml-2" />}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 输入框容器 */}
      <div className="w-full bg-white border border-default-200 rounded-[20px] shadow-lg hover:shadow-xl transition-all duration-200 focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/50">
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          resize="vertical"
          appearance="outline"
          style={{
            minHeight: '40px',
            maxHeight: '200px',
            border: 'none',
            background: 'transparent',
            fontSize: tokens.fontSizeBase300
          }}
          onKeyDown={handleKeyDown}
          disabled={disabled}
        />

        {/* 底部工具栏 */}
        <div className="flex justify-between items-center px-2 pb-2 pt-1 border-t border-dashed border-default-100 mx-2">
          <div className="flex items-center gap-1">
            {/* 附件 */}
            <Tooltip content="上传文件" relationship="label" positioning="above">
              <Button appearance="subtle" size="small" icon={<AttachRegular />} shape="circular" disabled={disabled} />
            </Tooltip>

            {/* 知识库 */}
            <Tooltip content="知识库" relationship="label" positioning="above">
              <Button 
                appearance={selectedKnowledgeBases.length > 0 ? "primary" : "subtle"}
                size="small" 
                icon={<DatabaseRegular />}
                shape="circular" 
                disabled={disabled}
                onClick={() => {
                  setShowKBPicker(!showKBPicker)
                  setShowMCPPicker(false)
                }}
              />
            </Tooltip>

            {/* MCP 工具 */}
            <Tooltip content="MCP 工具" relationship="label" positioning="above">
              <Button 
                appearance={selectedMCPTools.length > 0 ? "primary" : "subtle"}
                size="small" 
                icon={<ToolboxRegular />}
                shape="circular" 
                disabled={disabled}
                onClick={() => {
                  setShowMCPPicker(!showMCPPicker)
                  setShowKBPicker(false)
                }}
              />
            </Tooltip>

            {/* 联网搜索 */}
            <Tooltip content={webSearchEnabled ? "联网搜索已开启" : "联网搜索已关闭"} relationship="label" positioning="above">
              <Button 
                appearance="subtle" 
                size="small" 
                icon={webSearchEnabled ? <GlobeRegular /> : <GlobeOffRegular />}
                shape="circular" 
                disabled={disabled}
                onClick={() => onWebSearchChange?.(!webSearchEnabled)}
              />
            </Tooltip>
          </div>

          {/* 发送按钮 */}
          <Button
            appearance={value.trim() ? "primary" : "subtle"}
            size="small"
            shape="circular"
            icon={<ArrowUpRegular />}
            onClick={onSubmit}
            disabled={disabled || !value.trim()}
          />
        </div>
      </div>
    </div>
  )
}
