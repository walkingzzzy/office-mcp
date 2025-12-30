/**
 * Office 插件管理器
 * 负责扫描、安装、卸载 Office 插件，管理插件日志
 */

import { promises as fs, accessSync } from 'fs';
import path from 'path';
import os from 'os';
import { createLogger } from '../utils/logger.js';
import {
  MAX_LOGS_PER_PLUGIN,
  SUPPORTED_OFFICE_VERSIONS,
  DEFAULT_OFFICE_VERSION
} from '../utils/constants.js';
import type {
  InstalledPlugin,
  PluginStatus,
  PluginSource,
  PluginLogEntry,
  OfficeAppType
} from './types.js';

const logger = createLogger('PluginManager');

/**
 * Office 应用类型映射（从 manifest Hosts 节点名称到 OfficeAppType）
 */
const HOST_TO_APP_MAP: Record<string, OfficeAppType> = {
  'Document': 'Word',
  'Workbook': 'Excel',
  'Presentation': 'PowerPoint',
  'Mailbox': 'Outlook',
  'Notebook': 'OneNote'
};

// 系统目录，不是插件目录
const SYSTEM_DIRECTORIES = new Set([
  'AddinInfo',
  'AggregatedCache',
  'AppCommands',
  'CustomFunctions',
  'Resources',
  'webview2'
]);

export class PluginManager {
  private static instance: PluginManager;
  private pluginLogs: Map<string, PluginLogEntry[]> = new Map();
  private maxLogsPerPlugin = MAX_LOGS_PER_PLUGIN;
  private detectedOfficeVersion: string | null = null;

  /**
   * 获取 Office 信任目录路径（Wef 目录）
   * 动态检测已安装的 Office 版本
   */
  private get wefPath(): string {
    // 如果已经检测过版本，使用缓存的版本
    if (this.detectedOfficeVersion) {
      return path.join(
        os.homedir(),
        'AppData', 'Local', 'Microsoft', 'Office', this.detectedOfficeVersion, 'Wef'
      );
    }

    // 尝试检测已安装的 Office 版本
    const baseOfficePath = path.join(os.homedir(), 'AppData', 'Local', 'Microsoft', 'Office');
    
    // 同步检测版本（getter 不能是 async）
    const detectedVersion = this.detectOfficeVersionSync(baseOfficePath);
    this.detectedOfficeVersion = detectedVersion;

    return path.join(baseOfficePath, detectedVersion, 'Wef');
  }

  /**
   * 同步检测 Office 版本
   * @param baseOfficePath Office 基础路径
   * @returns 检测到的版本号
   */
  private detectOfficeVersionSync(baseOfficePath: string): string {
    // 按优先级检查支持的 Office 版本
    for (const version of SUPPORTED_OFFICE_VERSIONS) {
      const versionPath = path.join(baseOfficePath, version);
      try {
        accessSync(versionPath);
        logger.info('检测到 Office 版本', { version, path: versionPath });
        return version;
      } catch {
        // 版本目录不存在，继续检查下一个
      }
    }

    // 如果没有找到任何版本，使用默认版本
    logger.info('未检测到已安装的 Office 版本，使用默认版本', { defaultVersion: DEFAULT_OFFICE_VERSION });
    return DEFAULT_OFFICE_VERSION;
  }

  /**
   * 异步检测 Office 版本（提供更好的错误处理）
   * @returns 检测到的版本信息
   */
  async detectOfficeVersion(): Promise<{
    version: string;
    path: string;
    isDefault: boolean;
  }> {
    const baseOfficePath = path.join(os.homedir(), 'AppData', 'Local', 'Microsoft', 'Office');

    // 按优先级检查支持的 Office 版本
    for (const version of SUPPORTED_OFFICE_VERSIONS) {
      const versionPath = path.join(baseOfficePath, version);
      try {
        await fs.access(versionPath);
        this.detectedOfficeVersion = version;
        return {
          version,
          path: versionPath,
          isDefault: false
        };
      } catch {
        // 版本目录不存在，继续检查下一个
      }
    }

    // 如果没有找到任何版本，使用默认版本
    this.detectedOfficeVersion = DEFAULT_OFFICE_VERSION;
    return {
      version: DEFAULT_OFFICE_VERSION,
      path: path.join(baseOfficePath, DEFAULT_OFFICE_VERSION),
      isDefault: true
    };
  }

  /**
   * 获取当前检测到的 Office 版本
   */
  getDetectedVersion(): string {
    return this.detectedOfficeVersion || DEFAULT_OFFICE_VERSION;
  }

  /**
   * 获取单例实例
   */
  static getInstance(): PluginManager {
    if (!PluginManager.instance) {
      PluginManager.instance = new PluginManager();
    }
    return PluginManager.instance;
  }

  /**
   * 重置单例实例（用于测试）
   * @internal 仅用于测试目的
   */
  static resetInstance(): void {
    PluginManager.instance = undefined as unknown as PluginManager;
  }

  /**
   * 获取所有已安装插件列表
   */
  async listPlugins(): Promise<InstalledPlugin[]> {
    const plugins: InstalledPlugin[] = [];

    try {
      // 检查 Wef 目录是否存在
      try {
        await fs.access(this.wefPath);
      } catch {
        logger.info('Wef 目录不存在，返回空列表', { path: this.wefPath });
        return plugins;
      }

      // 递归搜索所有 manifest 文件
      const manifestFiles = await this.findManifestFiles(this.wefPath);
      
      for (const manifestPath of manifestFiles) {
        try {
          const plugin = await this.parseManifest(manifestPath);
          if (plugin) {
            // 避免重复添加同一个插件
            if (!plugins.some(p => p.id === plugin.id)) {
              plugins.push(plugin);
            }
          }
        } catch (err) {
          logger.debug('解析 manifest 失败', { path: manifestPath, error: String(err) });
        }
      }

      logger.info('扫描插件完成', { count: plugins.length });
      return plugins;
    } catch (err) {
      logger.error('扫描插件失败', { error: String(err) });
      throw err;
    }
  }

  /**
   * 递归搜索 manifest 文件
   */
  private async findManifestFiles(dir: string, depth = 0): Promise<string[]> {
    const results: string[] = [];
    
    // 限制搜索深度，避免无限递归
    if (depth > 6) return results;

    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
          // 跳过系统目录
          if (SYSTEM_DIRECTORIES.has(entry.name)) continue;
          
          // 递归搜索子目录
          const subResults = await this.findManifestFiles(fullPath, depth + 1);
          results.push(...subResults);
        } else if (entry.isFile()) {
          // 检查是否是 manifest 文件（.xml 文件且包含 OfficeApp 标签）
          if (entry.name.toLowerCase().endsWith('.xml')) {
            try {
              const content = await fs.readFile(fullPath, 'utf-8');
              if (content.includes('<OfficeApp') || content.includes('officeApp')) {
                results.push(fullPath);
              }
            } catch {
              // 忽略读取错误
            }
          }
        }
      }
    } catch {
      // 忽略目录访问错误
    }

    return results;
  }

  /**
   * 获取单个插件详情
   */
  async getPlugin(pluginId: string): Promise<InstalledPlugin | null> {
    try {
      const pluginDir = path.join(this.wefPath, pluginId);
      const manifestPath = path.join(pluginDir, 'manifest.xml');

      // 检查 manifest.xml 是否存在
      try {
        await fs.access(manifestPath);
      } catch {
        logger.debug('插件不存在', { pluginId });
        return null;
      }

      const plugin = await this.parseManifest(manifestPath);
      return plugin;
    } catch (err) {
      logger.error('获取插件详情失败', { pluginId, error: String(err) });
      return null;
    }
  }

  /**
   * 安装插件
   * @param manifestPath 本地 manifest.xml 文件路径
   */
  async installPlugin(manifestPath: string): Promise<InstalledPlugin> {
    logger.info('开始安装插件', { manifestPath });

    try {
      // 1. 检查源 manifest 文件是否存在
      try {
        await fs.access(manifestPath);
      } catch {
        throw new Error(`Manifest 文件不存在: ${manifestPath}`);
      }

      // 2. 解析 manifest 获取插件信息
      const pluginInfo = await this.parseManifest(manifestPath);
      if (!pluginInfo) {
        throw new Error('无法解析 manifest.xml 文件');
      }

      const pluginId = pluginInfo.id;
      logger.info('解析插件信息成功', { pluginId, name: pluginInfo.name });

      // 3. 确保 Wef 目录存在
      await fs.mkdir(this.wefPath, { recursive: true });

      // 4. 创建插件目标目录
      const targetDir = path.join(this.wefPath, pluginId);
      await fs.mkdir(targetDir, { recursive: true });

      // 5. 复制 manifest.xml 到目标目录
      const targetManifestPath = path.join(targetDir, 'manifest.xml');
      const manifestContent = await fs.readFile(manifestPath, 'utf-8');
      await fs.writeFile(targetManifestPath, manifestContent, 'utf-8');

      logger.info('插件安装成功', { pluginId, targetDir });

      // 6. 返回安装后的插件信息
      const installedPlugin: InstalledPlugin = {
        ...pluginInfo,
        manifestPath: targetManifestPath,
        installedAt: new Date().toISOString(),
        status: 'installed' as PluginStatus,
        source: 'sideload' as PluginSource
      };

      // 添加安装日志
      this.addLog(pluginId, 'info', '插件安装成功', {
        name: pluginInfo.name,
        version: pluginInfo.version
      });

      return installedPlugin;
    } catch (err) {
      logger.error('插件安装失败', { manifestPath, error: String(err) });
      throw err;
    }
  }

  /**
   * 卸载插件
   * @param pluginId 插件ID
   */
  async uninstallPlugin(pluginId: string): Promise<boolean> {
    logger.info('开始卸载插件', { pluginId });

    try {
      const pluginDir = path.join(this.wefPath, pluginId);

      // 检查插件目录是否存在
      try {
        await fs.access(pluginDir);
      } catch {
        logger.warn('插件目录不存在', { pluginId, pluginDir });
        return false;
      }

      // 递归删除插件目录
      await fs.rm(pluginDir, { recursive: true, force: true });

      logger.info('插件卸载成功', { pluginId });

      // 添加卸载日志
      this.addLog(pluginId, 'info', '插件已卸载');

      return true;
    } catch (err) {
      logger.error('插件卸载失败', { pluginId, error: String(err) });
      throw err;
    }
  }

  /**
   * 解析 manifest.xml 文件
   * 使用正则表达式提取关键信息，避免引入额外 XML 解析依赖
   */
  private async parseManifest(manifestPath: string): Promise<InstalledPlugin | null> {
    try {
      const content = await fs.readFile(manifestPath, 'utf-8');

      // 提取 Id
      const idMatch = content.match(/<(?:OfficeApp:)?Id[^>]*>([^<]+)<\/(?:OfficeApp:)?Id>/i)
        || content.match(/<Id>([^<]+)<\/Id>/i);
      if (!idMatch) {
        logger.warn('无法从 manifest 中提取 Id', { manifestPath });
        return null;
      }
      const id = idMatch[1].trim();

      // 提取 DisplayName
      const displayNameMatch = content.match(
        /<(?:OfficeApp:)?DisplayName[^>]*DefaultValue\s*=\s*["']([^"']+)["']/i
      ) || content.match(/<DisplayName[^>]*DefaultValue\s*=\s*["']([^"']+)["']/i);
      const name = displayNameMatch ? displayNameMatch[1].trim() : 'Unknown Plugin';

      // 提取 Version
      const versionMatch = content.match(
        /<(?:OfficeApp:)?Version[^>]*>([^<]+)<\/(?:OfficeApp:)?Version>/i
      ) || content.match(/<Version>([^<]+)<\/Version>/i);
      const version = versionMatch ? versionMatch[1].trim() : '1.0.0';

      // 提取 ProviderName
      const providerMatch = content.match(
        /<(?:OfficeApp:)?ProviderName[^>]*DefaultValue\s*=\s*["']([^"']+)["']/i
      ) || content.match(/<ProviderName[^>]*DefaultValue\s*=\s*["']([^"']+)["']/i)
        || content.match(/<(?:OfficeApp:)?ProviderName[^>]*>([^<]+)<\/(?:OfficeApp:)?ProviderName>/i);
      const provider = providerMatch ? providerMatch[1].trim() : 'Unknown';

      // 提取 Description
      const descMatch = content.match(
        /<(?:OfficeApp:)?Description[^>]*DefaultValue\s*=\s*["']([^"']+)["']/i
      ) || content.match(/<Description[^>]*DefaultValue\s*=\s*["']([^"']+)["']/i);
      const description = descMatch ? descMatch[1].trim() : undefined;

      // 提取支持的 Office 应用（从 Hosts 节点）
      const supportedApps = this.extractSupportedApps(content);

      // 提取图标 URL
      const iconMatch = content.match(
        /<(?:OfficeApp:)?IconUrl[^>]*DefaultValue\s*=\s*["']([^"']+)["']/i
      ) || content.match(/<IconUrl[^>]*DefaultValue\s*=\s*["']([^"']+)["']/i);
      const iconUrl = iconMatch ? iconMatch[1].trim() : undefined;

      // 获取文件状态信息
      let installedAt: string | undefined;
      try {
        const stats = await fs.stat(manifestPath);
        installedAt = stats.birthtime.toISOString();
      } catch {
        // 忽略错误
      }

      const plugin: InstalledPlugin = {
        id,
        name,
        version,
        provider,
        description,
        status: 'installed' as PluginStatus,
        source: 'sideload' as PluginSource,
        manifestPath,
        installedAt,
        supportedApps,
        iconUrl
      };

      logger.debug('解析 manifest 成功', { id, name, version });
      return plugin;
    } catch (err) {
      logger.error('解析 manifest 失败', { manifestPath, error: String(err) });
      return null;
    }
  }

  /**
   * 从 manifest 内容中提取支持的 Office 应用类型
   */
  private extractSupportedApps(content: string): OfficeAppType[] {
    const apps: OfficeAppType[] = [];

    // 匹配 <Host Name="..."> 形式
    const hostNameMatches = content.matchAll(/<Host[^>]*Name\s*=\s*["'](\w+)["'][^>]*\/?>/gi);
    for (const match of hostNameMatches) {
      const hostName = match[1];
      const appType = HOST_TO_APP_MAP[hostName];
      if (appType && !apps.includes(appType)) {
        apps.push(appType);
      }
    }

    // 如果没有找到，尝试从 OfficeApp 根元素类型推断
    if (apps.length === 0) {
      if (content.includes('xsi:type="DocumentApp"') || content.includes('type="Document"')) {
        apps.push('Word');
      }
      if (content.includes('xsi:type="WorkbookApp"') || content.includes('type="Workbook"')) {
        apps.push('Excel');
      }
      if (content.includes('xsi:type="PresentationApp"') || content.includes('type="Presentation"')) {
        apps.push('PowerPoint');
      }
      if (content.includes('xsi:type="MailApp"') || content.includes('type="Mailbox"')) {
        apps.push('Outlook');
      }
    }

    // 如果仍然没找到，默认返回所有主要应用
    if (apps.length === 0) {
      logger.debug('无法确定支持的应用，使用默认值');
      apps.push('Word', 'Excel', 'PowerPoint');
    }

    return apps;
  }

  /**
   * 添加插件日志
   */
  addLog(
    pluginId: string,
    level: PluginLogEntry['level'],
    message: string,
    details?: Record<string, unknown>
  ): void {
    const entry: PluginLogEntry = {
      timestamp: new Date().toISOString(),
      level,
      pluginId,
      message,
      details
    };

    // 获取或创建该插件的日志列表
    let logs = this.pluginLogs.get(pluginId);
    if (!logs) {
      logs = [];
      this.pluginLogs.set(pluginId, logs);
    }

    // 添加日志条目
    logs.push(entry);

    // 如果超过最大日志数，移除最旧的日志
    if (logs.length > this.maxLogsPerPlugin) {
      logs.shift();
    }

    // 同时记录到系统日志
    logger.debug('插件日志', { pluginId, level, message, details });
  }

  /**
   * 获取插件日志
   * @param pluginId 插件ID
   * @param limit 返回的最大日志条数（默认返回全部）
   */
  getLogs(pluginId: string, limit?: number): PluginLogEntry[] {
    const logs = this.pluginLogs.get(pluginId) || [];

    if (limit && limit > 0) {
      // 返回最新的 limit 条日志
      return logs.slice(-limit);
    }

    return [...logs];
  }

  /**
   * 清除插件日志
   * @param pluginId 可选，指定插件ID。如果不提供则清除所有日志
   */
  clearLogs(pluginId?: string): void {
    if (pluginId) {
      this.pluginLogs.delete(pluginId);
      logger.debug('清除插件日志', { pluginId });
    } else {
      this.pluginLogs.clear();
      logger.debug('清除所有插件日志');
    }
  }

  /**
   * 检查 Wef 目录是否存在
   */
  async checkWefDirectory(): Promise<boolean> {
    try {
      await fs.access(this.wefPath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 获取 Wef 目录路径
   */
  getWefPath(): string {
    return this.wefPath;
  }
}
