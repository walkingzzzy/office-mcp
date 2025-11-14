import { spawn, ChildProcess } from 'child_process';
import { EventEmitter } from 'events';
import { MCPRequest, MCPResponse, MCPTool } from '../types';
import logger from '../utils/logger';
import config from '../config';

/**
 * MCP Client类
 * 通过stdio与MCP服务器通信,使用JSON-RPC协议
 */
export class MCPClient extends EventEmitter {
  private process: ChildProcess | null = null;
  private messageBuffer: string = '';
  private requestId: number = 0;
  private pendingRequests: Map<string | number, {
    resolve: (value: any) => void;
    reject: (reason: any) => void;
    timeout: NodeJS.Timeout;
  }> = new Map();
  private isInitialized: boolean = false;

  constructor() {
    super();
  }

  /**
   * 启动MCP服务器进程
   */
  async start(): Promise<void> {
    if (this.process) {
      logger.warn('MCP服务器进程已在运行');
      return;
    }

    return new Promise((resolve, reject) => {
      logger.info(`启动MCP服务器: ${config.pythonPath} ${config.mcpServerPath}`);

      try {
        this.process = spawn(config.pythonPath, [config.mcpServerPath], {
          stdio: ['pipe', 'pipe', 'pipe'],
          cwd: process.cwd(),
        });

        // 处理stdout
        if (this.process.stdout) {
          this.process.stdout.on('data', (data: Buffer) => {
            this.handleStdout(data);
          });
        }

        // 处理stderr
        if (this.process.stderr) {
          this.process.stderr.on('data', (data: Buffer) => {
            logger.error(`MCP stderr: ${data.toString()}`);
          });
        }

        // 处理进程退出
        this.process.on('exit', (code, signal) => {
          logger.warn(`MCP进程退出: code=${code}, signal=${signal}`);
          this.cleanup();
        });

        // 处理进程错误
        this.process.on('error', (error) => {
          logger.error(`MCP进程错误: ${error.message}`);
          this.cleanup();
          reject(error);
        });

        // 初始化MCP服务器(增加等待时间让MCP服务器完全启动)
        setTimeout(async () => {
          try {
            await this.initialize();
            this.isInitialized = true;
            logger.info('MCP服务器初始化成功');
            resolve();
          } catch (error) {
            logger.error('MCP服务器初始化失败', error);
            reject(error);
          }
        }, 3000);

      } catch (error) {
        logger.error('启动MCP服务器失败', error);
        reject(error);
      }
    });
  }

  /**
   * 停止MCP服务器进程
   */
  stop(): void {
    if (this.process) {
      logger.info('停止MCP服务器');
      this.process.kill();
      this.cleanup();
    }
  }

  /**
   * 清理资源
   */
  private cleanup(): void {
    this.process = null;
    this.isInitialized = false;
    this.messageBuffer = '';

    // 拒绝所有待处理的请求
    this.pendingRequests.forEach(({ reject, timeout }) => {
      clearTimeout(timeout);
      reject(new Error('MCP服务器已关闭'));
    });
    this.pendingRequests.clear();
  }

  /**
   * 处理stdout数据
   */
  private handleStdout(data: Buffer): void {
    this.messageBuffer += data.toString();

    // 尝试解析完整的JSON消息
    const lines = this.messageBuffer.split('\n');
    this.messageBuffer = lines.pop() || ''; // 保留不完整的行

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      try {
        const message = JSON.parse(trimmed);
        this.handleMessage(message);
      } catch (error) {
        logger.error(`解析MCP消息失败: ${trimmed}`, error);
      }
    }
  }

  /**
   * 处理MCP消息
   */
  private handleMessage(message: MCPResponse): void {
    const { id, result, error } = message;

    if (id !== undefined && this.pendingRequests.has(id)) {
      const request = this.pendingRequests.get(id)!;
      clearTimeout(request.timeout);
      this.pendingRequests.delete(id);

      if (error) {
        logger.error(`MCP请求失败: ${error.message}`, error);
        request.reject(new Error(error.message));
      } else {
        request.resolve(result);
      }
    } else {
      // 处理通知消息
      logger.debug('收到MCP通知:', message);
      this.emit('notification', message);
    }
  }

  /**
   * 发送请求到MCP服务器
   */
  async request(method: string, params?: Record<string, any>): Promise<any> {
    // 允许initialize请求在未初始化时通过
    if (!this.process || (!this.isInitialized && method !== 'initialize')) {
      throw new Error('MCP服务器未初始化');
    }

    const id = ++this.requestId;
    const request: MCPRequest = {
      jsonrpc: '2.0',
      id,
      method,
      params,
    };

    return new Promise((resolve, reject) => {
      // 设置超时
      const timeout = setTimeout(() => {
        this.pendingRequests.delete(id);
        reject(new Error(`MCP请求超时: ${method}`));
      }, 30000); // 30秒超时

      this.pendingRequests.set(id, { resolve, reject, timeout });

      // 发送请求
      const message = JSON.stringify(request) + '\n';
      if (this.process && this.process.stdin) {
        this.process.stdin.write(message);
        logger.debug(`发送MCP请求: ${method}`, params);
      } else {
        clearTimeout(timeout);
        this.pendingRequests.delete(id);
        reject(new Error('MCP进程stdin不可用'));
      }
    });
  }

  /**
   * 初始化MCP服务器
   */
  private async initialize(): Promise<void> {
    const result = await this.request('initialize', {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: {
        name: 'office-ai-bridge',
        version: '1.0.0',
      },
    });

    logger.info('MCP服务器信息:', result);
    return result;
  }

  /**
   * 获取可用的工具列表
   */
  async listTools(): Promise<MCPTool[]> {
    const result = await this.request('tools/list');
    return result.tools || [];
  }

  /**
   * 调用工具
   */
  async callTool(name: string, args: Record<string, any>): Promise<any> {
    const result = await this.request('tools/call', {
      name,
      arguments: args,
    });
    return result;
  }

  /**
   * 获取服务器信息
   */
  async getServerInfo(): Promise<any> {
    const result = await this.callTool('get_server_info', {});
    // 从FastMCP工具返回结果中提取实际数据
    return result.structuredContent || result;
  }

  /**
   * 检查是否已初始化
   */
  get initialized(): boolean {
    return this.isInitialized;
  }
}

// 导出单例
export default new MCPClient();
