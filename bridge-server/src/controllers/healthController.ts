import { Request, Response } from 'express';
import { ApiResponse } from '../types';
import mcpClient from '../services/MCPClient';
import logger from '../utils/logger';

/**
 * 健康检查
 */
export const healthCheck = async (req: Request, res: Response) => {
  const response: ApiResponse = {
    success: true,
    data: {
      status: 'ok',
      timestamp: new Date().toISOString(),
      mcpServer: mcpClient.initialized ? 'connected' : 'disconnected',
    },
    message: '服务器运行正常',
  };

  res.json(response);
};

/**
 * 获取服务器信息
 */
export const getServerInfo = async (req: Request, res: Response) => {
  try {
    const info = await mcpClient.getServerInfo();

    const response: ApiResponse = {
      success: true,
      data: info,
    };

    res.json(response);
  } catch (error: any) {
    logger.error('获取服务器信息失败', error);

    const response: ApiResponse = {
      success: false,
      error: error.message,
      message: '获取服务器信息失败',
    };

    res.status(500).json(response);
  }
};
