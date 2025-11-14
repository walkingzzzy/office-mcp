import { WebSocketServer as WSServer, WebSocket } from 'ws';
import { IncomingMessage } from 'http';
import logger from '../utils/logger';

export interface WebSocketMessage {
  type: 'message' | 'progress' | 'error' | 'status';
  data: any;
  id?: string;
  timestamp?: number;
}

export interface ClientInfo {
  id: string;
  ip: string;
  userAgent?: string;
  connectedAt: number;
  lastActivity: number;
}

export class WebSocketServer {
  private wss: WSServer;
  private clients = new Map<WebSocket, ClientInfo>();
  private messageHandlers = new Map<string, (ws: WebSocket, data: any) => void>();

  constructor(port: number = 8080) {
    this.wss = new WSServer({ port });
    this.setupEventHandlers();
    logger.info(`WebSocket服务器启动在端口 ${port}`);
  }

  /**
   * 设置事件处理器
   */
  private setupEventHandlers(): void {
    this.wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
      const clientInfo: ClientInfo = {
        id: this.generateClientId(),
        ip: req.socket.remoteAddress || 'unknown',
        userAgent: req.headers['user-agent'],
        connectedAt: Date.now(),
        lastActivity: Date.now()
      };

      this.clients.set(ws, clientInfo);
      logger.info('WebSocket客户端连接', clientInfo);

      ws.on('message', (data: Buffer) => {
        try {
          const message: WebSocketMessage = JSON.parse(data.toString());
          this.handleMessage(ws, message);

          // 更新最后活动时间
          const client = this.clients.get(ws);
          if (client) {
            client.lastActivity = Date.now();
          }
        } catch (error) {
          logger.error('WebSocket消息解析失败', error);
          this.sendError(ws, 'Invalid message format');
        }
      });

      ws.on('close', () => {
        const client = this.clients.get(ws);
        if (client) {
          logger.info('WebSocket客户端断开连接', { clientId: client.id });
          this.clients.delete(ws);
        }
      });

      ws.on('error', (error) => {
        const client = this.clients.get(ws);
        logger.error('WebSocket连接错误', {
          clientId: client?.id,
          error: error.message
        });
      });

      // 发送连接确认
      this.sendMessage(ws, {
        type: 'status',
        data: { status: 'connected', clientId: clientInfo.id }
      });
    });
  }

  /**
   * 处理消息
   */
  private handleMessage(ws: WebSocket, message: WebSocketMessage): void {
    const handler = this.messageHandlers.get(message.type);
    if (handler) {
      handler(ws, message.data);
    } else {
      logger.warn('未知的WebSocket消息类型', { type: message.type });
    }
  }

  /**
   * 注册消息处理器
   */
  onMessage(type: string, handler: (ws: WebSocket, data: any) => void): void {
    this.messageHandlers.set(type, handler);
  }

  /**
   * 发送消息给指定客户端
   */
  sendMessage(ws: WebSocket, message: WebSocketMessage): boolean {
    if (ws.readyState === WebSocket.OPEN) {
      try {
        const messageWithTimestamp = {
          ...message,
          timestamp: Date.now()
        };
        ws.send(JSON.stringify(messageWithTimestamp));
        return true;
      } catch (error) {
        logger.error('发送WebSocket消息失败', error);
        return false;
      }
    }
    return false;
  }

  /**
   * 广播消息给所有客户端
   */
  broadcast(message: WebSocketMessage): number {
    let sentCount = 0;
    for (const ws of this.clients.keys()) {
      if (this.sendMessage(ws, message)) {
        sentCount++;
      }
    }
    return sentCount;
  }

  /**
   * 发送错误消息
   */
  sendError(ws: WebSocket, error: string, code?: string): void {
    this.sendMessage(ws, {
      type: 'error',
      data: { error, code }
    });
  }

  /**
   * 发送进度消息
   */
  sendProgress(ws: WebSocket, progress: number, status?: string, description?: string): void {
    this.sendMessage(ws, {
      type: 'progress',
      data: { progress, status, description }
    });
  }

  /**
   * 流式发送消息
   */
  async sendStream(
    ws: WebSocket,
    messageId: string,
    contentGenerator: AsyncGenerator<string, void, unknown>
  ): Promise<void> {
    try {
      for await (const chunk of contentGenerator) {
        if (ws.readyState !== WebSocket.OPEN) {
          break;
        }

        this.sendMessage(ws, {
          type: 'message',
          id: messageId,
          data: {
            content: chunk,
            isComplete: false
          }
        });
      }

      // 发送完成标记
      if (ws.readyState === WebSocket.OPEN) {
        this.sendMessage(ws, {
          type: 'message',
          id: messageId,
          data: {
            content: '',
            isComplete: true
          }
        });
      }
    } catch (error) {
      logger.error('流式发送失败', error);
      this.sendError(ws, '流式传输中断');
    }
  }

  /**
   * 获取客户端信息
   */
  getClientInfo(ws: WebSocket): ClientInfo | undefined {
    return this.clients.get(ws);
  }

  /**
   * 获取所有客户端信息
   */
  getAllClients(): ClientInfo[] {
    return Array.from(this.clients.values());
  }

  /**
   * 根据客户端ID查找WebSocket
   */
  findClientById(clientId: string): WebSocket | undefined {
    for (const [ws, client] of this.clients.entries()) {
      if (client.id === clientId) {
        return ws;
      }
    }
    return undefined;
  }

  /**
   * 清理非活跃连接
   */
  cleanupInactiveClients(maxInactiveTime: number = 30 * 60 * 1000): number {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [ws, client] of this.clients.entries()) {
      if (now - client.lastActivity > maxInactiveTime) {
        ws.close();
        this.clients.delete(ws);
        cleanedCount++;
        logger.info('清理非活跃WebSocket连接', { clientId: client.id });
      }
    }

    return cleanedCount;
  }

  /**
   * 获取服务器统计信息
   */
  getStats(): {
    totalClients: number;
    activeClients: number;
    messageHandlers: number;
  } {
    return {
      totalClients: this.clients.size,
      activeClients: Array.from(this.clients.keys())
        .filter(ws => ws.readyState === WebSocket.OPEN).length,
      messageHandlers: this.messageHandlers.size
    };
  }

  /**
   * 生成客户端ID
   */
  private generateClientId(): string {
    return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 关闭服务器
   */
  close(): void {
    this.wss.close();
    logger.info('WebSocket服务器已关闭');
  }
}

export default WebSocketServer;