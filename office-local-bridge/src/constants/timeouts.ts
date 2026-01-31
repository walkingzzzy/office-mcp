/**
 * 超时常量定义
 * 统一管理所有超时时间，避免魔法数字
 */

/** API 请求超时时间（毫秒） */
export const API_REQUEST_TIMEOUT = 60000 // 60秒

/** 流式请求超时时间（毫秒） */
export const STREAM_REQUEST_TIMEOUT = 120000 // 120秒

/** 搜索请求超时时间（毫秒） */
export const SEARCH_REQUEST_TIMEOUT = 8000 // 8秒

/** MCP 请求超时时间（毫秒） */
export const MCP_REQUEST_TIMEOUT = 30000 // 30秒

/** 配置缓存 TTL（毫秒） */
export const CONFIG_CACHE_TTL = 60000 // 60秒

/** 重试延迟基数（毫秒） */
export const RETRY_DELAY_BASE = 1000 // 1秒

/** 最大重试次数 */
export const MAX_RETRIES = 2

/** 缓冲区大小限制（字节） */
export const MAX_BUFFER_SIZE = 1024 * 1024 // 1MB

/** WebSocket 心跳间隔（毫秒） */
export const WS_HEARTBEAT_INTERVAL = 30000 // 30秒

/** 速率限制窗口（毫秒） */
export const RATE_LIMIT_WINDOW = 60000 // 60秒

/** 默认速率限制（每窗口请求数） */
export const DEFAULT_RATE_LIMIT = 100
