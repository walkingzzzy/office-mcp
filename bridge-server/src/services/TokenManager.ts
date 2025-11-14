import crypto from 'crypto';
import logger from '../utils/logger';

export interface SessionToken {
  token: string;
  sessionId: string;
  userId?: string;
  createdAt: number;
  expiresAt: number;
  permissions: string[];
}

export class TokenManager {
  private tokens = new Map<string, SessionToken>();
  private readonly SECRET_KEY = process.env.TOKEN_SECRET_KEY || 'office-ai-plugin-secret';
  private readonly TOKEN_EXPIRY = 24 * 60 * 60 * 1000; // 24小时

  /**
   * 生成会话Token
   */
  generateToken(sessionId: string, permissions: string[] = []): SessionToken {
    const token = this.createSecureToken();
    const now = Date.now();

    const sessionToken: SessionToken = {
      token,
      sessionId,
      createdAt: now,
      expiresAt: now + this.TOKEN_EXPIRY,
      permissions
    };

    this.tokens.set(token, sessionToken);
    logger.info('生成会话Token', { sessionId, tokenLength: token.length });

    return sessionToken;
  }

  /**
   * 验证Token
   */
  validateToken(token: string): SessionToken | null {
    const sessionToken = this.tokens.get(token);

    if (!sessionToken) {
      logger.warn('Token不存在', { token: token.substring(0, 10) + '...' });
      return null;
    }

    if (Date.now() > sessionToken.expiresAt) {
      logger.warn('Token已过期', { sessionId: sessionToken.sessionId });
      this.revokeToken(token);
      return null;
    }

    return sessionToken;
  }

  /**
   * 撤销Token
   */
  revokeToken(token: string): void {
    this.tokens.delete(token);
    logger.info('撤销Token', { token: token.substring(0, 10) + '...' });
  }

  /**
   * 更新Token过期时间
   */
  refreshToken(token: string): SessionToken | null {
    const sessionToken = this.validateToken(token);

    if (sessionToken) {
      sessionToken.expiresAt = Date.now() + this.TOKEN_EXPIRY;
      logger.info('刷新Token', { sessionId: sessionToken.sessionId });
    }

    return sessionToken;
  }

  /**
   * 清理过期Token
   */
  cleanupExpiredTokens(): number {
    const now = Date.now();
    const expiredTokens: string[] = [];

    for (const [token, sessionToken] of this.tokens.entries()) {
      if (now > sessionToken.expiresAt) {
        expiredTokens.push(token);
      }
    }

    expiredTokens.forEach(token => this.tokens.delete(token));

    if (expiredTokens.length > 0) {
      logger.info('清理过期Token', { count: expiredTokens.length });
    }

    return expiredTokens.length;
  }

  private createSecureToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }
}

export default new TokenManager();