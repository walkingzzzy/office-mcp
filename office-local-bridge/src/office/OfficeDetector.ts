/**
 * Office 环境检测模块
 * 负责检测 Windows 系统上的 Office 安装情况
 *
 * 特性：
 * - 单例模式
 * - 通过注册表检测 Office 版本
 * - 检测已安装的 Office 应用
 * - 结果缓存机制
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { createLogger } from '../utils/logger.js';
import type { OfficeEnvironment, OfficeVersion, OfficeApp, OfficeAppType } from './types.js';

const execAsync = promisify(exec);
const logger = createLogger('OfficeDetector');

// 注册表路径
const OFFICE_CTR_PATH = 'HKEY_LOCAL_MACHINE\\SOFTWARE\\Microsoft\\Office\\ClickToRun\\Configuration';
const OFFICE_APPS_PATH = 'HKEY_LOCAL_MACHINE\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\App Paths';

// Office 应用列表
const OFFICE_APPS: OfficeAppType[] = ['Word', 'Excel', 'PowerPoint', 'Outlook', 'OneNote'];

// 应用对应的可执行文件名
const APP_EXECUTABLES: Record<OfficeAppType, string> = {
  Word: 'WINWORD.EXE',
  Excel: 'EXCEL.EXE',
  PowerPoint: 'POWERPNT.EXE',
  Outlook: 'OUTLOOK.EXE',
  OneNote: 'ONENOTE.EXE'
};

/**
 * Office 环境检测器
 */
export class OfficeDetector {
  private static instance: OfficeDetector;
  private cache: OfficeEnvironment | null = null;
  private cacheTimeout = 60000; // 1分钟缓存
  private lastCacheTime = 0;

  private constructor() {
    // 私有构造函数，确保单例模式
  }

  /**
   * 获取单例实例
   */
  static getInstance(): OfficeDetector {
    if (!OfficeDetector.instance) {
      OfficeDetector.instance = new OfficeDetector();
    }
    return OfficeDetector.instance;
  }

  /**
   * 重置单例实例（用于测试）
   * @internal 仅用于测试目的
   */
  static resetInstance(): void {
    OfficeDetector.instance = undefined as unknown as OfficeDetector;
  }

  /**
   * 检测 Office 环境
   */
  async detectEnvironment(): Promise<OfficeEnvironment> {
    // 检查缓存是否有效
    if (this.cache && (Date.now() - this.lastCacheTime) < this.cacheTimeout) {
      logger.debug('使用缓存的 Office 环境信息');
      return this.cache;
    }

    logger.info('开始检测 Office 环境');

    try {
      // 检测 Click-to-Run 安装
      const ctrInfo = await this.detectClickToRun();

      // 检测已安装的应用
      const apps = await this.getInstalledApps();

      // 构建环境信息
      const environment: OfficeEnvironment = {
        detected: ctrInfo.detected || apps.some(app => app.installed),
        version: ctrInfo.version,
        versionNumber: ctrInfo.versionNumber,
        installPath: ctrInfo.installPath,
        platform: ctrInfo.platform,
        apps,
        clickToRun: ctrInfo.detected,
        lastChecked: new Date().toISOString()
      };

      // 更新缓存
      this.cache = environment;
      this.lastCacheTime = Date.now();

      logger.info('Office 环境检测完成', {
        detected: environment.detected,
        version: environment.version,
        appCount: apps.filter(a => a.installed).length
      });

      return environment;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Office 环境检测失败', { error: errorMessage });

      // 返回默认的未检测到状态
      return {
        detected: false,
        version: 'Unknown',
        platform: 'unknown',
        apps: OFFICE_APPS.map(name => ({ name, installed: false })),
        clickToRun: false,
        lastChecked: new Date().toISOString()
      };
    }
  }

  /**
   * 检测 Click-to-Run 安装信息
   */
  private async detectClickToRun(): Promise<{
    detected: boolean;
    version: OfficeVersion;
    versionNumber?: string;
    installPath?: string;
    platform: 'x86' | 'x64' | 'arm64' | 'unknown';
  }> {
    try {
      const output = await this.queryRegistry(OFFICE_CTR_PATH);

      if (!output) {
        logger.debug('未检测到 Click-to-Run 安装');
        return {
          detected: false,
          version: 'Unknown',
          platform: 'unknown'
        };
      }

      // 解析版本号
      const versionMatch = output.match(/VersionToReport\s+REG_SZ\s+(\S+)/i);
      const versionNumber = versionMatch ? versionMatch[1] : undefined;

      // 解析安装路径
      const pathMatch = output.match(/InstallationPath\s+REG_SZ\s+(.+?)[\r\n]/i);
      const installPath = pathMatch ? pathMatch[1].trim() : undefined;

      // 解析平台架构
      const platformMatch = output.match(/Platform\s+REG_SZ\s+(\S+)/i);
      const platformRaw = platformMatch ? platformMatch[1].toLowerCase() : '';
      let platform: 'x86' | 'x64' | 'arm64' | 'unknown' = 'unknown';
      if (platformRaw === 'x64') platform = 'x64';
      else if (platformRaw === 'x86') platform = 'x86';
      else if (platformRaw === 'arm64') platform = 'arm64';

      // 解析产品类型（用于判断版本）
      const productMatch = output.match(/ProductReleaseIds\s+REG_SZ\s+(.+?)[\r\n]/i);
      const productIds = productMatch ? productMatch[1].trim() : '';

      // 根据版本号和产品 ID 判断 Office 版本
      const version = this.parseVersion(versionNumber || '', productIds);

      logger.debug('Click-to-Run 检测结果', {
        versionNumber,
        installPath,
        platform,
        productIds,
        version
      });

      return {
        detected: true,
        version,
        versionNumber,
        installPath,
        platform
      };
    } catch (error) {
      logger.debug('Click-to-Run 检测失败', { error });
      return {
        detected: false,
        version: 'Unknown',
        platform: 'unknown'
      };
    }
  }

  /**
   * 验证注册表路径格式
   * 确保路径只包含合法字符，防止命令注入
   */
  private isValidRegistryPath(path: string): boolean {
    // 合法的注册表路径只应包含：字母、数字、反斜杠、下划线、点、空格、短横线
    // 不允许包含：| & ; $ ` " ' < > ( ) ! % ^ 等特殊字符
    const validPathPattern = /^[A-Za-z0-9\\_.\s\-]+$/;
    return validPathPattern.test(path);
  }

  /**
   * 查询注册表
   */
  private async queryRegistry(path: string): Promise<string> {
    // 验证路径格式，防止命令注入
    if (!this.isValidRegistryPath(path)) {
      logger.error('检测到非法注册表路径格式', { path });
      return '';
    }

    try {
      // 使用 chcp 65001 强制 UTF-8 输出，解决中文 Windows 下 GBK 编码问题
      const { stdout } = await execAsync(`chcp 65001 >nul && reg query "${path}" /s`, {
        encoding: 'utf8',
        windowsHide: true
      });
      return stdout;
    } catch (error) {
      logger.debug(`注册表查询失败: ${path}`, { error });
      return '';
    }
  }

  /**
   * 解析版本字符串，返回对应的 OfficeVersion
   */
  private parseVersion(versionString: string, productIds: string): OfficeVersion {
    // 检查产品 ID 是否包含 365 相关标识
    const product365Patterns = [
      'O365',
      'Microsoft365',
      'M365'
    ];

    if (product365Patterns.some(p => productIds.toUpperCase().includes(p.toUpperCase()))) {
      return 'Microsoft365';
    }

    // 根据版本号判断
    // Office 版本号格式：16.0.xxxxx.xxxxx
    // 16.x - Office 2016/2019/2021/365
    // 15.x - Office 2013
    // 14.x - Office 2010
    if (!versionString) {
      return 'Unknown';
    }

    const majorVersion = versionString.split('.')[0];
    const buildNumber = versionString.split('.')[2];

    if (majorVersion === '16') {
      // 16.x 版本需要根据 build 号进一步区分
      const build = parseInt(buildNumber, 10);

      // Office 2021: build 14326+
      // Office 2019: build 10000-14325
      // Office 2016: build < 10000
      // Microsoft 365: 通常有持续更新的高 build 号

      if (build >= 14326) {
        // 可能是 Office 2021 或 Microsoft 365
        // 如果产品 ID 包含 2021 标识
        if (productIds.toUpperCase().includes('2021')) {
          return 'Office2021';
        }
        // 否则假设是 Microsoft 365
        return 'Microsoft365';
      } else if (build >= 10000) {
        return 'Office2019';
      } else {
        return 'Office2016';
      }
    }

    return 'Unknown';
  }

  /**
   * 获取已安装的 Office 应用
   */
  async getInstalledApps(): Promise<OfficeApp[]> {
    const apps: OfficeApp[] = [];

    // 首先尝试获取安装路径
    const ctrInfo = await this.detectClickToRun();
    const installPath = ctrInfo.installPath;

    for (const appName of OFFICE_APPS) {
      const app = await this.detectApp(appName, installPath);
      apps.push(app);
    }

    return apps;
  }

  /**
   * 检测单个 Office 应用
   */
  private async detectApp(appName: OfficeAppType, installPath?: string): Promise<OfficeApp> {
    const exeName = APP_EXECUTABLES[appName];

    // 方法1: 直接检查安装路径下的可执行文件
    if (installPath) {
      const possiblePaths = [
        `${installPath}\\root\\Office16\\${exeName}`,
        `${installPath}\\Office16\\${exeName}`,
        `${installPath}\\${exeName}`
      ];

      for (const appPath of possiblePaths) {
        try {
          const { stdout } = await execAsync(`powershell -NoProfile -Command "Test-Path '${appPath.replace(/'/g, "''")}'"`);
          if (stdout.trim().toLowerCase() === 'true') {
            const version = await this.getFileVersion(appPath);
            logger.debug(`检测到 ${appName}`, { path: appPath, version });
            return {
              name: appName,
              installed: true,
              path: appPath,
              version
            };
          }
        } catch {
          // 继续尝试下一个路径
        }
      }
    }

    // 方法2: 通过注册表 App Paths 检测
    const registryPath = `${OFFICE_APPS_PATH}\\${exeName}`;
    try {
      const output = await this.queryRegistry(registryPath);

      if (output) {
        // 使用通用正则匹配任何语言的默认值：(本地化名称) REG_SZ 值
        // 支持：中文(默认)、英文(Default)、日文(既定)、韩文(기본값)、
        // 德文(Standard)、法文(Par défaut)、西班牙文(Predeterminado) 等
        const pathMatch = output.match(/^\s*\([^)]+\)\s+REG_SZ\s+(.+?)[\r\n]/im);
        const appPath = pathMatch ? pathMatch[1].trim() : undefined;

        if (appPath) {
          const version = await this.getFileVersion(appPath);
          logger.debug(`检测到 ${appName}`, { path: appPath, version });
          return {
            name: appName,
            installed: true,
            path: appPath,
            version
          };
        }
      }
    } catch {
      // 忽略错误
    }

    return { name: appName, installed: false };
  }

  /**
   * 获取文件版本信息
   */
  private async getFileVersion(filePath: string): Promise<string | undefined> {
    try {
      // 使用 PowerShell 获取文件版本
      const command = `powershell -NoProfile -Command "(Get-Item '${filePath.replace(/'/g, "''")}').VersionInfo.FileVersion"`;
      const { stdout } = await execAsync(command, {
        encoding: 'utf8',
        windowsHide: true
      });
      const version = stdout.trim();
      return version || undefined;
    } catch (error) {
      logger.debug('获取文件版本失败', { filePath, error });
      return undefined;
    }
  }

  /**
   * 清除缓存
   */
  clearCache(): void {
    this.cache = null;
    this.lastCacheTime = 0;
    logger.debug('Office 环境缓存已清除');
  }

  /**
   * 设置缓存超时时间
   */
  setCacheTimeout(timeout: number): void {
    this.cacheTimeout = timeout;
    logger.debug('缓存超时时间已设置', { timeout });
  }
}

// 导出单例实例
export const officeDetector = OfficeDetector.getInstance();
