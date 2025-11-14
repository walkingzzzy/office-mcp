import { Change, HighlightOptions } from '../types';

/**
 * 高亮管理器
 * 管理Word ContentControl高亮标记
 */
export class HighlightManager {
  private highlightMap: Map<string, string> = new Map(); // changeId -> controlId

  /**
   * 高亮颜色配置
   */
  readonly COLORS = {
    insert: '#E8F5E9',   // 绿色背景
    delete: '#FFEBEE',   // 红色背景
    modify: '#FFF9C4',   // 黄色背景
    format: '#E3F2FD',   // 蓝色背景
  };

  /**
   * 创建高亮
   */
  async createHighlight(change: Change): Promise<void> {
    return Word.run(async (context) => {
      const body = context.document.body;

      let contentControl: Word.ContentControl;

      // 根据位置信息创建ContentControl
      if (change.position) {
        // 使用Range创建ContentControl
        const searchResults = body.search(change.content);
        searchResults.load('items');
        await context.sync();

        if (searchResults.items.length > 0) {
          const range = searchResults.items[0];
          contentControl = range.insertContentControl();
        } else {
          // 如果找不到内容,在文档末尾创建
          const endRange = body.getRange(Word.RangeLocation.end);
          contentControl = endRange.insertContentControl();
          contentControl.insertText(change.content, Word.InsertLocation.start);
        }
      } else {
        // 在文档末尾创建
        const endRange = body.getRange(Word.RangeLocation.end);
        contentControl = endRange.insertContentControl();
        contentControl.insertText(change.content, Word.InsertLocation.start);
      }

      // 配置ContentControl
      this.configureContentControl(contentControl, change);

      await context.sync();

      // 保存映射关系
      contentControl.load('id');
      await context.sync();
      this.highlightMap.set(change.id, contentControl.id);
    });
  }

  /**
   * 配置ContentControl外观和属性
   */
  private configureContentControl(control: Word.ContentControl, change: Change): void {
    // 设置标签和标题
    control.tag = change.id;
    control.title = change.description || this.getDefaultTitle(change.type);

    // 设置外观
    control.appearance = Word.ContentControlAppearance.boundingBox;

    // 设置颜色
    control.color = this.getColor(change.type);

    // 设置字体样式
    if (change.type === 'delete') {
      control.font.strikeThrough = true;
      control.font.color = '#D32F2F';  // 红色字体
    } else if (change.type === 'insert') {
      control.font.bold = true;
      control.font.color = '#388E3C';  // 绿色字体
    } else if (change.type === 'modify') {
      control.font.italic = true;
      control.font.color = '#F57C00';  // 橙色字体
    }

    // 不允许删除(用户必须通过Accept/Reject操作)
    control.cannotDelete = true;
    control.cannotEdit = true;
  }

  /**
   * 获取默认标题
   */
  private getDefaultTitle(type: Change['type']): string {
    const titles = {
      insert: '新增内容',
      delete: '删除内容',
      modify: '修改内容',
      format: '格式调整',
    };
    return titles[type];
  }

  /**
   * 获取高亮颜色
   */
  getColor(type: Change['type']): string {
    return this.COLORS[type] || this.COLORS.modify;
  }

  /**
   * 更新高亮
   */
  async updateHighlight(change: Change, options?: Partial<HighlightOptions>): Promise<void> {
    const controlId = this.highlightMap.get(change.id);
    if (!controlId) {
      throw new Error(`找不到修改的高亮: ${change.id}`);
    }

    return Word.run(async (context) => {
      const contentControls = context.document.contentControls;
      contentControls.load('items');
      await context.sync();

      for (const control of contentControls.items) {
        control.load('tag');
        await context.sync();

        if (control.tag === change.id) {
          // 更新属性
          if (options?.color) {
            control.color = options.color;
          }
          if (options?.title) {
            control.title = options.title;
          }
          await context.sync();
          return;
        }
      }

      throw new Error(`找不到ContentControl: ${change.id}`);
    });
  }

  /**
   * 移除高亮
   */
  async removeHighlight(changeId: string): Promise<void> {
    return Word.run(async (context) => {
      const contentControls = context.document.contentControls;
      contentControls.load('items');
      await context.sync();

      for (const control of contentControls.items) {
        control.load('tag');
        await context.sync();

        if (control.tag === changeId) {
          // 保留内容,只删除ContentControl外壳
          control.delete(false);
          await context.sync();
          this.highlightMap.delete(changeId);
          return;
        }
      }

      console.warn(`找不到要删除的高亮: ${changeId}`);
    });
  }

  /**
   * 移除所有高亮
   */
  async removeAllHighlights(): Promise<void> {
    return Word.run(async (context) => {
      const contentControls = context.document.contentControls;
      contentControls.load('items');
      await context.sync();

      // 删除所有ContentControl但保留内容
      for (const control of contentControls.items) {
        control.delete(false);
      }

      await context.sync();
      this.highlightMap.clear();
    });
  }

  /**
   * 批量创建高亮
   */
  async createHighlights(changes: Change[]): Promise<void> {
    for (const change of changes) {
      try {
        await this.createHighlight(change);
      } catch (error) {
        console.error(`创建高亮失败 (${change.id}):`, error);
      }
    }
  }

  /**
   * 批量移除高亮
   */
  async removeHighlights(changeIds: string[]): Promise<void> {
    for (const id of changeIds) {
      try {
        await this.removeHighlight(id);
      } catch (error) {
        console.error(`移除高亮失败 (${id}):`, error);
      }
    }
  }

  /**
   * 查找高亮对应的ContentControl
   */
  async findContentControl(changeId: string): Promise<Word.ContentControl | null> {
    return Word.run(async (context) => {
      const contentControls = context.document.contentControls;
      contentControls.load('items');
      await context.sync();

      for (const control of contentControls.items) {
        control.load('tag');
        await context.sync();

        if (control.tag === changeId) {
          return control;
        }
      }

      return null;
    });
  }

  /**
   * 获取所有高亮的修改ID
   */
  getHighlightedChangeIds(): string[] {
    return Array.from(this.highlightMap.keys());
  }

  /**
   * 检查修改是否已高亮
   */
  isHighlighted(changeId: string): boolean {
    return this.highlightMap.has(changeId);
  }

  /**
   * 获取高亮数量
   */
  getHighlightCount(): number {
    return this.highlightMap.size;
  }

  /**
   * 跳转到指定高亮
   */
  async scrollToHighlight(changeId: string): Promise<void> {
    return Word.run(async (context) => {
      const contentControls = context.document.contentControls;
      contentControls.load('items');
      await context.sync();

      for (const control of contentControls.items) {
        control.load('tag');
        await context.sync();

        if (control.tag === changeId) {
          // 选中ContentControl
          control.select(Word.SelectionMode.select);
          await context.sync();

          // 滚动到视图
          control.track();
          await context.sync();
          return;
        }
      }

      throw new Error(`找不到高亮: ${changeId}`);
    });
  }

  /**
   * 高亮文档中的搜索结果
   */
  async highlightSearchResults(searchText: string, color?: string): Promise<number> {
    return Word.run(async (context) => {
      const body = context.document.body;
      const searchResults = body.search(searchText, { matchCase: false, matchWholeWord: false });
      searchResults.load('items');
      await context.sync();

      const count = searchResults.items.length;

      for (const result of searchResults.items) {
        const control = result.insertContentControl();
        control.appearance = Word.ContentControlAppearance.boundingBox;
        control.color = color || '#FFEB3B';  // 黄色高亮
        control.title = `搜索结果: ${searchText}`;
      }

      await context.sync();
      return count;
    });
  }

  /**
   * 清除搜索高亮
   */
  async clearSearchHighlights(): Promise<void> {
    return Word.run(async (context) => {
      const contentControls = context.document.contentControls;
      contentControls.load('items');
      await context.sync();

      for (const control of contentControls.items) {
        control.load('title');
        await context.sync();

        if (control.title.startsWith('搜索结果:')) {
          control.delete(false);
        }
      }

      await context.sync();
    });
  }

  /**
   * 获取高亮统计
   */
  async getHighlightStats(): Promise<{
    total: number;
    byType: Record<string, number>;
  }> {
    return Word.run(async (context) => {
      const contentControls = context.document.contentControls;
      contentControls.load('items');
      await context.sync();

      const stats = {
        total: 0,
        byType: {} as Record<string, number>,
      };

      for (const control of contentControls.items) {
        control.load(['tag', 'title']);
        await context.sync();

        if (control.tag && this.highlightMap.has(control.tag)) {
          stats.total++;
          const title = control.title;
          stats.byType[title] = (stats.byType[title] || 0) + 1;
        }
      }

      return stats;
    });
  }

  /**
   * 导出高亮映射
   */
  exportHighlightMap(): Record<string, string> {
    return Object.fromEntries(this.highlightMap);
  }

  /**
   * 导入高亮映射
   */
  importHighlightMap(map: Record<string, string>): void {
    this.highlightMap.clear();
    for (const [changeId, controlId] of Object.entries(map)) {
      this.highlightMap.set(changeId, controlId);
    }
  }
}

// 导出单例
export default new HighlightManager();
