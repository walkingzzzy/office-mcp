import request from 'supertest';
import WebSocket from 'ws';
import { app } from '../../app';

describe('端到端工作流测试', () => {
  describe('完整对话流程', () => {
    it('应该完成完整的AI对话流程', async () => {
      // 1. 创建对话
      const createResponse = await request(app)
        .post('/api/conversations')
        .send({
          title: '测试Word文档编辑',
          model: 'openai',
          documentType: 'word',
          filename: 'test.docx'
        });

      expect(createResponse.status).toBe(201);
      const conversationId = createResponse.body.data.id;

      // 2. 发送第一条消息
      const messageResponse = await request(app)
        .post(`/api/conversations/${conversationId}/messages`)
        .send({
          message: '请将第一段设置为粗体',
          documentData: Buffer.from('测试文档内容').toString('base64')
        });

      expect(messageResponse.status).toBe(200);
      expect(messageResponse.body.data.content).toBeDefined();

      // 3. 获取对话历史
      const historyResponse = await request(app)
        .get(`/api/conversations/${conversationId}`);

      expect(historyResponse.status).toBe(200);
      expect(historyResponse.body.data.messages.length).toBeGreaterThan(0);

      // 4. 发送流式消息
      const streamResponse = await request(app)
        .post(`/api/conversations/${conversationId}/stream-chat`)
        .send({
          message: '现在请将标题居中对齐'
        });

      expect(streamResponse.status).toBe(200);
    });

    it('应该处理多轮对话', async () => {
      // 创建对话
      const createResponse = await request(app)
        .post('/api/conversations')
        .send({
          title: '多轮对话测试',
          model: 'openai'
        });

      const conversationId = createResponse.body.data.id;

      // 第一轮对话
      await request(app)
        .post(`/api/conversations/${conversationId}/messages`)
        .send({ message: '你好，我需要编辑一个Word文档' });

      // 第二轮对话
      await request(app)
        .post(`/api/conversations/${conversationId}/messages`)
        .send({ message: '请帮我添加一个标题' });

      // 第三轮对话
      await request(app)
        .post(`/api/conversations/${conversationId}/messages`)
        .send({ message: '标题应该是"年度报告"' });

      // 检查对话历史
      const historyResponse = await request(app)
        .get(`/api/conversations/${conversationId}`);

      expect(historyResponse.body.data.messages.length).toBe(6); // 3轮对话 = 6条消息
    });
  });

  describe('文档处理流程', () => {
    it('应该处理Word文档编辑流程', async () => {
      const createResponse = await request(app)
        .post('/api/conversations')
        .send({
          title: 'Word文档编辑',
          model: 'openai',
          documentType: 'word',
          filename: 'report.docx'
        });

      const conversationId = createResponse.body.data.id;

      // 模拟Word文档内容
      const wordDocumentData = Buffer.from(`
        <w:document>
          <w:body>
            <w:p><w:r><w:t>这是第一段内容</w:t></w:r></w:p>
            <w:p><w:r><w:t>这是第二段内容</w:t></w:r></w:p>
          </w:body>
        </w:document>
      `).toString('base64');

      const response = await request(app)
        .post(`/api/conversations/${conversationId}/messages`)
        .send({
          message: '请将第一段设置为粗体，第二段设置为斜体',
          documentData: wordDocumentData
        });

      expect(response.status).toBe(200);
      expect(response.body.data.documentData).toBeDefined();
    });

    it('应该处理Excel工作簿编辑流程', async () => {
      const createResponse = await request(app)
        .post('/api/conversations')
        .send({
          title: 'Excel工作簿编辑',
          model: 'openai',
          documentType: 'excel',
          filename: 'data.xlsx'
        });

      const conversationId = createResponse.body.data.id;

      const response = await request(app)
        .post(`/api/conversations/${conversationId}/messages`)
        .send({
          message: '在A1单元格输入"销售数据"，在B1输入"金额"'
        });

      expect(response.status).toBe(200);
      expect(response.body.data.content).toContain('A1');
    });

    it('应该处理PowerPoint演示文稿编辑流程', async () => {
      const createResponse = await request(app)
        .post('/api/conversations')
        .send({
          title: 'PowerPoint演示文稿编辑',
          model: 'openai',
          documentType: 'powerpoint',
          filename: 'presentation.pptx'
        });

      const conversationId = createResponse.body.data.id;

      const response = await request(app)
        .post(`/api/conversations/${conversationId}/messages`)
        .send({
          message: '添加一张标题为"产品介绍"的幻灯片'
        });

      expect(response.status).toBe(200);
      expect(response.body.data.content).toContain('幻灯片');
    });
  });

  describe('WebSocket实时通信流程', () => {
    let server: any;
    let port: number;

    beforeAll((done) => {
      server = app.listen(0, () => {
        port = server.address().port;
        done();
      });
    });

    afterAll((done) => {
      server.close(done);
    });

    it('应该建立WebSocket连接并接收进度更新', (done) => {
      // 首先创建对话
      request(app)
        .post('/api/conversations')
        .send({
          title: 'WebSocket测试',
          model: 'openai'
        })
        .then((response) => {
          const conversationId = response.body.data.id;

          // 建立WebSocket连接
          const ws = new WebSocket(`ws://localhost:${port}/ws/session/${conversationId}`);

          ws.on('open', () => {
            // 发送HTTP请求触发工具调用
            request(app)
              .post(`/api/conversations/${conversationId}/messages`)
              .send({
                message: '请执行一个复杂的文档操作'
              })
              .end();
          });

          ws.on('message', (data) => {
            const message = JSON.parse(data.toString());

            if (message.type === 'progress') {
              expect(message.data.tool).toBeDefined();
              expect(message.data.status).toBeDefined();
              ws.close();
              done();
            }
          });

          ws.on('error', done);
        });
    });

    it('应该处理WebSocket错误通知', (done) => {
      request(app)
        .post('/api/conversations')
        .send({
          title: 'WebSocket错误测试',
          model: 'openai'
        })
        .then((response) => {
          const conversationId = response.body.data.id;
          const ws = new WebSocket(`ws://localhost:${port}/ws/session/${conversationId}`);

          ws.on('open', () => {
            // 发送会导致错误的请求
            request(app)
              .post(`/api/conversations/${conversationId}/messages`)
              .send({
                message: 'trigger-error' // 特殊消息触发错误
              })
              .end();
          });

          ws.on('message', (data) => {
            const message = JSON.parse(data.toString());

            if (message.type === 'error') {
              expect(message.data.message).toBeDefined();
              ws.close();
              done();
            }
          });

          ws.on('error', done);
        });
    });
  });

  describe('错误恢复流程', () => {
    it('应该处理MCP服务器连接失败', async () => {
      // 模拟MCP服务器不可用的情况
      const response = await request(app)
        .post('/api/conversations')
        .send({
          title: 'MCP错误测试',
          model: 'openai',
          documentType: 'word',
          filename: 'test.docx'
        });

      // 即使MCP服务器不可用，也应该能创建对话（使用默认Prompt）
      expect(response.status).toBe(201);
      expect(response.body.data.systemPromptGenerated).toBe(false);
    });

    it('应该处理AI服务API错误', async () => {
      const createResponse = await request(app)
        .post('/api/conversations')
        .send({
          title: 'AI API错误测试',
          model: 'openai'
        });

      const conversationId = createResponse.body.data.id;

      // 发送会导致AI API错误的消息
      const response = await request(app)
        .post(`/api/conversations/${conversationId}/messages`)
        .send({
          message: 'api-error-trigger' // 特殊消息触发API错误
        });

      expect(response.status).toBe(500);
      expect(response.body.error).toBeDefined();
    });

    it('应该处理无效文档数据', async () => {
      const createResponse = await request(app)
        .post('/api/conversations')
        .send({
          title: '无效文档测试',
          model: 'openai'
        });

      const conversationId = createResponse.body.data.id;

      const response = await request(app)
        .post(`/api/conversations/${conversationId}/messages`)
        .send({
          message: '分析这个文档',
          documentData: 'invalid-base64-data'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('文档数据');
    });
  });

  describe('性能和负载测试', () => {
    it('应该处理并发对话创建', async () => {
      const promises = [];

      for (let i = 0; i < 10; i++) {
        promises.push(
          request(app)
            .post('/api/conversations')
            .send({
              title: `并发对话${i}`,
              model: 'openai'
            })
        );
      }

      const responses = await Promise.all(promises);

      responses.forEach((response) => {
        expect(response.status).toBe(201);
        expect(response.body.data.id).toBeDefined();
      });
    });

    it('应该处理大文档数据', async () => {
      const createResponse = await request(app)
        .post('/api/conversations')
        .send({
          title: '大文档测试',
          model: 'openai'
        });

      const conversationId = createResponse.body.data.id;

      // 创建1MB的测试数据
      const largeData = Buffer.alloc(1024 * 1024, 'a').toString('base64');

      const response = await request(app)
        .post(`/api/conversations/${conversationId}/messages`)
        .send({
          message: '分析这个大文档',
          documentData: largeData
        })
        .timeout(10000); // 10秒超时

      expect(response.status).toBe(200);
    });

    it('应该在合理时间内响应', async () => {
      const startTime = Date.now();

      const response = await request(app)
        .post('/api/conversations')
        .send({
          title: '性能测试',
          model: 'openai'
        });

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(response.status).toBe(201);
      expect(responseTime).toBeLessThan(2000); // 2秒内响应
    });
  });
});