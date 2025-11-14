import { ConversationManager } from '../services/ConversationManager';

describe('对话管理器单元测试', () => {
  let conversationManager: ConversationManager;

  beforeEach(() => {
    conversationManager = new ConversationManager();
  });

  describe('对话创建', () => {
    it('应该创建新对话', () => {
      const conversation = conversationManager.createConversation(
        '测试对话',
        'openai',
        '你是一个AI助手'
      );

      expect(conversation).toBeDefined();
      expect(conversation.id).toBeDefined();
      expect(conversation.title).toBe('测试对话');
      expect(conversation.model).toBe('openai');
      expect(conversation.systemPrompt).toBe('你是一个AI助手');
      expect(conversation.messages).toEqual([]);
      expect(conversation.createdAt).toBeDefined();
    });

    it('应该为每个对话生成唯一ID', () => {
      const conv1 = conversationManager.createConversation('对话1', 'openai');
      const conv2 = conversationManager.createConversation('对话2', 'openai');

      expect(conv1.id).not.toBe(conv2.id);
    });
  });

  describe('对话检索', () => {
    it('应该根据ID获取对话', () => {
      const conversation = conversationManager.createConversation('测试', 'openai');

      const retrieved = conversationManager.getConversation(conversation.id);

      expect(retrieved).toEqual(conversation);
    });

    it('应该返回null对于不存在的对话', () => {
      const result = conversationManager.getConversation('nonexistent');

      expect(result).toBeNull();
    });

    it('应该获取所有对话', () => {
      const conv1 = conversationManager.createConversation('对话1', 'openai');
      const conv2 = conversationManager.createConversation('对话2', 'claude');

      const allConversations = conversationManager.getAllConversations();

      expect(allConversations).toHaveLength(2);
      expect(allConversations).toContainEqual(conv1);
      expect(allConversations).toContainEqual(conv2);
    });
  });

  describe('消息管理', () => {
    it('应该添加用户消息', () => {
      const conversation = conversationManager.createConversation('测试', 'openai');

      conversationManager.addMessage(conversation.id, {
        role: 'user',
        content: '你好'
      });

      const updated = conversationManager.getConversation(conversation.id);
      expect(updated?.messages).toHaveLength(1);
      expect(updated?.messages[0].role).toBe('user');
      expect(updated?.messages[0].content).toBe('你好');
      expect(updated?.messages[0].timestamp).toBeDefined();
    });

    it('应该添加助手消息', () => {
      const conversation = conversationManager.createConversation('测试', 'openai');

      conversationManager.addMessage(conversation.id, {
        role: 'assistant',
        content: '你好！我是AI助手。'
      });

      const updated = conversationManager.getConversation(conversation.id);
      expect(updated?.messages).toHaveLength(1);
      expect(updated?.messages[0].role).toBe('assistant');
      expect(updated?.messages[0].content).toBe('你好！我是AI助手。');
    });

    it('应该处理工具调用消息', () => {
      const conversation = conversationManager.createConversation('测试', 'openai');

      conversationManager.addMessage(conversation.id, {
        role: 'assistant',
        content: '我将调用工具',
        tool_calls: [{
          id: 'call_123',
          type: 'function',
          function: {
            name: 'test_tool',
            arguments: '{"param": "value"}'
          }
        }]
      });

      const updated = conversationManager.getConversation(conversation.id);
      expect(updated?.messages[0].tool_calls).toBeDefined();
      expect(updated?.messages[0].tool_calls?.[0].function.name).toBe('test_tool');
    });

    it('应该处理不存在的对话', () => {
      expect(() => {
        conversationManager.addMessage('nonexistent', {
          role: 'user',
          content: '测试'
        });
      }).toThrow('对话不存在');
    });
  });

  describe('对话更新', () => {
    it('应该更新对话标题', () => {
      const conversation = conversationManager.createConversation('原标题', 'openai');

      conversationManager.updateConversation(conversation.id, {
        title: '新标题'
      });

      const updated = conversationManager.getConversation(conversation.id);
      expect(updated?.title).toBe('新标题');
    });

    it('应该更新系统提示', () => {
      const conversation = conversationManager.createConversation('测试', 'openai', '原提示');

      conversationManager.updateConversation(conversation.id, {
        systemPrompt: '新提示'
      });

      const updated = conversationManager.getConversation(conversation.id);
      expect(updated?.systemPrompt).toBe('新提示');
    });

    it('应该处理不存在的对话更新', () => {
      expect(() => {
        conversationManager.updateConversation('nonexistent', {
          title: '新标题'
        });
      }).toThrow('对话不存在');
    });
  });

  describe('对话删除', () => {
    it('应该删除对话', () => {
      const conversation = conversationManager.createConversation('测试', 'openai');

      const deleted = conversationManager.deleteConversation(conversation.id);

      expect(deleted).toBe(true);
      expect(conversationManager.getConversation(conversation.id)).toBeNull();
    });

    it('应该处理删除不存在的对话', () => {
      const deleted = conversationManager.deleteConversation('nonexistent');

      expect(deleted).toBe(false);
    });
  });

  describe('对话统计', () => {
    it('应该返回对话总数', () => {
      const initialCount = conversationManager.getConversationCount();

      conversationManager.createConversation('对话1', 'openai');
      conversationManager.createConversation('对话2', 'claude');

      expect(conversationManager.getConversationCount()).toBe(initialCount + 2);
    });

    it('应该按模型筛选对话', () => {
      conversationManager.createConversation('OpenAI对话1', 'openai');
      conversationManager.createConversation('OpenAI对话2', 'openai');
      conversationManager.createConversation('Claude对话', 'claude');

      const openaiConversations = conversationManager.getConversationsByModel('openai');
      const claudeConversations = conversationManager.getConversationsByModel('claude');

      expect(openaiConversations).toHaveLength(2);
      expect(claudeConversations).toHaveLength(1);
    });
  });

  describe('消息历史', () => {
    it('应该获取对话的消息历史', () => {
      const conversation = conversationManager.createConversation('测试', 'openai');

      conversationManager.addMessage(conversation.id, {
        role: 'user',
        content: '第一条消息'
      });

      conversationManager.addMessage(conversation.id, {
        role: 'assistant',
        content: '第二条消息'
      });

      const messages = conversationManager.getMessages(conversation.id);

      expect(messages).toHaveLength(2);
      expect(messages[0].content).toBe('第一条消息');
      expect(messages[1].content).toBe('第二条消息');
    });

    it('应该限制消息历史长度', () => {
      const conversation = conversationManager.createConversation('测试', 'openai');

      // 添加5条消息
      for (let i = 1; i <= 5; i++) {
        conversationManager.addMessage(conversation.id, {
          role: 'user',
          content: `消息${i}`
        });
      }

      const recentMessages = conversationManager.getMessages(conversation.id, 3);

      expect(recentMessages).toHaveLength(3);
      expect(recentMessages[0].content).toBe('消息3');
      expect(recentMessages[2].content).toBe('消息5');
    });
  });
});