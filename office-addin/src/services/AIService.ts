import { HttpClient } from './HttpClient';
import { WebSocketClient } from './WebSocketClient';
import { ApiResponse, ChatMessage } from '../types';

/**
 * AI服务配置
 */
interface AIServiceConfig {
  baseURL?: string;
  model?: 'openai' | 'claude';
  enableWebSocket?: boolean;
}

/**
 * 对话信息
 */
interface ConversationInfo {
  id: string;
  title: string;
  model: string;
  systemPromptGenerated: boolean;
  systemPromptLength: number;
  createdAt: number;
}

/**
 * AI消息响应
 */
interface AIMessageResponse {
  messageId: string;
  content: string;
  toolCalls?: Array<{
    name: string;
    arguments: any;
    result: any;
  }>;
  documentData?: string; // Base64编码的文档数据
}

/**
 * AI服务类
 * 封装与Bridge Server的AI对话通信
 */
export class AIService {
  private httpClient: HttpClient;
  private wsClient: WebSocketClient | null = null;
  private conversationId: string | null = null;
  private model: string = 'openai';
  private enableWebSocket: boolean = false;

  constructor(config?: AIServiceConfig) {
    this.httpClient = new HttpClient({
      baseURL: config?.baseURL || 'http://localhost:3000'
    });

    this.model = config?.model || 'openai';
    this.enableWebSocket = config?.enableWebSocket ?? true;
  }

  /**
   * 创建对话
   * @param documentType 文档类型
   * @param filename 文件名
   * @param title 对话标题（可选）
   * @param useSimplifiedPrompt 是否使用简化版Prompt（可选）
   */
  async createConversation(
    documentType: 'word' | 'excel' | 'powerpoint',
    filename: string,
    title?: string,
    useSimplifiedPrompt: boolean = false
  ): Promise<ConversationInfo> {
    const response = await this.httpClient.post<ConversationInfo>('/api/conversations', {
      title: title || `编辑 ${filename}`,
      model: this.model,
      documentType,
      filename,
      useSimplifiedPrompt
    });

    if (!response.success || !response.data) {
      throw new Error(response.error || '创建对话失败');
    }

    this.conversationId = response.data.id;

    // 如果启用WebSocket，建立连接
    if (this.enableWebSocket) {
      this.wsClient = new WebSocketClient(
        this.httpClient.getBaseURL().replace('http', 'ws')
      );
      await this.wsClient.connect(`/ws/session/${this.conversationId}`);
    }

    return response.data;
  }

  /**
   * 发送消息
   * @param message 用户消息
   * @param documentData 文档数据（可选，ArrayBuffer格式）
   */
  async sendMessage(
    message: string,
    documentData?: ArrayBuffer
  ): Promise<AIMessageResponse> {
    if (!this.conversationId) {
      throw new Error('未创建对话，请先调用 createConversation()');
    }

    // 将ArrayBuffer转换为Base64
    let base64Data: string | undefined;
    if (documentData) {
      const uint8Array = new Uint8Array(documentData);
      base64Data = btoa(String.fromCharCode.apply(null, Array.from(uint8Array)));
    }

    const response = await this.httpClient.post<AIMessageResponse>(
      `/api/conversations/${this.conversationId}/messages`,
      {
        message,
        documentData: base64Data
      }
    );

    if (!response.success || !response.data) {
      throw new Error(response.error || '发送消息失败');
    }

    return response.data;
  }

  /**
   * 流式发送消息（使用Server-Sent Events）
   * @param message 用户消息
   * @param documentData 文档数据（可选）
   * @param onChunk 接收到消息片段时的回调
   * @param onComplete 消息完成时的回调
   * @param onError 错误时的回调
   */
  async sendMessageStream(
    message: string,
    documentData: ArrayBuffer | undefined,
    onChunk: (content: string) => void,
    onComplete?: (response: AIMessageResponse) => void,
    onError?: (error: Error) => void
  ): Promise<void> {
    if (!this.conversationId) {
      throw new Error('未创建对话，请先调用 createConversation()');
    }

    // 将ArrayBuffer转换为Base64
    let base64Data: string | undefined;
    if (documentData) {
      const uint8Array = new Uint8Array(documentData);
      base64Data = btoa(String.fromCharCode.apply(null, Array.from(uint8Array)));
    }

    try {
      const response = await fetch(
        `${this.httpClient.getBaseURL()}/api/conversations/${this.conversationId}/stream-chat`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            message,
            documentData: base64Data
          })
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('无法读取响应流');
      }

      const decoder = new TextDecoder();
      let buffer = '';
      let fullContent = '';

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim() || !line.startsWith('data: ')) continue;

          const data = line.substring(6); // 移除 "data: " 前缀

          try {
            const parsed = JSON.parse(data);

            if (parsed.content) {
              fullContent += parsed.content;
              onChunk(parsed.content);
            }

            if (parsed.done) {
              if (onComplete) {
                onComplete({
                  messageId: parsed.messageId || `msg_${Date.now()}`,
                  content: fullContent,
                  toolCalls: parsed.toolCalls,
                  documentData: parsed.documentData
                });
              }
            }
          } catch (e) {
            console.warn('解析SSE消息失败:', data, e);
          }
        }
      }
    } catch (error) {
      console.error('流式发送消息失败:', error);
      if (onError) {
        onError(error as Error);
      }
      throw error;
    }
  }

  /**
   * 获取对话历史
   */
  async getConversation(): Promise<any> {
    if (!this.conversationId) {
      throw new Error('未创建对话');
    }

    const response = await this.httpClient.get(
      `/api/conversations/${this.conversationId}`
    );

    if (!response.success) {
      throw new Error(response.error || '获取对话失败');
    }

    return response.data;
  }

  /**
   * 监听WebSocket消息
   * @param callback 消息回调
   */
  onWebSocketMessage(callback: (data: any) => void): void {
    if (this.wsClient) {
      this.wsClient.on('message', callback);
    }
  }

  /**
   * 监听进度更新
   * @param callback 进度回调
   */
  onProgress(callback: (progress: { tool: string; status: string; progress?: number }) => void): void {
    if (this.wsClient) {
      this.wsClient.on('progress', callback);
    }
  }

  /**
   * 监听错误
   * @param callback 错误回调
   */
  onError(callback: (error: Error) => void): void {
    if (this.wsClient) {
      this.wsClient.on('error', callback);
    }
  }

  /**
   * 获取当前对话ID
   */
  getConversationId(): string | null {
    return this.conversationId;
  }

  /**
   * 设置对话ID（用于恢复已有对话）
   */
  setConversationId(id: string): void {
    this.conversationId = id;
  }

  /**
   * 关闭连接
   */
  async disconnect(): Promise<void> {
    if (this.wsClient) {
      await this.wsClient.disconnect();
      this.wsClient = null;
    }
  }

  /**
   * 重置服务状态
   */
  reset(): void {
    this.conversationId = null;
    if (this.wsClient) {
      this.wsClient.disconnect();
      this.wsClient = null;
    }
  }
}

// 导出单例（可选，也可以每次创建新实例）
export default new AIService();
