/**
 * MCP JSON-RPC请求格式
 */
export interface MCPRequest {
  jsonrpc: '2.0';
  id: string | number;
  method: string;
  params?: Record<string, any>;
}

/**
 * MCP JSON-RPC响应格式
 */
export interface MCPResponse {
  jsonrpc: '2.0';
  id: string | number;
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}

/**
 * API响应格式
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * 工具调用请求
 */
export interface ToolCallRequest {
  tool: string;
  parameters: Record<string, any>;
}

/**
 * 文件上传信息
 */
export interface FileUploadInfo {
  filename: string;
  originalName: string;
  mimetype: string;
  size: number;
  path: string;
}

/**
 * MCP工具定义
 */
export interface MCPTool {
  name: string;
  description: string;
  inputSchema: {
    type: string;
    properties: Record<string, any>;
    required?: string[];
  };
}

/**
 * 服务器配置
 */
export interface ServerConfig {
  port: number;
  mcpServerPath: string;
  pythonPath: string;
  tempDir: string;
  logDir: string;
  logLevel: string;
  corsOrigin: string;
  maxFileSize: number;
}

/**
 * 文档差异信息
 */
export interface DocumentDiff {
  original: string;
  modified: string;
  changes: DocumentChange[];
}

/**
 * 文档修改信息
 */
export interface DocumentChange {
  id: string;
  type: 'insert' | 'delete' | 'modify' | 'format';
  content: string;
  originalContent?: string;
  position?: {
    start: number;
    end: number;
  };
  timestamp: number;
  status: 'pending' | 'accepted' | 'rejected';
  description?: string;
}

/**
 * 会话信息
 */
export interface DocumentSession {
  id: string;
  originalFileId: string;
  modifiedFileId?: string;
  status: 'active' | 'completed' | 'expired';
  createdAt: number;
  updatedAt: number;
  changes: DocumentChange[];
}

/**
 * 文件分片信息
 */
export interface FileChunk {
  chunkId: string;
  fileId: string;
  chunkIndex: number;
  totalChunks: number;
  data: Buffer;
  size: number;
}
