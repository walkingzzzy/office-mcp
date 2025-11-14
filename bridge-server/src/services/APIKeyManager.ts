import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import logger from '../utils/logger';

export interface APIKeyConfig {
  openai?: {
    apiKey: string;
    baseURL?: string;
    organization?: string;
  };
  claude?: {
    apiKey: string;
    baseURL?: string;
  };
  other?: Record<string, {
    apiKey: string;
    baseURL?: string;
    [key: string]: any;
  }>;
}

export interface EncryptedConfig {
  data: string;
  iv: string;
  salt: string;
}

export class APIKeyManager {
  private configPath: string;
  private encryptionKey: Buffer | null = null;
  private config: APIKeyConfig = {};

  constructor(configPath: string = './config/api-keys.json') {
    this.configPath = path.resolve(configPath);
    this.ensureConfigDirectory();
    logger.info('API密钥管理器初始化完成', { configPath: this.configPath });
  }

  /**
   * 设置加密密钥
   */
  setEncryptionKey(password: string): void {
    const salt = crypto.randomBytes(32);
    this.encryptionKey = crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha512');
    logger.info('加密密钥已设置');
  }

  /**
   * 设置API密钥
   */
  setAPIKey(provider: 'openai' | 'claude' | string, config: any): void {
    if (provider === 'openai' || provider === 'claude') {
      this.config[provider] = config;
    } else {
      if (!this.config.other) {
        this.config.other = {};
      }
      this.config.other[provider] = config;
    }

    logger.info('API密钥已设置', { provider });
  }

  /**
   * 获取API密钥
   */
  getAPIKey(provider: 'openai' | 'claude' | string): any | null {
    if (provider === 'openai' || provider === 'claude') {
      return this.config[provider] || null;
    }

    return this.config.other?.[provider] || null;
  }

  /**
   * 删除API密钥
   */
  removeAPIKey(provider: 'openai' | 'claude' | string): boolean {
    if (provider === 'openai' || provider === 'claude') {
      if (this.config[provider]) {
        delete this.config[provider];
        logger.info('API密钥已删除', { provider });
        return true;
      }
    } else if (this.config.other?.[provider]) {
      delete this.config.other[provider];
      logger.info('API密钥已删除', { provider });
      return true;
    }

    return false;
  }

  /**
   * 保存配置到文件
   */
  async saveConfig(password?: string): Promise<void> {
    try {
      if (password && !this.encryptionKey) {
        this.setEncryptionKey(password);
      }

      const configData = JSON.stringify(this.config, null, 2);

      if (this.encryptionKey) {
        const encrypted = this.encrypt(configData);
        await fs.promises.writeFile(this.configPath, JSON.stringify(encrypted, null, 2));
      } else {
        await fs.promises.writeFile(this.configPath, configData);
      }

      logger.info('API密钥配置已保存');
    } catch (error: any) {
      logger.error('保存API密钥配置失败', error);
      throw new Error(`保存配置失败: ${error.message}`);
    }
  }

  /**
   * 从文件加载配置
   */
  async loadConfig(password?: string): Promise<void> {
    try {
      if (!fs.existsSync(this.configPath)) {
        logger.info('配置文件不存在，使用空配置');
        return;
      }

      const fileContent = await fs.promises.readFile(this.configPath, 'utf-8');
      const parsedContent = JSON.parse(fileContent);

      // 检查是否为加密配置
      if (parsedContent.data && parsedContent.iv && parsedContent.salt) {
        if (!password) {
          throw new Error('配置文件已加密，需要提供密码');
        }

        this.setEncryptionKey(password);
        const decrypted = this.decrypt(parsedContent);
        this.config = JSON.parse(decrypted);
      } else {
        this.config = parsedContent;
      }

      logger.info('API密钥配置已加载');
    } catch (error: any) {
      logger.error('加载API密钥配置失败', error);
      throw new Error(`加载配置失败: ${error.message}`);
    }
  }

  /**
   * 验证API密钥
   */
  async validateAPIKey(provider: 'openai' | 'claude'): Promise<boolean> {
    const config = this.getAPIKey(provider);
    if (!config || !config.apiKey) {
      return false;
    }

    try {
      if (provider === 'openai') {
        // 简单的OpenAI API测试
        const response = await fetch('https://api.openai.com/v1/models', {
          headers: {
            'Authorization': `Bearer ${config.apiKey}`,
            'Content-Type': 'application/json'
          }
        });
        return response.ok;
      } else if (provider === 'claude') {
        // 简单的Claude API测试
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'x-api-key': config.apiKey,
            'Content-Type': 'application/json',
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify({
            model: 'claude-3-haiku-20240307',
            max_tokens: 1,
            messages: [{ role: 'user', content: 'test' }]
          })
        });
        return response.status !== 401;
      }

      return false;
    } catch (error) {
      logger.error('API密钥验证失败', { provider, error });
      return false;
    }
  }

  /**
   * 获取所有配置的提供商
   */
  getConfiguredProviders(): string[] {
    const providers: string[] = [];

    if (this.config.openai) providers.push('openai');
    if (this.config.claude) providers.push('claude');
    if (this.config.other) {
      providers.push(...Object.keys(this.config.other));
    }

    return providers;
  }

  /**
   * 检查配置完整性
   */
  checkConfiguration(): {
    valid: boolean;
    missing: string[];
    configured: string[];
  } {
    const configured = this.getConfiguredProviders();
    const required = ['openai', 'claude'];
    const missing = required.filter(provider => !configured.includes(provider));

    return {
      valid: missing.length === 0,
      missing,
      configured
    };
  }

  /**
   * 清空所有配置
   */
  clearAll(): void {
    this.config = {};
    logger.info('所有API密钥配置已清空');
  }

  /**
   * 加密数据
   */
  private encrypt(text: string): EncryptedConfig {
    if (!this.encryptionKey) {
      throw new Error('未设置加密密钥');
    }

    const iv = crypto.randomBytes(16);
    const salt = crypto.randomBytes(32);
    const cipher = crypto.createCipher('aes-256-gcm', this.encryptionKey);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    return {
      data: encrypted,
      iv: iv.toString('hex'),
      salt: salt.toString('hex')
    };
  }

  /**
   * 解密数据
   */
  private decrypt(encryptedConfig: EncryptedConfig): string {
    if (!this.encryptionKey) {
      throw new Error('未设置加密密钥');
    }

    const decipher = crypto.createDecipher('aes-256-gcm', this.encryptionKey);

    let decrypted = decipher.update(encryptedConfig.data, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  /**
   * 确保配置目录存在
   */
  private ensureConfigDirectory(): void {
    const configDir = path.dirname(this.configPath);
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }
  }

  /**
   * 获取配置统计
   */
  getStats(): {
    totalProviders: number;
    configuredProviders: number;
    encryptionEnabled: boolean;
    configFileExists: boolean;
  } {
    return {
      totalProviders: 2, // openai + claude
      configuredProviders: this.getConfiguredProviders().length,
      encryptionEnabled: this.encryptionKey !== null,
      configFileExists: fs.existsSync(this.configPath)
    };
  }

  /**
   * 导出配置（不包含敏感信息）
   */
  exportConfig(): {
    providers: Array<{
      name: string;
      configured: boolean;
      hasBaseURL: boolean;
    }>;
  } {
    const providers = [
      {
        name: 'openai',
        configured: !!this.config.openai?.apiKey,
        hasBaseURL: !!this.config.openai?.baseURL
      },
      {
        name: 'claude',
        configured: !!this.config.claude?.apiKey,
        hasBaseURL: !!this.config.claude?.baseURL
      }
    ];

    if (this.config.other) {
      for (const [name, config] of Object.entries(this.config.other)) {
        providers.push({
          name,
          configured: !!config.apiKey,
          hasBaseURL: !!config.baseURL
        });
      }
    }

    return { providers };
  }
}

export default APIKeyManager;