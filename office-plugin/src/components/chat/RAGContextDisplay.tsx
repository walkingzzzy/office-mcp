/**
 * RAG 上下文显示组件
 * 显示检索到的相关文档
 */

import React, { useState } from 'react'
import type { RAGEnhancedContext } from '../../services/knowledge/RAGService'

interface RAGContextDisplayProps {
  context: RAGEnhancedContext | null
  collapsed?: boolean
}

export const RAGContextDisplay: React.FC<RAGContextDisplayProps> = ({
  context,
  collapsed: initialCollapsed = true
}) => {
  const [collapsed, setCollapsed] = useState(initialCollapsed)

  if (!context || context.retrievedDocuments.length === 0) {
    return null
  }

  return (
    <div className="mb-3 border rounded-md overflow-hidden">
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full px-3 py-2 bg-blue-50 text-left flex items-center justify-between text-sm"
      >
        <span className="flex items-center gap-2">
          <span className="text-blue-500">📚</span>
          <span>
            检索到 {context.retrievedDocuments.length} 条相关文档
            <span className="text-gray-500 ml-2">
              ({context.queryTime}ms)
            </span>
          </span>
        </span>
        <span className="text-gray-400">
          {collapsed ? '▼' : '▲'}
        </span>
      </button>

      {!collapsed && (
        <div className="p-3 space-y-3 max-h-64 overflow-auto">
          {context.retrievedDocuments.map((doc, index) => (
            <div
              key={doc.id}
              className="p-2 bg-gray-50 rounded text-sm"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-blue-600">
                  参考 {index + 1}
                </span>
                <span className="text-xs text-gray-500">
                  相关度: {(doc.score * 100).toFixed(1)}%
                </span>
              </div>
              <p className="text-gray-700 line-clamp-3">
                {doc.content}
              </p>
              {doc.source && (
                <div className="mt-1 text-xs text-gray-500">
                  来源: {doc.source}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default RAGContextDisplay
