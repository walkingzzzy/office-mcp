"""错误处理和恢复机制"""
import logging
import traceback
import asyncio
from typing import Dict, Any, Optional, Callable, List
from functools import wraps
from enum import Enum
import time

class ErrorSeverity(Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class ErrorCategory(Enum):
    NETWORK = "network"
    FILE_IO = "file_io"
    PERMISSION = "permission"
    VALIDATION = "validation"
    OFFICE_API = "office_api"
    SYSTEM = "system"

class ErrorInfo:
    """错误信息类"""
    def __init__(self, error: Exception, category: ErrorCategory, severity: ErrorSeverity,
                 user_message: str, recovery_suggestions: List[str] = None):
        self.error = error
        self.category = category
        self.severity = severity
        self.user_message = user_message
        self.recovery_suggestions = recovery_suggestions or []
        self.timestamp = time.time()
        self.traceback = traceback.format_exc()

class ErrorRecoveryManager:
    """错误恢复管理器"""

    def __init__(self):
        self.error_handlers: Dict[ErrorCategory, Callable] = {}
        self.retry_strategies: Dict[ErrorCategory, Dict[str, Any]] = {}
        self.error_history: List[ErrorInfo] = []
        self.max_history = 100

    def register_handler(self, category: ErrorCategory, handler: Callable):
        """注册错误处理器"""
        self.error_handlers[category] = handler

    def register_retry_strategy(self, category: ErrorCategory, max_retries: int = 3,
                              delay: float = 1.0, backoff_factor: float = 2.0):
        """注册重试策略"""
        self.retry_strategies[category] = {
            'max_retries': max_retries,
            'delay': delay,
            'backoff_factor': backoff_factor
        }

    def categorize_error(self, error: Exception) -> ErrorCategory:
        """错误分类"""
        error_type = type(error).__name__
        error_message = str(error).lower()

        if 'network' in error_message or 'connection' in error_message:
            return ErrorCategory.NETWORK
        elif 'file' in error_message or 'path' in error_message:
            return ErrorCategory.FILE_IO
        elif 'permission' in error_message or 'access' in error_message:
            return ErrorCategory.PERMISSION
        elif 'validation' in error_message or 'invalid' in error_message:
            return ErrorCategory.VALIDATION
        elif 'office' in error_message or 'excel' in error_message or 'powerpoint' in error_message:
            return ErrorCategory.OFFICE_API
        else:
            return ErrorCategory.SYSTEM

    def get_user_friendly_message(self, error: Exception, category: ErrorCategory) -> str:
        """获取用户友好的错误消息"""
        messages = {
            ErrorCategory.NETWORK: "网络连接出现问题，请检查网络设置",
            ErrorCategory.FILE_IO: "文件操作失败，请检查文件路径和权限",
            ErrorCategory.PERMISSION: "权限不足，请检查文件访问权限",
            ErrorCategory.VALIDATION: "输入数据格式不正确，请检查输入内容",
            ErrorCategory.OFFICE_API: "Office应用程序操作失败，请确保Office正常运行",
            ErrorCategory.SYSTEM: "系统错误，请稍后重试"
        }
        return messages.get(category, "发生未知错误")

    def get_recovery_suggestions(self, category: ErrorCategory) -> List[str]:
        """获取恢复建议"""
        suggestions = {
            ErrorCategory.NETWORK: [
                "检查网络连接",
                "重新启动网络适配器",
                "联系网络管理员"
            ],
            ErrorCategory.FILE_IO: [
                "检查文件是否存在",
                "确认文件路径正确",
                "检查磁盘空间",
                "关闭其他程序对文件的占用"
            ],
            ErrorCategory.PERMISSION: [
                "以管理员身份运行程序",
                "检查文件权限设置",
                "联系系统管理员"
            ],
            ErrorCategory.VALIDATION: [
                "检查输入数据格式",
                "参考示例数据格式",
                "清理无效字符"
            ],
            ErrorCategory.OFFICE_API: [
                "重新启动Office应用程序",
                "检查Office版本兼容性",
                "修复Office安装"
            ],
            ErrorCategory.SYSTEM: [
                "重启应用程序",
                "检查系统资源",
                "联系技术支持"
            ]
        }
        return suggestions.get(category, ["请稍后重试"])

    async def handle_error(self, error: Exception, context: Dict[str, Any] = None) -> ErrorInfo:
        """处理错误"""
        category = self.categorize_error(error)
        severity = self._determine_severity(error, category)
        user_message = self.get_user_friendly_message(error, category)
        recovery_suggestions = self.get_recovery_suggestions(category)

        error_info = ErrorInfo(error, category, severity, user_message, recovery_suggestions)

        # 记录错误历史
        self._add_to_history(error_info)

        # 执行特定的错误处理器
        if category in self.error_handlers:
            try:
                await self.error_handlers[category](error_info, context)
            except Exception as handler_error:
                logging.error(f"错误处理器执行失败: {handler_error}")

        # 记录日志
        self._log_error(error_info, context)

        return error_info

    def _determine_severity(self, error: Exception, category: ErrorCategory) -> ErrorSeverity:
        """确定错误严重程度"""
        if category == ErrorCategory.SYSTEM:
            return ErrorSeverity.CRITICAL
        elif category in [ErrorCategory.OFFICE_API, ErrorCategory.PERMISSION]:
            return ErrorSeverity.HIGH
        elif category in [ErrorCategory.FILE_IO, ErrorCategory.NETWORK]:
            return ErrorSeverity.MEDIUM
        else:
            return ErrorSeverity.LOW

    def _add_to_history(self, error_info: ErrorInfo):
        """添加到错误历史"""
        self.error_history.append(error_info)
        if len(self.error_history) > self.max_history:
            self.error_history.pop(0)

    def _log_error(self, error_info: ErrorInfo, context: Dict[str, Any] = None):
        """记录错误日志"""
        log_level = {
            ErrorSeverity.LOW: logging.INFO,
            ErrorSeverity.MEDIUM: logging.WARNING,
            ErrorSeverity.HIGH: logging.ERROR,
            ErrorSeverity.CRITICAL: logging.CRITICAL
        }.get(error_info.severity, logging.ERROR)

        logging.log(log_level, f"错误: {error_info.user_message}")
        logging.debug(f"详细信息: {error_info.traceback}")
        if context:
            logging.debug(f"上下文: {context}")

def retry_on_error(max_retries: int = 3, delay: float = 1.0, backoff_factor: float = 2.0,
                  exceptions: tuple = (Exception,)):
    """重试装饰器"""
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            last_exception = None
            current_delay = delay

            for attempt in range(max_retries + 1):
                try:
                    return await func(*args, **kwargs)
                except exceptions as e:
                    last_exception = e
                    if attempt < max_retries:
                        logging.warning(f"操作失败，{current_delay}秒后重试 (尝试 {attempt + 1}/{max_retries})")
                        await asyncio.sleep(current_delay)
                        current_delay *= backoff_factor
                    else:
                        logging.error(f"操作在{max_retries}次重试后仍然失败")

            raise last_exception

        return wrapper
    return decorator

def safe_execute(fallback_value=None, log_errors=True):
    """安全执行装饰器"""
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            try:
                return await func(*args, **kwargs)
            except Exception as e:
                if log_errors:
                    logging.error(f"函数 {func.__name__} 执行失败: {e}")
                return fallback_value

        return wrapper
    return decorator

class CircuitBreaker:
    """熔断器"""

    def __init__(self, failure_threshold: int = 5, recovery_timeout: int = 60):
        self.failure_threshold = failure_threshold
        self.recovery_timeout = recovery_timeout
        self.failure_count = 0
        self.last_failure_time = None
        self.state = 'CLOSED'  # CLOSED, OPEN, HALF_OPEN

    def call(self, func):
        """调用函数"""
        if self.state == 'OPEN':
            if time.time() - self.last_failure_time > self.recovery_timeout:
                self.state = 'HALF_OPEN'
            else:
                raise Exception("熔断器开启，服务暂时不可用")

        try:
            result = func()
            if self.state == 'HALF_OPEN':
                self.state = 'CLOSED'
                self.failure_count = 0
            return result
        except Exception as e:
            self.failure_count += 1
            self.last_failure_time = time.time()

            if self.failure_count >= self.failure_threshold:
                self.state = 'OPEN'

            raise e

# 全局错误恢复管理器
error_recovery_manager = ErrorRecoveryManager()

# 注册默认的重试策略
error_recovery_manager.register_retry_strategy(ErrorCategory.NETWORK, max_retries=3, delay=2.0)
error_recovery_manager.register_retry_strategy(ErrorCategory.OFFICE_API, max_retries=2, delay=1.0)
error_recovery_manager.register_retry_strategy(ErrorCategory.FILE_IO, max_retries=2, delay=0.5)