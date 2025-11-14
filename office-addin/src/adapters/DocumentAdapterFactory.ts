import { IDocumentAdapter, DocumentType } from './IDocumentAdapter';
import { WordAdapter } from './WordAdapter';
import { ExcelAdapter } from './ExcelAdapter';
import { PowerPointAdapter } from './PowerPointAdapter';

export class DocumentAdapterFactory {
  static createAdapter(): IDocumentAdapter {
    const hostType = Office.context.host;

    switch (hostType) {
      case Office.HostType.Word:
        return new WordAdapter();
      case Office.HostType.Excel:
        return new ExcelAdapter();
      case Office.HostType.PowerPoint:
        return new PowerPointAdapter();
      default:
        throw new Error(`不支持的Office应用类型: ${hostType}`);
    }
  }

  static getDocumentType(): DocumentType {
    const hostType = Office.context.host;

    switch (hostType) {
      case Office.HostType.Word:
        return 'word';
      case Office.HostType.Excel:
        return 'excel';
      case Office.HostType.PowerPoint:
        return 'powerpoint';
      default:
        throw new Error(`不支持的Office应用类型: ${hostType}`);
    }
  }
}