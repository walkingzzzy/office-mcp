/**
 * 错误边界组件
 * 捕获子组件的 JavaScript 错误并显示友好的错误界面
 */

import React, { Component, ErrorInfo, ReactNode } from 'react'
import Logger from '../../utils/logger'

const logger = new Logger('ErrorBoundary')

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

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
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo })
    this.props.onError?.(error, errorInfo)
    logger.error('ErrorBoundary 捕获错误:', { error: error.message, stack: errorInfo.componentStack })
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: null, errorInfo: null })
  }

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="p-4 flex flex-col items-center justify-center min-h-[200px]">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <h2 className="text-lg font-semibold text-gray-800 mb-2">
            出现了一些问题
          </h2>
          <p className="text-sm text-gray-600 mb-4 text-center max-w-md">
            {this.state.error?.message || '发生了未知错误'}
          </p>
          <button
            onClick={this.handleRetry}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            重试
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
