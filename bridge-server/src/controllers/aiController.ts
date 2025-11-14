import { Request, Response } from 'express';
import { ApiResponse } from '../types';
import OpenAIService from '../services/OpenAIService';
import ClaudeService from '../services/ClaudeService';
import ConversationManager from '../services/ConversationManager';
import ToolExecutionEngine from '../services/ToolExecutionEngine';
import StreamingService from '../services/StreamingService';
import APIKeyManager from '../services/APIKeyManager';
import { MCPClient } from '../services/MCPClient';
import { generateOfficeAssistantPrompt, DocumentType, generateSimplifiedPrompt } from '../prompts/officeAssistant';
import logger from '../utils/logger';

// 全局MCPClient实例（应该从应用实例注入，这里临时创建）
let mcpClient: MCPClient | null = null;

/**
 * 初始化MCP Client（应该在应用启动时调用）
 */
export const initializeMCPClient = async (client: MCPClient) => {
  mcpClient = client;
  logger.info('aiController: MCPClient已初始化');
};

/**
 * 创建对话
 */
export const createConversation = async (req: Request, res: Response) => {
  try {
    const {
      title,
      model = 'openai',
      systemPrompt,
      documentType,
      filename,
      useSimplifiedPrompt = false
    } = req.body;

    if (!title) {
      const response: ApiResponse = {
        success: false,
        error: '缺少title参数',
        message: '请求参数错误'
      };
      return res.status(400).json(response);
    }

    // 生成System Prompt
    let finalSystemPrompt = systemPrompt;

    if (!finalSystemPrompt && documentType && filename) {
      try {
        // 获取可用工具列表
        if (!mcpClient) {
          logger.warn('MCP Client未初始化，使用默认System Prompt');
          finalSystemPrompt = `你是一个Office文档处理助手，当前操作${documentType}文件"${filename}"。`;
        } else {
          const tools = await mcpClient.listTools();
          logger.info(`获取到${tools.length}个MCP工具，生成System Prompt`);

          // 根据是否需要简化版选择生成函数
          if (useSimplifiedPrompt) {
            finalSystemPrompt = generateSimplifiedPrompt(
              documentType as DocumentType,
              filename,
              tools.length
            );
          } else {
            finalSystemPrompt = generateOfficeAssistantPrompt(
              documentType as DocumentType,
              filename,
              tools
            );
          }

          logger.debug('System Prompt已生成', {
            documentType,
            filename,
            promptLength: finalSystemPrompt.length,
            simplified: useSimplifiedPrompt
          });
        }
      } catch (error: any) {
        logger.error('生成System Prompt失败，使用默认值', error);
        finalSystemPrompt = `你是一个Office文档处理助手，当前操作${documentType}文件"${filename}"。`;
      }
    }

    // 这里需要从应用实例获取conversationManager
    // 暂时创建一个临时实例用于演示
    const conversationManager = new ConversationManager();
    const conversation = conversationManager.createConversation(title, model, finalSystemPrompt);

    const response: ApiResponse = {
      success: true,
      data: {
        ...conversation,
        systemPromptGenerated: !systemPrompt && !!documentType,
        systemPromptLength: finalSystemPrompt?.length || 0
      },
      message: '对话创建成功'
    };

    res.json(response);
  } catch (error: any) {
    logger.error('创建对话失败', error);

    const response: ApiResponse = {
      success: false,
      error: error.message,
      message: '创建对话失败'
    };

    res.status(500).json(response);
  }
};

/**
 * 发送消息
 */
export const sendMessage = async (req: Request, res: Response) => {
  try {
    const { conversationId, message, model = 'openai', enableTools = true } = req.body;

    if (!conversationId || !message) {
      const response: ApiResponse = {
        success: false,
        error: '缺少必要参数',
        message: '请求参数错误'
      };
      return res.status(400).json(response);
    }

    // 这里需要从应用实例获取服务
    // 暂时返回成功响应用于演示
    const response: ApiResponse = {
      success: true,
      data: {
        conversationId,
        messageId: `msg_${Date.now()}`,
        content: '消息已接收，正在处理...'
      },
      message: '消息发送成功'
    };

    res.json(response);
  } catch (error: any) {
    logger.error('发送消息失败', error);

    const response: ApiResponse = {
      success: false,
      error: error.message,
      message: '发送消息失败'
    };

    res.status(500).json(response);
  }
};

/**
 * 流式聊天
 */
export const streamChat = async (req: Request, res: Response) => {
  try {
    const { conversationId, message, model = 'openai', enableTools = true } = req.body;

    if (!conversationId || !message) {
      const response: ApiResponse = {
        success: false,
        error: '缺少必要参数',
        message: '请求参数错误'
      };
      return res.status(400).json(response);
    }

    // 设置SSE响应头
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*'
    });

    // 发送开始事件
    res.write(`event: start\n`);
    res.write(`data: ${JSON.stringify({ message: '开始处理请求' })}\n\n`);

    // 模拟流式响应
    const chunks = ['正在', '处理', '您的', '请求', '...'];
    for (let i = 0; i < chunks.length; i++) {
      setTimeout(() => {
        res.write(`event: content\n`);
        res.write(`data: ${JSON.stringify({ content: chunks[i] })}\n\n`);

        if (i === chunks.length - 1) {
          res.write(`event: done\n`);
          res.write(`data: ${JSON.stringify({ message: '处理完成' })}\n\n`);
          res.end();
        }
      }, i * 500);
    }
  } catch (error: any) {
    logger.error('流式聊天失败', error);
    res.write(`event: error\n`);
    res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
    res.end();
  }
};

/**
 * 获取对话历史
 */
export const getConversation = async (req: Request, res: Response) => {
  try {
    const { conversationId } = req.params;

    if (!conversationId) {
      const response: ApiResponse = {
        success: false,
        error: '缺少conversationId参数',
        message: '请求参数错误'
      };
      return res.status(400).json(response);
    }

    // 这里需要从应用实例获取conversationManager
    const response: ApiResponse = {
      success: true,
      data: {
        id: conversationId,
        title: '示例对话',
        messages: [],
        createdAt: Date.now(),
        updatedAt: Date.now()
      },
      message: '获取对话成功'
    };

    res.json(response);
  } catch (error: any) {
    logger.error('获取对话失败', error);

    const response: ApiResponse = {
      success: false,
      error: error.message,
      message: '获取对话失败'
    };

    res.status(500).json(response);
  }
};

/**
 * 获取可用工具
 */
export const getAvailableTools = async (req: Request, res: Response) => {
  try {
    const { category, search } = req.query;

    // 这里需要从应用实例获取toolEngine
    const tools = [
      {
        name: 'word_create_document',
        description: '创建Word文档',
        category: 'word'
      },
      {
        name: 'excel_create_workbook',
        description: '创建Excel工作簿',
        category: 'excel'
      }
    ];

    let filteredTools = tools;

    if (category) {
      filteredTools = tools.filter(tool => tool.category === category);
    }

    if (search) {
      const searchLower = (search as string).toLowerCase();
      filteredTools = filteredTools.filter(tool =>
        tool.name.toLowerCase().includes(searchLower) ||
        tool.description.toLowerCase().includes(searchLower)
      );
    }

    const response: ApiResponse = {
      success: true,
      data: {
        tools: filteredTools,
        total: filteredTools.length
      },
      message: '获取工具列表成功'
    };

    res.json(response);
  } catch (error: any) {
    logger.error('获取工具列表失败', error);

    const response: ApiResponse = {
      success: false,
      error: error.message,
      message: '获取工具列表失败'
    };

    res.status(500).json(response);
  }
};

/**
 * 执行工具
 */
export const executeTool = async (req: Request, res: Response) => {
  try {
    const { toolName, args, conversationId } = req.body;

    if (!toolName || !args) {
      const response: ApiResponse = {
        success: false,
        error: '缺少必要参数',
        message: '请求参数错误'
      };
      return res.status(400).json(response);
    }

    // 这里需要从应用实例获取toolEngine
    const result = {
      success: true,
      result: `工具 ${toolName} 执行成功`,
      executionTime: 100,
      toolName
    };

    const response: ApiResponse = {
      success: true,
      data: result,
      message: '工具执行成功'
    };

    res.json(response);
  } catch (error: any) {
    logger.error('工具执行失败', error);

    const response: ApiResponse = {
      success: false,
      error: error.message,
      message: '工具执行失败'
    };

    res.status(500).json(response);
  }
};

/**
 * 配置API密钥
 */
export const configureAPIKey = async (req: Request, res: Response) => {
  try {
    const { provider, apiKey, baseURL, password } = req.body;

    if (!provider || !apiKey) {
      const response: ApiResponse = {
        success: false,
        error: '缺少必要参数',
        message: '请求参数错误'
      };
      return res.status(400).json(response);
    }

    // 这里需要从应用实例获取apiKeyManager
    const response: ApiResponse = {
      success: true,
      data: { provider, configured: true },
      message: 'API密钥配置成功'
    };

    res.json(response);
  } catch (error: any) {
    logger.error('配置API密钥失败', error);

    const response: ApiResponse = {
      success: false,
      error: error.message,
      message: '配置API密钥失败'
    };

    res.status(500).json(response);
  }
};

/**
 * 获取系统状态
 */
export const getSystemStatus = async (req: Request, res: Response) => {
  try {
    const status = {
      services: {
        openai: { status: 'ready', configured: true },
        claude: { status: 'ready', configured: true },
        mcp: { status: 'connected', tools: 184 },
        websocket: { status: 'running', clients: 0 }
      },
      stats: {
        totalConversations: 0,
        totalMessages: 0,
        totalToolExecutions: 0
      },
      uptime: process.uptime()
    };

    const response: ApiResponse = {
      success: true,
      data: status,
      message: '获取系统状态成功'
    };

    res.json(response);
  } catch (error: any) {
    logger.error('获取系统状态失败', error);

    const response: ApiResponse = {
      success: false,
      error: error.message,
      message: '获取系统状态失败'
    };

    res.status(500).json(response);
  }
};