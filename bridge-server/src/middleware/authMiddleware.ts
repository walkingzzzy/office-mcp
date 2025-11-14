import { Request, Response, NextFunction } from 'express';
import tokenManager from '../services/TokenManager';
import logger from '../utils/logger';

/**
 * Token认证中间件
 */
export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const token = req.headers['authorization']?.replace('Bearer ', '');

  if (!token) {
    res.status(401).json({
      error: '未提供认证Token'
    });
    return;
  }

  const sessionToken = tokenManager.validateToken(token);

  if (!sessionToken) {
    res.status(401).json({
      error: 'Token无效或已过期'
    });
    return;
  }

  // 将Token信息附加到请求对象
  (req as any).sessionToken = sessionToken;
  next();
}

/**
 * 权限检查中间件
 */
export function requirePermissions(...permissions: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const sessionToken = (req as any).sessionToken;

    if (!sessionToken) {
      res.status(401).json({
        error: '未认证'
      });
      return;
    }

    const hasPermissions = permissions.every(permission =>
      sessionToken.permissions.includes(permission) ||
      sessionToken.permissions.includes('admin')
    );

    if (!hasPermissions) {
      logger.warn('权限不足', {
        sessionId: sessionToken.sessionId,
        required: permissions,
        actual: sessionToken.permissions
      });

      res.status(403).json({
        error: '权限不足',
        required: permissions
      });
      return;
    }

    next();
  };
}

/**
 * 工具调用白名单中间件
 */
const TOOL_WHITELIST = new Set([
  'create_word_document',
  'format_word_text',
  'insert_word_table',
  'create_excel_workbook',
  'write_excel_range',
  'create_excel_chart',
  'create_ppt_presentation',
  'add_ppt_slide',
  'get_server_info'
]);

export function toolWhitelistMiddleware(req: Request, res: Response, next: NextFunction): void {
  const { toolName } = req.body;

  if (!toolName) {
    next();
    return;
  }

  if (!TOOL_WHITELIST.has(toolName)) {
    logger.warn('工具调用被白名单拦截', { toolName });

    res.status(403).json({
      error: '该工具不在允许调用列表中',
      toolName
    });
    return;
  }

  next();
}

/**
 * 参数验证中间件
 */
export function validateToolArgs(req: Request, res: Response, next: NextFunction): void {
  const { toolName, arguments: args } = req.body;

  if (!toolName || !args) {
    next();
    return;
  }

  // 检查路径遍历攻击
  if (args.filename || args.filepath) {
    const path = args.filename || args.filepath;
    if (path.includes('..') || path.includes('~')) {
      logger.warn('检测到路径遍历攻击尝试', { toolName, path });

      res.status(400).json({
        error: '无效的文件路径'
      });
      return;
    }
  }

  // 检查命令注入
  const dangerousPatterns = [';', '&&', '||', '`', '$', '>', '<', '|'];
  const argValues = Object.values(args).filter(v => typeof v === 'string');

  for (const value of argValues) {
    if (dangerousPatterns.some(pattern => (value as string).includes(pattern))) {
      logger.warn('检测到潜在的命令注入尝试', { toolName, value });

      res.status(400).json({
        error: '参数包含非法字符'
      });
      return;
    }
  }

  next();
}