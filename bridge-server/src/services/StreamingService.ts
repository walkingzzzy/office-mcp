import { Response } from 'express';
import { WebSocket } from 'ws';
import OpenAIService from './OpenAIService';
import ClaudeService from './ClaudeService';
import ToolExecutionEngine from './ToolExecutionEngine';
import ConversationManager from './ConversationManager';
import logger from '../utils/logger';

export interface StreamingOptions {
  conversationId: string;
  model: 'openai' | 'claude';
  enableTools?: boolean;
  onProgress?: (progress: number) => void;
  onToolCall?: (toolName: string, args: any) => void;
}

export class StreamingService {
  private openaiService: OpenAIService;
  private claudeService: ClaudeService;
  private toolEngine: ToolExecutionEngine;
  private conversationManager: ConversationManager;

  constructor(
    openaiService: OpenAIService,
    claudeService: ClaudeService,
    toolEngine: ToolExecutionEngine,
    conversationManager: ConversationManager
  ) {
    this.openaiService = openaiService;
    this.claudeService = claudeService;
    this.toolEngine = toolEngine;
    this.conversationManager = conversationManager;
    logger.info('流式响应服务初始化完成');
  }

  /**
   * SSE流式响应
   */
  async streamToSSE(
    res: Response,
    userMessage: string,
    options: StreamingOptions
  ): Promise<void> {
    // 设置SSE头
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    });

    try {
      // 添加用户消息到对话
      this.conversationManager.addMessage(options.conversationId, 'user', userMessage);

      // 发送开始事件
      this.sendSSEEvent(res, 'start', { message: '开始处理请求' });

      if (options.model === 'openai') {
        await this.streamOpenAIToSSE(res, options);
      } else {
        await this.streamClaudeToSSE(res, options);
      }

      // 发送完成事件
      this.sendSSEEvent(res, 'done', { message: '处理完成' });
    } catch (error: any) {
      logger.error('SSE流式响应失败', error);
      this.sendSSEEvent(res, 'error', { error: error.message });
    } finally {
      res.end();
    }
  }

  /**
   * WebSocket流式响应
   */
  async streamToWebSocket(
    ws: WebSocket,
    userMessage: string,
    options: StreamingOptions
  ): Promise<void> {
    try {
      // 添加用户消息到对话
      this.conversationManager.addMessage(options.conversationId, 'user', userMessage);

      // 发送开始消息
      this.sendWebSocketMessage(ws, 'status', { status: 'processing', message: '开始处理请求' });

      if (options.model === 'openai') {
        await this.streamOpenAIToWebSocket(ws, options);
      } else {
        await this.streamClaudeToWebSocket(ws, options);
      }

      // 发送完成消息
      this.sendWebSocketMessage(ws, 'status', { status: 'completed', message: '处理完成' });
    } catch (error: any) {
      logger.error('WebSocket流式响应失败', error);
      this.sendWebSocketMessage(ws, 'error', { error: error.message });
    }
  }

  /**
   * OpenAI流式响应到SSE
   */
  private async streamOpenAIToSSE(res: Response, options: StreamingOptions): Promise<void> {
    const messages = this.conversationManager.getOpenAIMessages(options.conversationId);
    const functions = options.enableTools ? this.toolEngine.getAvailableTools() : undefined;

    let assistantMessage = '';
    let messageId = '';

    try {
      const stream = this.openaiService.streamChat(messages, functions as any);

      for await (const chunk of stream) {
        if (!messageId) {
          messageId = this.generateMessageId();
          this.sendSSEEvent(res, 'message_start', { messageId });
        }

        assistantMessage += chunk;
        this.sendSSEEvent(res, 'content_delta', {
          messageId,
          delta: chunk,
          content: assistantMessage
        });
      }

      // 保存助手消息
      if (assistantMessage) {
        this.conversationManager.addMessage(
          options.conversationId,
          'assistant',
          assistantMessage
        );
      }
    } catch (error: any) {
      throw new Error(`OpenAI流式响应失败: ${error.message}`);
    }
  }

  /**
   * Claude流式响应到SSE
   */
  private async streamClaudeToSSE(res: Response, options: StreamingOptions): Promise<void> {
    const messages = this.conversationManager.getClaudeMessages(options.conversationId);
    const tools = options.enableTools ? this.toolEngine.getAvailableTools() : undefined;

    let assistantMessage = '';
    let messageId = '';

    try {
      const stream = this.claudeService.streamMessage(messages, tools as any);

      for await (const chunk of stream) {
        if (!messageId) {
          messageId = this.generateMessageId();
          this.sendSSEEvent(res, 'message_start', { messageId });
        }

        assistantMessage += chunk;
        this.sendSSEEvent(res, 'content_delta', {
          messageId,
          delta: chunk,
          content: assistantMessage
        });
      }

      // 保存助手消息
      if (assistantMessage) {
        this.conversationManager.addMessage(
          options.conversationId,
          'assistant',
          assistantMessage
        );
      }
    } catch (error: any) {
      throw new Error(`Claude流式响应失败: ${error.message}`);
    }
  }

  /**
   * OpenAI流式响应到WebSocket
   */
  private async streamOpenAIToWebSocket(ws: WebSocket, options: StreamingOptions): Promise<void> {
    const messages = this.conversationManager.getOpenAIMessages(options.conversationId);
    const functions = options.enableTools ? this.toolEngine.getAvailableTools() : undefined;

    let assistantMessage = '';
    let messageId = this.generateMessageId();

    try {
      this.sendWebSocketMessage(ws, 'message', {
        id: messageId,
        content: '',
        isComplete: false
      });

      const stream = this.openaiService.streamChat(messages, functions as any);

      for await (const chunk of stream) {
        assistantMessage += chunk;
        this.sendWebSocketMessage(ws, 'message', {
          id: messageId,
          content: chunk,
          isComplete: false
        });
      }

      // 发送完成标记
      this.sendWebSocketMessage(ws, 'message', {
        id: messageId,
        content: '',
        isComplete: true
      });

      // 保存助手消息
      if (assistantMessage) {
        this.conversationManager.addMessage(
          options.conversationId,
          'assistant',
          assistantMessage
        );
      }
    } catch (error: any) {
      throw new Error(`OpenAI WebSocket流式响应失败: ${error.message}`);
    }
  }

  /**
   * Claude流式响应到WebSocket
   */
  private async streamClaudeToWebSocket(ws: WebSocket, options: StreamingOptions): Promise<void> {
    const messages = this.conversationManager.getClaudeMessages(options.conversationId);
    const tools = options.enableTools ? this.toolEngine.getAvailableTools() : undefined;

    let assistantMessage = '';
    let messageId = this.generateMessageId();

    try {
      this.sendWebSocketMessage(ws, 'message', {
        id: messageId,
        content: '',
        isComplete: false
      });

      const stream = this.claudeService.streamMessage(messages, tools as any);

      for await (const chunk of stream) {
        assistantMessage += chunk;
        this.sendWebSocketMessage(ws, 'message', {
          id: messageId,
          content: chunk,
          isComplete: false
        });
      }

      // 发送完成标记
      this.sendWebSocketMessage(ws, 'message', {
        id: messageId,
        content: '',
        isComplete: true
      });

      // 保存助手消息
      if (assistantMessage) {
        this.conversationManager.addMessage(
          options.conversationId,
          'assistant',
          assistantMessage
        );
      }
    } catch (error: any) {
      throw new Error(`Claude WebSocket流式响应失败: ${error.message}`);
    }
  }

  /**
   * 发送SSE事件
   */
  private sendSSEEvent(res: Response, event: string, data: any): void {
    res.write(`event: ${event}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  }

  /**
   * 发送WebSocket消息
   */
  private sendWebSocketMessage(ws: WebSocket, type: string, data: any): void {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type,
        data,
        timestamp: Date.now()
      }));
    }
  }

  /**
   * 生成消息ID
   */
  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 处理工具调用流式响应
   */
  async streamWithTools(
    ws: WebSocket,
    userMessage: string,
    options: StreamingOptions
  ): Promise<void> {
    try {
      // 添加用户消息
      this.conversationManager.addMessage(options.conversationId, 'user', userMessage);

      const messages = options.model === 'openai'
        ? this.conversationManager.getOpenAIMessages(options.conversationId)
        : this.conversationManager.getClaudeMessages(options.conversationId);

      // 发送进度
      this.sendWebSocketMessage(ws, 'progress', { progress: 10, status: '分析请求' });

      if (options.model === 'openai') {
        const functions = this.toolEngine.getAvailableTools();
        const response = await this.openaiService.callFunction(messages as any, functions as any);

        if (response.functionCall) {
          // 发送工具调用进度
          this.sendWebSocketMessage(ws, 'progress', { progress: 50, status: '执行工具' });
          options.onToolCall?.(response.functionCall.name, response.functionCall.arguments);

          // 执行工具
          const toolResult = await this.toolEngine.executeTool(
            response.functionCall.name,
            response.functionCall.arguments,
            { conversationId: options.conversationId }
          );

          // 发送工具结果
          this.sendWebSocketMessage(ws, 'tool_result', {
            toolName: response.functionCall.name,
            result: toolResult
          });

          // 继续对话
          this.conversationManager.addMessage(
            options.conversationId,
            'function',
            JSON.stringify(toolResult.result),
            { functionCall: response.functionCall }
          );

          // 获取最终响应
          const finalMessages = this.conversationManager.getOpenAIMessages(options.conversationId);
          await this.streamOpenAIToWebSocket(ws, { ...options, enableTools: false });
        } else {
          // 直接流式响应
          await this.streamOpenAIToWebSocket(ws, options);
        }
      } else {
        // Claude工具使用
        const tools = this.toolEngine.getAvailableTools();
        const response = await this.claudeService.useTools(messages as any, tools as any);

        if (response.toolUse && response.toolUse.length > 0) {
          for (const tool of response.toolUse) {
            this.sendWebSocketMessage(ws, 'progress', { progress: 50, status: `执行工具: ${tool.name}` });
            options.onToolCall?.(tool.name, tool.input);

            const toolResult = await this.toolEngine.executeTool(
              tool.name,
              tool.input,
              { conversationId: options.conversationId }
            );

            this.sendWebSocketMessage(ws, 'tool_result', {
              toolName: tool.name,
              result: toolResult
            });
          }
        }

        await this.streamClaudeToWebSocket(ws, options);
      }

      this.sendWebSocketMessage(ws, 'progress', { progress: 100, status: '完成' });
    } catch (error: any) {
      logger.error('工具调用流式响应失败', error);
      this.sendWebSocketMessage(ws, 'error', { error: error.message });
    }
  }
}

export default StreamingService;