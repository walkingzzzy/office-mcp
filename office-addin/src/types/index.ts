/**
 * Office应用类型
 */
export type OfficeHostType = 'Word' | 'Excel' | 'PowerPoint' | 'Unknown';

/**
 * 文档适配器接口
 */
export interface IDocumentAdapter {
  /**
   * 获取文档内容
   */
  getContent(): Promise<string>;

  /**
   * 设置文档内容
   */
  setContent(content: string): Promise<void>;

  /**
   * 获取选中的内容
   */
  getSelection(): Promise<string>;

  /**
   * 插入内容
   */
  insertContent(content: string): Promise<void>;

  /**
   * 读取文档并上传到服务器
   */
  readDocument(): Promise<ApiResponse<{ fileId: string }>>;

  /**
   * 更新文档内容
   */
  updateDocument(content: ArrayBuffer | Blob): Promise<void>;

  /**
   * 高亮显示指定范围
   */
  highlightRange(change: Change): Promise<void>;

  /**
   * 移除高亮
   */
  removeHighlight(changeId: string): Promise<void>;

  /**
   * 应用修改
   */
  applyChange(change: Change): Promise<void>;
}

/**
 * API响应类型
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * 修改类型
 */
export type ChangeType = 'insert' | 'delete' | 'modify' | 'format';

/**
 * 修改状态
 */
export type ChangeStatus = 'pending' | 'accepted' | 'rejected';

/**
 * 高亮颜色配置
 */
export interface HighlightColor {
  insert: string;  // 绿色背景 #E8F5E9
  delete: string;  // 红色背景 #FFEBEE
  modify: string;  // 黄色背景 #FFF9C4
  format: string;  // 蓝色边框
}

/**
 * 修改建议类型
 */
export interface Change {
  id: string;
  type: ChangeType;
  content: string;
  originalContent?: string;  // 原始内容(用于delete和modify)
  position?: {
    start: number;
    end: number;
  };
  timestamp: number;
  status: ChangeStatus;
  description?: string;  // 修改描述
  controlId?: string;    // ContentControl ID (用于Word)
}

/**
 * 文档差异对比结果
 */
export interface DocumentDiff {
  original: string;
  modified: string;
  changes: Change[];
}

/**
 * 高亮配置
 */
export interface HighlightOptions {
  color: string;
  title?: string;
  tag?: string;
}

/**
 * Office上下文信息
 */
export interface OfficeContext {
  host: Office.HostType;
  platform: Office.PlatformType;
  isInitialized: boolean;
}

/**
 * 聊天消息类型
 */
export type MessageType = 'user' | 'assistant' | 'system' | 'error';

/**
 * 消息状态
 */
export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'failed';

/**
 * 聊天消息
 */
export interface ChatMessage {
  id: string;
  type: MessageType;
  content: string;
  timestamp: number;
  status?: MessageStatus;
  metadata?: {
    toolCalls?: any[];
    error?: string;
    progress?: number;
  };
}

/**
 * WebSocket消息
 */
export interface WebSocketMessage {
  type: 'message' | 'progress' | 'error' | 'status';
  data: any;
  id?: string;
}

/**
 * 聊天会话
 */
export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
}
