import { SessionManager } from '../services/SessionManager';

describe('会话管理器单元测试', () => {
  let sessionManager: SessionManager;

  beforeEach(() => {
    sessionManager = new SessionManager();
  });

  describe('会话创建', () => {
    it('应该创建新会话', () => {
      const sessionId = sessionManager.createSession();

      expect(sessionId).toBeDefined();
      expect(typeof sessionId).toBe('string');
      expect(sessionId.length).toBeGreaterThan(0);
    });

    it('应该为每个会话生成唯一ID', () => {
      const sessionId1 = sessionManager.createSession();
      const sessionId2 = sessionManager.createSession();

      expect(sessionId1).not.toBe(sessionId2);
    });
  });

  describe('会话验证', () => {
    it('应该验证有效会话', () => {
      const sessionId = sessionManager.createSession();

      expect(sessionManager.isValidSession(sessionId)).toBe(true);
    });

    it('应该拒绝无效会话', () => {
      expect(sessionManager.isValidSession('invalid-session')).toBe(false);
      expect(sessionManager.isValidSession('')).toBe(false);
      expect(sessionManager.isValidSession(null as any)).toBe(false);
    });
  });

  describe('会话数据管理', () => {
    it('应该存储和检索会话数据', () => {
      const sessionId = sessionManager.createSession();
      const testData = { key: 'value', number: 123 };

      sessionManager.setSessionData(sessionId, 'testKey', testData);
      const retrievedData = sessionManager.getSessionData(sessionId, 'testKey');

      expect(retrievedData).toEqual(testData);
    });

    it('应该返回undefined对于不存在的数据', () => {
      const sessionId = sessionManager.createSession();

      const data = sessionManager.getSessionData(sessionId, 'nonexistent');

      expect(data).toBeUndefined();
    });

    it('应该处理无效会话的数据操作', () => {
      expect(() => {
        sessionManager.setSessionData('invalid', 'key', 'value');
      }).toThrow('会话不存在');

      expect(() => {
        sessionManager.getSessionData('invalid', 'key');
      }).toThrow('会话不存在');
    });
  });

  describe('会话清理', () => {
    it('应该删除会话', () => {
      const sessionId = sessionManager.createSession();
      sessionManager.setSessionData(sessionId, 'key', 'value');

      sessionManager.destroySession(sessionId);

      expect(sessionManager.isValidSession(sessionId)).toBe(false);
      expect(() => {
        sessionManager.getSessionData(sessionId, 'key');
      }).toThrow('会话不存在');
    });

    it('应该处理删除不存在的会话', () => {
      expect(() => {
        sessionManager.destroySession('nonexistent');
      }).not.toThrow();
    });
  });

  describe('会话统计', () => {
    it('应该返回活跃会话数量', () => {
      const initialCount = sessionManager.getActiveSessionCount();

      const sessionId1 = sessionManager.createSession();
      const sessionId2 = sessionManager.createSession();

      expect(sessionManager.getActiveSessionCount()).toBe(initialCount + 2);

      sessionManager.destroySession(sessionId1);

      expect(sessionManager.getActiveSessionCount()).toBe(initialCount + 1);
    });

    it('应该返回所有活跃会话ID', () => {
      const sessionId1 = sessionManager.createSession();
      const sessionId2 = sessionManager.createSession();

      const activeSessions = sessionManager.getActiveSessions();

      expect(activeSessions).toContain(sessionId1);
      expect(activeSessions).toContain(sessionId2);
    });
  });

  describe('会话过期', () => {
    it('应该设置会话过期时间', () => {
      const sessionId = sessionManager.createSession();
      const expiryTime = Date.now() + 60000; // 1分钟后过期

      sessionManager.setSessionExpiry(sessionId, expiryTime);

      expect(sessionManager.isValidSession(sessionId)).toBe(true);
    });

    it('应该清理过期会话', () => {
      const sessionId = sessionManager.createSession();
      const pastTime = Date.now() - 1000; // 1秒前过期

      sessionManager.setSessionExpiry(sessionId, pastTime);
      sessionManager.cleanupExpiredSessions();

      expect(sessionManager.isValidSession(sessionId)).toBe(false);
    });
  });
});