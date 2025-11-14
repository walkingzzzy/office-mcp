import { ChatSession, ChatMessage } from '../types';

export interface ChatHistoryOptions {
  maxSessions?: number;
  maxMessagesPerSession?: number;
  storageKey?: string;
  autoSave?: boolean;
}

export class ChatHistoryManager {
  private sessions = new Map<string, ChatSession>();
  private currentSessionId: string | null = null;
  private options: Required<ChatHistoryOptions>;

  constructor(options: ChatHistoryOptions = {}) {
    this.options = {
      maxSessions: options.maxSessions ?? 50,
      maxMessagesPerSession: options.maxMessagesPerSession ?? 1000,
      storageKey: options.storageKey ?? 'office-ai-chat-history',
      autoSave: options.autoSave ?? true
    };

    this.loadFromStorage();
  }

  /**
   * 创建新的聊天会话
   */
  createSession(title?: string): ChatSession {
    const session: ChatSession = {
      id: this.generateId(),
      title: title || `对话 ${new Date().toLocaleString('zh-CN')}`,
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    this.sessions.set(session.id, session);
    this.currentSessionId = session.id;

    // 限制会话数量
    this.enforceSessionLimit();

    if (this.options.autoSave) {
      this.saveToStorage();
    }

    return session;
  }

  /**
   * 获取当前会话
   */
  getCurrentSession(): ChatSession | null {
    if (!this.currentSessionId) {
      return null;
    }
    return this.sessions.get(this.currentSessionId) || null;
  }

  /**
   * 切换到指定会话
   */
  switchToSession(sessionId: string): ChatSession | null {
    const session = this.sessions.get(sessionId);
    if (session) {
      this.currentSessionId = sessionId;
      return session;
    }
    return null;
  }

  /**
   * 添加消息到当前会话
   */
  addMessage(message: ChatMessage): void {
    let session = this.getCurrentSession();

    if (!session) {
      session = this.createSession();
    }

    session.messages.push(message);
    session.updatedAt = Date.now();

    // 限制消息数量
    this.enforceMessageLimit(session);

    // 自动更新会话标题
    this.updateSessionTitle(session);

    if (this.options.autoSave) {
      this.saveToStorage();
    }
  }

  /**
   * 更新消息
   */
  updateMessage(messageId: string, updates: Partial<ChatMessage>): boolean {
    const session = this.getCurrentSession();
    if (!session) return false;

    const messageIndex = session.messages.findIndex(m => m.id === messageId);
    if (messageIndex === -1) return false;

    session.messages[messageIndex] = {
      ...session.messages[messageIndex],
      ...updates
    };
    session.updatedAt = Date.now();

    if (this.options.autoSave) {
      this.saveToStorage();
    }

    return true;
  }

  /**
   * 删除消息
   */
  deleteMessage(messageId: string): boolean {
    const session = this.getCurrentSession();
    if (!session) return false;

    const messageIndex = session.messages.findIndex(m => m.id === messageId);
    if (messageIndex === -1) return false;

    session.messages.splice(messageIndex, 1);
    session.updatedAt = Date.now();

    if (this.options.autoSave) {
      this.saveToStorage();
    }

    return true;
  }

  /**
   * 获取所有会话
   */
  getAllSessions(): ChatSession[] {
    return Array.from(this.sessions.values())
      .sort((a, b) => b.updatedAt - a.updatedAt);
  }

  /**
   * 获取会话
   */
  getSession(sessionId: string): ChatSession | null {
    return this.sessions.get(sessionId) || null;
  }

  /**
   * 删除会话
   */
  deleteSession(sessionId: string): boolean {
    const deleted = this.sessions.delete(sessionId);

    if (deleted && this.currentSessionId === sessionId) {
      // 切换到最近的会话
      const sessions = this.getAllSessions();
      this.currentSessionId = sessions.length > 0 ? sessions[0].id : null;
    }

    if (deleted && this.options.autoSave) {
      this.saveToStorage();
    }

    return deleted;
  }

  /**
   * 更新会话标题
   */
  updateSessionTitle(sessionOrId: ChatSession | string, title?: string): boolean {
    const session = typeof sessionOrId === 'string'
      ? this.sessions.get(sessionOrId)
      : sessionOrId;

    if (!session) return false;

    if (title) {
      session.title = title;
    } else {
      // 自动生成标题
      const firstUserMessage = session.messages.find(m => m.type === 'user');
      if (firstUserMessage) {
        session.title = this.truncateText(firstUserMessage.content, 30);
      }
    }

    session.updatedAt = Date.now();

    if (this.options.autoSave) {
      this.saveToStorage();
    }

    return true;
  }

  /**
   * 清空所有历史
   */
  clearAllHistory(): void {
    this.sessions.clear();
    this.currentSessionId = null;

    if (this.options.autoSave) {
      this.saveToStorage();
    }
  }

  /**
   * 搜索消息
   */
  searchMessages(query: string, sessionId?: string): Array<{
    session: ChatSession;
    message: ChatMessage;
    matchIndex: number;
  }> {
    const results: Array<{
      session: ChatSession;
      message: ChatMessage;
      matchIndex: number;
    }> = [];

    const sessionsToSearch = sessionId
      ? [this.sessions.get(sessionId)].filter(Boolean) as ChatSession[]
      : Array.from(this.sessions.values());

    const queryLower = query.toLowerCase();

    for (const session of sessionsToSearch) {
      for (const message of session.messages) {
        const contentLower = message.content.toLowerCase();
        const matchIndex = contentLower.indexOf(queryLower);

        if (matchIndex !== -1) {
          results.push({
            session,
            message,
            matchIndex
          });
        }
      }
    }

    return results.sort((a, b) => b.message.timestamp - a.message.timestamp);
  }

  /**
   * 导出历史数据
   */
  exportHistory(): string {
    const data = {
      sessions: Array.from(this.sessions.values()),
      currentSessionId: this.currentSessionId,
      exportedAt: Date.now()
    };

    return JSON.stringify(data, null, 2);
  }

  /**
   * 导入历史数据
   */
  importHistory(jsonData: string): boolean {
    try {
      const data = JSON.parse(jsonData);

      if (!data.sessions || !Array.isArray(data.sessions)) {
        throw new Error('Invalid data format');
      }

      this.sessions.clear();

      for (const session of data.sessions) {
        if (this.isValidSession(session)) {
          this.sessions.set(session.id, session);
        }
      }

      this.currentSessionId = data.currentSessionId || null;

      if (this.options.autoSave) {
        this.saveToStorage();
      }

      return true;
    } catch (error) {
      console.error('导入历史数据失败:', error);
      return false;
    }
  }

  /**
   * 获取统计信息
   */
  getStats(): {
    totalSessions: number;
    totalMessages: number;
    oldestSession: number | null;
    newestSession: number | null;
    averageMessagesPerSession: number;
  } {
    const sessions = Array.from(this.sessions.values());
    const totalMessages = sessions.reduce((sum, s) => sum + s.messages.length, 0);

    return {
      totalSessions: sessions.length,
      totalMessages,
      oldestSession: sessions.length > 0
        ? Math.min(...sessions.map(s => s.createdAt))
        : null,
      newestSession: sessions.length > 0
        ? Math.max(...sessions.map(s => s.updatedAt))
        : null,
      averageMessagesPerSession: sessions.length > 0
        ? Math.round(totalMessages / sessions.length)
        : 0
    };
  }

  /**
   * 保存到本地存储
   */
  private saveToStorage(): void {
    try {
      const data = {
        sessions: Array.from(this.sessions.entries()),
        currentSessionId: this.currentSessionId,
        savedAt: Date.now()
      };

      localStorage.setItem(this.options.storageKey, JSON.stringify(data));
    } catch (error) {
      console.error('保存聊天历史失败:', error);
    }
  }

  /**
   * 从本地存储加载
   */
  private loadFromStorage(): void {
    try {
      const data = localStorage.getItem(this.options.storageKey);
      if (!data) return;

      const parsed = JSON.parse(data);

      if (parsed.sessions && Array.isArray(parsed.sessions)) {
        this.sessions = new Map(parsed.sessions);
        this.currentSessionId = parsed.currentSessionId || null;
      }
    } catch (error) {
      console.error('加载聊天历史失败:', error);
    }
  }

  /**
   * 限制会话数量
   */
  private enforceSessionLimit(): void {
    const sessions = this.getAllSessions();

    if (sessions.length > this.options.maxSessions) {
      const sessionsToDelete = sessions.slice(this.options.maxSessions);

      for (const session of sessionsToDelete) {
        this.sessions.delete(session.id);
      }
    }
  }

  /**
   * 限制消息数量
   */
  private enforceMessageLimit(session: ChatSession): void {
    if (session.messages.length > this.options.maxMessagesPerSession) {
      const messagesToRemove = session.messages.length - this.options.maxMessagesPerSession;
      session.messages.splice(0, messagesToRemove);
    }
  }

  /**
   * 验证会话数据
   */
  private isValidSession(session: any): session is ChatSession {
    return session &&
      typeof session.id === 'string' &&
      typeof session.title === 'string' &&
      Array.isArray(session.messages) &&
      typeof session.createdAt === 'number' &&
      typeof session.updatedAt === 'number';
  }

  /**
   * 截断文本
   */
  private truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
  }

  /**
   * 生成唯一ID
   */
  private generateId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export default ChatHistoryManager;