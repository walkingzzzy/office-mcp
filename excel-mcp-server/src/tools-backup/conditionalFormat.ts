/**
 * Excel 条件格式工具
 * 使用 ExcelApi 1.6+ 实现条件格式操作
 * P1 阶段功能
 */

import { sendIPCCommand } from '@office-mcp/shared'
import type { ToolDefinition } from './types.js'

/**
 * 添加色阶条件格式
 */
export const excelAddColorScaleFormatTool: ToolDefinition = {
  name: 'excel_add_color_scale_format',
  description: '为 Excel 数据范围添加色阶条件格式，支持双色或三色渐变，适用于数据热力图、温度分布图或数值大小可视化展示',
  category: 'conditional_format',
  application: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      range: {
        type: 'string',
        description: '应用范围（如 A1:A10）'
      },
      minColor: {
        type: 'string',
        description: '最小值颜色（如 #FF0000）',
        default: '#FF0000'
      },
      midColor: {
        type: 'string',
        description: '中间值颜色（如 #FFFF00）'
      },
      maxColor: {
        type: 'string',
        description: '最大值颜色（如 #00FF00）',
        default: '#00FF00'
      }
    },
    required: ['range']
  },
  handler: async (args: any) => sendIPCCommand('excel_add_color_scale_format', args),
  examples: [
    {
      description: '添加三色色阶',
      input: {
        range: 'A1:A10',
        minColor: '#FF0000',
        midColor: '#FFFF00',
        maxColor: '#00FF00'
      },
      output: { success: true, message: '成功添加色阶条件格式' }
    }
  ]
}

/**
 * 添加数据条条件格式
 */
export const excelAddDataBarFormatTool: ToolDefinition = {
  name: 'excel_add_data_bar_format',
  description: '为 Excel 数据范围添加数据条条件格式，通过条形长度直观展示数值大小，适用于销售数据对比、库存量展示或进度可视化',
  category: 'conditional_format',
  application: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      range: {
        type: 'string',
        description: '应用范围（如 A1:A10）'
      },
      color: {
        type: 'string',
        description: '数据条颜色（如 #0000FF）',
        default: '#0000FF'
      },
      showValue: {
        type: 'boolean',
        description: '是否显示数值',
        default: true
      }
    },
    required: ['range']
  },
  handler: async (args: any) => sendIPCCommand('excel_add_data_bar_format', args),
  examples: [
    {
      description: '添加数据条',
      input: {
        range: 'A1:A10',
        color: '#0000FF',
        showValue: true
      },
      output: { success: true, message: '成功添加数据条条件格式' }
    }
  ]
}

/**
 * 添加图标集条件格式
 */
export const excelAddIconSetFormatTool: ToolDefinition = {
  name: 'excel_add_icon_set_format',
  description: '为 Excel 数据范围添加图标集条件格式，使用箭头、交通灯等图标表示数据状态，适用于绩效评级、趋势指示或状态标记',
  category: 'conditional_format',
  application: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      range: {
        type: 'string',
        description: '应用范围（如 A1:A10）'
      },
      iconStyle: {
        type: 'string',
        description: '图标样式（如 ThreeArrows, ThreeTrafficLights, FiveArrows）',
        default: 'ThreeArrows'
      },
      showIconOnly: {
        type: 'boolean',
        description: '是否仅显示图标',
        default: false
      }
    },
    required: ['range']
  },
  handler: async (args: any) => sendIPCCommand('excel_add_icon_set_format', args),
  examples: [
    {
      description: '添加三箭头图标集',
      input: {
        range: 'A1:A10',
        iconStyle: 'ThreeArrows',
        showIconOnly: false
      },
      output: { success: true, message: '成功添加图标集条件格式' }
    }
  ]
}

/**
 * 添加单元格值条件格式
 */
export const excelAddCellValueFormatTool: ToolDefinition = {
  name: 'excel_add_cell_value_format',
  description: '根据单元格数值大小设置条件格式，支持大于、小于、等于、介于等条件，适用于异常值标记、阈值警告或数据分类显示',
  category: 'conditional_format',
  application: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      range: {
        type: 'string',
        description: '应用范围（如 A1:A10）'
      },
      operator: {
        type: 'string',
        description: '比较运算符（如 GreaterThan, LessThan, Between, EqualTo）'
      },
      value1: {
        type: 'string',
        description: '比较值1'
      },
      value2: {
        type: 'string',
        description: '比较值2（用于 Between 运算符）'
      },
      fillColor: {
        type: 'string',
        description: '填充颜色（如 #FFFF00）'
      },
      fontColor: {
        type: 'string',
        description: '字体颜色（如 #FF0000）'
      }
    },
    required: ['range', 'operator', 'value1']
  },
  handler: async (args: any) => sendIPCCommand('excel_add_cell_value_format', args),
  examples: [
    {
      description: '高亮大于100的单元格',
      input: {
        range: 'A1:A10',
        operator: 'GreaterThan',
        value1: '100',
        fillColor: '#FFFF00',
        fontColor: '#FF0000'
      },
      output: { success: true, message: '成功添加单元格值条件格式' }
    }
  ]
}

/**
 * 添加文本包含条件格式
 */
export const excelAddTextContainsFormatTool: ToolDefinition = {
  name: 'excel_add_text_contains_format',
  description: '根据单元格中的文本内容设置条件格式，支持包含特定文本的单元格高亮，适用于关键词标记、错误信息突出或分类标识',
  category: 'conditional_format',
  application: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      range: {
        type: 'string',
        description: '应用范围（如 A1:A10）'
      },
      text: {
        type: 'string',
        description: '要查找的文本'
      },
      fillColor: {
        type: 'string',
        description: '填充颜色（如 #FFFF00）'
      },
      fontColor: {
        type: 'string',
        description: '字体颜色（如 #FF0000）'
      }
    },
    required: ['range', 'text']
  },
  handler: async (args: any) => sendIPCCommand('excel_add_text_contains_format', args),
  examples: [
    {
      description: '高亮包含"错误"的单元格',
      input: {
        range: 'A1:A10',
        text: '错误',
        fillColor: '#FF0000',
        fontColor: '#FFFFFF'
      },
      output: { success: true, message: '成功添加文本包含条件格式' }
    }
  ]
}

/**
 * 添加前N项条件格式
 */
export const excelAddTopBottomFormatTool: ToolDefinition = {
  name: 'excel_add_top_bottom_format',
  description: '为数据范围内的前N项或后N项添加条件格式，适用于突出显示最佳/最差表现、排行榜展示或异常值识别',
  category: 'conditional_format',
  application: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      range: {
        type: 'string',
        description: '应用范围（如 A1:A10）'
      },
      type: {
        type: 'string',
        description: '类型（Top 或 Bottom）',
        enum: ['Top', 'Bottom']
      },
      rank: {
        type: 'number',
        description: '排名数量',
        default: 10
      },
      fillColor: {
        type: 'string',
        description: '填充颜色（如 #00FF00）'
      }
    },
    required: ['range', 'type']
  },
  handler: async (args: any) => sendIPCCommand('excel_add_top_bottom_format', args),
  examples: [
    {
      description: '高亮前10项',
      input: {
        range: 'A1:A100',
        type: 'Top',
        rank: 10,
        fillColor: '#00FF00'
      },
      output: { success: true, message: '成功添加前N项条件格式' }
    }
  ]
}

/**
 * 获取条件格式
 */
export const excelGetConditionalFormatsTool: ToolDefinition = {
  name: 'excel_get_conditional_formats',
  description: '查询指定 Excel 范围内所有条件格式的详细信息，包括格式类型、规则和样式，适用于格式管理、规则检查或批量修改前的分析',
  category: 'conditional_format',
  application: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      range: {
        type: 'string',
        description: '查询范围（如 A1:A10）'
      }
    },
    required: ['range']
  },
  handler: async (args: any) => sendIPCCommand('excel_get_conditional_formats', args),
  examples: [
    {
      description: '获取条件格式',
      input: { range: 'A1:A10' },
      output: {
        success: true,
        message: '成功获取 2 个条件格式',
        data: {
          formats: [
            { id: 'format1', type: 'ColorScale' },
            { id: 'format2', type: 'DataBar' }
          ]
        }
      }
    }
  ]
}

/**
 * 删除条件格式
 */
export const excelDeleteConditionalFormatTool: ToolDefinition = {
  name: 'excel_delete_conditional_format',
  description: '删除指定的条件格式规则，支持通过格式ID精确定位，适用于清理无效规则、调整格式策略或重置特定格式',
  category: 'conditional_format',
  application: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      formatId: {
        type: 'string',
        description: '条件格式 ID'
      }
    },
    required: ['formatId']
  },
  handler: async (args: any) => sendIPCCommand('excel_delete_conditional_format', args),
  examples: [
    {
      description: '删除条件格式',
      input: { formatId: 'format1' },
      output: { success: true, message: '成功删除条件格式' }
    }
  ]
}

/**
 * 清除范围的所有条件格式
 */
export const excelClearConditionalFormatsTool: ToolDefinition = {
  name: 'excel_clear_conditional_formats',
  description: '清除指定 Excel 范围内的所有条件格式，适用于重置格式、准备新的格式设置或清理工作表格式',
  category: 'conditional_format',
  application: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      range: {
        type: 'string',
        description: '清除范围（如 A1:A10）'
      }
    },
    required: ['range']
  },
  handler: async (args: any) => sendIPCCommand('excel_clear_conditional_formats', args),
  examples: [
    {
      description: '清除所有条件格式',
      input: { range: 'A1:A10' },
      output: { success: true, message: '成功清除条件格式' }
    }
  ]
}
