import React, { useState } from 'react';
import { ChatSession, ChatMessage } from '../types';
import './ChatHistory.css';

interface ChatHistoryProps {
  sessions: ChatSession[];
  currentSessionId: string | null;
  onSessionSelect: (sessionId: string) => void;
  onSessionDelete: (sessionId: string) => void;
  onSessionRename: (sessionId: string, newTitle: string) => void;
  onNewSession: () => void;
  onClearAll: () => void;
  onExport: () => void;
  onImport: (data: string) => void;
}

export const ChatHistory: React.FC<ChatHistoryProps> = ({
  sessions,
  currentSessionId,
  onSessionSelect,
  onSessionDelete,
  onSessionRename,
  onNewSession,
  onClearAll,
  onExport,
  onImport
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [showConfirmClear, setShowConfirmClear] = useState(false);

  const filteredSessions = sessions.filter(session =>
    session.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    session.messages.some(msg =>
      msg.content.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  const handleStartEdit = (session: ChatSession) => {
    setEditingSessionId(session.id);
    setEditingTitle(session.title);
  };

  const handleSaveEdit = () => {
    if (editingSessionId && editingTitle.trim()) {
      onSessionRename(editingSessionId, editingTitle.trim());
    }
    setEditingSessionId(null);
    setEditingTitle('');
  };

  const handleCancelEdit = () => {
    setEditingSessionId(null);
    setEditingTitle('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return '昨天';
    } else if (diffDays < 7) {
      return `${diffDays}天前`;
    } else {
      return date.toLocaleDateString('zh-CN');
    }
  };

  const getSessionPreview = (session: ChatSession): string => {
    const lastMessage = session.messages[session.messages.length - 1];
    if (!lastMessage) return '暂无消息';

    const preview = lastMessage.content.replace(/\n/g, ' ').trim();
    return preview.length > 50 ? preview.substring(0, 50) + '...' : preview;
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        onImport(content);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="chat-history">
      <div className="chat-history-header">
        <h3>聊天历史</h3>
        <div className="history-actions">
          <button
            className="action-button new-session"
            onClick={onNewSession}
            title="新建对话"
          >
            ➕
          </button>
          <button
            className="action-button export"
            onClick={onExport}
            title="导出历史"
          >
            📤
          </button>
          <label className="action-button import" title="导入历史">
            📥
            <input
              type="file"
              accept=".json"
              onChange={handleImportFile}
              style={{ display: 'none' }}
            />
          </label>
          <button
            className="action-button clear"
            onClick={() => setShowConfirmClear(true)}
            title="清空历史"
          >
            🗑️
          </button>
        </div>
      </div>

      <div className="search-container">
        <input
          type="text"
          placeholder="搜索对话..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
        />
      </div>

      <div className="sessions-list">
        {filteredSessions.length === 0 ? (
          <div className="empty-state">
            {searchQuery ? (
              <>
                <div className="empty-icon">🔍</div>
                <p>未找到匹配的对话</p>
              </>
            ) : (
              <>
                <div className="empty-icon">💬</div>
                <p>暂无聊天历史</p>
                <button className="start-chat-button" onClick={onNewSession}>
                  开始新对话
                </button>
              </>
            )}
          </div>
        ) : (
          filteredSessions.map((session) => (
            <div
              key={session.id}
              className={`session-item ${
                session.id === currentSessionId ? 'active' : ''
              }`}
              onClick={() => onSessionSelect(session.id)}
            >
              <div className="session-content">
                {editingSessionId === session.id ? (
                  <input
                    type="text"
                    value={editingTitle}
                    onChange={(e) => setEditingTitle(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onBlur={handleSaveEdit}
                    className="session-title-input"
                    autoFocus
                  />
                ) : (
                  <>
                    <div className="session-title">{session.title}</div>
                    <div className="session-preview">
                      {getSessionPreview(session)}
                    </div>
                    <div className="session-meta">
                      <span className="session-date">
                        {formatDate(session.updatedAt)}
                      </span>
                      <span className="session-count">
                        {session.messages.length} 条消息
                      </span>
                    </div>
                  </>
                )}
              </div>

              <div className="session-actions">
                <button
                  className="session-action edit"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStartEdit(session);
                  }}
                  title="重命名"
                >
                  ✏️
                </button>
                <button
                  className="session-action delete"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSessionDelete(session.id);
                  }}
                  title="删除"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {showConfirmClear && (
        <div className="confirm-dialog">
          <div className="confirm-content">
            <h4>确认清空历史</h4>
            <p>此操作将删除所有聊天历史，无法恢复。确定要继续吗？</p>
            <div className="confirm-actions">
              <button
                className="confirm-button cancel"
                onClick={() => setShowConfirmClear(false)}
              >
                取消
              </button>
              <button
                className="confirm-button confirm"
                onClick={() => {
                  onClearAll();
                  setShowConfirmClear(false);
                }}
              >
                确认清空
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatHistory;