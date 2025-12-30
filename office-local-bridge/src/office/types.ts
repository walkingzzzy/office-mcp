/**
 * Office 环境检测和插件管理类型定义
 */

// Office 版本类型
export type OfficeVersion = 'Microsoft365' | 'Office2021' | 'Office2019' | 'Office2016' | 'Unknown';

// Office 应用类型
export type OfficeAppType = 'Word' | 'Excel' | 'PowerPoint' | 'Outlook' | 'OneNote';

// Office 应用信息
export interface OfficeApp {
  name: OfficeAppType;
  installed: boolean;
  path?: string;
  version?: string;
}

// Office 环境信息
export interface OfficeEnvironment {
  detected: boolean;
  version: OfficeVersion;
  versionNumber?: string;  // 如 "16.0.xxxxx"
  installPath?: string;
  platform: 'x86' | 'x64' | 'arm64' | 'unknown';
  apps: OfficeApp[];
  clickToRun: boolean;  // 是否是 Click-to-Run 安装
  /** ISO 8601 格式的日期字符串，便于 JSON 序列化 */
  lastChecked: string;
}

// 插件状态
export type PluginStatus = 'installed' | 'enabled' | 'disabled' | 'error';

// 插件来源
export type PluginSource = 'sideload' | 'store' | 'admin';

// 已安装插件信息
export interface InstalledPlugin {
  id: string;
  name: string;
  version: string;
  provider: string;
  description?: string;
  status: PluginStatus;
  source: PluginSource;
  manifestPath: string;
  /** ISO 8601 格式的日期字符串，便于 JSON 序列化 */
  installedAt?: string;
  supportedApps: OfficeAppType[];
  iconUrl?: string;
}

// 插件日志条目
export interface PluginLogEntry {
  /** ISO 8601 格式的日期字符串，便于 JSON 序列化 */
  timestamp: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  pluginId: string;
  message: string;
  details?: Record<string, unknown>;
}

// API 响应类型
export interface OfficeEnvironmentResponse {
  success: boolean;
  data?: OfficeEnvironment;
  error?: string;
}

export interface PluginListResponse {
  success: boolean;
  data?: InstalledPlugin[];
  error?: string;
}

export interface PluginInstallRequest {
  manifestPath?: string;  // 本地 manifest.xml 路径
  manifestUrl?: string;   // 远程 manifest URL
}

export interface PluginInstallResponse {
  success: boolean;
  plugin?: InstalledPlugin;
  error?: string;
}
