/**
 * excel_data - 数据导入导出与分析
 * 合并 15 个原工具
 */

import { sendIPCCommand } from '@office-mcp/shared'
import type { ToolDefinition } from './types.js'
import { validateAction, unsupportedActionError } from './types.js'

const SUPPORTED_ACTIONS = [
  'importCsv', 'exportCsv', 'importJson', 'exportJson',
  'importXml', 'exportXml', 'connectDatabase', 'refresh',
  'group', 'correlation', 'regression', 'histogram',
  'forecast', 'pivot', 'tTest'
] as const

type DataAction = typeof SUPPORTED_ACTIONS[number]

export const excelDataTool: ToolDefinition = {
  name: 'excel_data',
  description: `数据导入导出与分析工具。支持的操作(action):
- importCsv: 导入CSV (需要 filePath, 可选 range, delimiter)
- exportCsv: 导出CSV (需要 range, filePath)
- importJson: 导入JSON (需要 filePath, 可选 range)
- exportJson: 导出JSON (需要 range, filePath)
- importXml: 导入XML (需要 filePath)
- exportXml: 导出XML (需要 range, filePath)
- connectDatabase: 连接数据库 (需要 connectionString)
- refresh: 刷新数据
- group: 分组数据 (需要 range, groupBy)
- correlation: 相关性分析 (需要 range1, range2)
- regression: 回归分析 (需要 xRange, yRange)
- histogram: 直方图分析 (需要 range)
- forecast: 预测分析 (需要 range, periods)
- pivot: 数据透视 (需要 range)
- tTest: T检验 (需要 range1, range2)`,
  category: 'data',
  application: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        enum: SUPPORTED_ACTIONS,
        description: '要执行的操作'
      },
      filePath: {
        type: 'string',
        description: '[import/export] 文件路径'
      },
      range: {
        type: 'string',
        description: '[多个操作] 数据区域'
      },
      delimiter: {
        type: 'string',
        description: '[importCsv] 分隔符',
        default: ','
      },
      connectionString: {
        type: 'string',
        description: '[connectDatabase] 连接字符串'
      },
      groupBy: {
        type: 'string',
        description: '[group] 分组字段'
      },
      range1: {
        type: 'string',
        description: '[correlation/tTest] 第一个数据区域'
      },
      range2: {
        type: 'string',
        description: '[correlation/tTest] 第二个数据区域'
      },
      xRange: {
        type: 'string',
        description: '[regression] X数据区域'
      },
      yRange: {
        type: 'string',
        description: '[regression] Y数据区域'
      },
      periods: {
        type: 'number',
        description: '[forecast] 预测期数'
      }
    },
    required: ['action']
  },
  metadata: {
    version: '2.0.0',
    priority: 'P0',
    intentKeywords: [
      '导入', '导出', 'CSV', 'JSON', 'XML', '数据库',
      '分组', '相关性', '回归', '直方图', '预测', 'T检验'
    ],
    mergedTools: [
      'excel_import_csv', 'excel_export_csv', 'excel_import_json',
      'excel_export_json', 'excel_import_xml', 'excel_export_xml',
      'excel_connect_database', 'excel_refresh_data', 'excel_group_data',
      'excel_correlation', 'excel_regression', 'excel_histogram',
      'excel_forecast', 'excel_pivot_data', 'excel_t_test'
    ],
    supportedActions: [...SUPPORTED_ACTIONS]
  },
  handler: async (args: Record<string, any>) => {
    const { action, ...params } = args

    if (!validateAction(action, [...SUPPORTED_ACTIONS])) {
      return unsupportedActionError(action, [...SUPPORTED_ACTIONS])
    }

    const commandMap: Record<DataAction, string> = {
      importCsv: 'excel_import_csv',
      exportCsv: 'excel_export_csv',
      importJson: 'excel_import_json',
      exportJson: 'excel_export_json',
      importXml: 'excel_import_xml',
      exportXml: 'excel_export_xml',
      connectDatabase: 'excel_connect_database',
      refresh: 'excel_refresh_data',
      group: 'excel_group_data',
      correlation: 'excel_correlation',
      regression: 'excel_regression',
      histogram: 'excel_histogram',
      forecast: 'excel_forecast',
      pivot: 'excel_pivot_data',
      tTest: 'excel_t_test'
    }

    const command = commandMap[action as DataAction]
    const result = await sendIPCCommand(command, params)

    return { ...result, action }
  },
  examples: [
    {
      description: '导入CSV文件',
      input: { action: 'importCsv', filePath: 'C:\\data.csv', range: 'A1' },
      output: { success: true, message: '成功导入CSV', action: 'importCsv' }
    },
    {
      description: '相关性分析',
      input: { action: 'correlation', range1: 'A1:A100', range2: 'B1:B100' },
      output: { success: true, action: 'correlation', data: { coefficient: 0.85 } }
    }
  ]
}
