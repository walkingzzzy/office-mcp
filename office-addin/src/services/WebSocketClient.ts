import { WebSocketMessage, ChatMessage } from '../types';

export type WebSocketEventType = 'open' | 'close' | 'error' | 'message' | 'reconnect';

export interface WebSocketEventHandlers {
  onOpen?: () => void;
  onClose?: (event: CloseEvent) => void;
  onError?: (error: Event) => void;
  onMessage?: (message: WebSocketMessage) => void;
  onReconnect?: (attempt: number) => void;
}

export class WebSocketClient {
  private ws: WebSocket | null = null;
  private url: string;
  private handlers: WebSocketEventHandlers = {};
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private isConnecting = false;
  private shouldReconnect = true;

  constructor(url: string) {
    this.url = url;
  }

  /**
   * 连接WebSocket
   */
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.isConnecting || this.isConnected()) {
        resolve();
        return;
      }

      this.isConnecting = true;

      try {
        this.ws = new WebSocket(this.url);

        this.ws.onopen = () => {
          this.isConnecting = false;
          this.reconnectAttempts = 0;
          this.handlers.onOpen?.();
          resolve();
        };

        this.ws.onclose = (event) => {
          this.isConnecting = false;
          this.handlers.onClose?.(event);

          if (this.shouldReconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.scheduleReconnect();
          }
        };

        this.ws.onerror = (error) => {
          this.isConnecting = false;
          this.handlers.onError?.(error);
          reject(error);
        };

        this.ws.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data);
            this.handlers.onMessage?.(message);
          } catch (error) {
            console.error('解析WebSocket消息失败:', error);
          }
        };

      } catch (error) {
        this.isConnecting = false;
        reject(error);
      }
    });
  }

  /**
   * 断开连接
   */
  disconnect(): void {
    this.shouldReconnect = false;
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  /**
   * 发送消息
   */
  send(message: WebSocketMessage): boolean {
    if (!this.isConnected()) {
      console.warn('WebSocket未连接，无法发送消息');
      return false;
    }

    try {
      this.ws!.send(JSON.stringify(message));
      return true;
    } catch (error) {
      console.error('发送WebSocket消息失败:', error);
      return false;
    }
  }

  /**
   * 发送聊天消息
   */
  sendChatMessage(content: string, messageId?: string): boolean {
    return this.send({
      type: 'message',
      data: {
        content,
        timestamp: Date.now()
      },
      id: messageId
    });
  }

  /**
   * 检查连接状态
   */
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  /**
   * 获取连接状态
   */
  getReadyState(): number {
    return this.ws?.readyState ?? WebSocket.CLOSED;
  }

  /**
   * 设置事件处理器
   */
  setEventHandlers(handlers: WebSocketEventHandlers): void {
    this.handlers = { ...this.handlers, ...handlers };
  }

  /**
   * 设置重连配置
   */
  setReconnectConfig(maxAttempts: number, delay: number): void {
    this.maxReconnectAttempts = maxAttempts;
    this.reconnectDelay = delay;
  }

  /**
   * 计划重连
   */
  private scheduleReconnect(): void {
    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    setTimeout(() => {
      if (this.shouldReconnect) {
        this.handlers.onReconnect?.(this.reconnectAttempts);
        this.connect().catch(console.error);
      }
    }, delay);
  }

  /**
   * 获取连接统计信息
   */
  getStats(): {
    isConnected: boolean;
    reconnectAttempts: number;
    readyState: string;
  } {
    const readyStateMap: Record<number, string> = {
      [WebSocket.CONNECTING]: 'CONNECTING',
      [WebSocket.OPEN]: 'OPEN',
      [WebSocket.CLOSING]: 'CLOSING',
      [WebSocket.CLOSED]: 'CLOSED'
    };

    return {
      isConnected: this.isConnected(),
      reconnectAttempts: this.reconnectAttempts,
      readyState: readyStateMap[this.getReadyState()] || 'UNKNOWN'
    };
  }
}

export default WebSocketClient;