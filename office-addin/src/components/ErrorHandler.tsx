import React, { useState, useEffect } from 'react';
import './ErrorHandler.css';

export interface ErrorInfo {
  id: string;
  type: 'network' | 'validation' | 'server' | 'client' | 'unknown';
  message: string;
  details?: string;
  code?: string | number;
  timestamp: number;
  retryable?: boolean;
  action?: string;
}

interface ErrorHandlerProps {
  error: ErrorInfo | null;
  onRetry?: () => void;
  onDismiss?: () => void;
  onReport?: (error: ErrorInfo) => void;
  autoHide?: boolean;
  autoHideDelay?: number;
  showDetails?: boolean;
  className?: string;
}

export const ErrorHandler: React.FC<ErrorHandlerProps> = ({
  error,
  onRetry,
  onDismiss,
  onReport,
  autoHide = false,
  autoHideDelay = 5000,
  showDetails = false,
  className = ''
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [showFullDetails, setShowFullDetails] = useState(false);

  useEffect(() => {
    if (error) {
      setIsVisible(true);
      if (autoHide && !error.retryable) {
        const timer = setTimeout(() => {
          handleDismiss();
        }, autoHideDelay);
        return () => clearTimeout(timer);
      }
    } else {
      setIsVisible(false);
    }
  }, [error, autoHide, autoHideDelay]);

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(() => {
      onDismiss?.();
    }, 300);
  };

  const handleRetry = () => {
    onRetry?.();
  };

  const handleReport = () => {
    if (error) {
      onReport?.(error);
    }
  };

  const getErrorIcon = (type: string) => {
    switch (type) {
      case 'network':
        return '🌐';
      case 'validation':
        return '⚠️';
      case 'server':
        return '🔧';
      case 'client':
        return '💻';
      default:
        return '❌';
    }
  };

  const getErrorTitle = (type: string) => {
    switch (type) {
      case 'network':
        return '网络连接错误';
      case 'validation':
        return '输入验证错误';
      case 'server':
        return '服务器错误';
      case 'client':
        return '客户端错误';
      default:
        return '未知错误';
    }
  };

  const getSuggestion = (type: string) => {
    switch (type) {
      case 'network':
        return '请检查网络连接后重试';
      case 'validation':
        return '请检查输入内容是否正确';
      case 'server':
        return '服务器暂时不可用，请稍后重试';
      case 'client':
        return '请刷新页面或重启应用';
      default:
        return '请联系技术支持';
    }
  };

  if (!error || !isVisible) {
    return null;
  }

  return (
    <div className={`error-handler ${error.type} ${isVisible ? 'visible' : ''} ${className}`}>
      <div className="error-content">
        <div className="error-header">
          <div className="error-icon">
            {getErrorIcon(error.type)}
          </div>
          <div className="error-title">
            {getErrorTitle(error.type)}
          </div>
          <button
            className="error-close"
            onClick={handleDismiss}
            aria-label="关闭错误提示"
          >
            ✕
          </button>
        </div>

        <div className="error-body">
          <div className="error-message">
            {error.message}
          </div>

          {error.code && (
            <div className="error-code">
              错误代码: {error.code}
            </div>
          )}

          <div className="error-suggestion">
            {getSuggestion(error.type)}
          </div>

          {(showDetails || showFullDetails) && error.details && (
            <div className="error-details">
              <div className="error-details-header">
                <span>详细信息:</span>
              </div>
              <div className="error-details-content">
                {error.details}
              </div>
            </div>
          )}

          {!showDetails && error.details && (
            <button
              className="error-toggle-details"
              onClick={() => setShowFullDetails(!showFullDetails)}
            >
              {showFullDetails ? '隐藏详情' : '显示详情'}
            </button>
          )}
        </div>

        <div className="error-actions">
          {error.retryable && onRetry && (
            <button
              className="error-action retry"
              onClick={handleRetry}
            >
              🔄 重试
            </button>
          )}

          {onReport && (
            <button
              className="error-action report"
              onClick={handleReport}
            >
              📝 报告问题
            </button>
          )}

          <button
            className="error-action dismiss"
            onClick={handleDismiss}
          >
            知道了
          </button>
        </div>
      </div>
    </div>
  );
};

// 简化的错误提示组件
export const ErrorToast: React.FC<{
  message: string;
  type?: 'error' | 'warning' | 'info';
  onClose?: () => void;
  autoClose?: boolean;
  duration?: number;
}> = ({
  message,
  type = 'error',
  onClose,
  autoClose = true,
  duration = 3000
}) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (autoClose) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(() => onClose?.(), 300);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [autoClose, duration, onClose]);

  const getToastIcon = () => {
    switch (type) {
      case 'warning':
        return '⚠️';
      case 'info':
        return 'ℹ️';
      default:
        return '❌';
    }
  };

  return (
    <div className={`error-toast ${type} ${isVisible ? 'visible' : ''}`}>
      <span className="toast-icon">{getToastIcon()}</span>
      <span className="toast-message">{message}</span>
      {onClose && (
        <button
          className="toast-close"
          onClick={() => {
            setIsVisible(false);
            setTimeout(() => onClose(), 300);
          }}
        >
          ✕
        </button>
      )}
    </div>
  );
};

// 错误边界组件
interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

export class ErrorBoundary extends React.Component<
  React.PropsWithChildren<{
    fallback?: React.ComponentType<{ error: Error; retry: () => void }>;
    onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  }>,
  ErrorBoundaryState
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ errorInfo });
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return <FallbackComponent error={this.state.error!} retry={this.handleRetry} />;
      }

      return (
        <div className="error-boundary">
          <div className="error-boundary-content">
            <div className="error-boundary-icon">💥</div>
            <h3>出现了意外错误</h3>
            <p>应用程序遇到了一个意外的错误。</p>
            <div className="error-boundary-actions">
              <button
                className="error-action retry"
                onClick={this.handleRetry}
              >
                🔄 重新加载
              </button>
            </div>
            {this.state.error && (
              <details className="error-boundary-details">
                <summary>错误详情</summary>
                <pre>{this.state.error.toString()}</pre>
                {this.state.errorInfo && (
                  <pre>{this.state.errorInfo.componentStack}</pre>
                )}
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorHandler;