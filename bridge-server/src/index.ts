import { startServer } from './app';
import logger from './utils/logger';

/**
 * 应用入口
 */
async function main() {
  try {
    logger.info('='.repeat(50));
    logger.info('Office AI Bridge Server');
    logger.info('='.repeat(50));

    await startServer();
  } catch (error) {
    logger.error('应用启动失败', error);
    process.exit(1);
  }
}

// 启动应用
main();
