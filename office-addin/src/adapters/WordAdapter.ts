import { IDocumentAdapter, DocumentData, DocumentType } from './IDocumentAdapter';

export class WordAdapter implements IDocumentAdapter {
  getDocumentType(): DocumentType {
    return 'word';
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
                type: 'word',
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
            reject(new Error(result.error?.message || '读取Word文档失败'));
          }
        }
      );
    });
  }

  async updateDocument(data: ArrayBuffer): Promise<void> {
    return new Promise((resolve, reject) => {
      const base64Data = this.arrayBufferToBase64(data);

      Office.context.document.setSelectedDataAsync(
        base64Data,
        { coercionType: Office.CoercionType.Ooxml },
        (result) => {
          if (result.status === Office.AsyncResultStatus.Succeeded) {
            resolve();
          } else {
            reject(new Error(result.error?.message || '更新Word文档失败'));
          }
        }
      );
    });
  }

  validateDocument(data: ArrayBuffer): boolean {
    // 检查Word文档的魔数标识
    const view = new Uint8Array(data.slice(0, 4));
    return view[0] === 0x50 && view[1] === 0x4B; // ZIP格式标识
  }

  async getMetadata(): Promise<Record<string, any>> {
    return new Promise((resolve) => {
      Office.context.document.properties.getAsync((result) => {
        if (result.status === Office.AsyncResultStatus.Succeeded) {
          resolve(result.value);
        } else {
          resolve({});
        }
      });
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

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }
}