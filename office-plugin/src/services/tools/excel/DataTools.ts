/**
 * Excel 数据分析工具
 * 包含 15 个数据分析相关工具
 */

import type { FunctionResult } from '../../ai/types'
import type { ToolDefinition, ToolResult } from '../types'

/**
 * 导入 CSV
 */
async function excelImportCsv(args: Record<string, any>): Promise<FunctionResult> {
  const { csvData, targetAddress = 'A1', delimiter = ',' } = args

  if (!csvData) {
    return { success: false, message: 'csvData 参数不能为空' }
  }

  return new Promise((resolve) => {
    Excel.run(async (context) => {
      const sheet = context.workbook.worksheets.getActiveWorksheet()
      
      // 解析 CSV 数据
      const rows = csvData.split('\n').filter((row: string) => row.trim())
      const data = rows.map((row: string) => row.split(delimiter))
      
      // 写入数据
      const range = sheet.getRange(targetAddress).getResizedRange(data.length - 1, data[0].length - 1)
      range.values = data
      
      await context.sync()

      resolve({
        success: true,
        message: 'CSV 数据已导入',
        data: { targetAddress, rowCount: data.length, colCount: data[0].length }
      })
    }).catch((error) => {
      resolve({
        success: false,
        message: `导入 CSV 失败: ${error instanceof Error ? error.message : String(error)}`,
        error
      })
    })
  })
}

/**
 * 导出 CSV
 */
async function excelExportCsv(args: Record<string, any>): Promise<FunctionResult> {
  const { sourceAddress, delimiter = ',' } = args

  if (!sourceAddress) {
    return { success: false, message: 'sourceAddress 参数不能为空' }
  }

  return new Promise((resolve) => {
    Excel.run(async (context) => {
      const sheet = context.workbook.worksheets.getActiveWorksheet()
      const range = sheet.getRange(sourceAddress)
      range.load('values')
      await context.sync()

      const csvData = range.values.map(row => row.join(delimiter)).join('\n')

      resolve({
        success: true,
        message: 'CSV 数据已导出',
        data: { csvData, rowCount: range.values.length }
      })
    }).catch((error) => {
      resolve({
        success: false,
        message: `导出 CSV 失败: ${error instanceof Error ? error.message : String(error)}`,
        error
      })
    })
  })
}

/**
 * 导入 JSON
 */
async function excelImportJson(args: Record<string, any>): Promise<FunctionResult> {
  const { jsonData, targetAddress = 'A1', includeHeaders = true } = args

  if (!jsonData) {
    return { success: false, message: 'jsonData 参数不能为空' }
  }

  return new Promise((resolve) => {
    Excel.run(async (context) => {
      const sheet = context.workbook.worksheets.getActiveWorksheet()
      
      // 解析 JSON 数据
      let data: any[]
      try {
        data = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData
      } catch (e) {
        resolve({ success: false, message: 'JSON 格式无效' })
        return
      }

      if (!Array.isArray(data) || data.length === 0) {
        resolve({ success: false, message: 'JSON 数据必须是非空数组' })
        return
      }

      // 获取所有键作为列头
      const headers = Object.keys(data[0])
      const rows: any[][] = []
      
      if (includeHeaders) {
        rows.push(headers)
      }
      
      for (const item of data) {
        rows.push(headers.map(h => item[h] ?? ''))
      }

      // 写入数据
      const range = sheet.getRange(targetAddress).getResizedRange(rows.length - 1, rows[0].length - 1)
      range.values = rows
      
      await context.sync()

      resolve({
        success: true,
        message: 'JSON 数据已导入',
        data: { targetAddress, rowCount: rows.length, colCount: headers.length }
      })
    }).catch((error) => {
      resolve({
        success: false,
        message: `导入 JSON 失败: ${error instanceof Error ? error.message : String(error)}`,
        error
      })
    })
  })
}

/**
 * 导出 JSON
 */
async function excelExportJson(args: Record<string, any>): Promise<FunctionResult> {
  const { sourceAddress, hasHeaders = true } = args

  if (!sourceAddress) {
    return { success: false, message: 'sourceAddress 参数不能为空' }
  }

  return new Promise((resolve) => {
    Excel.run(async (context) => {
      const sheet = context.workbook.worksheets.getActiveWorksheet()
      const range = sheet.getRange(sourceAddress)
      range.load('values')
      await context.sync()

      const values = range.values
      let jsonData: any[]

      if (hasHeaders && values.length > 1) {
        const headers = values[0]
        jsonData = values.slice(1).map(row => {
          const obj: Record<string, any> = {}
          headers.forEach((h, i) => {
            obj[String(h)] = row[i]
          })
          return obj
        })
      } else {
        jsonData = values
      }

      resolve({
        success: true,
        message: 'JSON 数据已导出',
        data: { jsonData, rowCount: jsonData.length }
      })
    }).catch((error) => {
      resolve({
        success: false,
        message: `导出 JSON 失败: ${error instanceof Error ? error.message : String(error)}`,
        error
      })
    })
  })
}

/**
 * 导入 XML
 */
async function excelImportXml(args: Record<string, any>): Promise<FunctionResult> {
  const { xmlData, targetAddress } = args

  // XML 导入需要更复杂的解析逻辑
  return {
    success: false,
    message: 'excel_import_xml: XML 导入功能需要服务器端 XML 解析支持，暂未实现。建议先将 XML 转换为 JSON 或 CSV 格式。',
    data: { suggestion: '使用 excel_import_json 或 excel_import_csv 作为替代' }
  }
}

/**
 * 导出 XML
 */
async function excelExportXml(args: Record<string, any>): Promise<FunctionResult> {
  const { sourceAddress, rootElement = 'data', rowElement = 'row' } = args

  if (!sourceAddress) {
    return { success: false, message: 'sourceAddress 参数不能为空' }
  }

  return new Promise((resolve) => {
    Excel.run(async (context) => {
      const sheet = context.workbook.worksheets.getActiveWorksheet()
      const range = sheet.getRange(sourceAddress)
      range.load('values')
      await context.sync()

      const values = range.values
      const headers = values[0]
      
      let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<${rootElement}>\n`
      
      for (let i = 1; i < values.length; i++) {
        xml += `  <${rowElement}>\n`
        for (let j = 0; j < headers.length; j++) {
          const tag = String(headers[j]).replace(/\s+/g, '_')
          xml += `    <${tag}>${values[i][j]}</${tag}>\n`
        }
        xml += `  </${rowElement}>\n`
      }
      
      xml += `</${rootElement}>`

      resolve({
        success: true,
        message: 'XML 数据已导出',
        data: { xmlData: xml, rowCount: values.length - 1 }
      })
    }).catch((error) => {
      resolve({
        success: false,
        message: `导出 XML 失败: ${error instanceof Error ? error.message : String(error)}`,
        error
      })
    })
  })
}

/**
 * 连接数据库
 */
async function excelConnectDatabase(args: Record<string, any>): Promise<FunctionResult> {
  return {
    success: false,
    message: 'excel_connect_database: 数据库连接功能需要后端服务支持，暂未实现。请使用 Excel 的"数据-获取数据"功能。',
    data: args
  }
}

/**
 * 刷新数据
 */
async function excelRefreshData(args: Record<string, any>): Promise<FunctionResult> {
  return new Promise((resolve) => {
    Excel.run(async (context) => {
      // 刷新所有数据连接（使用 application.calculate 作为替代）
      // refreshAllDataConnections 在某些版本不可用
      context.application.calculate(Excel.CalculationType.full)
      await context.sync()

      resolve({
        success: true,
        message: '数据已刷新'
      })
    }).catch((error) => {
      resolve({
        success: false,
        message: `刷新数据失败: ${error instanceof Error ? error.message : String(error)}`,
        error
      })
    })
  })
}

/**
 * 分组数据
 */
async function excelGroupData(args: Record<string, any>): Promise<FunctionResult> {
  const { address, groupBy = 'rows' } = args

  if (!address) {
    return { success: false, message: 'address 参数不能为空' }
  }

  return new Promise((resolve) => {
    Excel.run(async (context) => {
      const sheet = context.workbook.worksheets.getActiveWorksheet()
      const range = sheet.getRange(address)
      
      if (groupBy === 'rows') {
        range.group(Excel.GroupOption.byRows)
      } else {
        range.group(Excel.GroupOption.byColumns)
      }
      
      await context.sync()

      resolve({
        success: true,
        message: '数据已分组',
        data: { address, groupBy }
      })
    }).catch((error) => {
      resolve({
        success: false,
        message: `分组数据失败: ${error instanceof Error ? error.message : String(error)}`,
        error
      })
    })
  })
}

/**
 * 相关性分析
 */
async function excelCorrelation(args: Record<string, any>): Promise<FunctionResult> {
  const { range1, range2, targetAddress } = args

  if (!range1 || !range2) {
    return { success: false, message: 'range1 和 range2 参数不能为空' }
  }

  return new Promise((resolve) => {
    Excel.run(async (context) => {
      const sheet = context.workbook.worksheets.getActiveWorksheet()
      const target = sheet.getRange(targetAddress || 'A1')
      
      // 使用 CORREL 函数计算相关系数
      target.formulas = [[`=CORREL(${range1}, ${range2})`]]
      
      await context.sync()

      resolve({
        success: true,
        message: '相关性分析公式已插入',
        data: { range1, range2, targetAddress }
      })
    }).catch((error) => {
      resolve({
        success: false,
        message: `相关性分析失败: ${error instanceof Error ? error.message : String(error)}`,
        error
      })
    })
  })
}

/**
 * 回归分析
 */
async function excelRegression(args: Record<string, any>): Promise<FunctionResult> {
  const { xRange, yRange, targetAddress } = args

  if (!xRange || !yRange) {
    return { success: false, message: 'xRange 和 yRange 参数不能为空' }
  }

  return new Promise((resolve) => {
    Excel.run(async (context) => {
      const sheet = context.workbook.worksheets.getActiveWorksheet()
      const target = sheet.getRange(targetAddress || 'A1')
      
      // 使用 LINEST 函数进行线性回归
      target.formulas = [[`=LINEST(${yRange}, ${xRange}, TRUE, TRUE)`]]
      
      await context.sync()

      resolve({
        success: true,
        message: '回归分析公式已插入（使用 LINEST）',
        data: { xRange, yRange, targetAddress }
      })
    }).catch((error) => {
      resolve({
        success: false,
        message: `回归分析失败: ${error instanceof Error ? error.message : String(error)}`,
        error
      })
    })
  })
}

/**
 * 直方图
 */
async function excelHistogram(args: Record<string, any>): Promise<FunctionResult> {
  const { sourceAddress, binRange } = args

  if (!sourceAddress) {
    return { success: false, message: 'sourceAddress 参数不能为空' }
  }

  return new Promise((resolve) => {
    Excel.run(async (context) => {
      const sheet = context.workbook.worksheets.getActiveWorksheet()
      const sourceRange = sheet.getRange(sourceAddress)
      
      // 创建直方图（使用 histogram 图表类型）
      const chart = sheet.charts.add(Excel.ChartType.histogram, sourceRange, Excel.ChartSeriesBy.auto)
      chart.title.text = '直方图'
      chart.setPosition('E1', 'L15')
      
      await context.sync()

      resolve({
        success: true,
        message: '直方图已创建',
        data: { sourceAddress }
      })
    }).catch((error) => {
      resolve({
        success: false,
        message: `创建直方图失败: ${error instanceof Error ? error.message : String(error)}`,
        error
      })
    })
  })
}

/**
 * 预测
 */
async function excelForecast(args: Record<string, any>): Promise<FunctionResult> {
  const { targetX, knownYs, knownXs, targetAddress } = args

  if (!targetX || !knownYs || !knownXs) {
    return { success: false, message: '请提供 targetX、knownYs 和 knownXs 参数' }
  }

  return new Promise((resolve) => {
    Excel.run(async (context) => {
      const sheet = context.workbook.worksheets.getActiveWorksheet()
      const target = sheet.getRange(targetAddress || 'A1')
      
      // 使用 FORECAST 函数
      target.formulas = [[`=FORECAST(${targetX}, ${knownYs}, ${knownXs})`]]
      
      await context.sync()

      resolve({
        success: true,
        message: '预测公式已插入',
        data: { targetX, targetAddress }
      })
    }).catch((error) => {
      resolve({
        success: false,
        message: `预测失败: ${error instanceof Error ? error.message : String(error)}`,
        error
      })
    })
  })
}

/**
 * 数据透视
 */
async function excelPivotData(args: Record<string, any>): Promise<FunctionResult> {
  const { sourceAddress, rowField, columnField, valueField } = args

  if (!sourceAddress) {
    return { success: false, message: 'sourceAddress 参数不能为空' }
  }

  // 数据透视的复杂操作
  return {
    success: false,
    message: 'excel_pivot_data: 数据透视操作较复杂，建议使用 excel_insert_pivot_table 创建数据透视表，然后在 Excel 中手动配置字段。',
    data: { sourceAddress, rowField, columnField, valueField }
  }
}

/**
 * T 检验
 */
async function excelTTest(args: Record<string, any>): Promise<FunctionResult> {
  const { array1, array2, tails = 2, type = 1, targetAddress } = args

  if (!array1 || !array2) {
    return { success: false, message: 'array1 和 array2 参数不能为空' }
  }

  return new Promise((resolve) => {
    Excel.run(async (context) => {
      const sheet = context.workbook.worksheets.getActiveWorksheet()
      const target = sheet.getRange(targetAddress || 'A1')
      
      // 使用 T.TEST 函数
      target.formulas = [[`=T.TEST(${array1}, ${array2}, ${tails}, ${type})`]]
      
      await context.sync()

      resolve({
        success: true,
        message: 'T 检验公式已插入',
        data: { array1, array2, tails, type, targetAddress }
      })
    }).catch((error) => {
      resolve({
        success: false,
        message: `T 检验失败: ${error instanceof Error ? error.message : String(error)}`,
        error
      })
    })
  })
}

/**
 * 导出数据工具定义
 */
export const dataTools: ToolDefinition[] = [
  { name: 'excel_import_csv', handler: excelImportCsv, category: 'read', description: '导入 CSV' },
  { name: 'excel_export_csv', handler: excelExportCsv, category: 'read', description: '导出 CSV' },
  { name: 'excel_import_json', handler: excelImportJson, category: 'read', description: '导入 JSON' },
  { name: 'excel_export_json', handler: excelExportJson, category: 'read', description: '导出 JSON' },
  { name: 'excel_import_xml', handler: excelImportXml, category: 'read', description: '导入 XML' },
  { name: 'excel_export_xml', handler: excelExportXml, category: 'read', description: '导出 XML' },
  { name: 'excel_connect_database', handler: excelConnectDatabase, category: 'read', description: '连接数据库' },
  { name: 'excel_refresh_data', handler: excelRefreshData, category: 'read', description: '刷新数据' },
  { name: 'excel_group_data', handler: excelGroupData, category: 'read', description: '分组数据' },
  { name: 'excel_correlation', handler: excelCorrelation, category: 'read', description: '相关性分析' },
  { name: 'excel_regression', handler: excelRegression, category: 'read', description: '回归分析' },
  { name: 'excel_histogram', handler: excelHistogram, category: 'read', description: '直方图' },
  { name: 'excel_forecast', handler: excelForecast, category: 'read', description: '预测' },
  { name: 'excel_pivot_data', handler: excelPivotData, category: 'read', description: '数据透视' },
  { name: 'excel_t_test', handler: excelTTest, category: 'read', description: 'T 检验' }
]
