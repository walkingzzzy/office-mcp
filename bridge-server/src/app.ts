import express, { Application } from 'express';
import cors from 'cors';
import config from './config';
import logger, { httpLogger } from './utils/logger';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import routes from './routes';
import mcpClient from './services/MCPClient';

/**
 * 创建Express应用
 */
export function createApp(): Application {
  const app = express();

  // 中间件配置
  app.use(cors({
    origin: config.corsOrigin,
    credentials: true,
  }));

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(httpLogger);

  // 路由
  app.use('/api', routes);

  // 根路径
  app.get('/', (req, res) => {
    res.json({
      name: 'Office AI Bridge Server',
      version: '1.0.0',
      status: 'running',
    });
  });

  // 404处理
  app.use(notFoundHandler);

  // 错误处理
  app.use(errorHandler);

  return app;
}

/**
 * 启动服务器
 */
export async function startServer(): Promise<void> {
  try {
    // 启动MCP Client
    logger.info('启动MCP Client...');
    await mcpClient.start();

    // 创建Express应用
    const app = createApp();

    // 启动HTTP服务器
    const server = app.listen(config.port, () => {
      logger.info(`Bridge Server运行在端口 ${config.port}`);
      logger.info(`API地址: http://localhost:${config.port}/api`);
    });

    // 优雅关闭
    const shutdown = async () => {
      logger.info('收到关闭信号,开始优雅关闭...');

      // 关闭HTTP服务器
      server.close(() => {
        logger.info('HTTP服务器已关闭');
      });

      // 停止MCP Client
      mcpClient.stop();

      // 等待所有连接关闭
      setTimeout(() => {
        logger.info('服务器已完全关闭');
        process.exit(0);
      }, 1000);
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);

  } catch (error) {
    logger.error('启动服务器失败', error);
    process.exit(1);
  }
}

export default createApp;
