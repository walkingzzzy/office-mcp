import { IDocumentAdapter, ApiResponse, Change } from '../types';
import { HttpClient } from './HttpClient';

export class ExcelAdapter implements IDocumentAdapter {
  private httpClient: HttpClient;

  constructor() {
    this.httpClient = new HttpClient();
  }

  async getContent(): Promise<string> {
    return Excel.run(async (context) => {
      const worksheet = context.workbook.worksheets.getActiveWorksheet();
      const range = worksheet.getUsedRange();
      range.load('values');
      await context.sync();

      return JSON.stringify(range.values);
    });
  }

  async setContent(content: string): Promise<void> {
    const data = JSON.parse(content);
    await Excel.run(async (context) => {
      const worksheet = context.workbook.worksheets.getActiveWorksheet();
      const range = worksheet.getRange('A1').getResizedRange(data.length - 1, data[0].length - 1);
      range.values = data;
      await context.sync();
    });
  }

  async getSelection(): Promise<string> {
    return Excel.run(async (context) => {
      const range = context.workbook.getSelectedRange();
      range.load('values');
      await context.sync();

      return JSON.stringify(range.values);
    });
  }

  async insertContent(content: string): Promise<void> {
    const data = JSON.parse(content);
    await Excel.run(async (context) => {
      const range = context.workbook.getSelectedRange();
      range.values = data;
      await context.sync();
    });
  }

  async readDocument(): Promise<ApiResponse<{ fileId: string }>> {
    try {
      const workbook = await Office.context.document.getFileAsync(Office.FileType.Compressed);
      const blob = new Blob([workbook.value], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });

      const formData = new FormData();
      formData.append('file', blob, 'workbook.xlsx');

      return await this.httpClient.post<{ fileId: string }>('/files/upload', formData);
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        message: '读取Excel文档失败'
      };
    }
  }

  async updateDocument(content: ArrayBuffer | Blob): Promise<void> {
    const blob = content instanceof ArrayBuffer ? new Blob([content]) : content;
    const arrayBuffer = await blob.arrayBuffer();

    await Office.context.document.setFileAsync(arrayBuffer, {
      fileType: Office.FileType.Compressed
    });
  }

  async highlightRange(change: Change): Promise<void> {
    if (!change.position) return;

    await Excel.run(async (context) => {
      const worksheet = context.workbook.worksheets.getActiveWorksheet();
      const range = this.parseExcelRange(change.position);
      const cellRange = worksheet.getRange(range);

      const color = this.getHighlightColor(change.type);
      cellRange.format.fill.color = color;

      if (change.controlId) {
        cellRange.worksheet.comments.add(range, change.description || '', 'AI Assistant');
      }

      await context.sync();
    });
  }

  async removeHighlight(changeId: string): Promise<void> {
    await Excel.run(async (context) => {
      const worksheet = context.workbook.worksheets.getActiveWorksheet();
      const comments = worksheet.comments.load('items');
      await context.sync();

      for (const comment of comments.items) {
        if (comment.content.includes(changeId)) {
          comment.delete();
        }
      }

      await context.sync();
    });
  }

  async applyChange(change: Change): Promise<void> {
    if (!change.position) return;

    await Excel.run(async (context) => {
      const worksheet = context.workbook.worksheets.getActiveWorksheet();
      const range = this.parseExcelRange(change.position);
      const cellRange = worksheet.getRange(range);

      switch (change.type) {
        case 'insert':
          cellRange.values = [[change.content]];
          break;
        case 'modify':
          cellRange.values = [[change.content]];
          break;
        case 'delete':
          cellRange.clear();
          break;
      }

      // 清除高亮
      cellRange.format.fill.clear();

      await context.sync();
    });
  }

  async getCellValue(address: string): Promise<any> {
    return Excel.run(async (context) => {
      const worksheet = context.workbook.worksheets.getActiveWorksheet();
      const range = worksheet.getRange(address);
      range.load('values');
      await context.sync();

      return range.values[0][0];
    });
  }

  async setCellValue(address: string, value: any): Promise<void> {
    await Excel.run(async (context) => {
      const worksheet = context.workbook.worksheets.getActiveWorksheet();
      const range = worksheet.getRange(address);
      range.values = [[value]];
      await context.sync();
    });
  }

  async getWorksheetNames(): Promise<string[]> {
    return Excel.run(async (context) => {
      const worksheets = context.workbook.worksheets;
      worksheets.load('items/name');
      await context.sync();

      return worksheets.items.map(ws => ws.name);
    });
  }

  async switchWorksheet(name: string): Promise<void> {
    await Excel.run(async (context) => {
      const worksheet = context.workbook.worksheets.getItem(name);
      worksheet.activate();
      await context.sync();
    });
  }

  async getUsedRange(): Promise<{ address: string; values: any[][] }> {
    return Excel.run(async (context) => {
      const worksheet = context.workbook.worksheets.getActiveWorksheet();
      const range = worksheet.getUsedRange();
      range.load(['address', 'values']);
      await context.sync();

      return {
        address: range.address,
        values: range.values
      };
    });
  }

  private parseExcelRange(position: { start: number; end: number }): string {
    // 将位置转换为Excel范围格式 (A1:B2)
    const startCol = String.fromCharCode(65 + (position.start % 26));
    const startRow = Math.floor(position.start / 26) + 1;
    const endCol = String.fromCharCode(65 + (position.end % 26));
    const endRow = Math.floor(position.end / 26) + 1;

    return `${startCol}${startRow}:${endCol}${endRow}`;
  }

  private getHighlightColor(type: string): string {
    switch (type) {
      case 'insert': return '#E8F5E9';
      case 'delete': return '#FFEBEE';
      case 'modify': return '#FFF9C4';
      default: return '#E3F2FD';
    }
  }
}

export default ExcelAdapter;