/**
 * Simple logger utility for MCP Server
 */

const LOG_LEVELS = {
  info: 'INFO',
  warn: 'WARN',
  error: 'ERROR'
} as const

type LogLevel = keyof typeof LOG_LEVELS

class Logger {
  private formatMessage(level: LogLevel, message: string, metadata?: Record<string, any>): string {
    const timestamp = new Date().toISOString()
    const levelStr = LOG_LEVELS[level].padEnd(5)
    let formattedMessage = `[${timestamp}] [${levelStr}] ${message}`

    if (metadata && Object.keys(metadata).length > 0) {
      formattedMessage += ` ${JSON.stringify(metadata)}`
    }

    return formattedMessage
  }

  info(message: string, metadata?: Record<string, any>): void {
    console.error(this.formatMessage('info', message, metadata))
  }

  warn(message: string, metadata?: Record<string, any>): void {
    console.error(this.formatMessage('warn', message, metadata))
  }

  error(message: string, metadata?: Record<string, any>): void {
    console.error(this.formatMessage('error', message, metadata))
  }
}

export const logger = new Logger()
