import { ChatMessage as OpenAIMessage } from './OpenAIService';
import { ClaudeMessage } from './ClaudeService';
import logger from '../utils/logger';

export interface ConversationMessage {
  id: string;
  role: 'system' | 'user' | 'assistant' | 'function' | 'tool';
  content: string;
  timestamp: number;
  metadata?: {
    toolCalls?: any[];
    functionCall?: any;
    model?: string;
    tokens?: number;
  };
}

export interface Conversation {
  id: string;
  title: string;
  messages: ConversationMessage[];
  context: Record<string, any>;
  createdAt: number;
  updatedAt: number;
  model: 'openai' | 'claude';
  maxMessages?: number;
}

export class ConversationManager {
  private conversations = new Map<string, Conversation>();
  private defaultMaxMessages = 50;

  /**
   * 创建新对话
   */
  createConversation(
    title: string,
    model: 'openai' | 'claude' = 'openai',
    systemPrompt?: string
  ): Conversation {
    const conversation: Conversation = {
      id: this.generateId(),
      title,
      messages: [],
      context: {},
      createdAt: Date.now(),
      updatedAt: Date.now(),
      model,
      maxMessages: this.defaultMaxMessages
    };

    if (systemPrompt) {
      conversation.messages.push({
        id: this.generateId(),
        role: 'system',
        content: systemPrompt,
        timestamp: Date.now()
      });
    }

    this.conversations.set(conversation.id, conversation);
    logger.info('创建新对话', { conversationId: conversation.id, model });
    return conversation;
  }

  /**
   * 获取对话
   */
  getConversation(conversationId: string): Conversation | undefined {
    return this.conversations.get(conversationId);
  }

  /**
   * 添加消息到对话
   */
  addMessage(
    conversationId: string,
    role: ConversationMessage['role'],
    content: string,
    metadata?: ConversationMessage['metadata']
  ): ConversationMessage | null {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) {
      logger.error('对话不存在', { conversationId });
      return null;
    }

    const message: ConversationMessage = {
      id: this.generateId(),
      role,
      content,
      timestamp: Date.now(),
      metadata
    };

    conversation.messages.push(message);
    conversation.updatedAt = Date.now();

    // 限制消息数量
    this.enforceMessageLimit(conversation);

    // 自动更新标题
    if (conversation.messages.length === 2 && role === 'user') {
      conversation.title = this.generateTitle(content);
    }

    logger.debug('添加消息到对话', {
      conversationId,
      messageId: message.id,
      role
    });

    return message;
  }

  /**
   * 更新消息
   */
  updateMessage(
    conversationId: string,
    messageId: string,
    updates: Partial<ConversationMessage>
  ): boolean {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) return false;

    const messageIndex = conversation.messages.findIndex(m => m.id === messageId);
    if (messageIndex === -1) return false;

    conversation.messages[messageIndex] = {
      ...conversation.messages[messageIndex],
      ...updates
    };
    conversation.updatedAt = Date.now();

    return true;
  }

  /**
   * 删除消息
   */
  deleteMessage(conversationId: string, messageId: string): boolean {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) return false;

    const messageIndex = conversation.messages.findIndex(m => m.id === messageId);
    if (messageIndex === -1) return false;

    conversation.messages.splice(messageIndex, 1);
    conversation.updatedAt = Date.now();

    return true;
  }

  /**
   * 获取对话消息（适配OpenAI格式）
   */
  getOpenAIMessages(conversationId: string): OpenAIMessage[] {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) return [];

    return conversation.messages.map(msg => ({
      role: msg.role as any,
      content: msg.content,
      ...(msg.metadata?.functionCall && { function_call: msg.metadata.functionCall }),
      ...(msg.role === 'function' && { name: msg.metadata?.functionCall?.name })
    }));
  }

  /**
   * 获取对话消息（适配Claude格式）
   */
  getClaudeMessages(conversationId: string): ClaudeMessage[] {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) return [];

    const messages: ClaudeMessage[] = [];
    const nonSystemMessages = conversation.messages.filter(m => m.role !== 'system');

    for (const msg of nonSystemMessages) {
      if (msg.role === 'user' || msg.role === 'assistant') {
        messages.push({
          role: msg.role,
          content: msg.content
        });
      }
    }

    return messages;
  }

  /**
   * 设置对话上下文
   */
  setContext(conversationId: string, key: string, value: any): boolean {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) return false;

    conversation.context[key] = value;
    conversation.updatedAt = Date.now();
    return true;
  }

  /**
   * 获取对话上下文
   */
  getContext(conversationId: string, key?: string): any {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) return null;

    return key ? conversation.context[key] : conversation.context;
  }

  /**
   * 清空对话消息
   */
  clearMessages(conversationId: string, keepSystem = true): boolean {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) return false;

    if (keepSystem) {
      conversation.messages = conversation.messages.filter(m => m.role === 'system');
    } else {
      conversation.messages = [];
    }

    conversation.updatedAt = Date.now();
    return true;
  }

  /**
   * 删除对话
   */
  deleteConversation(conversationId: string): boolean {
    const deleted = this.conversations.delete(conversationId);
    if (deleted) {
      logger.info('删除对话', { conversationId });
    }
    return deleted;
  }

  /**
   * 获取所有对话
   */
  getAllConversations(): Conversation[] {
    return Array.from(this.conversations.values())
      .sort((a, b) => b.updatedAt - a.updatedAt);
  }

  /**
   * 搜索对话
   */
  searchConversations(query: string): Conversation[] {
    const queryLower = query.toLowerCase();
    return Array.from(this.conversations.values())
      .filter(conv =>
        conv.title.toLowerCase().includes(queryLower) ||
        conv.messages.some(msg =>
          msg.content.toLowerCase().includes(queryLower)
        )
      )
      .sort((a, b) => b.updatedAt - a.updatedAt);
  }

  /**
   * 限制消息数量
   */
  private enforceMessageLimit(conversation: Conversation): void {
    const maxMessages = conversation.maxMessages || this.defaultMaxMessages;

    if (conversation.messages.length > maxMessages) {
      // 保留系统消息
      const systemMessages = conversation.messages.filter(m => m.role === 'system');
      const otherMessages = conversation.messages.filter(m => m.role !== 'system');

      // 保留最新的消息
      const keepCount = maxMessages - systemMessages.length;
      const keptMessages = otherMessages.slice(-keepCount);

      conversation.messages = [...systemMessages, ...keptMessages];
    }
  }

  /**
   * 生成对话标题
   */
  private generateTitle(firstMessage: string): string {
    const maxLength = 30;
    const cleaned = firstMessage.replace(/\n/g, ' ').trim();

    if (cleaned.length <= maxLength) {
      return cleaned;
    }

    return cleaned.substring(0, maxLength - 3) + '...';
  }

  /**
   * 生成唯一ID
   */
  private generateId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 获取统计信息
   */
  getStats(): {
    totalConversations: number;
    totalMessages: number;
    averageMessagesPerConversation: number;
    modelDistribution: Record<string, number>;
  } {
    const conversations = Array.from(this.conversations.values());
    const totalMessages = conversations.reduce((sum, conv) => sum + conv.messages.length, 0);
    const modelDistribution: Record<string, number> = {};

    for (const conv of conversations) {
      modelDistribution[conv.model] = (modelDistribution[conv.model] || 0) + 1;
    }

    return {
      totalConversations: conversations.length,
      totalMessages,
      averageMessagesPerConversation: conversations.length > 0
        ? Math.round(totalMessages / conversations.length)
        : 0,
      modelDistribution
    };
  }

  /**
   * 清理过期对话
   */
  cleanupExpiredConversations(maxAge: number = 7 * 24 * 60 * 60 * 1000): number {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [id, conversation] of this.conversations.entries()) {
      if (now - conversation.updatedAt > maxAge) {
        this.conversations.delete(id);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      logger.info(`清理了 ${cleanedCount} 个过期对话`);
    }

    return cleanedCount;
  }
}

export default ConversationManager;