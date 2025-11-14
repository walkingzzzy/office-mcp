import { DocumentDiff, DocumentChange, DocumentSession } from '../types';
import logger from '../utils/logger';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

/**
 * 文档处理服务
 */
export class DocumentService {
  private sessions: Map<string, DocumentSession> = new Map();
  private tempDir: string;

  constructor(tempDir: string = 'temp') {
    this.tempDir = tempDir;
    this.ensureTempDir();
  }

  /**
   * 确保临时目录存在
   */
  private ensureTempDir(): void {
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
  }

  /**
   * 创建文档会话
   */
  createSession(originalFileId: string): DocumentSession {
    const sessionId = this.generateId();
    const session: DocumentSession = {
      id: sessionId,
      originalFileId,
      status: 'active',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      changes: [],
    };

    this.sessions.set(sessionId, session);
    logger.info(`创建文档会话: ${sessionId}`);
    return session;
  }

  /**
   * 获取会话
   */
  getSession(sessionId: string): DocumentSession | undefined {
    return this.sessions.get(sessionId);
  }

  /**
   * 更新会话
   */
  updateSession(sessionId: string, updates: Partial<DocumentSession>): DocumentSession | null {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return null;
    }

    Object.assign(session, updates, { updatedAt: Date.now() });
    this.sessions.set(sessionId, session);
    return session;
  }

  /**
   * 删除会话
   */
  deleteSession(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (session) {
      // 清理相关文件
      if (session.modifiedFileId) {
        this.deleteFile(session.modifiedFileId);
      }
      this.sessions.delete(sessionId);
      logger.info(`删除文档会话: ${sessionId}`);
      return true;
    }
    return false;
  }

  /**
   * 计算文档差异
   */
  async calculateDiff(originalPath: string, modifiedPath: string): Promise<DocumentDiff> {
    try {
      const originalContent = fs.readFileSync(originalPath, 'utf-8');
      const modifiedContent = fs.readFileSync(modifiedPath, 'utf-8');

      // 简单的行级差异计算
      const changes = this.computeLineChanges(originalContent, modifiedContent);

      return {
        original: originalContent,
        modified: modifiedContent,
        changes,
      };
    } catch (error: any) {
      logger.error('计算文档差异失败', error);
      throw new Error(`计算差异失败: ${error.message}`);
    }
  }

  /**
   * 计算行级变化
   */
  private computeLineChanges(original: string, modified: string): DocumentChange[] {
    const originalLines = original.split('\n');
    const modifiedLines = modified.split('\n');
    const changes: DocumentChange[] = [];

    const maxLines = Math.max(originalLines.length, modifiedLines.length);

    for (let i = 0; i < maxLines; i++) {
      const originalLine = originalLines[i] || '';
      const modifiedLine = modifiedLines[i] || '';

      if (originalLine !== modifiedLine) {
        if (!originalLine && modifiedLine) {
          // 新增行
          changes.push({
            id: this.generateId(),
            type: 'insert',
            content: modifiedLine,
            position: { start: i, end: i },
            timestamp: Date.now(),
            status: 'pending',
            description: `第${i + 1}行新增`,
          });
        } else if (originalLine && !modifiedLine) {
          // 删除行
          changes.push({
            id: this.generateId(),
            type: 'delete',
            content: '',
            originalContent: originalLine,
            position: { start: i, end: i },
            timestamp: Date.now(),
            status: 'pending',
            description: `第${i + 1}行删除`,
          });
        } else if (originalLine && modifiedLine) {
          // 修改行
          changes.push({
            id: this.generateId(),
            type: 'modify',
            content: modifiedLine,
            originalContent: originalLine,
            position: { start: i, end: i },
            timestamp: Date.now(),
            status: 'pending',
            description: `第${i + 1}行修改`,
          });
        }
      }
    }

    return changes;
  }

  /**
   * 获取文件路径
   */
  getFilePath(fileId: string): string {
    return path.join(this.tempDir, fileId);
  }

  /**
   * 检查文件是否存在
   */
  fileExists(fileId: string): boolean {
    return fs.existsSync(this.getFilePath(fileId));
  }

  /**
   * 删除文件
   */
  deleteFile(fileId: string): boolean {
    try {
      const filePath = this.getFilePath(fileId);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        logger.info(`删除文件: ${fileId}`);
        return true;
      }
      return false;
    } catch (error: any) {
      logger.error(`删除文件失败: ${fileId}`, error);
      return false;
    }
  }

  /**
   * 获取文件信息
   */
  getFileInfo(fileId: string): { size: number; mtime: Date } | null {
    try {
      const filePath = this.getFilePath(fileId);
      const stats = fs.statSync(filePath);
      return {
        size: stats.size,
        mtime: stats.mtime,
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * 清理过期会话
   */
  cleanupExpiredSessions(maxAge: number = 24 * 60 * 60 * 1000): number {
    const now = Date.now();
    let cleaned = 0;

    for (const [sessionId, session] of this.sessions.entries()) {
      if (now - session.updatedAt > maxAge) {
        this.deleteSession(sessionId);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      logger.info(`清理了 ${cleaned} 个过期会话`);
    }

    return cleaned;
  }

  /**
   * 生成唯一ID
   */
  private generateId(): string {
    return crypto.randomBytes(16).toString('hex');
  }

  /**
   * 获取所有活跃会话
   */
  getActiveSessions(): DocumentSession[] {
    return Array.from(this.sessions.values()).filter(s => s.status === 'active');
  }

  /**
   * 获取会话统计
   */
  getStats(): {
    totalSessions: number;
    activeSessions: number;
    completedSessions: number;
    expiredSessions: number;
  } {
    const sessions = Array.from(this.sessions.values());
    return {
      totalSessions: sessions.length,
      activeSessions: sessions.filter(s => s.status === 'active').length,
      completedSessions: sessions.filter(s => s.status === 'completed').length,
      expiredSessions: sessions.filter(s => s.status === 'expired').length,
    };
  }
}

// 导出单例
export default new DocumentService();