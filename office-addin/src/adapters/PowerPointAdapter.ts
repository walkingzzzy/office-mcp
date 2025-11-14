import { IDocumentAdapter, DocumentData, DocumentType } from './IDocumentAdapter';

export class PowerPointAdapter implements IDocumentAdapter {
  getDocumentType(): DocumentType {
    return 'powerpoint';
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
                type: 'powerpoint',
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
            reject(new Error(result.error?.message || '读取PowerPoint文档失败'));
          }
        }
      );
    });
  }

  async updateDocument(data: ArrayBuffer): Promise<void> {
    return PowerPoint.run(async (context) => {
      // PowerPoint特定的更新逻辑
      const presentation = context.presentation;

      // 简化实现：这里需要根据具体需求来更新演示文稿
      // 可以添加新幻灯片、更新内容等
      await context.sync();
    });
  }

  validateDocument(data: ArrayBuffer): boolean {
    // 检查PowerPoint文档的魔数标识
    const view = new Uint8Array(data.slice(0, 4));
    return view[0] === 0x50 && view[1] === 0x4B; // ZIP格式标识
  }

  async getMetadata(): Promise<Record<string, any>> {
    return PowerPoint.run(async (context) => {
      const presentation = context.presentation;
      const properties = presentation.properties;

      properties.load(['title', 'subject', 'author']);
      await context.sync();

      return {
        title: properties.title,
        subject: properties.subject,
        author: properties.author
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