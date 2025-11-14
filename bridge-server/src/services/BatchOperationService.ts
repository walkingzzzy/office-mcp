import mcpClient from './MCPClient';
import logger from '../utils/logger';

export interface BatchOperation {
  id: string;
  toolName: string;
  arguments: Record<string, any>;
}

export interface BatchResult {
  success: boolean;
  results: Array<{
    operationId: string;
    success: boolean;
    result?: any;
    error?: string;
  }>;
  totalTime: number;
  optimizationApplied: boolean;
}

export class BatchOperationService {
  /**
   * 执行批量操作
   */
  async executeBatch(operations: BatchOperation[]): Promise<BatchResult> {
    const startTime = Date.now();
    logger.info('开始批量操作', { operationCount: operations.length });

    // 检查是否可以优化
    const optimizedOperations = this.optimizeOperations(operations);
    const optimizationApplied = optimizedOperations.length < operations.length;

    const results: BatchResult['results'] = [];

    try {
      // 并行执行独立操作
      const promises = optimizedOperations.map(async (operation) => {
        try {
          const result = await mcpClient.callTool(operation.toolName, operation.arguments);
          return {
            operationId: operation.id,
            success: true,
            result
          };
        } catch (error) {
          return {
            operationId: operation.id,
            success: false,
            error: error instanceof Error ? error.message : String(error)
          };
        }
      });

      const operationResults = await Promise.all(promises);
      results.push(...operationResults);

      const totalTime = Date.now() - startTime;
      const successCount = results.filter(r => r.success).length;

      logger.info('批量操作完成', {
        total: operations.length,
        optimized: optimizedOperations.length,
        success: successCount,
        failed: results.length - successCount,
        totalTime
      });

      return {
        success: successCount === results.length,
        results,
        totalTime,
        optimizationApplied
      };

    } catch (error) {
      logger.error('批量操作失败', error);
      throw error;
    }
  }

  /**
   * 优化操作序列
   */
  private optimizeOperations(operations: BatchOperation[]): BatchOperation[] {
    // 合并相同类型的操作
    const optimized = this.mergeSimilarOperations(operations);

    // 移除重复操作
    const deduplicated = this.deduplicateOperations(optimized);

    return deduplicated;
  }

  /**
   * 合并相似操作
   */
  private mergeSimilarOperations(operations: BatchOperation[]): BatchOperation[] {
    const merged: BatchOperation[] = [];
    const formatOperations: BatchOperation[] = [];

    for (const operation of operations) {
      // 合并格式化操作
      if (operation.toolName === 'format_word_text') {
        formatOperations.push(operation);
      } else {
        merged.push(operation);
      }
    }

    // 如果有多个格式化操作，尝试合并
    if (formatOperations.length > 1) {
      const mergedFormat = this.mergeFormatOperations(formatOperations);
      merged.push(...mergedFormat);
    } else {
      merged.push(...formatOperations);
    }

    return merged;
  }

  /**
   * 合并格式化操作
   */
  private mergeFormatOperations(operations: BatchOperation[]): BatchOperation[] {
    // 按文件名分组
    const groupedByFile = new Map<string, BatchOperation[]>();

    for (const operation of operations) {
      const filename = operation.arguments.filename;
      if (!groupedByFile.has(filename)) {
        groupedByFile.set(filename, []);
      }
      groupedByFile.get(filename)!.push(operation);
    }

    const merged: BatchOperation[] = [];

    // 为每个文件合并操作
    for (const [filename, fileOperations] of groupedByFile) {
      if (fileOperations.length === 1) {
        merged.push(fileOperations[0]);
        continue;
      }

      // 检查是否可以合并为批量格式化
      const canMerge = fileOperations.every(op =>
        op.toolName === 'format_word_text' &&
        this.hasSameFormatting(op.arguments, fileOperations[0].arguments)
      );

      if (canMerge) {
        // 创建批量操作
        const paragraphIndices = fileOperations.map(op => op.arguments.paragraph_index);
        const batchOperation: BatchOperation = {
          id: `batch_${Date.now()}`,
          toolName: 'batch_format_word_text',
          arguments: {
            ...fileOperations[0].arguments,
            paragraph_indices: paragraphIndices
          }
        };
        merged.push(batchOperation);
      } else {
        merged.push(...fileOperations);
      }
    }

    return merged;
  }

  /**
   * 检查格式化参数是否相同
   */
  private hasSameFormatting(args1: Record<string, any>, args2: Record<string, any>): boolean {
    const formatKeys = ['font_name', 'bold', 'italic', 'color', 'font_size'];
    return formatKeys.every(key => args1[key] === args2[key]);
  }

  /**
   * 去重操作
   */
  private deduplicateOperations(operations: BatchOperation[]): BatchOperation[] {
    const seen = new Set<string>();
    const deduplicated: BatchOperation[] = [];

    for (const operation of operations) {
      const key = this.getOperationKey(operation);
      if (!seen.has(key)) {
        seen.add(key);
        deduplicated.push(operation);
      }
    }

    return deduplicated;
  }

  /**
   * 生成操作唯一键
   */
  private getOperationKey(operation: BatchOperation): string {
    return `${operation.toolName}:${JSON.stringify(operation.arguments)}`;
  }

  /**
   * 估算批量操作时间
   */
  estimateBatchTime(operations: BatchOperation[]): number {
    const optimized = this.optimizeOperations(operations);

    // 基础时间估算（毫秒）
    const baseTimePerOperation = 100;
    const parallelismFactor = 0.6; // 并行执行的时间节省

    return Math.ceil(optimized.length * baseTimePerOperation * parallelismFactor);
  }
}

export default new BatchOperationService();