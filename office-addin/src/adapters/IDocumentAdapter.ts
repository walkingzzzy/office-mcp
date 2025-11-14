export type DocumentType = 'word' | 'excel' | 'powerpoint';

export interface DocumentData {
  content: ArrayBuffer;
  type: DocumentType;
  metadata?: {
    filename?: string;
    size?: number;
    lastModified?: number;
  };
}

export interface IDocumentAdapter {
  /**
   * 获取当前文档数据
   */
  getDocumentData(): Promise<DocumentData>;

  /**
   * 更新文档内容
   */
  updateDocument(data: ArrayBuffer): Promise<void>;

  /**
   * 获取文档类型
   */
  getDocumentType(): DocumentType;

  /**
   * 验证文档格式
   */
  validateDocument(data: ArrayBuffer): boolean;

  /**
   * 获取文档元数据
   */
  getMetadata(): Promise<Record<string, any>>;
}