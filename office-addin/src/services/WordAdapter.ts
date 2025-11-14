import { IDocumentAdapter, Change, ApiResponse, HighlightOptions } from '../types';
import httpClient from './HttpClient';

/**
 * Word文档适配器
 * 实现Word文档的读取、更新、高亮功能
 */
export class WordAdapter implements IDocumentAdapter {
  private highlightMap: Map<string, Word.ContentControl> = new Map();

  /**
   * 高亮颜色配置
   */
  private readonly COLORS = {
    insert: '#E8F5E9',   // 绿色背景
    delete: '#FFEBEE',   // 红色背景
    modify: '#FFF9C4',   // 黄色背景
    format: '#2196F3',   // 蓝色边框
  };

  /**
   * 获取文档内容
   */
  async getContent(): Promise<string> {
    return Word.run(async (context) => {
      const body = context.document.body;
      body.load('text');
      await context.sync();
      return body.text;
    });
  }

  /**
   * 设置文档内容
   */
  async setContent(content: string): Promise<void> {
    return Word.run(async (context) => {
      const body = context.document.body;
      body.clear();
      body.insertText(content, Word.InsertLocation.start);
      await context.sync();
    });
  }

  /**
   * 获取选中的内容
   */
  async getSelection(): Promise<string> {
    return Word.run(async (context) => {
      const selection = context.document.getSelection();
      selection.load('text');
      await context.sync();
      return selection.text;
    });
  }

  /**
   * 插入内容
   */
  async insertContent(content: string): Promise<void> {
    return Word.run(async (context) => {
      const selection = context.document.getSelection();
      selection.insertText(content, Word.InsertLocation.replace);
      await context.sync();
    });
  }

  /**
   * 读取文档并上传到服务器
   */
  async readDocument(): Promise<ApiResponse<{ fileId: string }>> {
    try {
      // 获取文档的完整内容(包括格式)
      const file = await this.getDocumentAsBlob();

      // 上传到Bridge Server
      const result = await httpClient.uploadFile(file, 'document.docx');

      return result;
    } catch (error: any) {
      console.error('读取文档失败:', error);
      return {
        success: false,
        error: error.message,
        message: '读取文档失败',
      };
    }
  }

  /**
   * 获取文档作为Blob
   */
  private async getDocumentAsBlob(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      Office.context.document.getFileAsync(
        Office.FileType.Compressed,
        { sliceSize: 65536 },
        async (result) => {
          if (result.status === Office.AsyncResultStatus.Succeeded) {
            const file = result.value;
            const sliceCount = file.sliceCount;
            const slices: Uint8Array[] = [];

            // 读取所有切片
            for (let i = 0; i < sliceCount; i++) {
              const slice = await this.getSlice(file, i);
              slices.push(new Uint8Array(slice));
            }

            // 合并切片
            const totalLength = slices.reduce((sum, arr) => sum + arr.length, 0);
            const combined = new Uint8Array(totalLength);
            let offset = 0;
            for (const slice of slices) {
              combined.set(slice, offset);
              offset += slice.length;
            }

            file.closeAsync();
            resolve(new Blob([combined], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }));
          } else {
            reject(new Error(result.error.message));
          }
        }
      );
    });
  }

  /**
   * 获取单个切片
   */
  private getSlice(file: Office.File, sliceIndex: number): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      file.getSliceAsync(sliceIndex, (result) => {
        if (result.status === Office.AsyncResultStatus.Succeeded) {
          resolve(result.value.data);
        } else {
          reject(new Error(result.error.message));
        }
      });
    });
  }

  /**
   * 更新文档内容
   */
  async updateDocument(content: ArrayBuffer | Blob): Promise<void> {
    // Word不支持直接替换整个文档
    // 这个方法通常用于从服务器下载修改后的文档
    // 实际场景中,用户需要手动保存和打开新文档
    throw new Error('Word文档不支持直接更新整个文档,请使用applyChange方法应用具体修改');
  }

  /**
   * 高亮显示指定范围
   */
  async highlightRange(change: Change): Promise<void> {
    return Word.run(async (context) => {
      const body = context.document.body;

      // 根据change类型选择颜色
      const color = this.getHighlightColor(change.type);

      // 创建ContentControl来标记修改区域
      let contentControl: Word.ContentControl;

      if (change.position) {
        // 根据位置高亮
        const range = body.getRange().getRange(Word.RangeLocation.start);
        range.moveStart('Character', change.position.start);
        range.moveEnd('Character', change.position.end - change.position.start);
        contentControl = range.insertContentControl();
      } else {
        // 如果没有位置信息,在文档末尾插入
        const endRange = body.getRange(Word.RangeLocation.end);
        contentControl = endRange.insertContentControl();
        contentControl.insertText(change.content, Word.InsertLocation.start);
      }

      // 设置ContentControl属性
      contentControl.tag = change.id;
      contentControl.title = change.description || `修改 - ${change.type}`;
      contentControl.appearance = Word.ContentControlAppearance.boundingBox;
      contentControl.color = color;

      // 根据类型设置特殊样式
      if (change.type === 'delete') {
        contentControl.font.strikeThrough = true;
      }

      await context.sync();

      // 保存ContentControl引用
      this.highlightMap.set(change.id, contentControl);
    });
  }

  /**
   * 获取高亮颜色
   */
  private getHighlightColor(type: Change['type']): string {
    return this.COLORS[type] || this.COLORS.modify;
  }

  /**
   * 移除高亮
   */
  async removeHighlight(changeId: string): Promise<void> {
    return Word.run(async (context) => {
      // 查找并删除ContentControl
      const contentControls = context.document.contentControls;
      contentControls.load('items');
      await context.sync();

      for (const control of contentControls.items) {
        control.load('tag');
        await context.sync();

        if (control.tag === changeId) {
          // 保留内容,只删除ContentControl
          control.removeWhenEdited = false;
          control.delete(false);  // false表示保留内容
          break;
        }
      }

      await context.sync();
      this.highlightMap.delete(changeId);
    });
  }

  /**
   * 应用修改
   */
  async applyChange(change: Change): Promise<void> {
    return Word.run(async (context) => {
      const contentControls = context.document.contentControls;
      contentControls.load('items');
      await context.sync();

      // 找到对应的ContentControl
      for (const control of contentControls.items) {
        control.load('tag');
        await context.sync();

        if (control.tag === change.id) {
          switch (change.type) {
            case 'insert':
              // 插入内容已经在高亮时完成,只需移除ContentControl
              control.delete(false);
              break;

            case 'delete':
              // 删除内容和ContentControl
              control.delete(true);
              break;

            case 'modify':
              // 替换内容
              control.insertText(change.content, Word.InsertLocation.replace);
              control.delete(false);
              break;

            case 'format':
              // 应用格式(这里需要根据具体格式需求实现)
              control.delete(false);
              break;
          }

          await context.sync();
          break;
        }
      }

      this.highlightMap.delete(change.id);
    });
  }

  /**
   * 批量应用修改
   */
  async applyChanges(changes: Change[]): Promise<void> {
    for (const change of changes) {
      if (change.status === 'accepted') {
        await this.applyChange(change);
      } else if (change.status === 'rejected') {
        await this.removeHighlight(change.id);
      }
    }
  }

  /**
   * 清除所有高亮
   */
  async clearAllHighlights(): Promise<void> {
    return Word.run(async (context) => {
      const contentControls = context.document.contentControls;
      contentControls.load('items');
      await context.sync();

      for (const control of contentControls.items) {
        control.delete(false);
      }

      await context.sync();
      this.highlightMap.clear();
    });
  }

  /**
   * 获取文档统计信息
   */
  async getDocumentStats(): Promise<{
    characterCount: number;
    wordCount: number;
    paragraphCount: number;
  }> {
    return Word.run(async (context) => {
      const body = context.document.body;

      body.load('text');
      const paragraphs = body.paragraphs;
      paragraphs.load('items');

      await context.sync();

      const text = body.text;
      const words = text.trim().split(/\s+/).filter(w => w.length > 0);

      return {
        characterCount: text.length,
        wordCount: words.length,
        paragraphCount: paragraphs.items.length,
      };
    });
  }
}

// 导出单例
export default new WordAdapter();
