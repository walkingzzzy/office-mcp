import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, MessageType } from '../types';
import './ChatPanel.css';

interface ChatPanelProps {
  messages: ChatMessage[];
  onSendMessage: (content: string) => void;
  isLoading?: boolean;
  error?: string;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({
  messages,
  onSendMessage,
  isLoading = false,
  error
}) => {
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() && !isLoading) {
      onSendMessage(inputValue.trim());
      setInputValue('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getMessageIcon = (type: MessageType) => {
    switch (type) {
      case 'user':
        return '👤';
      case 'assistant':
        return '🤖';
      case 'system':
        return '⚙️';
      case 'error':
        return '❌';
      default:
        return '💬';
    }
  };

  return (
    <div className="chat-panel">
      <div className="chat-header">
        <h3>AI 助手对话</h3>
        {error && <div className="error-banner">{error}</div>}
      </div>

      <div className="messages-container">
        {messages.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">💬</div>
            <p>开始与AI助手对话</p>
            <p className="empty-hint">您可以询问关于文档编辑、格式化等问题</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`message ${message.type}`}
            >
              <div className="message-header">
                <span className="message-icon">
                  {getMessageIcon(message.type)}
                </span>
                <span className="message-time">
                  {formatTimestamp(message.timestamp)}
                </span>
                {message.status && (
                  <span className={`message-status ${message.status}`}>
                    {message.status === 'sending' && '发送中...'}
                    {message.status === 'failed' && '发送失败'}
                  </span>
                )}
              </div>
              <div className="message-content">
                {message.content}
              </div>
              {message.metadata?.progress !== undefined && (
                <div className="message-progress">
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{ width: `${message.metadata.progress}%` }}
                    />
                  </div>
                  <span className="progress-text">
                    {message.metadata.progress}%
                  </span>
                </div>
              )}
            </div>
          ))
        )}
        {isLoading && (
          <div className="message assistant loading">
            <div className="message-header">
              <span className="message-icon">🤖</span>
              <span className="message-time">
                {formatTimestamp(Date.now())}
              </span>
            </div>
            <div className="message-content">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form className="input-form" onSubmit={handleSubmit}>
        <div className="input-container">
          <textarea
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="输入您的问题..."
            className="message-input"
            rows={1}
            disabled={isLoading}
          />
          <button
            type="submit"
            className="send-button"
            disabled={!inputValue.trim() || isLoading}
          >
            {isLoading ? '⏳' : '📤'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatPanel;