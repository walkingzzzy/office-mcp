import { OfficeService } from './OfficeService';
import { ApiClient } from './ApiClient';
import { WebSocketClient } from './WebSocketClient';

export interface SyncSession {
  sessionId: string;
  documentType: string;
  lastSync: number;
  isActive: boolean;
}

export class DocumentSyncService {
  private officeService: OfficeService;
  private apiClient: ApiClient;
  private wsClient: WebSocketClient;
  private currentSession: SyncSession | null = null;

  constructor(
    officeService: OfficeService,
    apiClient: ApiClient,
    wsClient: WebSocketClient
  ) {
    this.officeService = officeService;
    this.apiClient = apiClient;
    this.wsClient = wsClient;
  }

  /**
   * 执行完整的12步文档同步流程
   */
  async executeDocumentSync(userMessage: string): Promise<void> {
    try {
      // 步骤1-2: 用户输入AI指令
      console.log('步骤1-2: 接收用户指令:', userMessage);

      // 步骤3: 插件通过Office.js读取当前文档内容
      console.log('步骤3: 读取当前文档内容');
      const documentData = await this.officeService.getDocumentData();

      // 步骤4: 插件发送HTTP请求到Bridge Server
      console.log('步骤4: 发送请求到Bridge Server');
      const chatResponse = await this.apiClient.chat({
        message: userMessage,
        documentData: documentData.content,
        documentType: documentData.type,
        sessionId: this.currentSession?.sessionId
      });

      // 步骤5-10: Bridge Server处理(由后端完成)
      console.log('步骤5-10: Bridge Server处理中...');

      // 步骤11: 插件通过Office.js更新文档内容
      if (chatResponse.documentData) {
        console.log('步骤11: 更新文档内容');
        await this.officeService.updateDocument(chatResponse.documentData);
      }

      // 步骤12: 用户看到实时变化
      console.log('步骤12: 文档同步完成');

    } catch (error) {
      console.error('文档同步失败:', error);
      throw error;
    }
  }

  /**
   * 创建同步会话
   */
  async createSession(): Promise<SyncSession> {
    const response = await this.apiClient.createSession();

    this.currentSession = {
      sessionId: response.sessionId,
      documentType: this.officeService.getDocumentType(),
      lastSync: Date.now(),
      isActive: true
    };

    return this.currentSession;
  }

  /**
   * 获取当前会话
   */
  getCurrentSession(): SyncSession | null {
    return this.currentSession;
  }

  /**
   * 结束会话
   */
  endSession(): void {
    if (this.currentSession) {
      this.currentSession.isActive = false;
      this.currentSession = null;
    }
  }
}