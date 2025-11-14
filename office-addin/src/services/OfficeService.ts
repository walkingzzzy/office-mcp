import { DocumentAdapterFactory } from '../adapters/DocumentAdapterFactory';
import { DocumentData } from '../adapters/IDocumentAdapter';

export class OfficeService {
  private adapter = DocumentAdapterFactory.createAdapter();

  /**
   * 获取当前文档数据
   */
  async getDocumentData(): Promise<DocumentData> {
    return this.adapter.getDocumentData();
  }

  /**
   * 更新文档内容
   */
  async updateDocument(data: ArrayBuffer): Promise<void> {
    if (!this.adapter.validateDocument(data)) {
      throw new Error('无效的文档格式');
    }
    return this.adapter.updateDocument(data);
  }

  /**
   * 获取文档类型
   */
  getDocumentType() {
    return this.adapter.getDocumentType();
  }

  /**
   * 获取文档元数据
   */
  async getMetadata() {
    return this.adapter.getMetadata();
  }

  /**
   * 检查Office是否已初始化
   */
  isOfficeInitialized(): boolean {
    return typeof Office !== 'undefined' && Office.context !== null;
  }

  /**
   * 等待Office初始化完成
   */
  async waitForOfficeInitialization(): Promise<void> {
    return new Promise((resolve) => {
      if (this.isOfficeInitialized()) {
        resolve();
      } else {
        Office.onReady(() => {
          resolve();
        });
      }
    });
  }
}