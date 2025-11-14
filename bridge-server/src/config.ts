import dotenv from 'dotenv';
import path from 'path';

// 加载环境变量
dotenv.config();

/**
 * 应用配置
 */
const config = {
  // 服务器配置
  port: parseInt(process.env.PORT || '3001', 10),
  corsOrigin: process.env.CORS_ORIGIN || 'https://localhost:3000',

  // MCP服务器配置
  mcpServerPath: process.env.MCP_SERVER_PATH || '../src/office_mcp_server/main.py',
  pythonPath: process.env.PYTHON_PATH || 'python',

  // 路径配置
  tempDir: process.env.TEMP_DIR || './temp',
  logDir: process.env.LOG_DIR || './logs',

  // 日志配置
  logLevel: (process.env.LOG_LEVEL || 'INFO').toLowerCase(),

  // 文件上传配置
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '50', 10), // MB
};

export default config;
