import { MCPClient } from '../services/MCPClient';
import { EventEmitter } from 'events';

describe('MCP Client单元测试', () => {
  let client: MCPClient;

  beforeEach(() => {
    client = new MCPClient();
  });

  afterEach(() => {
    if (client.initialized) {
      client.stop();
    }
  });

  describe('初始化', () => {
    it('应该创建MCPClient实例', () => {
      expect(client).toBeInstanceOf(MCPClient);
      expect(client).toBeInstanceOf(EventEmitter);
    });

    it('初始状态应该未初始化', () => {
      expect(client.initialized).toBe(false);
    });
  });

  describe('请求管理', () => {
    it('应该在未初始化时拒绝请求', async () => {
      await expect(client.request('test')).rejects.toThrow('MCP服务器未初始化');
    });
  });

  describe('工具方法', () => {
    it('listTools应该返回Promise', () => {
      const promise = client.listTools().catch(() => {});
      expect(promise).toBeInstanceOf(Promise);
    });

    it('callTool应该返回Promise', () => {
      const promise = client.callTool('test', {}).catch(() => {});
      expect(promise).toBeInstanceOf(Promise);
    });

    it('getServerInfo应该返回Promise', () => {
      const promise = client.getServerInfo().catch(() => {});
      expect(promise).toBeInstanceOf(Promise);
    });
  });
});
