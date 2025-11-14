import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { ApiResponse } from '../types';

/**
 * HTTP Client配置
 */
interface HttpClientConfig {
  baseURL?: string;
  timeout?: number;
}

/**
 * HTTP Client类
 * 封装与Bridge Server的通信
 */
export class HttpClient {
  private client: AxiosInstance;
  private baseURL: string;

  constructor(config?: HttpClientConfig) {
    this.baseURL = config?.baseURL || 'http://localhost:3000';

    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: config?.timeout || 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // 请求拦截器
    this.client.interceptors.request.use(
      (config) => {
        console.log('发送请求:', config.method?.toUpperCase(), config.url);
        return config;
      },
      (error) => {
        console.error('请求错误:', error);
        return Promise.reject(error);
      }
    );

    // 响应拦截器
    this.client.interceptors.response.use(
      (response) => {
        console.log('收到响应:', response.status, response.config.url);
        return response;
      },
      (error) => {
        console.error('响应错误:', error.message);
        return Promise.reject(error);
      }
    );
  }

  /**
   * GET请求
   */
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse<T> = await this.client.get(url, config);
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        message: '请求失败',
      };
    }
  }

  /**
   * POST请求
   */
  async post<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse<T> = await this.client.post(url, data, config);
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        message: '请求失败',
      };
    }
  }

  /**
   * PUT请求
   */
  async put<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse<T> = await this.client.put(url, data, config);
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        message: '请求失败',
      };
    }
  }

  /**
   * DELETE请求
   */
  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse<T> = await this.client.delete(url, config);
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        message: '请求失败',
      };
    }
  }

  /**
   * 上传文件
   */
  async uploadFile(file: File | Blob, filename?: string): Promise<ApiResponse> {
    try {
      const formData = new FormData();
      formData.append('file', file, filename);

      const response = await this.client.post('/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        message: '文件上传失败',
      };
    }
  }

  /**
   * 调用MCP工具
   */
  async callTool(toolName: string, parameters: Record<string, any>): Promise<ApiResponse> {
    return this.post('/tools/call', {
      tool: toolName,
      parameters,
    });
  }

  /**
   * 获取服务器健康状态
   */
  async healthCheck(): Promise<ApiResponse> {
    return this.get('/health');
  }

  /**
   * 设置Base URL
   */
  setBaseURL(url: string): void {
    this.baseURL = url;
    this.client.defaults.baseURL = url;
  }

  /**
   * 获取Base URL
   */
  getBaseURL(): string {
    return this.baseURL;
  }
}

// 导出单例
export default new HttpClient();
