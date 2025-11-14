/**
 * Jest测试环境设置
 */

// 设置测试超时时间
jest.setTimeout(30000);

// 模拟环境变量
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'error';

// 全局测试工具
global.console = {
  ...console,
  // 在测试中静默某些日志
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: console.warn,
  error: console.error,
};

// 模拟外部依赖
jest.mock('openai', () => ({
  OpenAI: jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: jest.fn().mockResolvedValue({
          choices: [{ message: { content: '模拟AI响应' } }]
        })
      }
    }
  }))
}));

// 清理函数
afterEach(() => {
  jest.clearAllMocks();
});

// 全局错误处理
process.on('unhandledRejection', (reason, promise) => {
  console.error('未处理的Promise拒绝:', reason);
});

// 测试工具函数
export const createMockRequest = (body: any = {}, params: any = {}, query: any = {}) => ({
  body,
  params,
  query,
  headers: {},
  get: jest.fn(),
});

export const createMockResponse = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  res.setHeader = jest.fn().mockReturnValue(res);
  res.write = jest.fn().mockReturnValue(res);
  res.end = jest.fn().mockReturnValue(res);
  return res;
};

export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));