import React, { useState, useEffect, useRef } from 'react';
import { ChatPanel } from './ChatPanel';
import { DiffPreviewPanel } from './DiffPreviewPanel';
import { VersionHistory } from './VersionHistory';
import { ChangesList } from './ChangesList';
import { Change, ChatMessage } from '../types';
import { ChangeManager } from '../services/ChangeManager';
import { HighlightManager } from '../services/HighlightManager';
import { AIService } from '../services/AIService';
import { WordAdapter } from '../services/WordAdapter';
import { ExcelAdapter } from '../services/ExcelAdapter';
import { PowerPointAdapter } from '../services/PowerPointAdapter';
import './MainInterface.css';

interface MainInterfaceProps {
  changeManager: ChangeManager;
  highlightManager: HighlightManager;
}

export const MainInterface: React.FC<MainInterfaceProps> = ({
  changeManager,
  highlightManager
}) => {
  const [changes, setChanges] = useState<Change[]>([]);
  const [selectedChangeId, setSelectedChangeId] = useState<string>();
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [versions, setVersions] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'chat' | 'diff' | 'history'>('chat');
  const [isLoading, setIsLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');

  // AI服务实例
  const aiServiceRef = useRef<AIService | null>(null);
  const documentAdapterRef = useRef<WordAdapter | ExcelAdapter | PowerPointAdapter | null>(null);
  const [currentDocumentType, setCurrentDocumentType] = useState<'word' | 'excel' | 'powerpoint'>('word');
  const [currentFilename, setCurrentFilename] = useState<string>('document.docx');

  useEffect(() => {
    // 监听修改变化
    const handleChangesUpdate = (updatedChanges: Change[]) => {
      setChanges(updatedChanges);
    };

    changeManager.on('changes:updated', handleChangesUpdate);

    // 初始化数据
    setChanges(changeManager.getAllChanges());

    // 初始化AI服务和文档适配器
    const initializeServices = async () => {
      try {
        setConnectionStatus('connecting');

        // 创建AI服务实例
        aiServiceRef.current = new AIService({
          baseURL: 'http://localhost:3000',
          model: 'openai',
          enableWebSocket: true
        });

        // 检测当前文档类型并创建适配器
        if (Office.context.host === Office.HostType.Word) {
          documentAdapterRef.current = new WordAdapter();
          setCurrentDocumentType('word');
          setCurrentFilename('document.docx');
        } else if (Office.context.host === Office.HostType.Excel) {
          documentAdapterRef.current = new ExcelAdapter();
          setCurrentDocumentType('excel');
          setCurrentFilename('workbook.xlsx');
        } else if (Office.context.host === Office.HostType.PowerPoint) {
          documentAdapterRef.current = new PowerPointAdapter();
          setCurrentDocumentType('powerpoint');
          setCurrentFilename('presentation.pptx');
        }

        // 创建对话
        await aiServiceRef.current.createConversation(
          currentDocumentType,
          currentFilename
        );

        // 设置WebSocket事件监听
        aiServiceRef.current.onProgress((progress) => {
          console.log('AI进度更新:', progress);
          // 可以在UI上显示进度
        });

        aiServiceRef.current.onError((error) => {
          console.error('AI服务错误:', error);
          const errorMessage: ChatMessage = {
            id: `error-${Date.now()}`,
            type: 'error',
            content: `错误: ${error.message}`,
            timestamp: Date.now()
          };
          setChatMessages(prev => [...prev, errorMessage]);
        });

        setConnectionStatus('connected');

        // 添加欢迎消息
        const welcomeMessage: ChatMessage = {
          id: 'welcome',
          type: 'assistant',
          content: `您好！我是Office AI助手，已准备好帮助您编辑${currentDocumentType === 'word' ? 'Word文档' : currentDocumentType === 'excel' ? 'Excel工作簿' : 'PowerPoint演示文稿'}。请告诉我您需要什么帮助。`,
          timestamp: Date.now()
        };
        setChatMessages([welcomeMessage]);

      } catch (error) {
        console.error('初始化服务失败:', error);
        setConnectionStatus('disconnected');

        const errorMessage: ChatMessage = {
          id: 'init-error',
          type: 'error',
          content: '无法连接到AI服务，请检查Bridge Server是否正常运行。',
          timestamp: Date.now()
        };
        setChatMessages([errorMessage]);
      }
    };

    initializeServices();

    return () => {
      changeManager.off('changes:updated', handleChangesUpdate);

      // 清理AI服务连接
      if (aiServiceRef.current) {
        aiServiceRef.current.disconnect();
      }
    };
  }, [changeManager]);

  const handleSendMessage = async (content: string) => {
    if (!aiServiceRef.current || connectionStatus !== 'connected') {
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        type: 'error',
        content: '未连接到AI服务，请刷新页面重试。',
        timestamp: Date.now()
      };
      setChatMessages(prev => [...prev, errorMessage]);
      return;
    }

    setIsLoading(true);

    // 添加用户消息
    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      type: 'user',
      content,
      timestamp: Date.now()
    };

    setChatMessages(prev => [...prev, userMessage]);

    try {
      // 读取当前文档数据
      let documentData: ArrayBuffer | undefined;
      if (documentAdapterRef.current) {
        try {
          const buffer = await documentAdapterRef.current.getDocumentData();
          documentData = buffer.buffer as ArrayBuffer;
        } catch (error) {
          console.warn('读取文档数据失败，将不发送文档内容:', error);
        }
      }

      // 使用流式响应
      let aiContent = '';
      const aiMessageId = `msg-${Date.now()}-ai`;

      // 先添加一个占位的AI消息
      const aiMessage: ChatMessage = {
        id: aiMessageId,
        type: 'assistant',
        content: '',
        timestamp: Date.now()
      };
      setChatMessages(prev => [...prev, aiMessage]);

      // 流式接收AI响应
      await aiServiceRef.current.sendMessageStream(
        content,
        documentData,
        // onChunk: 接收到消息片段
        (chunk: string) => {
          aiContent += chunk;
          setChatMessages(prev =>
            prev.map(msg =>
              msg.id === aiMessageId
                ? { ...msg, content: aiContent }
                : msg
            )
          );
        },
        // onComplete: 消息完成
        async (response) => {
          console.log('AI响应完成:', response);

          // 如果有文档更新，应用到Office
          if (response.documentData && documentAdapterRef.current) {
            try {
              // Base64解码为ArrayBuffer
              const binaryString = atob(response.documentData);
              const bytes = new Uint8Array(binaryString.length);
              for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
              }
              const updatedBuffer = Buffer.from(bytes);

              await documentAdapterRef.current.updateDocument(updatedBuffer);

              console.log('文档已更新');
            } catch (error) {
              console.error('更新文档失败:', error);
              const errorMsg: ChatMessage = {
                id: `error-${Date.now()}`,
                type: 'error',
                content: `文档更新失败: ${(error as Error).message}`,
                timestamp: Date.now()
              };
              setChatMessages(prev => [...prev, errorMsg]);
            }
          }

          // 如果有工具调用信息，记录日志
          if (response.toolCalls && response.toolCalls.length > 0) {
            console.log('AI执行了以下工具:', response.toolCalls);
            // 可以在UI上显示工具调用详情
          }

          setIsLoading(false);
        },
        // onError: 错误处理
        (error: Error) => {
          console.error('发送消息失败:', error);
          const errorMessage: ChatMessage = {
            id: `error-${Date.now()}`,
            type: 'error',
            content: `发送失败: ${error.message}`,
            timestamp: Date.now()
          };
          setChatMessages(prev => [...prev, errorMessage]);
          setIsLoading(false);
        }
      );

    } catch (error) {
      console.error('发送消息失败:', error);
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        type: 'error',
        content: `发送失败: ${(error as Error).message}`,
        timestamp: Date.now()
      };
      setChatMessages(prev => [...prev, errorMessage]);
      setIsLoading(false);
    }
  };

  const handleAcceptChange = async (changeId: string) => {
    try {
      await changeManager.acceptChange(changeId);
    } catch (error) {
      console.error('接受修改失败:', error);
    }
  };

  const handleRejectChange = async (changeId: string) => {
    try {
      await changeManager.rejectChange(changeId);
    } catch (error) {
      console.error('拒绝修改失败:', error);
    }
  };

  const handleAcceptAll = async () => {
    try {
      await changeManager.acceptAll();
    } catch (error) {
      console.error('批量接受失败:', error);
    }
  };

  const handleRejectAll = async () => {
    try {
      await changeManager.rejectAll();
    } catch (error) {
      console.error('批量拒绝失败:', error);
    }
  };

  const handleVersionRestore = async (versionId: string) => {
    try {
      // 这里应该调用版本管理器
      console.log('恢复版本:', versionId);
    } catch (error) {
      console.error('恢复版本失败:', error);
    }
  };

  const handleVersionCompare = (versionId1: string, versionId2: string) => {
    console.log('对比版本:', versionId1, versionId2);
  };

  const pendingChanges = changes.filter(c => c.status === 'pending');
  const stats = changeManager.getStats();

  return (
    <div className="main-interface">
      <div className="interface-header">
        <h2>Office AI 助手</h2>
        <div className="stats-bar">
          <span className="stat-item">
            待处理: <strong>{stats.pending}</strong>
          </span>
          <span className="stat-item">
            已接受: <strong>{stats.accepted}</strong>
          </span>
          <span className="stat-item">
            已拒绝: <strong>{stats.rejected}</strong>
          </span>
        </div>
      </div>

      <div className="interface-content">
        <div className="left-panel">
          <div className="tab-navigation">
            <button
              className={activeTab === 'chat' ? 'active' : ''}
              onClick={() => setActiveTab('chat')}
            >
              💬 对话
            </button>
            <button
              className={activeTab === 'diff' ? 'active' : ''}
              onClick={() => setActiveTab('diff')}
            >
              📋 预览
            </button>
            <button
              className={activeTab === 'history' ? 'active' : ''}
              onClick={() => setActiveTab('history')}
            >
              📚 历史
            </button>
          </div>

          <div className="tab-content">
            {activeTab === 'chat' && (
              <ChatPanel
                messages={chatMessages}
                onSendMessage={handleSendMessage}
                isLoading={isLoading}
              />
            )}

            {activeTab === 'diff' && (
              <DiffPreviewPanel
                changes={pendingChanges}
                selectedChangeId={selectedChangeId}
                onChangeSelect={setSelectedChangeId}
              />
            )}

            {activeTab === 'history' && (
              <VersionHistory
                versions={versions}
                onRestore={handleVersionRestore}
                onCompare={handleVersionCompare}
              />
            )}
          </div>
        </div>

        <div className="right-panel">
          <ChangesList
            changes={pendingChanges}
            onAccept={handleAcceptChange}
            onReject={handleRejectChange}
            onAcceptAll={handleAcceptAll}
            onRejectAll={handleRejectAll}
            onView={setSelectedChangeId}
          />
        </div>
      </div>

      {isLoading && (
        <div className="loading-overlay">
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>AI正在处理您的请求...</p>
          </div>
        </div>
      )}
    </div>
  );
};