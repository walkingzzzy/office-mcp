import { IDocumentAdapter } from '../types';

/**
 * Excel API封装
 */
export class ExcelAPI implements IDocumentAdapter {
  /**
   * 获取文档内容(活动工作表的使用范围)
   */
  async getContent(): Promise<string> {
    return Excel.run(async (context) => {
      const sheet = context.workbook.worksheets.getActiveWorksheet();
      const usedRange = sheet.getUsedRange();
      usedRange.load('values, address');
      await context.sync();

      return JSON.stringify({
        address: usedRange.address,
        values: usedRange.values,
      });
    });
  }

  /**
   * 设置文档内容(不推荐,Excel应该操作特定范围)
   */
  async setContent(content: string): Promise<void> {
    throw new Error('Excel不支持setContent,请使用setRangeValues');
  }

  /**
   * 获取选中的内容
   */
  async getSelection(): Promise<string> {
    return Excel.run(async (context) => {
      const range = context.workbook.getSelectedRange();
      range.load('values, address');
      await context.sync();

      return JSON.stringify({
        address: range.address,
        values: range.values,
      });
    });
  }

  /**
   * 插入内容到选中区域
   */
  async insertContent(content: string): Promise<void> {
    return Excel.run(async (context) => {
      const range = context.workbook.getSelectedRange();
      range.values = [[content]];
      await context.sync();
    });
  }

  /**
   * 设置范围的值
   */
  async setRangeValues(address: string, values: any[][]): Promise<void> {
    return Excel.run(async (context) => {
      const sheet = context.workbook.worksheets.getActiveWorksheet();
      const range = sheet.getRange(address);
      range.values = values;
      await context.sync();
    });
  }

  /**
   * 获取范围的值
   */
  async getRangeValues(address: string): Promise<any[][]> {
    return Excel.run(async (context) => {
      const sheet = context.workbook.worksheets.getActiveWorksheet();
      const range = sheet.getRange(address);
      range.load('values');
      await context.sync();
      return range.values;
    });
  }

  /**
   * 创建条件格式高亮
   */
  async createHighlight(address: string, color: string): Promise<void> {
    return Excel.run(async (context) => {
      const sheet = context.workbook.worksheets.getActiveWorksheet();
      const range = sheet.getRange(address);

      // 使用条件格式创建高亮
      const conditionalFormat = range.conditionalFormats.add(
        Excel.ConditionalFormatType.custom
      );
      conditionalFormat.custom.format.fill.color = color;
      conditionalFormat.custom.rule.formula = '=TRUE';

      await context.sync();
    });
  }

  /**
   * 移除所有条件格式
   */
  async removeAllHighlights(): Promise<void> {
    return Excel.run(async (context) => {
      const sheet = context.workbook.worksheets.getActiveWorksheet();
      const usedRange = sheet.getUsedRange();
      usedRange.conditionalFormats.clearAll();
      await context.sync();
    });
  }

  /**
   * 插入图表
   */
  async insertChart(
    dataRange: string,
    chartType: Excel.ChartType = Excel.ChartType.columnClustered
  ): Promise<void> {
    return Excel.run(async (context) => {
      const sheet = context.workbook.worksheets.getActiveWorksheet();
      const range = sheet.getRange(dataRange);
      const chart = sheet.charts.add(chartType, range, Excel.ChartSeriesBy.auto);
      chart.title.text = '数据图表';
      await context.sync();
    });
  }

  /**
   * 获取工作簿文件
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
                      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
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

export default new ExcelAPI();
