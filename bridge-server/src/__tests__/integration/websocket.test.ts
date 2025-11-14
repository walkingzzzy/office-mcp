import WebSocket from 'ws';
import { createServer } from 'http';
import { WebSocketServer } from '../services/WebSocketServer';

describe('WebSocket集成测试', () => {
  let server: any;
  let wsServer: WebSocketServer;
  let port: number;

  beforeAll((done) => {
    server = createServer();
    wsServer = new WebSocketServer(server);

    server.listen(0, () => {
      port = server.address().port;
      done();
    });
  });

  afterAll((done) => {
    server.close(done);
  });

  describe('连接管理', () => {
    it('应该接受WebSocket连接', (done) => {
      const ws = new WebSocket(`ws://localhost:${port}/ws/session/test-session`);

      ws.on('open', () => {
        expect(ws.readyState).toBe(WebSocket.OPEN);
        ws.close();
        done();
      });

      ws.on('error', done);
    });

    it('应该处理连接关闭', (done) => {
      const ws = new WebSocket(`ws://localhost:${port}/ws/session/test-session`);

      ws.on('open', () => {
        ws.close();
      });

      ws.on('close', (code) => {
        expect(code).toBe(1000); // 正常关闭
        done();
      });

      ws.on('error', done);
    });

    it('应该拒绝无效路径的连接', (done) => {
      const ws = new WebSocket(`ws://localhost:${port}/invalid-path`);

      ws.on('error', (error) => {
        expect(error).toBeDefined();
        done();
      });

      // 如果意外连接成功，也要关闭
      ws.on('open', () => {
        ws.close();
        done(new Error('不应该连接成功'));
      });
    });
  });

  describe('消息传输', () => {
    it('应该发送和接收消息', (done) => {
      const ws = new WebSocket(`ws://localhost:${port}/ws/session/test-session`);

      ws.on('open', () => {
        const testMessage = {
          type: 'test',
          data: { message: '测试消息' }
        };

        ws.send(JSON.stringify(testMessage));
      });

      ws.on('message', (data) => {
        const message = JSON.parse(data.toString());
        expect(message.type).toBe('test');
        expect(message.data.message).toBe('测试消息');
        ws.close();
        done();
      });

      ws.on('error', done);
    });

    it('应该处理进度更新消息', (done) => {
      const ws = new WebSocket(`ws://localhost:${port}/ws/session/test-session`);

      ws.on('open', () => {
        const progressMessage = {
          type: 'progress',
          data: {
            tool: 'format_word_text',
            status: 'running',
            progress: 50
          }
        };

        ws.send(JSON.stringify(progressMessage));
      });

      ws.on('message', (data) => {
        const message = JSON.parse(data.toString());
        if (message.type === 'progress') {
          expect(message.data.tool).toBe('format_word_text');
          expect(message.data.progress).toBe(50);
          ws.close();
          done();
        }
      });

      ws.on('error', done);
    });

    it('应该处理错误消息', (done) => {
      const ws = new WebSocket(`ws://localhost:${port}/ws/session/test-session`);

      ws.on('open', () => {
        const errorMessage = {
          type: 'error',
          data: {
            message: '测试错误',
            code: 'TEST_ERROR'
          }
        };

        ws.send(JSON.stringify(errorMessage));
      });

      ws.on('message', (data) => {
        const message = JSON.parse(data.toString());
        if (message.type === 'error') {
          expect(message.data.message).toBe('测试错误');
          expect(message.data.code).toBe('TEST_ERROR');
          ws.close();
          done();
        }
      });

      ws.on('error', done);
    });
  });

  describe('会话管理', () => {
    it('应该为不同会话创建独立连接', (done) => {
      const ws1 = new WebSocket(`ws://localhost:${port}/ws/session/session-1`);
      const ws2 = new WebSocket(`ws://localhost:${port}/ws/session/session-2`);

      let ws1Connected = false;
      let ws2Connected = false;

      const checkBothConnected = () => {
        if (ws1Connected && ws2Connected) {
          ws1.close();
          ws2.close();
          done();
        }
      };

      ws1.on('open', () => {
        ws1Connected = true;
        checkBothConnected();
      });

      ws2.on('open', () => {
        ws2Connected = true;
        checkBothConnected();
      });

      ws1.on('error', done);
      ws2.on('error', done);
    });

    it('应该处理会话消息隔离', (done) => {
      const ws1 = new WebSocket(`ws://localhost:${port}/ws/session/session-1`);
      const ws2 = new WebSocket(`ws://localhost:${port}/ws/session/session-2`);

      let ws1Ready = false;
      let ws2Ready = false;
      let ws2ReceivedMessage = false;

      const checkReady = () => {
        if (ws1Ready && ws2Ready) {
          // ws1发送消息
          ws1.send(JSON.stringify({
            type: 'test',
            data: { sessionId: 'session-1' }
          }));

          // 等待一段时间确保ws2不会收到消息
          setTimeout(() => {
            if (!ws2ReceivedMessage) {
              ws1.close();
              ws2.close();
              done();
            }
          }, 100);
        }
      };

      ws1.on('open', () => {
        ws1Ready = true;
        checkReady();
      });

      ws2.on('open', () => {
        ws2Ready = true;
        checkReady();
      });

      ws2.on('message', () => {
        ws2ReceivedMessage = true;
        ws1.close();
        ws2.close();
        done(new Error('ws2不应该收到ws1的消息'));
      });

      ws1.on('error', done);
      ws2.on('error', done);
    });
  });

  describe('错误处理', () => {
    it('应该处理无效JSON消息', (done) => {
      const ws = new WebSocket(`ws://localhost:${port}/ws/session/test-session`);

      ws.on('open', () => {
        ws.send('invalid json');
      });

      ws.on('message', (data) => {
        const message = JSON.parse(data.toString());
        if (message.type === 'error') {
          expect(message.data.message).toContain('JSON');
          ws.close();
          done();
        }
      });

      ws.on('error', done);
    });

    it('应该处理连接超时', (done) => {
      const ws = new WebSocket(`ws://localhost:${port}/ws/session/test-session`);

      // 设置较短的超时时间进行测试
      const timeout = setTimeout(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.close();
        }
        done();
      }, 1000);

      ws.on('open', () => {
        // 连接成功，清除超时
        clearTimeout(timeout);
        ws.close();
        done();
      });

      ws.on('error', (error) => {
        clearTimeout(timeout);
        done();
      });
    });
  });

  describe('性能测试', () => {
    it('应该处理多个并发连接', (done) => {
      const connectionCount = 10;
      const connections: WebSocket[] = [];
      let connectedCount = 0;

      for (let i = 0; i < connectionCount; i++) {
        const ws = new WebSocket(`ws://localhost:${port}/ws/session/session-${i}`);

        ws.on('open', () => {
          connectedCount++;
          if (connectedCount === connectionCount) {
            // 所有连接都成功
            connections.forEach(conn => conn.close());
            done();
          }
        });

        ws.on('error', done);
        connections.push(ws);
      }
    });

    it('应该处理快速消息发送', (done) => {
      const ws = new WebSocket(`ws://localhost:${port}/ws/session/test-session`);
      const messageCount = 100;
      let receivedCount = 0;

      ws.on('open', () => {
        // 快速发送多条消息
        for (let i = 0; i < messageCount; i++) {
          ws.send(JSON.stringify({
            type: 'test',
            data: { index: i }
          }));
        }
      });

      ws.on('message', () => {
        receivedCount++;
        if (receivedCount === messageCount) {
          ws.close();
          done();
        }
      });

      ws.on('error', done);
    });
  });
});