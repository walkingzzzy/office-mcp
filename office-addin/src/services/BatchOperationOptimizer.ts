import { Change } from '../types';

interface BatchOperation {
  id: string;
  type: 'highlight' | 'apply' | 'remove';
  changes: Change[];
  priority: number;
  estimatedTime: number;
}

interface OptimizationResult {
  batches: BatchOperation[];
  totalTime: number;
  optimizationRatio: number;
}

export class BatchOperationOptimizer {
  private readonly MAX_BATCH_SIZE = 50;
  private readonly MAX_BATCH_TIME = 5000; // 5秒

  optimizeOperations(changes: Change[], operationType: 'highlight' | 'apply' | 'remove'): OptimizationResult {
    const groupedChanges = this.groupChangesByContext(changes);
    const batches: BatchOperation[] = [];
    let totalTime = 0;

    for (const [context, contextChanges] of groupedChanges) {
      const contextBatches = this.createOptimalBatches(contextChanges, operationType, context);
      batches.push(...contextBatches);
      totalTime += contextBatches.reduce((sum, batch) => sum + batch.estimatedTime, 0);
    }

    const originalTime = changes.length * this.getOperationTime(operationType);
    const optimizationRatio = originalTime > 0 ? (originalTime - totalTime) / originalTime : 0;

    return {
      batches: batches.sort((a, b) => b.priority - a.priority),
      totalTime,
      optimizationRatio
    };
  }

  private groupChangesByContext(changes: Change[]): Map<string, Change[]> {
    const groups = new Map<string, Change[]>();

    for (const change of changes) {
      const context = this.getChangeContext(change);
      if (!groups.has(context)) {
        groups.set(context, []);
      }
      groups.get(context)!.push(change);
    }

    return groups;
  }

  private getChangeContext(change: Change): string {
    if (change.controlId) {
      // Excel: 工作表级别
      if (change.controlId.includes('Sheet')) {
        return change.controlId.split('!')[0];
      }
      // PowerPoint: 幻灯片级别
      if (change.position) {
        const slideIndex = Math.floor(change.position.start / 1000);
        return `slide_${slideIndex}`;
      }
    }
    return 'default';
  }

  private createOptimalBatches(changes: Change[], operationType: string, context: string): BatchOperation[] {
    const batches: BatchOperation[] = [];
    const sortedChanges = this.sortChangesByPriority(changes);

    let currentBatch: Change[] = [];
    let currentBatchTime = 0;

    for (const change of sortedChanges) {
      const operationTime = this.getOperationTime(operationType);

      if (currentBatch.length >= this.MAX_BATCH_SIZE ||
          currentBatchTime + operationTime > this.MAX_BATCH_TIME) {

        if (currentBatch.length > 0) {
          batches.push(this.createBatchOperation(currentBatch, operationType, context, currentBatchTime));
          currentBatch = [];
          currentBatchTime = 0;
        }
      }

      currentBatch.push(change);
      currentBatchTime += operationTime;
    }

    if (currentBatch.length > 0) {
      batches.push(this.createBatchOperation(currentBatch, operationType, context, currentBatchTime));
    }

    return batches;
  }

  private sortChangesByPriority(changes: Change[]): Change[] {
    return changes.sort((a, b) => {
      // 按类型优先级排序
      const typePriority = { insert: 3, modify: 2, delete: 1, format: 0 };
      const aPriority = typePriority[a.type] || 0;
      const bPriority = typePriority[b.type] || 0;

      if (aPriority !== bPriority) {
        return bPriority - aPriority;
      }

      // 按位置排序（相邻操作优先）
      if (a.position && b.position) {
        return a.position.start - b.position.start;
      }

      return 0;
    });
  }

  private createBatchOperation(changes: Change[], operationType: string, context: string, estimatedTime: number): BatchOperation {
    const priority = this.calculateBatchPriority(changes);

    return {
      id: `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: operationType as 'highlight' | 'apply' | 'remove',
      changes,
      priority,
      estimatedTime
    };
  }

  private calculateBatchPriority(changes: Change[]): number {
    const typeWeights = { insert: 4, modify: 3, delete: 2, format: 1 };
    const totalWeight = changes.reduce((sum, change) => sum + (typeWeights[change.type] || 1), 0);
    return Math.round(totalWeight / changes.length);
  }

  private getOperationTime(operationType: string): number {
    const baseTimes = {
      highlight: 50,  // 50ms per highlight
      apply: 100,     // 100ms per apply
      remove: 30      // 30ms per remove
    };
    return baseTimes[operationType as keyof typeof baseTimes] || 50;
  }

  async executeBatch(batch: BatchOperation, executor: (changes: Change[]) => Promise<void>): Promise<void> {
    const startTime = Date.now();

    try {
      await executor(batch.changes);
    } catch (error) {
      console.error(`批处理执行失败 (${batch.id}):`, error);
      throw error;
    }

    const actualTime = Date.now() - startTime;
    console.log(`批处理完成 (${batch.id}): ${batch.changes.length} 个操作, 耗时 ${actualTime}ms`);
  }

  async executeAllBatches(
    batches: BatchOperation[],
    executor: (changes: Change[]) => Promise<void>,
    onProgress?: (completed: number, total: number) => void
  ): Promise<void> {
    for (let i = 0; i < batches.length; i++) {
      await this.executeBatch(batches[i], executor);
      onProgress?.(i + 1, batches.length);
    }
  }

  getOptimizationStats(result: OptimizationResult): {
    batchCount: number;
    avgBatchSize: number;
    maxBatchSize: number;
    timeSaved: number;
    efficiency: string;
  } {
    const batchSizes = result.batches.map(b => b.changes.length);
    const avgBatchSize = batchSizes.reduce((sum, size) => sum + size, 0) / batchSizes.length;
    const maxBatchSize = Math.max(...batchSizes);
    const totalChanges = result.batches.reduce((sum, b) => sum + b.changes.length, 0);
    const originalTime = totalChanges * 100; // 假设单个操作100ms
    const timeSaved = originalTime - result.totalTime;

    return {
      batchCount: result.batches.length,
      avgBatchSize: Math.round(avgBatchSize),
      maxBatchSize,
      timeSaved,
      efficiency: `${Math.round(result.optimizationRatio * 100)}%`
    };
  }
}

export default BatchOperationOptimizer;