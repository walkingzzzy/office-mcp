import { Change, ChangeStatus, DocumentDiff } from '../types';
import { EventEmitter } from 'events';
import DocumentAdapter from './DocumentAdapter';

/**
 * 修改管理器
 * 管理修改建议的状态和生命周期
 */
export class ChangeManager extends EventEmitter {
  private changes: Map<string, Change> = new Map();
  private changeHistory: Change[] = [];
  private currentDocumentState: string = '';

  constructor() {
    super();
  }

  /**
   * 添加修改建议
   */
  addChange(change: Omit<Change, 'id' | 'timestamp' | 'status'>): Change {
    const newChange: Change = {
      ...change,
      id: this.generateChangeId(),
      timestamp: Date.now(),
      status: 'pending',
    };

    this.changes.set(newChange.id, newChange);
    this.changeHistory.push(newChange);

    // 触发事件
    this.emit('change:added', newChange);
    this.emit('changes:updated', this.getAllChanges());

    return newChange;
  }

  /**
   * 批量添加修改建议
   */
  addChanges(changes: Omit<Change, 'id' | 'timestamp' | 'status'>[]): Change[] {
    const newChanges = changes.map((change) => this.addChange(change));
    return newChanges;
  }

  /**
   * 获取单个修改
   */
  getChange(id: string): Change | undefined {
    return this.changes.get(id);
  }

  /**
   * 获取所有修改
   */
  getAllChanges(): Change[] {
    return Array.from(this.changes.values());
  }

  /**
   * 获取待处理的修改
   */
  getPendingChanges(): Change[] {
    return this.getAllChanges().filter((c) => c.status === 'pending');
  }

  /**
   * 获取已接受的修改
   */
  getAcceptedChanges(): Change[] {
    return this.getAllChanges().filter((c) => c.status === 'accepted');
  }

  /**
   * 获取已拒绝的修改
   */
  getRejectedChanges(): Change[] {
    return this.getAllChanges().filter((c) => c.status === 'rejected');
  }

  /**
   * 按类型获取修改
   */
  getChangesByType(type: Change['type']): Change[] {
    return this.getAllChanges().filter((c) => c.type === type);
  }

  /**
   * 更新修改状态
   */
  updateChangeStatus(id: string, status: ChangeStatus): void {
    const change = this.changes.get(id);
    if (!change) {
      throw new Error(`修改不存在: ${id}`);
    }

    const oldStatus = change.status;
    change.status = status;

    // 触发事件
    this.emit('change:updated', change, oldStatus);
    this.emit('changes:updated', this.getAllChanges());
  }

  /**
   * 接受修改
   */
  async acceptChange(id: string): Promise<void> {
    const change = this.changes.get(id);
    if (!change) {
      throw new Error(`修改不存在: ${id}`);
    }

    // 更新状态
    this.updateChangeStatus(id, 'accepted');

    // 应用修改到文档
    try {
      const adapter = DocumentAdapter.getInstance();
      await adapter.applyChange(change);

      this.emit('change:accepted', change);
    } catch (error) {
      // 如果应用失败,回滚状态
      this.updateChangeStatus(id, 'pending');
      throw error;
    }
  }

  /**
   * 拒绝修改
   */
  async rejectChange(id: string): Promise<void> {
    const change = this.changes.get(id);
    if (!change) {
      throw new Error(`修改不存在: ${id}`);
    }

    // 更新状态
    this.updateChangeStatus(id, 'rejected');

    // 移除高亮
    try {
      const adapter = DocumentAdapter.getInstance();
      await adapter.removeHighlight(id);

      this.emit('change:rejected', change);
    } catch (error) {
      // 如果移除失败,回滚状态
      this.updateChangeStatus(id, 'pending');
      throw error;
    }
  }

  /**
   * 批量接受修改
   */
  async acceptChanges(ids: string[]): Promise<void> {
    for (const id of ids) {
      await this.acceptChange(id);
    }
    this.emit('changes:batchAccepted', ids);
  }

  /**
   * 接受所有待处理的修改
   */
  async acceptAll(): Promise<void> {
    const pendingIds = this.getPendingChanges().map((c) => c.id);
    await this.acceptChanges(pendingIds);
  }

  /**
   * 批量拒绝修改
   */
  async rejectChanges(ids: string[]): Promise<void> {
    for (const id of ids) {
      await this.rejectChange(id);
    }
    this.emit('changes:batchRejected', ids);
  }

  /**
   * 拒绝所有待处理的修改
   */
  async rejectAll(): Promise<void> {
    const pendingIds = this.getPendingChanges().map((c) => c.id);
    await this.rejectChanges(pendingIds);
  }

  /**
   * 删除修改
   */
  deleteChange(id: string): void {
    const change = this.changes.get(id);
    if (change) {
      this.changes.delete(id);
      this.emit('change:deleted', change);
      this.emit('changes:updated', this.getAllChanges());
    }
  }

  /**
   * 清空所有修改
   */
  clearAll(): void {
    this.changes.clear();
    this.emit('changes:cleared');
    this.emit('changes:updated', []);
  }

  /**
   * 生成唯一的修改ID
   */
  private generateChangeId(): string {
    return `change-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 获取修改统计信息
   */
  getStats(): {
    total: number;
    pending: number;
    accepted: number;
    rejected: number;
    byType: Record<Change['type'], number>;
  } {
    const all = this.getAllChanges();
    const stats = {
      total: all.length,
      pending: this.getPendingChanges().length,
      accepted: this.getAcceptedChanges().length,
      rejected: this.getRejectedChanges().length,
      byType: {
        insert: 0,
        delete: 0,
        modify: 0,
        format: 0,
      } as Record<Change['type'], number>,
    };

    for (const change of all) {
      stats.byType[change.type]++;
    }

    return stats;
  }

  /**
   * 导出修改历史
   */
  exportHistory(): Change[] {
    return [...this.changeHistory];
  }

  /**
   * 导入修改历史
   */
  importHistory(history: Change[]): void {
    this.clearAll();
    for (const change of history) {
      this.changes.set(change.id, change);
      this.changeHistory.push(change);
    }
    this.emit('changes:updated', this.getAllChanges());
  }

  /**
   * 保存当前文档状态
   */
  async saveDocumentState(): Promise<void> {
    try {
      const adapter = DocumentAdapter.getInstance();
      this.currentDocumentState = await adapter.getContent();
      this.emit('document:stateSaved', this.currentDocumentState);
    } catch (error) {
      console.error('保存文档状态失败:', error);
      throw error;
    }
  }

  /**
   * 比较文档差异
   */
  async compareDocuments(original: string, modified: string): Promise<DocumentDiff> {
    // 简单的差异对比实现
    // 实际应用中应该使用更复杂的diff算法
    const changes: Change[] = [];

    if (original !== modified) {
      changes.push({
        id: this.generateChangeId(),
        type: 'modify',
        content: modified,
        originalContent: original,
        timestamp: Date.now(),
        status: 'pending',
        description: '文档内容已修改',
      });
    }

    return {
      original,
      modified,
      changes,
    };
  }

  /**
   * 应用文档差异
   */
  async applyDocumentDiff(diff: DocumentDiff): Promise<void> {
    for (const change of diff.changes) {
      this.addChange(change);
    }
  }

  /**
   * 获取修改时间线
   */
  getTimeline(): Change[] {
    return [...this.changeHistory].sort((a, b) => a.timestamp - b.timestamp);
  }

  /**
   * 撤销最后一个修改
   */
  async undoLastChange(): Promise<void> {
    const acceptedChanges = this.getAcceptedChanges();
    if (acceptedChanges.length === 0) {
      throw new Error('没有可撤销的修改');
    }

    const lastChange = acceptedChanges[acceptedChanges.length - 1];
    await this.rejectChange(lastChange.id);
    this.emit('change:undone', lastChange);
  }

  /**
   * 获取修改摘要
   */
  getSummary(): string {
    const stats = this.getStats();
    return `总计 ${stats.total} 个修改: ${stats.pending} 个待处理, ${stats.accepted} 个已接受, ${stats.rejected} 个已拒绝`;
  }
}

// 导出单例
export default new ChangeManager();
