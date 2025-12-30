/**
 * ErrorBoundary - 错误边界组件
 * 已迁移到 Tailwind
 * 捕获子组件的渲染错误,防止整个应用崩溃
 */

import {
  ArrowResetRegular,
  ErrorCircleRegular
} from '@fluentui/react-icons'
import React, { Component, ReactNode } from 'react'

import { Button } from '@/components/ui/button'
import { logger } from '../utils/logger'

const errorLogger = logger.withContext('ErrorBoundary')

// Tailwind 类映射
const styles = {
  container: 'flex flex-col items-center justify-center p-8 gap-6 bg-background rounded-lg border border-border',
  icon: 'text-5xl text-red-500',
  title: 'text-lg font-semibold text-foreground',
  message: 'text-sm text-muted-foreground text-center max-w-[400px]',
  details: 'text-xs text-muted-foreground font-mono bg-muted p-4 rounded max-w-[500px] overflow-x-auto whitespace-pre-wrap break-words',
  actions: 'flex gap-3'
}

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
}

/**
 * 错误回退 UI
 */
const ErrorFallback: React.FC<{
  error: Error | null
  errorInfo: React.ErrorInfo | null
  onReset: () => void
}> = ({ error, errorInfo, onReset }) => {
  const isDev = import.meta.env.DEV

  return (
    <div className={styles.container}>
      <ErrorCircleRegular className="h-12 w-12 text-red-500" />
      <span className={styles.title}>组件渲染错误</span>
      <span className={styles.message}>
        抱歉，这个组件遇到了问题。请尝试刷新页面或联系技术支持。
      </span>

      {isDev && error && (
        <div className={styles.details}>
          <strong>错误信息:</strong>
          <br />
          {error.toString()}
          <br />
          <br />
          <strong>错误堆栈:</strong>
          <br />
          {errorInfo?.componentStack}
        </div>
      )}

      <div className={styles.actions}>
        <Button onClick={onReset}>
          <ArrowResetRegular className="h-4 w-4 mr-2" />
          重试
        </Button>
        <Button variant="outline" onClick={() => window.location.reload()}>
          刷新页面
        </Button>
      </div>
    </div>
  )
}

/**
 * 错误边界组件
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // 使用结构化日志记录错误
    errorLogger.error('Component rendering error caught', {
      errorName: error.name,
      errorMessage: error.message,
      errorStack: error.stack,
      componentStack: errorInfo.componentStack
    })

    this.setState({
      error,
      errorInfo
    })

    // 调用自定义错误处理函数
    this.props.onError?.(error, errorInfo)
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    })
  }

  render(): ReactNode {
    if (this.state.hasError) {
      // 如果提供了自定义 fallback，使用它
      if (this.props.fallback) {
        return this.props.fallback
      }

      // 否则使用默认的错误 UI
      return (
        <ErrorFallback
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          onReset={this.handleReset}
        />
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
