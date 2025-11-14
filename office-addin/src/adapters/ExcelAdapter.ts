import { IDocumentAdapter, DocumentData, DocumentType } from './IDocumentAdapter';

export class ExcelAdapter implements IDocumentAdapter {
  getDocumentType(): DocumentType {
    return 'excel';
  }

  async getDocumentData(): Promise<DocumentData> {
    return new Promise((resolve, reject) => {
      Office.context.document.getFileAsync(
        Office.FileType.Compressed,
        { sliceSize: 65536 },
        async (result) => {
          if (result.status === Office.AsyncResultStatus.Succeeded) {
            try {
              const file = result.value;
              const content = await this.readFileSlices(file);

              resolve({
                content,
                type: 'excel',
                metadata: {
                  size: file.size,
                  lastModified: Date.now()
                }
              });

              file.closeAsync();
            } catch (error) {
              reject(error);
            }
          } else {
            reject(new Error(result.error?.message || '读取Excel文档失败'));
          }
        }
      );
    });
  }

  async updateDocument(data: ArrayBuffer): Promise<void> {
    return Excel.run(async (context) => {
      // Excel特定的更新逻辑
      const workbook = context.workbook;

      // 这里需要根据具体的数据格式来更新工作簿
      // 简化实现：清空当前工作表并重新加载数据
      const worksheet = workbook.worksheets.getActiveWorksheet();
      worksheet.getUsedRange()?.clear();

      await context.sync();
    });
  }

  validateDocument(data: ArrayBuffer): boolean {
    // 检查Excel文档的魔数标识
    const view = new Uint8Array(data.slice(0, 4));
    return view[0] === 0x50 && view[1] === 0x4B; // ZIP格式标识
  }

  async getMetadata(): Promise<Record<string, any>> {
    return Excel.run(async (context) => {
      const workbook = context.workbook;
      const properties = workbook.properties;

      properties.load(['title', 'subject', 'author', 'comments']);
      await context.sync();

      return {
        title: properties.title,
        subject: properties.subject,
        author: properties.author,
        comments: properties.comments
      };
    });
  }

  private async readFileSlices(file: Office.File): Promise<ArrayBuffer> {
    const slices: ArrayBuffer[] = [];

    for (let i = 0; i < file.sliceCount; i++) {
      const slice = await this.getSlice(file, i);
      slices.push(slice);
    }

    return this.concatenateArrayBuffers(slices);
  }

  private getSlice(file: Office.File, index: number): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      file.getSliceAsync(index, (result) => {
        if (result.status === Office.AsyncResultStatus.Succeeded) {
          resolve(result.value.data);
        } else {
          reject(new Error('读取文件片段失败'));
        }
      });
    });
  }

  private concatenateArrayBuffers(buffers: ArrayBuffer[]): ArrayBuffer {
    const totalLength = buffers.reduce((sum, buf) => sum + buf.byteLength, 0);
    const result = new Uint8Array(totalLength);
    let offset = 0;

    for (const buffer of buffers) {
      result.set(new Uint8Array(buffer), offset);
      offset += buffer.byteLength;
    }

    return result.buffer;
  }
}