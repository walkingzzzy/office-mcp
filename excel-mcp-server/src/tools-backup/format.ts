/**
 * Excel Format Tools - Phase 5 Implementation
 */

import { sendIPCCommand } from '@office-mcp/shared'
import type { ToolDefinition } from './types.js'

// Format Operations (15 tools)

export const excelSetCellFormatTool: ToolDefinition = {
  name: 'excel_set_cell_format',
  description: '设置单元格格式属性。批量设置字体、填充、边框、对齐等格式，适用于报表美化、格式统一、专业排版等场景',
  category: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      range: { type: 'string', description: 'Cell range (e.g., A1:B2)' },
      format: {
        type: 'object',
        properties: {
          font: { type: 'object' },
          fill: { type: 'object' },
          borders: { type: 'object' },
          alignment: { type: 'object' }
        }
      }
    },
    required: ['range', 'format']
  },
  handler: async (args: any) => sendIPCCommand('excel_set_cell_format', args)
}

export const excelSetFontTool: ToolDefinition = {
  name: 'excel_set_font',
  description: '设置区域字体属性。配置字体名称、大小、粗体、斜体、颜色等，适用于标题设置、重点标注、格式美化等场景',
  category: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      range: { type: 'string', description: 'Cell range' },
      name: { type: 'string', description: 'Font name' },
      size: { type: 'number', description: 'Font size' },
      bold: { type: 'boolean', description: 'Bold text' },
      italic: { type: 'boolean', description: 'Italic text' },
      color: { type: 'string', description: 'Font color' }
    },
    required: ['range']
  },
  handler: async (args: any) => sendIPCCommand('excel_set_font', args)
}

export const excelSetFillColorTool: ToolDefinition = {
  name: 'excel_set_fill_color',
  description: '设置单元格填充颜色。使用颜色名称或十六进制值设置背景色，适用于数据分类、视觉区分、报表美化等场景',
  category: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      range: { type: 'string', description: 'Cell range' },
      color: { type: 'string', description: 'Fill color (hex or name)' }
    },
    required: ['range', 'color']
  },
  handler: async (args: any) => sendIPCCommand('excel_set_fill_color', args)
}

export const excelSetBorderTool: ToolDefinition = {
  name: 'excel_set_border',
  description: '设置单元格边框。配置边框样式、颜色和边框位置，适用于表格制作、区域划分、格式规范等场景',
  category: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      range: { type: 'string', description: 'Cell range' },
      style: { type: 'string', enum: ['thin', 'medium', 'thick', 'double'] },
      color: { type: 'string', description: 'Border color' },
      sides: { type: 'array', items: { type: 'string', enum: ['top', 'bottom', 'left', 'right'] } }
    },
    required: ['range', 'style']
  },
  handler: async (args: any) => sendIPCCommand('excel_set_border', args)
}

export const excelSetNumberFormatTool: ToolDefinition = {
  name: 'excel_set_number_format',
  description: '设置单元格数字格式。应用货币、百分比、科学计数等格式代码，适用于数据展示、财务报表、统计分析等场景',
  category: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      range: { type: 'string', description: 'Cell range' },
      format: { type: 'string', description: 'Number format code' }
    },
    required: ['range', 'format']
  },
  handler: async (args: any) => sendIPCCommand('excel_set_number_format', args)
}

export const excelSetDateFormatTool: ToolDefinition = {
  name: 'excel_set_date_format',
  description: '设置单元格日期格式。自定义日期显示模式，适用于时间序列、日期报表、时间管理等场景',
  category: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      range: { type: 'string', description: 'Cell range' },
      format: { type: 'string', description: 'Date format pattern' }
    },
    required: ['range', 'format']
  },
  handler: async (args: any) => sendIPCCommand('excel_set_date_format', args)
}

export const excelConditionalFormatTool: ToolDefinition = {
  name: 'excel_conditional_format',
  description: '应用条件格式。基于数值、表达式或数据条设置动态格式，适用于数据可视化、异常标记、KPI展示等场景',
  category: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      range: { type: 'string', description: 'Cell range' },
      rule: {
        type: 'object',
        properties: {
          type: { type: 'string', enum: ['cellValue', 'expression', 'colorScale', 'dataBar'] },
          operator: { type: 'string' },
          formula: { type: 'string' },
          format: { type: 'object' }
        }
      }
    },
    required: ['range', 'rule']
  },
  handler: async (args: any) => sendIPCCommand('excel_conditional_format', args)
}

export const excelClearFormatTool: ToolDefinition = {
  name: 'excel_clear_format',
  description: '清除区域格式。移除所有格式设置恢复默认样式，适用于格式重置、数据清理、模板重用等场景',
  category: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      range: { type: 'string', description: 'Cell range' }
    },
    required: ['range']
  },
  handler: async (args: any) => sendIPCCommand('excel_clear_format', args)
}

export const excelCopyFormatTool: ToolDefinition = {
  name: 'excel_copy_format',
  description: '将格式从源区域复制到目标区域。仅复制格式不复制数据，适用于格式统一、模板应用、批量美化等场景',
  category: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      sourceRange: { type: 'string', description: 'Source range' },
      targetRange: { type: 'string', description: 'Target range' }
    },
    required: ['sourceRange', 'targetRange']
  },
  handler: async (args: any) => sendIPCCommand('excel_copy_format', args)
}

export const excelSetAlignmentTool: ToolDefinition = {
  name: 'excel_set_alignment',
  description: '设置单元格对齐方式。配置水平和垂直对齐，适用于文本排版、表格布局、打印设置等场景',
  category: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      range: { type: 'string', description: 'Cell range' },
      horizontal: { type: 'string', enum: ['left', 'center', 'right', 'justify'] },
      vertical: { type: 'string', enum: ['top', 'middle', 'bottom'] }
    },
    required: ['range']
  },
  handler: async (args: any) => sendIPCCommand('excel_set_alignment', args)
}

export const excelSetWrapTextTool: ToolDefinition = {
  name: 'excel_set_wrap_text',
  description: '设置单元格文本换行。启用或禁用自动换行功能，适用于长文本显示、注释说明、报表优化等场景',
  category: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      range: { type: 'string', description: 'Cell range' },
      wrap: { type: 'boolean', description: 'Enable text wrapping' }
    },
    required: ['range', 'wrap']
  },
  handler: async (args: any) => sendIPCCommand('excel_set_wrap_text', args)
}

export const excelProtectSheetTool: ToolDefinition = {
  name: 'excel_protect_sheet',
  description: '保护工作表。设置密码保护并配置允许的操作，适用于数据安全、模板保护、权限控制等场景',
  category: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      password: { type: 'string', description: 'Protection password' },
      options: {
        type: 'object',
        properties: {
          allowFormatCells: { type: 'boolean' },
          allowFormatColumns: { type: 'boolean' },
          allowFormatRows: { type: 'boolean' },
          allowInsertColumns: { type: 'boolean' },
          allowInsertRows: { type: 'boolean' }
        }
      }
    }
  },
  handler: async (args: any) => sendIPCCommand('excel_protect_sheet', args)
}

export const excelUnprotectSheetTool: ToolDefinition = {
  name: 'excel_unprotect_sheet',
  description: '取消保护工作表。移除工作表密码保护，适用于数据修改、格式调整、权限变更等场景',
  category: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      password: { type: 'string', description: 'Protection password' }
    }
  },
  handler: async (args: any) => sendIPCCommand('excel_unprotect_sheet', args)
}

export const excelHideColumnsTool: ToolDefinition = {
  name: 'excel_hide_columns',
  description: '隐藏列。隐藏指定范围的列，适用于简化视图、临时隐藏、数据整理等场景',
  category: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      columns: { type: 'string', description: 'Column range (e.g., A:C)' }
    },
    required: ['columns']
  },
  handler: async (args: any) => sendIPCCommand('excel_hide_columns', args)
}

export const excelUnhideColumnsTool: ToolDefinition = {
  name: 'excel_unhide_columns',
  description: '取消隐藏列。显示之前隐藏的列，适用于数据恢复、视图还原、完整展示等场景',
  category: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      columns: { type: 'string', description: 'Column range (e.g., A:C)' }
    },
    required: ['columns']
  },
  handler: async (args: any) => sendIPCCommand('excel_unhide_columns', args)
}
