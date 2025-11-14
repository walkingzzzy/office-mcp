import request from 'supertest';
import express from 'express';
import { aiController } from '../../controllers/aiController';

describe('API集成测试', () => {
  let app: express.Application;

  beforeAll(() => {
    app = express();
    app.use(express.json());

    // 设置路由
    app.post('/api/conversations', aiController.createConversation);
    app.get('/api/conversations/:id', aiController.getConversation);
    app.post('/api/conversations/:id/messages', aiController.sendMessage);
    app.post('/api/conversations/:id/stream-chat', aiController.streamChat);
  });

  describe('POST /api/conversations', () => {
    it('应该创建新对话', async () => {
      const response = await request(app)
        .post('/api/conversations')
        .send({
          title: '测试对话',
          model: 'openai',
          systemPrompt: '你是一个AI助手'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.id).toBeDefined();
      expect(response.body.data.title).toBe('测试对话');
      expect(response.body.data.model).toBe('openai');
    });

    it('应该自动生成System Prompt', async () => {
      const response = await request(app)
        .post('/api/conversations')
        .send({
          title: '编辑Word文档',
          model: 'openai',
          documentType: 'word',
          filename: 'test.docx'
        });

      expect(response.status).toBe(201);
      expect(response.body.data.systemPromptGenerated).toBe(true);
      expect(response.body.data.systemPromptLength).toBeGreaterThan(0);
    });

    it('应该验证必需字段', async () => {
      const response = await request(app)
        .post('/api/conversations')
        .send({
          model: 'openai'
          // 缺少title
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('title');
    });

    it('应该验证模型类型', async () => {
      const response = await request(app)
        .post('/api/conversations')
        .send({
          title: '测试',
          model: 'invalid-model'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('model');
    });
  });

  describe('GET /api/conversations/:id', () => {
    let conversationId: string;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/conversations')
        .send({
          title: '测试对话',
          model: 'openai'
        });
      conversationId = response.body.data.id;
    });

    it('应该获取对话详情', async () => {
      const response = await request(app)
        .get(`/api/conversations/${conversationId}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(conversationId);
      expect(response.body.data.title).toBe('测试对话');
    });

    it('应该处理不存在的对话', async () => {
      const response = await request(app)
        .get('/api/conversations/nonexistent');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('对话不存在');
    });
  });

  describe('POST /api/conversations/:id/messages', () => {
    let conversationId: string;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/conversations')
        .send({
          title: '测试对话',
          model: 'openai'
        });
      conversationId = response.body.data.id;
    });

    it('应该发送消息并获得回复', async () => {
      const response = await request(app)
        .post(`/api/conversations/${conversationId}/messages`)
        .send({
          message: '你好'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.messageId).toBeDefined();
      expect(response.body.data.content).toBeDefined();
    });

    it('应该处理带文档数据的消息', async () => {
      const documentData = Buffer.from('测试文档内容').toString('base64');

      const response = await request(app)
        .post(`/api/conversations/${conversationId}/messages`)
        .send({
          message: '分析这个文档',
          documentData
        });

      expect(response.status).toBe(200);
      expect(response.body.data.content).toBeDefined();
    });

    it('应该验证消息内容', async () => {
      const response = await request(app)
        .post(`/api/conversations/${conversationId}/messages`)
        .send({
          // 缺少message字段
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('message');
    });

    it('应该处理不存在的对话', async () => {
      const response = await request(app)
        .post('/api/conversations/nonexistent/messages')
        .send({
          message: '测试消息'
        });

      expect(response.status).toBe(404);
      expect(response.body.error).toContain('对话不存在');
    });
  });

  describe('POST /api/conversations/:id/stream-chat', () => {
    let conversationId: string;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/conversations')
        .send({
          title: '测试对话',
          model: 'openai'
        });
      conversationId = response.body.data.id;
    });

    it('应该返回流式响应', async () => {
      const response = await request(app)
        .post(`/api/conversations/${conversationId}/stream-chat`)
        .send({
          message: '请简短回复'
        });

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain('text/plain');
      expect(response.headers['cache-control']).toBe('no-cache');
      expect(response.headers['connection']).toBe('keep-alive');
    });

    it('应该处理流式响应中的错误', async () => {
      // 发送无效的消息格式
      const response = await request(app)
        .post(`/api/conversations/${conversationId}/stream-chat`)
        .send({
          // 缺少message字段
        });

      expect(response.status).toBe(400);
    });
  });

  describe('错误处理', () => {
    it('应该处理JSON解析错误', async () => {
      const response = await request(app)
        .post('/api/conversations')
        .set('Content-Type', 'application/json')
        .send('invalid json');

      expect(response.status).toBe(400);
    });

    it('应该处理服务器内部错误', async () => {
      // Mock一个会抛出错误的情况
      jest.spyOn(console, 'error').mockImplementation(() => {});

      const response = await request(app)
        .post('/api/conversations')
        .send({
          title: 'error-trigger', // 特殊标题触发错误
          model: 'openai'
        });

      // 根据实际错误处理逻辑调整期望
      expect([400, 500]).toContain(response.status);
    });
  });

  describe('CORS和安全头', () => {
    it('应该设置正确的CORS头', async () => {
      const response = await request(app)
        .options('/api/conversations')
        .set('Origin', 'http://localhost:3000');

      expect(response.headers['access-control-allow-origin']).toBeDefined();
    });

    it('应该设置安全头', async () => {
      const response = await request(app)
        .get('/api/conversations/test');

      // 检查是否设置了基本的安全头
      expect(response.headers['x-powered-by']).toBeUndefined();
    });
  });
});