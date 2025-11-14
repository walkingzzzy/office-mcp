import request from 'supertest';
import { createApp } from '../app';
import mcpClient from '../services/MCPClient';

// Mock MCP Client
jest.mock('../services/MCPClient', () => ({
  __esModule: true,
  default: {
    start: jest.fn(),
    stop: jest.fn(),
    initialized: true,
    getServerInfo: jest.fn(),
    listTools: jest.fn(),
    callTool: jest.fn(),
  },
}));

describe('Bridge Server API测试', () => {
  let app: any;

  beforeAll(() => {
    app = createApp();
  });

  afterAll(() => {
    jest.clearAllMocks();
  });

  describe('GET /', () => {
    it('应该返回服务器基本信息', async () => {
      const response = await request(app).get('/');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('name', 'Office AI Bridge Server');
      expect(response.body).toHaveProperty('version', '1.0.0');
      expect(response.body).toHaveProperty('status', 'running');
    });
  });

  describe('GET /api/health', () => {
    it('应该返回健康状态', async () => {
      const response = await request(app).get('/api/health');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('status', 'ok');
      expect(response.body.data).toHaveProperty('mcpServer');
    });
  });

  describe('GET /api/server/info', () => {
    it('应该返回服务器信息', async () => {
      const mockServerInfo = {
        name: 'office-mcp-server',
        version: '1.0.0',
        protocolVersion: '2024-11-05',
      };

      (mcpClient.getServerInfo as jest.Mock).mockResolvedValue(mockServerInfo);

      const response = await request(app).get('/api/server/info');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toEqual(mockServerInfo);
    });

    it('应该处理MCP Client错误', async () => {
      (mcpClient.getServerInfo as jest.Mock).mockRejectedValue(
        new Error('MCP服务器未连接')
      );

      const response = await request(app).get('/api/server/info');

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/tools/list', () => {
    it('应该返回工具列表', async () => {
      const mockTools = [
        {
          name: 'get_server_info',
          description: '获取服务器信息',
          inputSchema: {
            type: 'object',
            properties: {},
            required: [],
          },
        },
      ];

      (mcpClient.listTools as jest.Mock).mockResolvedValue(mockTools);

      const response = await request(app).get('/api/tools/list');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('tools');
      expect(response.body.data.tools).toEqual(mockTools);
    });
  });

  describe('POST /api/tools/call', () => {
    it('应该成功调用工具', async () => {
      const mockResult = {
        name: 'office-mcp-server',
        version: '1.0.0',
      };

      (mcpClient.callTool as jest.Mock).mockResolvedValue(mockResult);

      const response = await request(app)
        .post('/api/tools/call')
        .send({
          tool: 'get_server_info',
          parameters: {},
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toEqual(mockResult);
      expect(mcpClient.callTool).toHaveBeenCalledWith('get_server_info', {});
    });

    it('应该验证必需的tool参数', async () => {
      const response = await request(app)
        .post('/api/tools/call')
        .send({
          parameters: {},
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', '缺少tool参数');
    });

    it('应该处理工具调用错误', async () => {
      (mcpClient.callTool as jest.Mock).mockRejectedValue(
        new Error('工具执行失败')
      );

      const response = await request(app)
        .post('/api/tools/call')
        .send({
          tool: 'invalid_tool',
          parameters: {},
        });

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('404处理', () => {
    it('应该返回404错误', async () => {
      const response = await request(app).get('/api/nonexistent');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', '路由不存在');
    });
  });
});
