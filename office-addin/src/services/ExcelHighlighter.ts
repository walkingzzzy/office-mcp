import { Change, HighlightOptions } from '../types';

export interface ExcelHighlight {
  id: string;
  range: string;
  type: 'insert' | 'delete' | 'modify' | 'format';
  color: string;
  comment?: string;
  timestamp: number;
}

export class ExcelHighlighter {
  private highlights = new Map<string, ExcelHighlight>();
  private colorMap = {
    insert: '#E8F5E9',
    delete: '#FFEBEE',
    modify: '#FFF9C4',
    format: '#E3F2FD'
  };

  async highlightCell(range: string, change: Change, options?: HighlightOptions): Promise<void> {
    const highlight: ExcelHighlight = {
      id: change.id,
      range,
      type: change.type,
      color: options?.color || this.colorMap[change.type],
      comment: change.description,
      timestamp: Date.now()
    };

    this.highlights.set(change.id, highlight);

    await Excel.run(async (context) => {
      const worksheet = context.workbook.worksheets.getActiveWorksheet();
      const cellRange = worksheet.getRange(range);

      // 设置背景色
      cellRange.format.fill.color = highlight.color;

      // 添加边框
      cellRange.format.borders.getItem('EdgeTop').style = Excel.BorderLineStyle.thin;
      cellRange.format.borders.getItem('EdgeBottom').style = Excel.BorderLineStyle.thin;
      cellRange.format.borders.getItem('EdgeLeft').style = Excel.BorderLineStyle.thin;
      cellRange.format.borders.getItem('EdgeRight').style = Excel.BorderLineStyle.thin;

      // 添加注释
      if (highlight.comment) {
        worksheet.comments.add(range, highlight.comment, 'AI Assistant');
      }

      await context.sync();
    });
  }

  async removeHighlight(changeId: string): Promise<void> {
    const highlight = this.highlights.get(changeId);
    if (!highlight) return;

    await Excel.run(async (context) => {
      const worksheet = context.workbook.worksheets.getActiveWorksheet();
      const cellRange = worksheet.getRange(highlight.range);

      // 清除格式
      cellRange.format.fill.clear();
      cellRange.format.borders.getItem('EdgeTop').style = Excel.BorderLineStyle.none;
      cellRange.format.borders.getItem('EdgeBottom').style = Excel.BorderLineStyle.none;
      cellRange.format.borders.getItem('EdgeLeft').style = Excel.BorderLineStyle.none;
      cellRange.format.borders.getItem('EdgeRight').style = Excel.BorderLineStyle.none;

      // 删除注释
      const comments = worksheet.comments.load('items');
      await context.sync();

      for (const comment of comments.items) {
        if (comment.content.includes(changeId)) {
          comment.delete();
        }
      }

      await context.sync();
    });

    this.highlights.delete(changeId);
  }

  async highlightRange(startRange: string, endRange: string, change: Change): Promise<void> {
    const rangeAddress = `${startRange}:${endRange}`;
    await this.highlightCell(rangeAddress, change);
  }

  async highlightColumn(column: string, change: Change): Promise<void> {
    await Excel.run(async (context) => {
      const worksheet = context.workbook.worksheets.getActiveWorksheet();
      const usedRange = worksheet.getUsedRange();
      usedRange.load('rowCount');
      await context.sync();

      const rangeAddress = `${column}1:${column}${usedRange.rowCount}`;
      await this.highlightCell(rangeAddress, change);
    });
  }

  async highlightRow(row: number, change: Change): Promise<void> {
    await Excel.run(async (context) => {
      const worksheet = context.workbook.worksheets.getActiveWorksheet();
      const usedRange = worksheet.getUsedRange();
      usedRange.load('columnCount');
      await context.sync();

      const endColumn = String.fromCharCode(64 + usedRange.columnCount);
      const rangeAddress = `A${row}:${endColumn}${row}`;
      await this.highlightCell(rangeAddress, change);
    });
  }

  async clearAllHighlights(): Promise<void> {
    await Excel.run(async (context) => {
      const worksheet = context.workbook.worksheets.getActiveWorksheet();
      const usedRange = worksheet.getUsedRange();

      // 清除所有格式
      usedRange.format.fill.clear();
      usedRange.format.borders.getItem('EdgeTop').style = Excel.BorderLineStyle.none;
      usedRange.format.borders.getItem('EdgeBottom').style = Excel.BorderLineStyle.none;
      usedRange.format.borders.getItem('EdgeLeft').style = Excel.BorderLineStyle.none;
      usedRange.format.borders.getItem('EdgeRight').style = Excel.BorderLineStyle.none;

      // 删除所有注释
      const comments = worksheet.comments.load('items');
      await context.sync();

      for (const comment of comments.items) {
        comment.delete();
      }

      await context.sync();
    });

    this.highlights.clear();
  }

  async getHighlightedCells(): Promise<ExcelHighlight[]> {
    return Array.from(this.highlights.values());
  }

  async updateHighlightColor(changeId: string, color: string): Promise<void> {
    const highlight = this.highlights.get(changeId);
    if (!highlight) return;

    highlight.color = color;

    await Excel.run(async (context) => {
      const worksheet = context.workbook.worksheets.getActiveWorksheet();
      const cellRange = worksheet.getRange(highlight.range);
      cellRange.format.fill.color = color;
      await context.sync();
    });
  }

  async blinkHighlight(changeId: string, duration: number = 2000): Promise<void> {
    const highlight = this.highlights.get(changeId);
    if (!highlight) return;

    const originalColor = highlight.color;
    const blinkColor = '#FFFF00'; // 黄色闪烁

    await Excel.run(async (context) => {
      const worksheet = context.workbook.worksheets.getActiveWorksheet();
      const cellRange = worksheet.getRange(highlight.range);

      // 闪烁效果
      const blinkInterval = setInterval(async () => {
        cellRange.format.fill.color = cellRange.format.fill.color === originalColor ? blinkColor : originalColor;
        await context.sync();
      }, 200);

      // 停止闪烁
      setTimeout(() => {
        clearInterval(blinkInterval);
        cellRange.format.fill.color = originalColor;
        context.sync();
      }, duration);
    });
  }

  async addConditionalHighlight(range: string, condition: string, color: string): Promise<string> {
    const highlightId = `conditional_${Date.now()}`;

    await Excel.run(async (context) => {
      const worksheet = context.workbook.worksheets.getActiveWorksheet();
      const cellRange = worksheet.getRange(range);

      const conditionalFormat = cellRange.conditionalFormats.add(Excel.ConditionalFormatType.custom);
      conditionalFormat.custom.rule.formula = condition;
      conditionalFormat.custom.format.fill.color = color;

      await context.sync();
    });

    return highlightId;
  }

  async removeConditionalHighlight(range: string): Promise<void> {
    await Excel.run(async (context) => {
      const worksheet = context.workbook.worksheets.getActiveWorksheet();
      const cellRange = worksheet.getRange(range);
      cellRange.conditionalFormats.clearAll();
      await context.sync();
    });
  }

  getHighlightStats(): {
    total: number;
    byType: Record<string, number>;
    oldest: number | null;
    newest: number | null;
  } {
    const highlights = Array.from(this.highlights.values());
    const byType: Record<string, number> = {};

    for (const highlight of highlights) {
      byType[highlight.type] = (byType[highlight.type] || 0) + 1;
    }

    const timestamps = highlights.map(h => h.timestamp);

    return {
      total: highlights.length,
      byType,
      oldest: timestamps.length > 0 ? Math.min(...timestamps) : null,
      newest: timestamps.length > 0 ? Math.max(...timestamps) : null
    };
  }

  async exportHighlights(): Promise<string> {
    const highlights = Array.from(this.highlights.values());
    return JSON.stringify(highlights, null, 2);
  }

  async importHighlights(data: string): Promise<void> {
    const highlights: ExcelHighlight[] = JSON.parse(data);

    for (const highlight of highlights) {
      this.highlights.set(highlight.id, highlight);

      // 重新应用高亮
      await Excel.run(async (context) => {
        const worksheet = context.workbook.worksheets.getActiveWorksheet();
        const cellRange = worksheet.getRange(highlight.range);
        cellRange.format.fill.color = highlight.color;
        await context.sync();
      });
    }
  }
}

export default ExcelHighlighter;