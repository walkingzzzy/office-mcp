import dotenv from 'dotenv';
import path from 'path';
import { ServerConfig } from '../types';

// 加载环境变量
dotenv.config();

/**
 * 服务器配置
 */
export const config: ServerConfig = {
  port: parseInt(process.env.PORT || '3001', 10),
  mcpServerPath: process.env.MCP_SERVER_PATH || path.join(__dirname, '../../../src/office_mcp_server/main.py'),
  pythonPath: process.env.PYTHON_PATH || 'python',
  tempDir: process.env.TEMP_DIR || path.join(__dirname, '../../temp'),
  logDir: process.env.LOG_DIR || path.join(__dirname, '../../logs'),
  logLevel: process.env.LOG_LEVEL || 'info',
  corsOrigin: process.env.CORS_ORIGIN || 'https://localhost:3000',
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '50', 10),
};

export default config;
