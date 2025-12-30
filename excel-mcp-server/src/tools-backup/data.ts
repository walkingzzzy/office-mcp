/**
 * Excel Data Analysis Tools - Phase 5 Implementation
 */

import { sendIPCCommand } from '@office-mcp/shared'
import type { ToolDefinition } from './types.js'

// Data Import/Export Tools (9 tools)
export const excelImportCsvTool: ToolDefinition = {
  name: 'excel_import_csv',
  description: '将CSV数据导入Excel。支持自定义分隔符，适用于数据迁移、批量导入、外部数据整合等场景',
  category: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      filePath: { type: 'string', description: 'Path to CSV file' },
      range: { type: 'string', description: 'Target range (e.g., A1)' },
      delimiter: { type: 'string', default: ',', description: 'CSV delimiter' }
    },
    required: ['filePath', 'range']
  },
  handler: async (args: any) => sendIPCCommand('excel_import_csv', args)
}

export const excelExportCsvTool: ToolDefinition = {
  name: 'excel_export_csv',
  description: '将Excel数据导出为CSV格式。适用于数据交换、系统间传输、备份存档等场景',
  category: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      range: { type: 'string', description: 'Source range to export' },
      filePath: { type: 'string', description: 'Output CSV file path' }
    },
    required: ['range', 'filePath']
  },
  handler: async (args: any) => sendIPCCommand('excel_export_csv', args)
}

export const excelImportJsonTool: ToolDefinition = {
  name: 'excel_import_json',
  description: '将JSON数据导入Excel。支持结构化数据转换，适用于API数据导入、配置数据处理、Web数据整合等场景',
  category: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      data: { type: 'object', description: 'JSON data to import' },
      range: { type: 'string', description: 'Target range' }
    },
    required: ['data', 'range']
  },
  handler: async (args: any) => sendIPCCommand('excel_import_json', args)
}

export const excelExportJsonTool: ToolDefinition = {
  name: 'excel_export_json',
  description: '将Excel数据导出为JSON格式。适用于数据交换、Web应用集成、配置文件生成等场景',
  category: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      range: { type: 'string', description: 'Source range to export' }
    },
    required: ['range']
  },
  handler: async (args: any) => sendIPCCommand('excel_export_json', args)
}

export const excelImportXmlTool: ToolDefinition = {
  name: 'excel_import_xml',
  description: '将XML数据导入Excel。支持结构化XML解析，适用于配置文件导入、Web服务数据、系统间数据交换等场景',
  category: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      filePath: { type: 'string', description: 'Path to XML file' },
      range: { type: 'string', description: 'Target range' }
    },
    required: ['filePath', 'range']
  },
  handler: async (args: any) => sendIPCCommand('excel_import_xml', args)
}

export const excelExportXmlTool: ToolDefinition = {
  name: 'excel_export_xml',
  description: '将Excel数据导出为XML格式。适用于数据交换、系统集成、配置文件生成等场景',
  category: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      range: { type: 'string', description: 'Source range to export' },
      filePath: { type: 'string', description: 'Output XML file path' }
    },
    required: ['range', 'filePath']
  },
  handler: async (args: any) => sendIPCCommand('excel_export_xml', args)
}

export const excelConnectDatabaseTool: ToolDefinition = {
  name: 'excel_connect_database',
  description: '连接外部数据库。通过连接字符串执行SQL查询并将结果导入Excel，适用于数据仓库连接、报表数据源、实时数据获取等场景',
  category: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      connectionString: { type: 'string', description: 'Database connection string' },
      query: { type: 'string', description: 'SQL query to execute' },
      range: { type: 'string', description: 'Target range for data' }
    },
    required: ['connectionString', 'query', 'range']
  },
  handler: async (args: any) => sendIPCCommand('excel_connect_database', args)
}

export const excelRefreshDataTool: ToolDefinition = {
  name: 'excel_refresh_data',
  description: '刷新外部数据连接。更新所有外部数据源的连接，适用于数据同步、实时更新、定期刷新等场景',
  category: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      connectionName: { type: 'string', description: 'Name of connection to refresh' }
    }
  },
  handler: async (args: any) => sendIPCCommand('excel_refresh_data', args)
}

export const excelGetExternalDataTool: ToolDefinition = {
  name: 'excel_get_external_data',
  description: 'Get data from external source',
  category: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      source: { type: 'string', description: 'External data source URL or path' },
      range: { type: 'string', description: 'Target range' }
    },
    required: ['source', 'range']
  },
  handler: async (args: any) => sendIPCCommand('excel_get_external_data', args)
}

// Statistical Analysis Tools (9 tools)
export const excelDescriptiveStatsTool: ToolDefinition = {
  name: 'excel_descriptive_stats',
  description: 'Calculate descriptive statistics',
  category: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      range: { type: 'string', description: 'Data range for analysis' },
      outputRange: { type: 'string', description: 'Output range for results' }
    },
    required: ['range', 'outputRange']
  },
  handler: async (args: any) => sendIPCCommand('excel_descriptive_stats', args)
}

export const excelCorrelationTool: ToolDefinition = {
  name: 'excel_correlation',
  description: '计算相关性矩阵。分析变量间的线性相关关系，适用于数据分析、统计研究、风险评估等场景',
  category: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      range: { type: 'string', description: 'Data range for correlation' },
      outputRange: { type: 'string', description: 'Output range for matrix' }
    },
    required: ['range', 'outputRange']
  },
  handler: async (args: any) => sendIPCCommand('excel_correlation', args)
}

export const excelRegressionTool: ToolDefinition = {
  name: 'excel_regression',
  description: '执行回归分析。建立变量间的数学关系模型，适用于预测分析、趋势研究、因果分析等场景',
  category: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      yRange: { type: 'string', description: 'Dependent variable range' },
      xRange: { type: 'string', description: 'Independent variable range' },
      outputRange: { type: 'string', description: 'Output range for results' }
    },
    required: ['yRange', 'xRange', 'outputRange']
  },
  handler: async (args: any) => sendIPCCommand('excel_regression', args)
}

export const excelHistogramTool: ToolDefinition = {
  name: 'excel_histogram',
  description: '创建直方图分析。展示数据分布特征，适用于统计分析、质量控制、数据探索等场景',
  category: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      dataRange: { type: 'string', description: 'Data range for histogram' },
      binRange: { type: 'string', description: 'Bin range (optional)' },
      outputRange: { type: 'string', description: 'Output range' }
    },
    required: ['dataRange', 'outputRange']
  },
  handler: async (args: any) => sendIPCCommand('excel_histogram', args)
}

export const excelTTestTool: ToolDefinition = {
  name: 'excel_t_test',
  description: '执行t检验分析。比较两组数据的均值差异，适用于假设检验、A/B测试、科研分析等场景',
  category: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      range1: { type: 'string', description: 'First sample range' },
      range2: { type: 'string', description: 'Second sample range' },
      testType: { type: 'string', enum: ['paired', 'two-sample-equal', 'two-sample-unequal'] },
      outputRange: { type: 'string', description: 'Output range' }
    },
    required: ['range1', 'range2', 'testType', 'outputRange']
  },
  handler: async (args: any) => sendIPCCommand('excel_t_test', args)
}

export const excelAnovaTool: ToolDefinition = {
  name: 'excel_anova',
  description: 'Perform ANOVA analysis',
  category: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      inputRange: { type: 'string', description: 'Input data range' },
      groupedBy: { type: 'string', enum: ['columns', 'rows'] },
      outputRange: { type: 'string', description: 'Output range' }
    },
    required: ['inputRange', 'groupedBy', 'outputRange']
  },
  handler: async (args: any) => sendIPCCommand('excel_anova', args)
}

export const excelMovingAverageTool: ToolDefinition = {
  name: 'excel_moving_average',
  description: 'Calculate moving average',
  category: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      inputRange: { type: 'string', description: 'Input data range' },
      interval: { type: 'number', description: 'Moving average interval' },
      outputRange: { type: 'string', description: 'Output range' }
    },
    required: ['inputRange', 'interval', 'outputRange']
  },
  handler: async (args: any) => sendIPCCommand('excel_moving_average', args)
}

export const excelExponentialSmoothingTool: ToolDefinition = {
  name: 'excel_exponential_smoothing',
  description: 'Apply exponential smoothing',
  category: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      inputRange: { type: 'string', description: 'Input data range' },
      dampingFactor: { type: 'number', description: 'Damping factor (0-1)' },
      outputRange: { type: 'string', description: 'Output range' }
    },
    required: ['inputRange', 'dampingFactor', 'outputRange']
  },
  handler: async (args: any) => sendIPCCommand('excel_exponential_smoothing', args)
}

export const excelForecastTool: ToolDefinition = {
  name: 'excel_forecast',
  description: '生成预测分析。基于历史数据预测未来趋势，适用于销售预测、需求规划、趋势分析等场景',
  category: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      knownYs: { type: 'string', description: 'Known Y values range' },
      knownXs: { type: 'string', description: 'Known X values range' },
      newXs: { type: 'string', description: 'New X values for forecast' },
      outputRange: { type: 'string', description: 'Output range' }
    },
    required: ['knownYs', 'knownXs', 'newXs', 'outputRange']
  },
  handler: async (args: any) => sendIPCCommand('excel_forecast', args)
}

// Data Processing Tools (9 tools)
export const excelDataCleaningTool: ToolDefinition = {
  name: 'excel_data_cleaning',
  description: 'Clean and standardize data',
  category: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      range: { type: 'string', description: 'Data range to clean' },
      operations: { type: 'array', items: { type: 'string' }, description: 'Cleaning operations' }
    },
    required: ['range', 'operations']
  },
  handler: async (args: any) => sendIPCCommand('excel_data_cleaning', args)
}

export const excelTextToColumnsTool: ToolDefinition = {
  name: 'excel_text_to_columns',
  description: 'Split text into columns',
  category: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      range: { type: 'string', description: 'Text range to split' },
      delimiter: { type: 'string', description: 'Delimiter character' },
      outputRange: { type: 'string', description: 'Output range' }
    },
    required: ['range', 'delimiter', 'outputRange']
  },
  handler: async (args: any) => sendIPCCommand('excel_text_to_columns', args)
}

export const excelConcatenateColumnsTool: ToolDefinition = {
  name: 'excel_concatenate_columns',
  description: 'Concatenate multiple columns',
  category: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      ranges: { type: 'array', items: { type: 'string' }, description: 'Column ranges to concatenate' },
      separator: { type: 'string', default: ' ', description: 'Separator between values' },
      outputRange: { type: 'string', description: 'Output range' }
    },
    required: ['ranges', 'outputRange']
  },
  handler: async (args: any) => sendIPCCommand('excel_concatenate_columns', args)
}

export const excelTransposeDataTool: ToolDefinition = {
  name: 'excel_transpose_data',
  description: 'Transpose data (rows to columns)',
  category: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      sourceRange: { type: 'string', description: 'Source data range' },
      outputRange: { type: 'string', description: 'Output range' }
    },
    required: ['sourceRange', 'outputRange']
  },
  handler: async (args: any) => sendIPCCommand('excel_transpose_data', args)
}

export const excelGroupDataTool: ToolDefinition = {
  name: 'excel_group_data',
  description: '按条件分组数据。根据指定列和聚合函数对数据进行分组汇总，适用于数据统计、报表生成、业务分析等场景',
  category: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      dataRange: { type: 'string', description: 'Data range to group' },
      groupByColumn: { type: 'string', description: 'Column to group by' },
      aggregateFunction: { type: 'string', enum: ['sum', 'count', 'average', 'max', 'min'] }
    },
    required: ['dataRange', 'groupByColumn', 'aggregateFunction']
  },
  handler: async (args: any) => sendIPCCommand('excel_group_data', args)
}

export const excelPivotDataTool: ToolDefinition = {
  name: 'excel_pivot_data',
  description: '创建数据透视表汇总。动态汇总和分析大量数据，适用于交互式报表、多维分析、数据钻取等场景',
  category: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      sourceRange: { type: 'string', description: 'Source data range' },
      rowFields: { type: 'array', items: { type: 'string' }, description: 'Row field names' },
      columnFields: { type: 'array', items: { type: 'string' }, description: 'Column field names' },
      valueFields: { type: 'array', items: { type: 'string' }, description: 'Value field names' },
      outputRange: { type: 'string', description: 'Output range' }
    },
    required: ['sourceRange', 'outputRange']
  },
  handler: async (args: any) => sendIPCCommand('excel_pivot_data', args)
}

export const excelNormalizationTool: ToolDefinition = {
  name: 'excel_normalization',
  description: 'Normalize data values',
  category: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      inputRange: { type: 'string', description: 'Input data range' },
      method: { type: 'string', enum: ['min-max', 'z-score', 'decimal'] },
      outputRange: { type: 'string', description: 'Output range' }
    },
    required: ['inputRange', 'method', 'outputRange']
  },
  handler: async (args: any) => sendIPCCommand('excel_normalization', args)
}

export const excelOutlierDetectionTool: ToolDefinition = {
  name: 'excel_outlier_detection',
  description: 'Detect outliers in data',
  category: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      dataRange: { type: 'string', description: 'Data range to analyze' },
      method: { type: 'string', enum: ['iqr', 'z-score', 'modified-z-score'] },
      outputRange: { type: 'string', description: 'Output range for results' }
    },
    required: ['dataRange', 'method', 'outputRange']
  },
  handler: async (args: any) => sendIPCCommand('excel_outlier_detection', args)
}

export const excelDataSamplingTool: ToolDefinition = {
  name: 'excel_data_sampling',
  description: 'Sample data from larger dataset',
  category: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      sourceRange: { type: 'string', description: 'Source data range' },
      sampleSize: { type: 'number', description: 'Number of samples to take' },
      method: { type: 'string', enum: ['random', 'systematic', 'stratified'] },
      outputRange: { type: 'string', description: 'Output range' }
    },
    required: ['sourceRange', 'sampleSize', 'method', 'outputRange']
  },
  handler: async (args: any) => sendIPCCommand('excel_data_sampling', args)
}
