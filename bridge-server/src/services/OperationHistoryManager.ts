import { v4 as uuidv4 } from 'uuid';
import logger from '../utils/logger';

export interface Operation {
  id: string;
  sessionId: string;
  type: 'tool_call' | 'document_update';
  toolName?: string;
  arguments?: Record<string, any>;
  result?: any;
  timestamp: number;
  userMessage?: string;
  documentStateBefore?: Buffer;
  documentStateAfter?: Buffer;
}

export interface UndoResult {
  success: boolean;
  operation: Operation;
  message: string;
}

export class OperationHistoryManager {
  private history = new Map<string, Operation[]>(); // sessionId -> operations
  private readonly MAX_HISTORY_SIZE = 50;

  /**
   * 记录操作
   */
  recordOperation(
    sessionId: string,
    type: Operation['type'],
    data: Partial<Operation>
  ): Operation {
    const operation: Operation = {
      id: uuidv4(),
      sessionId,
      type,
      timestamp: Date.now(),
      ...data
    };

    if (!this.history.has(sessionId)) {
      this.history.set(sessionId, []);
    }

    const sessionHistory = this.history.get(sessionId)!;
    sessionHistory.push(operation);

    // 限制历史记录大小
    if (sessionHistory.length > this.MAX_HISTORY_SIZE) {
      sessionHistory.shift();
    }

    logger.info('记录操作历史', {
      sessionId,
      operationId: operation.id,
      type: operation.type,
      toolName: operation.toolName
    });

    return operation;
  }

  /**
   * 获取会话历史
   */
  getSessionHistory(sessionId: string): Operation[] {
    return this.history.get(sessionId) || [];
  }

  /**
   * 获取最后一个操作
   */
  getLastOperation(sessionId: string): Operation | null {
    const sessionHistory = this.getSessionHistory(sessionId);
    return sessionHistory.length > 0 ? sessionHistory[sessionHistory.length - 1] : null;
  }

  /**
   * 撤销最后一个操作
   */
  async undoLastOperation(sessionId: string): Promise<UndoResult> {
    const sessionHistory = this.getSessionHistory(sessionId);

    if (sessionHistory.length === 0) {
      return {
        success: false,
        operation: {} as Operation,
        message: '没有可撤销的操作'
      };
    }

    const lastOperation = sessionHistory.pop()!;

    try {
      // 如果有文档状态备份，恢复到之前的状态
      if (lastOperation.documentStateBefore) {
        // 这里需要调用文档恢复逻辑
        // 实际实现中需要与SessionManager配合
        logger.info('恢复文档状态', {
          sessionId,
          operationId: lastOperation.id
        });
      }

      logger.info('撤销操作成功', {
        sessionId,
        operationId: lastOperation.id,
        toolName: lastOperation.toolName
      });

      return {
        success: true,
        operation: lastOperation,
        message: `已撤销操作: ${lastOperation.toolName || lastOperation.type}`
      };

    } catch (error) {
      // 如果撤销失败，重新添加到历史记录
      sessionHistory.push(lastOperation);

      logger.error('撤销操作失败', {
        sessionId,
        operationId: lastOperation.id,
        error: error instanceof Error ? error.message : String(error)
      });

      return {
        success: false,
        operation: lastOperation,
        message: '撤销操作失败'
      };
    }
  }

  /**
   * 重做操作
   */
  async redoOperation(sessionId: string, operationId: string): Promise<UndoResult> {
    // 简化实现：重做功能需要更复杂的状态管理
    // 这里提供基础框架
    logger.info('重做操作请求', { sessionId, operationId });

    return {
      success: false,
      operation: {} as Operation,
      message: '重做功能暂未实现'
    };
  }

  /**
   * 清理会话历史
   */
  clearSessionHistory(sessionId: string): void {
    this.history.delete(sessionId);
    logger.info('清理会话历史', { sessionId });
  }

  /**
   * 获取操作统计
   */
  getOperationStats(sessionId: string): {
    totalOperations: number;
    toolCalls: number;
    documentUpdates: number;
    lastOperationTime: number | null;
  } {
    const sessionHistory = this.getSessionHistory(sessionId);

    return {
      totalOperations: sessionHistory.length,
      toolCalls: sessionHistory.filter(op => op.type === 'tool_call').length,
      documentUpdates: sessionHistory.filter(op => op.type === 'document_update').length,
      lastOperationTime: sessionHistory.length > 0 ? sessionHistory[sessionHistory.length - 1].timestamp : null
    };
  }
}

export default new OperationHistoryManager();