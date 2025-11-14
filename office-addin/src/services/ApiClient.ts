import axios, { AxiosInstance, AxiosResponse } from 'axios';

export interface ApiConfig {
  baseURL: string;
  timeout?: number;
  apiKey?: string;
}

export interface ChatRequest {
  message: string;
  documentData: ArrayBuffer;
  documentType: string;
  sessionId?: string;
}

export interface ChatResponse {
  success: boolean;
  message: string;
  documentData?: ArrayBuffer;
  sessionId: string;
}

export class ApiClient {
  private client: AxiosInstance;
  private config: ApiConfig;

  constructor(config: ApiConfig) {
    this.config = {
      timeout: 30000,
      ...config
    };

    this.client = axios.create({
      baseURL: this.config.baseURL,
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json',
        ...(this.config.apiKey && { 'Authorization': `Bearer ${this.config.apiKey}` })
      }
    });

    this.setupInterceptors();
  }

  /**
   * 发送聊天请求
   */
  async chat(request: ChatRequest): Promise<ChatResponse> {
    const formData = new FormData();
    formData.append('message', request.message);
    formData.append('documentType', request.documentType);
    formData.append('file', new Blob([request.documentData]));

    if (request.sessionId) {
      formData.append('sessionId', request.sessionId);
    }

    const response = await this.client.post('/ai/chat', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });

    return response.data;
  }

  /**
   * 获取可用工具列表
   */
  async getTools() {
    const response = await this.client.get('/ai/tools');
    return response.data;
  }

  /**
   * 执行工具
   */
  async executeTool(toolName: string, args: Record<string, any>) {
    const response = await this.client.post('/ai/tools/execute', {
      toolName,
      arguments: args
    });
    return response.data;
  }

  /**
   * 创建会话
   */
  async createSession() {
    const response = await this.client.post('/sessions');
    return response.data;
  }

  /**
   * 获取会话信息
   */
  async getSession(sessionId: string) {
    const response = await this.client.get(`/sessions/${sessionId}`);
    return response.data;
  }

  /**
   * 上传文件
   */
  async uploadFile(file: ArrayBuffer, filename: string) {
    const formData = new FormData();
    formData.append('file', new Blob([file]), filename);

    const response = await this.client.post('/files/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });

    return response.data;
  }

  /**
   * 下载文件
   */
  async downloadFile(filename: string): Promise<ArrayBuffer> {
    const response = await this.client.get(`/files/${filename}`, {
      responseType: 'arraybuffer'
    });

    return response.data;
  }

  /**
   * 设置API密钥
   */
  setApiKey(apiKey: string) {
    this.config.apiKey = apiKey;
    this.client.defaults.headers['Authorization'] = `Bearer ${apiKey}`;
  }

  private setupInterceptors() {
    // 请求拦截器
    this.client.interceptors.request.use(
      (config) => {
        console.log(`API请求: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        console.error('API请求错误:', error);
        return Promise.reject(error);
      }
    );

    // 响应拦截器
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        console.log(`API响应: ${response.status} ${response.config.url}`);
        return response;
      },
      (error) => {
        console.error('API响应错误:', error.response?.data || error.message);
        return Promise.reject(error);
      }
    );
  }
}