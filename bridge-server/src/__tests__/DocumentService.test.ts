import { DocumentService } from '../services/DocumentService';
import fs from 'fs';
import path from 'path';

describe('DocumentService单元测试', () => {
  let documentService: DocumentService;
  const testTempDir = 'test-temp';

  beforeEach(() => {
    documentService = new DocumentService(testTempDir);

    // 确保测试目录存在
    if (!fs.existsSync(testTempDir)) {
      fs.mkdirSync(testTempDir, { recursive: true });
    }
  });

  afterEach(() => {
    // 清理测试文件
    if (fs.existsSync(testTempDir)) {
      const files = fs.readdirSync(testTempDir);
      files.forEach(file => {
        fs.unlinkSync(path.join(testTempDir, file));
      });
      fs.rmdirSync(testTempDir);
    }
  });

  describe('会话管理', () => {
    test('应该创建新会话', () => {
      const session = documentService.createSession('test-file-id');

      expect(session).toBeDefined();
      expect(session.id).toBeDefined();
      expect(session.originalFileId).toBe('test-file-id');
      expect(session.status).toBe('active');
      expect(session.changes).toEqual([]);
    });

    test('应该获取现有会话', () => {
      const session = documentService.createSession('test-file-id');
      const retrieved = documentService.getSession(session.id);

      expect(retrieved).toEqual(session);
    });

    test('应该返回undefined对于不存在的会话', () => {
      const retrieved = documentService.getSession('non-existent-id');
      expect(retrieved).toBeUndefined();
    });

    test('应该更新会话', () => {
      const session = documentService.createSession('test-file-id');
      const updated = documentService.updateSession(session.id, {
        status: 'completed',
        modifiedFileId: 'modified-file-id',
      });

      expect(updated).toBeDefined();
      expect(updated!.status).toBe('completed');
      expect(updated!.modifiedFileId).toBe('modified-file-id');
    });

    test('应该删除会话', () => {
      const session = documentService.createSession('test-file-id');
      const deleted = documentService.deleteSession(session.id);

      expect(deleted).toBe(true);
      expect(documentService.getSession(session.id)).toBeUndefined();
    });
  });

  describe('文件操作', () => {
    test('应该检查文件是否存在', () => {
      const testFile = path.join(testTempDir, 'test.txt');
      fs.writeFileSync(testFile, 'test content');

      expect(documentService.fileExists('test.txt')).toBe(true);
      expect(documentService.fileExists('non-existent.txt')).toBe(false);
    });

    test('应该获取文件信息', () => {
      const testFile = path.join(testTempDir, 'test.txt');
      const content = 'test content';
      fs.writeFileSync(testFile, content);

      const info = documentService.getFileInfo('test.txt');
      expect(info).toBeDefined();
      expect(info!.size).toBe(content.length);
      expect(info!.mtime).toBeInstanceOf(Date);
    });

    test('应该删除文件', () => {
      const testFile = path.join(testTempDir, 'test.txt');
      fs.writeFileSync(testFile, 'test content');

      expect(documentService.fileExists('test.txt')).toBe(true);
      const deleted = documentService.deleteFile('test.txt');
      expect(deleted).toBe(true);
      expect(documentService.fileExists('test.txt')).toBe(false);
    });
  });

  describe('差异计算', () => {
    test('应该计算简单文本差异', async () => {
      const originalFile = path.join(testTempDir, 'original.txt');
      const modifiedFile = path.join(testTempDir, 'modified.txt');

      fs.writeFileSync(originalFile, 'line 1\nline 2\nline 3');
      fs.writeFileSync(modifiedFile, 'line 1\nmodified line 2\nline 3\nline 4');

      const diff = await documentService.calculateDiff(originalFile, modifiedFile);

      expect(diff.original).toBe('line 1\nline 2\nline 3');
      expect(diff.modified).toBe('line 1\nmodified line 2\nline 3\nline 4');
      expect(diff.changes).toHaveLength(2); // 一个修改，一个新增

      const modifyChange = diff.changes.find(c => c.type === 'modify');
      const insertChange = diff.changes.find(c => c.type === 'insert');

      expect(modifyChange).toBeDefined();
      expect(modifyChange!.content).toBe('modified line 2');
      expect(modifyChange!.originalContent).toBe('line 2');

      expect(insertChange).toBeDefined();
      expect(insertChange!.content).toBe('line 4');
    });
  });

  describe('统计信息', () => {
    test('应该返回正确的统计信息', () => {
      documentService.createSession('file1');
      const session2 = documentService.createSession('file2');
      documentService.updateSession(session2.id, { status: 'completed' });

      const stats = documentService.getStats();
      expect(stats.totalSessions).toBe(2);
      expect(stats.activeSessions).toBe(1);
      expect(stats.completedSessions).toBe(1);
      expect(stats.expiredSessions).toBe(0);
    });

    test('应该清理过期会话', () => {
      const session = documentService.createSession('file1');

      // 模拟过期会话（修改内部时间戳）
      const sessionData = documentService.getSession(session.id)!;
      sessionData.updatedAt = Date.now() - 25 * 60 * 60 * 1000; // 25小时前

      const cleaned = documentService.cleanupExpiredSessions(24 * 60 * 60 * 1000); // 24小时
      expect(cleaned).toBe(1);
      expect(documentService.getSession(session.id)).toBeUndefined();
    });
  });
});