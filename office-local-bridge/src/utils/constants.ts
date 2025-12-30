/**
 * 应用程序常量定义
 * 集中管理魔法数字和配置常量
 */

// =====================
// 日志相关常量
// =====================

/** 每个模块最大日志条目数 */
export const MAX_LOGS_PER_MODULE = 1000;

/** 每个插件最大日志条目数 */
export const MAX_LOGS_PER_PLUGIN = 1000;

/** 最大模块数量 */
export const MAX_LOG_MODULES = 100;

/** 全局日志条目上限 */
export const MAX_GLOBAL_LOG_ENTRIES = 50000;

/** 默认日志查询限制 */
export const DEFAULT_LOG_QUERY_LIMIT = 100;

// =====================
// Embedding 相关常量
// =====================

/** 简单 embedding 向量维度 */
export const SIMPLE_EMBEDDING_DIMENSION = 384;

/** 默认文本分块大小 */
export const DEFAULT_CHUNK_SIZE = 1000;

// =====================
// 缓存相关常量
// =====================

/** 缓存 TTL（毫秒） - 5分钟 */
export const CACHE_TTL_MS = 5 * 60 * 1000;

/** 最大缓存查询数 */
export const MAX_CACHE_SIZE = 100;

// =====================
// 进程管理相关常量
// =====================

/** 最大重启次数 */
export const MAX_PROCESS_RESTARTS = 5;

/** 基础重启延迟（毫秒） */
export const BASE_RESTART_DELAY_MS = 1000;

/** 最大重启延迟（毫秒） */
export const MAX_RESTART_DELAY_MS = 60000;

/** 强制退出超时时间（毫秒） */
export const FORCE_EXIT_TIMEOUT_MS = 10000;

// =====================
// WebSocket 相关常量
// =====================

/** 日志缓冲时间（毫秒） */
export const LOG_BUFFER_TIME_MS = 100;

/** 最大 WebSocket 连接数 */
export const MAX_WEBSOCKET_CONNECTIONS = 100;

/** 速率限制窗口（毫秒） */
export const RATE_LIMIT_WINDOW_MS = 1000;

/** 每个 IP 每秒最大连接数 */
export const MAX_CONNECTIONS_PER_IP = 5;

// =====================
// Office 版本相关常量
// =====================

/** 支持的 Office 版本列表（按优先级降序排列） */
export const SUPPORTED_OFFICE_VERSIONS = ['16.0', '15.0', '14.0'] as const;

/** 默认 Office 版本 */
export const DEFAULT_OFFICE_VERSION = '16.0';

// =====================
// 日志级别相关常量
// =====================

/** 有效的日志级别 */
export const VALID_LOG_LEVELS = ['debug', 'info', 'warn', 'error'] as const;

/** 默认日志级别 */
export const DEFAULT_LOG_LEVEL = 'info';

// =====================
// API 相关常量
// =====================

/** 分页默认限制 */
export const DEFAULT_PAGE_LIMIT = 100;

/** 最大导出日志数 */
export const MAX_EXPORT_LOGS = 10000;

// =====================
// 服务版本
// =====================

/** 服务版本号 */
export const SERVICE_VERSION = '1.0.0';

/** 服务启动时间（毫秒时间戳） */
export const SERVICE_START_TIME = Date.now();
