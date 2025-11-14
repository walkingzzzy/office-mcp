import { ChatMessage, WebSocketMessage, MessageType } from '../types';

export interface StreamChunk {
  id: string;
  content: string;
  isComplete: boolean;
  metadata?: any;
}

export interface StreamProcessorOptions {
  onChunk?: (chunk: StreamChunk) => void;
  onComplete?: (message: ChatMessage) => void;
  onError?: (error: string) => void;
  onProgress?: (progress: number) => void;
}

export class MessageStreamProcessor {
  private activeStreams = new Map<string, {
    message: ChatMessage;
    buffer: string;
    startTime: number;
  }>();

  private options: StreamProcessorOptions;

  constructor(options: StreamProcessorOptions = {}) {
    this.options = options;
  }

  /**
   * 处理WebSocket消息
   */
  processMessage(wsMessage: WebSocketMessage): ChatMessage | null {
    switch (wsMessage.type) {
      case 'message':
        return this.processStreamMessage(wsMessage);
      case 'progress':
        return this.processProgressMessage(wsMessage);
      case 'error':
        return this.processErrorMessage(wsMessage);
      case 'status':
        return this.processStatusMessage(wsMessage);
      default:
        console.warn('未知的WebSocket消息类型:', wsMessage.type);
        return null;
    }
  }

  /**
   * 处理流式消息
   */
  private processStreamMessage(wsMessage: WebSocketMessage): ChatMessage | null {
    const { id, data } = wsMessage;
    if (!id) return null;

    const { content, isComplete = false, metadata } = data;

    if (!this.activeStreams.has(id)) {
      // 创建新的流
      const message: ChatMessage = {
        id,
        type: 'assistant',
        content: '',
        timestamp: Date.now(),
        status: 'delivered',
        metadata
      };

      this.activeStreams.set(id, {
        message,
        buffer: '',
        startTime: Date.now()
      });
    }

    const stream = this.activeStreams.get(id)!;

    // 累积内容
    if (content) {
      stream.buffer += content;
      stream.message.content = stream.buffer;
    }

    // 更新元数据
    if (metadata) {
      stream.message.metadata = { ...stream.message.metadata, ...metadata };
    }

    // 触发分块回调
    this.options.onChunk?.({
      id,
      content: stream.buffer,
      isComplete,
      metadata
    });

    if (isComplete) {
      // 流完成
      const finalMessage = { ...stream.message };
      this.activeStreams.delete(id);

      this.options.onComplete?.(finalMessage);
      return finalMessage;
    }

    return { ...stream.message };
  }

  /**
   * 处理进度消息
   */
  private processProgressMessage(wsMessage: WebSocketMessage): ChatMessage | null {
    const { id, data } = wsMessage;
    if (!id) return null;

    const { progress, status, description } = data;

    if (this.activeStreams.has(id)) {
      const stream = this.activeStreams.get(id)!;
      stream.message.metadata = {
        ...stream.message.metadata,
        progress
      };

      this.options.onProgress?.(progress);
      return { ...stream.message };
    }

    return null;
  }

  /**
   * 处理错误消息
   */
  private processErrorMessage(wsMessage: WebSocketMessage): ChatMessage {
    const { id, data } = wsMessage;
    const { error, code, details } = data;

    // 如果有对应的流，标记为错误
    if (id && this.activeStreams.has(id)) {
      const stream = this.activeStreams.get(id)!;
      stream.message.type = 'error';
      stream.message.content = error || '处理过程中发生错误';
      stream.message.metadata = {
        ...stream.message.metadata,
        error
      };

      const errorMessage = { ...stream.message };
      this.activeStreams.delete(id);

      this.options.onError?.(error);
      return errorMessage;
    }

    // 创建独立的错误消息
    const errorMessage: ChatMessage = {
      id: id || this.generateId(),
      type: 'error',
      content: error || '发生未知错误',
      timestamp: Date.now(),
      metadata: { error }
    };

    this.options.onError?.(error);
    return errorMessage;
  }

  /**
   * 处理状态消息
   */
  private processStatusMessage(wsMessage: WebSocketMessage): ChatMessage | null {
    const { id, data } = wsMessage;
    const { status, message } = data;

    if (status === 'typing') {
      // 显示打字指示器
      return null;
    }

    if (status === 'connected' || status === 'disconnected') {
      // 系统状态消息
      return {
        id: this.generateId(),
        type: 'system',
        content: message || `连接状态: ${status}`,
        timestamp: Date.now()
      };
    }

    return null;
  }

  /**
   * 取消活跃的流
   */
  cancelStream(id: string): void {
    if (this.activeStreams.has(id)) {
      this.activeStreams.delete(id);
    }
  }

  /**
   * 取消所有活跃的流
   */
  cancelAllStreams(): void {
    this.activeStreams.clear();
  }

  /**
   * 获取活跃流的统计信息
   */
  getActiveStreamsStats(): {
    count: number;
    streams: Array<{
      id: string;
      duration: number;
      contentLength: number;
    }>;
  } {
    const now = Date.now();
    const streams = Array.from(this.activeStreams.entries()).map(([id, stream]) => ({
      id,
      duration: now - stream.startTime,
      contentLength: stream.buffer.length
    }));

    return {
      count: this.activeStreams.size,
      streams
    };
  }

  /**
   * 生成唯一ID
   */
  private generateId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 设置选项
   */
  setOptions(options: Partial<StreamProcessorOptions>): void {
    this.options = { ...this.options, ...options };
  }
}

export default MessageStreamProcessor;