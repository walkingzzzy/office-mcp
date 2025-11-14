import { Request, Response } from 'express';
import { ApiResponse, ToolCallRequest } from '../types';
import mcpClient from '../services/MCPClient';
import logger from '../utils/logger';

/**
 * 获取可用工具列表
 */
export const listTools = async (req: Request, res: Response) => {
  try {
    const tools = await mcpClient.listTools();

    const response: ApiResponse = {
      success: true,
      data: { tools },
    };

    res.json(response);
  } catch (error: any) {
    logger.error('获取工具列表失败', error);

    const response: ApiResponse = {
      success: false,
      error: error.message,
      message: '获取工具列表失败',
    };

    res.status(500).json(response);
  }
};

/**
 * 调用MCP工具
 */
export const callTool = async (req: Request, res: Response) => {
  try {
    const { tool, parameters } = req.body as ToolCallRequest;

    if (!tool) {
      const response: ApiResponse = {
        success: false,
        error: '缺少tool参数',
        message: '请求参数错误',
      };
      return res.status(400).json(response);
    }

    logger.info(`调用工具: ${tool}`, parameters);

    const result = await mcpClient.callTool(tool, parameters || {});

    const response: ApiResponse = {
      success: true,
      data: result,
    };

    res.json(response);
  } catch (error: any) {
    logger.error('工具调用失败', error);

    const response: ApiResponse = {
      success: false,
      error: error.message,
      message: '工具调用失败',
    };

    res.status(500).json(response);
  }
};
