import fs from 'fs-extra';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import config from '../config';
import logger from '../utils/logger';

export interface DocumentSession {
  sessionId: string;
  documentType: 'word' | 'excel' | 'powerpoint';
  tempDir: string;
  currentFile: string;
  backupFile: string;
  metadata: Record<string, any>;
  createdAt: number;
  lastActivity: number;
}

export class SessionManager {
  private sessions = new Map<string, DocumentSession>();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // 确保临时目录存在
    fs.ensureDirSync(config.tempDir);

    // 启动清理定时器
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredSessions();
    }, 5 * 60 * 1000); // 每5分钟清理一次
  }

  /**
   * 创建新会话
   */
  async createSession(documentType: 'word' | 'excel' | 'powerpoint'): Promise<DocumentSession> {
    const sessionId = uuidv4();
    const sessionDir = path.join(config.tempDir, `session-${sessionId}`);

    // 创建会话目录
    await fs.ensureDir(sessionDir);

    const session: DocumentSession = {
      sessionId,
      documentType,
      tempDir: sessionDir,
      currentFile: path.join(sessionDir, `current.${this.getFileExtension(documentType)}`),
      backupFile: path.join(sessionDir, `backup.${this.getFileExtension(documentType)}`),
      metadata: {},
      createdAt: Date.now(),
      lastActivity: Date.now()
    };

    this.sessions.set(sessionId, session);
    logger.info('创建文档会话', { sessionId, documentType });

    return session;
  }

  /**
   * 获取会话
   */
  getSession(sessionId: string): DocumentSession | undefined {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.lastActivity = Date.now();
    }
    return session;
  }

  /**
   * 保存文档到会话
   */
  async saveDocumentToSession(sessionId: string, documentData: Buffer): Promise<string> {
    const session = this.getSession(sessionId);
    if (!session) {
      throw new Error(`会话不存在: ${sessionId}`);
    }

    // 备份当前文件
    if (await fs.pathExists(session.currentFile)) {
      await fs.copy(session.currentFile, session.backupFile);
    }

    // 保存新文档
    await fs.writeFile(session.currentFile, documentData);
    session.lastActivity = Date.now();

    logger.info('保存文档到会话', { sessionId, fileSize: documentData.length });
    return session.currentFile;
  }

  /**
   * 从会话读取文档
   */
  async readDocumentFromSession(sessionId: string): Promise<Buffer> {
    const session = this.getSession(sessionId);
    if (!session) {
      throw new Error(`会话不存在: ${sessionId}`);
    }

    if (!(await fs.pathExists(session.currentFile))) {
      throw new Error(`会话文档不存在: ${sessionId}`);
    }

    const documentData = await fs.readFile(session.currentFile);
    session.lastActivity = Date.now();

    return documentData;
  }

  /**
   * 更新会话元数据
   */
  updateSessionMetadata(sessionId: string, metadata: Record<string, any>): void {
    const session = this.getSession(sessionId);
    if (session) {
      session.metadata = { ...session.metadata, ...metadata };
      session.lastActivity = Date.now();
    }
  }

  /**
   * 删除会话
   */
  async deleteSession(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (session) {
      // 删除临时文件
      await fs.remove(session.tempDir);
      this.sessions.delete(sessionId);
      logger.info('删除文档会话', { sessionId });
    }
  }

  /**
   * 获取所有活跃会话
   */
  getActiveSessions(): DocumentSession[] {
    return Array.from(this.sessions.values());
  }

  /**
   * 清理过期会话
   */
  private async cleanupExpiredSessions(): Promise<void> {
    const now = Date.now();
    const maxAge = 60 * 60 * 1000; // 1小时

    const expiredSessions = Array.from(this.sessions.entries())
      .filter(([_, session]) => now - session.lastActivity > maxAge);

    for (const [sessionId, _] of expiredSessions) {
      await this.deleteSession(sessionId);
    }

    if (expiredSessions.length > 0) {
      logger.info('清理过期会话', { count: expiredSessions.length });
    }
  }

  private getFileExtension(documentType: string): string {
    switch (documentType) {
      case 'word': return 'docx';
      case 'excel': return 'xlsx';
      case 'powerpoint': return 'pptx';
      default: return 'bin';
    }
  }

  /**
   * 关闭会话管理器
   */
  close(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }
}

export default new SessionManager();