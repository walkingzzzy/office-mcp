import httpClient, { HttpClient } from './HttpClient';
import axios from 'axios';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock axios.create
const mockAxiosInstance = {
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
  defaults: { baseURL: '' },
  interceptors: {
    request: { use: jest.fn() },
    response: { use: jest.fn() },
  },
};

mockedAxios.create = jest.fn(() => mockAxiosInstance as any);

describe('HttpClient单元测试', () => {
  let httpClient: HttpClient;

  beforeEach(() => {
    // 重置所有mock
    jest.clearAllMocks();
    httpClient = new HttpClient();
  });

  describe('构造函数', () => {
    test('应该使用默认配置创建HttpClient实例', () => {
      expect(httpClient).toBeInstanceOf(HttpClient);
      expect(httpClient.getBaseURL()).toBe('http://localhost:3000');
    });

    test('应该使用自定义配置创建HttpClient实例', () => {
      const customClient = new HttpClient({
        baseURL: 'http://localhost:3001',
        timeout: 10000,
      });
      expect(customClient.getBaseURL()).toBe('http://localhost:3001');
    });
  });

  describe('GET请求', () => {
    test('应该成功发送GET请求', async () => {
      const mockData = { message: 'success' };
      const clientInstance = (httpClient as any).client;
      clientInstance.get.mockResolvedValue({ data: mockData, status: 200 });

      const result = await httpClient.get('/test');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockData);
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/test', undefined);
    });

    test('应该处理GET请求失败', async () => {
      const clientInstance = (httpClient as any).client;
      clientInstance.get.mockRejectedValue(new Error('Network Error'));

      const result = await httpClient.get('/test');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network Error');
      expect(result.message).toBe('请求失败');
    });
  });

  describe('POST请求', () => {
    test('应该成功发送POST请求', async () => {
      const mockData = { id: 1 };
      const requestData = { name: 'test' };
      const clientInstance = (httpClient as any).client;
      clientInstance.post.mockResolvedValue({ data: mockData, status: 200 });

      const result = await httpClient.post('/test', requestData);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockData);
      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/test', requestData, undefined);
    });

    test('应该处理POST请求失败', async () => {
      const clientInstance = (httpClient as any).client;
      clientInstance.post.mockRejectedValue(new Error('Server Error'));

      const result = await httpClient.post('/test', {});

      expect(result.success).toBe(false);
      expect(result.error).toBe('Server Error');
    });
  });

  describe('PUT请求', () => {
    test('应该成功发送PUT请求', async () => {
      const mockData = { updated: true };
      const requestData = { name: 'updated' };
      const clientInstance = (httpClient as any).client;
      clientInstance.put.mockResolvedValue({ data: mockData, status: 200 });

      const result = await httpClient.put('/test/1', requestData);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockData);
    });
  });

  describe('DELETE请求', () => {
    test('应该成功发送DELETE请求', async () => {
      const mockData = { deleted: true };
      const clientInstance = (httpClient as any).client;
      clientInstance.delete.mockResolvedValue({ data: mockData, status: 200 });

      const result = await httpClient.delete('/test/1');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockData);
    });
  });

  describe('工具方法', () => {
    test('callTool应该调用正确的端点', async () => {
      const mockData = { result: 'success' };
      const clientInstance = (httpClient as any).client;
      clientInstance.post.mockResolvedValue({ data: mockData, status: 200 });

      const result = await httpClient.callTool('test_tool', { param: 'value' });

      expect(result.success).toBe(true);
      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/tools/call', {
        tool: 'test_tool',
        parameters: { param: 'value' },
      });
    });

    test('healthCheck应该调用健康检查端点', async () => {
      const mockData = { status: 'healthy' };
      const clientInstance = (httpClient as any).client;
      clientInstance.get.mockResolvedValue({ data: mockData, status: 200 });

      const result = await httpClient.healthCheck();

      expect(result.success).toBe(true);
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/health', undefined);
    });

    test('setBaseURL应该更新基础URL', () => {
      httpClient.setBaseURL('http://localhost:4000');
      expect(httpClient.getBaseURL()).toBe('http://localhost:4000');
    });
  });

  describe('文件上传', () => {
    test('应该成功上传文件', async () => {
      const mockFile = new File(['test'], 'test.txt', { type: 'text/plain' });
      const mockData = { fileId: '123' };
      const clientInstance = (httpClient as any).client;
      clientInstance.post.mockResolvedValue({ data: mockData, status: 200 });

      const result = await httpClient.uploadFile(mockFile, 'test.txt');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockData);
      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/upload',
        expect.any(FormData),
        expect.objectContaining({
          headers: { 'Content-Type': 'multipart/form-data' },
        })
      );
    });

    test('应该处理文件上传失败', async () => {
      const mockFile = new File(['test'], 'test.txt', { type: 'text/plain' });
      const clientInstance = (httpClient as any).client;
      clientInstance.post.mockRejectedValue(new Error('Upload Failed'));

      const result = await httpClient.uploadFile(mockFile);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Upload Failed');
      expect(result.message).toBe('文件上传失败');
    });
  });
});
