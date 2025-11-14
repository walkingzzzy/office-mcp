import { IDocumentAdapter } from '../types';
import WordAdapter from './WordAdapter';
import ExcelAPI from './ExcelAPI';
import PowerPointAPI from './PowerPointAPI';

/**
 * 文档适配器工厂
 * 根据Office应用类型返回相应的API实例
 */
export class DocumentAdapter {
  private static instance: IDocumentAdapter | null = null;

  /**
   * 获取当前Office应用的文档适配器
   */
  static getInstance(): IDocumentAdapter {
    if (this.instance) {
      return this.instance;
    }

    const hostType = Office.context.host;

    switch (hostType) {
      case Office.HostType.Word:
        this.instance = WordAdapter;
        break;
      case Office.HostType.Excel:
        this.instance = ExcelAPI;
        break;
      case Office.HostType.PowerPoint:
        this.instance = PowerPointAPI;
        break;
      default:
        throw new Error(`不支持的Office应用类型: ${hostType}`);
    }

    return this.instance;
  }

  /**
   * 检查是否支持当前Office应用
   */
  static isSupported(): boolean {
    const hostType = Office.context.host;
    return (
      hostType === Office.HostType.Word ||
      hostType === Office.HostType.Excel ||
      hostType === Office.HostType.PowerPoint
    );
  }

  /**
   * 获取当前Office应用名称
   */
  static getHostName(): string {
    const hostType = Office.context.host;
    switch (hostType) {
      case Office.HostType.Word:
        return 'Word';
      case Office.HostType.Excel:
        return 'Excel';
      case Office.HostType.PowerPoint:
        return 'PowerPoint';
      default:
        return '未知';
    }
  }
}

export default DocumentAdapter;
