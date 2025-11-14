import { OpenAIService } from '../services/OpenAIService';

describe('OpenAI服务单元测试', () => {
  let service: OpenAIService;

  beforeEach(() => {
    service = new OpenAIService();
  });

  describe('初始化', () => {
    it('应该创建OpenAIService实例', () => {
      expect(service).toBeInstanceOf(OpenAIService);
    });
  });

  describe('聊天完成', () => {
    it('应该处理基本聊天请求', async () => {
      const mockResponse = {
        choices: [{ message: { content: '测试响应' } }]
      };

      // Mock OpenAI API
      jest.spyOn(service as any, 'client').mockImplementation(() => ({
        chat: {
          completions: {
            create: jest.fn().mockResolvedValue(mockResponse)
          }
        }
      }));

      const result = await service.chat([
        { role: 'user', content: '测试消息' }
      ]);

      expect(result).toBeDefined();
    });

    it('应该处理API错误', async () => {
      jest.spyOn(service as any, 'client').mockImplementation(() => ({
        chat: {
          completions: {
            create: jest.fn().mockRejectedValue(new Error('API错误'))
          }
        }
      }));

      await expect(service.chat([
        { role: 'user', content: '测试消息' }
      ])).rejects.toThrow('API错误');
    });
  });

  describe('流式聊天', () => {
    it('应该处理流式响应', async () => {
      const mockStream = {
        [Symbol.asyncIterator]: async function* () {
          yield { choices: [{ delta: { content: '测试' } }] };
          yield { choices: [{ delta: { content: '流式' } }] };
          yield { choices: [{ delta: { content: '响应' } }] };
        }
      };

      jest.spyOn(service as any, 'client').mockImplementation(() => ({
        chat: {
          completions: {
            create: jest.fn().mockResolvedValue(mockStream)
          }
        }
      }));

      const chunks: string[] = [];
      await service.chatStream(
        [{ role: 'user', content: '测试消息' }],
        (chunk) => chunks.push(chunk)
      );

      expect(chunks).toEqual(['测试', '流式', '响应']);
    });
  });

  describe('工具调用', () => {
    it('应该处理工具调用请求', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: '执行工具调用',
            tool_calls: [{
              id: 'call_123',
              type: 'function',
              function: {
                name: 'test_tool',
                arguments: '{"param": "value"}'
              }
            }]
          }
        }]
      };

      jest.spyOn(service as any, 'client').mockImplementation(() => ({
        chat: {
          completions: {
            create: jest.fn().mockResolvedValue(mockResponse)
          }
        }
      }));

      const result = await service.chatWithTools(
        [{ role: 'user', content: '使用工具' }],
        [{ type: 'function', function: { name: 'test_tool', description: '测试工具' } }]
      );

      expect(result.tool_calls).toBeDefined();
      expect(result.tool_calls[0].function.name).toBe('test_tool');
    });
  });
});