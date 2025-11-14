import { IDocumentAdapter } from '../types';

/**
 * Word API封装
 */
export class WordAPI implements IDocumentAdapter {
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
      selection.insertText(content, Word.InsertLocation.end);
      await context.sync();
    });
  }

  /**
   * 插入段落
   */
  async insertParagraph(text: string, location: 'Start' | 'End' = 'End'): Promise<void> {
    return Word.run(async (context) => {
      const body = context.document.body;
      body.insertParagraph(
        text,
        location === 'Start' ? Word.InsertLocation.start : Word.InsertLocation.end
      );
      await context.sync();
    });
  }

  /**
   * 创建ContentControl高亮
   */
  async createHighlight(
    startIndex: number,
    endIndex: number,
    color: string
  ): Promise<void> {
    return Word.run(async (context) => {
      const body = context.document.body;
      const range = body.getRange();
      range.load('text');
      await context.sync();

      // 创建ContentControl
      const highlightRange = body.getRange(Word.RangeLocation.start).getRange();
      const contentControl = highlightRange.insertContentControl();
      contentControl.title = 'AIHighlight';
      contentControl.appearance = Word.ContentControlAppearance.boundingBox;
      contentControl.color = color;

      await context.sync();
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

      contentControls.items.forEach((cc) => {
        cc.delete(false);
      });

      await context.sync();
    });
  }

  /**
   * 获取文档文件
   */
  async getDocumentFile(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      Office.context.document.getFileAsync(
        Office.FileType.Compressed,
        { sliceSize: 4194304 },
        (result) => {
          if (result.status === Office.AsyncResultStatus.Succeeded) {
            const file = result.value;
            const sliceCount = file.sliceCount;
            const slices: any[] = [];

            const getSlice = (sliceIndex: number) => {
              file.getSliceAsync(sliceIndex, (sliceResult) => {
                if (sliceResult.status === Office.AsyncResultStatus.Succeeded) {
                  slices[sliceIndex] = sliceResult.value.data;

                  if (sliceIndex < sliceCount - 1) {
                    getSlice(sliceIndex + 1);
                  } else {
                    file.closeAsync();
                    const blob = new Blob(slices, {
                      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                    });
                    resolve(blob);
                  }
                } else {
                  file.closeAsync();
                  reject(new Error(sliceResult.error.message));
                }
              });
            };

            getSlice(0);
          } else {
            reject(new Error(result.error.message));
          }
        }
      );
    });
  }
}

export default new WordAPI();
