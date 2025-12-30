/**
 * Excel 切片器工具
 * 使用 ExcelApi 1.10+ 实现切片器操作
 * P2 阶段功能
 */

import { sendIPCCommand } from '@office-mcp/shared'
import type { ToolDefinition } from './types.js'

/**
 * 添加切片器
 */
export const excelAddSlicerTool: ToolDefinition = {
  name: 'excel_add_slicer',
  description: '为 Excel 表格或数据透视表创建交互式切片器，支持自定义位置和样式，适用于数据筛选、仪表板制作和交互式报表',
  category: 'slicer',
  application: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      tableName: {
        type: 'string',
        description: '表格名称或数据透视表名称'
      },
      fieldName: {
        type: 'string',
        description: '要创建切片器的字段名称'
      },
      position: {
        type: 'object',
        description: '切片器位置',
        properties: {
          left: {
            type: 'number',
            description: '左边距（像素）'
          },
          top: {
            type: 'number',
            description: '上边距（像素）'
          }
        }
      },
      style: {
        type: 'string',
        description: '切片器样式名称'
      }
    },
    required: ['tableName', 'fieldName']
  },
  handler: async (args: any) => sendIPCCommand('excel_add_slicer', args),
  examples: [
    {
      description: '为表格添加切片器',
      input: {
        tableName: 'SalesTable',
        fieldName: 'Region',
        position: {
          left: 100,
          top: 100
        },
        style: 'SlicerStyleLight1'
      },
      output: {
        success: true,
        message: '成功添加切片器',
        data: {
          slicerId: 'slicer1',
          slicerName: 'Region Slicer'
        }
      }
    }
  ]
}

/**
 * 获取所有切片器
 */
export const excelGetSlicersTool: ToolDefinition = {
  name: 'excel_get_slicers',
  description: '获取指定工作表中所有切片器的列表和基本信息，包括位置、大小和样式，适用于切片器管理、批量操作或生成切片器清单',
  category: 'slicer',
  application: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      worksheetName: {
        type: 'string',
        description: '工作表名称（可选，默认为当前工作表）'
      }
    },
    required: []
  },
  handler: async (args: any) => sendIPCCommand('excel_get_slicers', args),
  examples: [
    {
      description: '获取所有切片器',
      input: {},
      output: {
        success: true,
        message: '成功获取 2 个切片器',
        data: {
          slicers: [
            {
              id: 'slicer1',
              name: 'Region Slicer',
              caption: '区域',
              left: 100,
              top: 100,
              width: 200,
              height: 300,
              style: 'SlicerStyleLight1'
            }
          ]
        }
      }
    }
  ]
}

/**
 * 获取切片器详情
 */
export const excelGetSlicerDetailTool: ToolDefinition = {
  name: 'excel_get_slicer_detail',
  description: '获取指定切片器的完整配置信息，包括位置、样式、选择项和所有可用项目，适用于状态检查、配置分析或准备批量操作',
  category: 'slicer',
  application: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      slicerName: {
        type: 'string',
        description: '切片器名称'
      }
    },
    required: ['slicerName']
  },
  handler: async (args: any) => sendIPCCommand('excel_get_slicer_detail', args),
  examples: [
    {
      description: '获取切片器详情',
      input: {
        slicerName: 'Region Slicer'
      },
      output: {
        success: true,
        message: '成功获取切片器详情',
        data: {
          id: 'slicer1',
          name: 'Region Slicer',
          caption: '区域',
          left: 100,
          top: 100,
          width: 200,
          height: 300,
          style: 'SlicerStyleLight1',
          sortOrder: 'ascending',
          items: [
            { name: '北京', selected: true },
            { name: '上海', selected: true },
            { name: '广州', selected: false }
          ]
        }
      }
    }
  ]
}

/**
 * 更新切片器
 */
export const excelUpdateSlicerTool: ToolDefinition = {
  name: 'excel_update_slicer',
  description: '修改 Excel 切片器的各种属性，包括标题、位置、大小和样式，适用于布局调整、样式更新或重新设计仪表板',
  category: 'slicer',
  application: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      slicerName: {
        type: 'string',
        description: '切片器名称'
      },
      caption: {
        type: 'string',
        description: '切片器标题'
      },
      position: {
        type: 'object',
        description: '切片器位置',
        properties: {
          left: {
            type: 'number',
            description: '左边距（像素）'
          },
          top: {
            type: 'number',
            description: '上边距（像素）'
          }
        }
      },
      size: {
        type: 'object',
        description: '切片器大小',
        properties: {
          width: {
            type: 'number',
            description: '宽度（像素）'
          },
          height: {
            type: 'number',
            description: '高度（像素）'
          }
        }
      },
      style: {
        type: 'string',
        description: '切片器样式名称'
      }
    },
    required: ['slicerName']
  },
  handler: async (args: any) => sendIPCCommand('excel_update_slicer', args),
  examples: [
    {
      description: '更新切片器位置和样式',
      input: {
        slicerName: 'Region Slicer',
        position: {
          left: 200,
          top: 200
        },
        style: 'SlicerStyleDark1'
      },
      output: {
        success: true,
        message: '成功更新切片器'
      }
    }
  ]
}

/**
 * 设置切片器选择项
 */
export const excelSetSlicerSelectionTool: ToolDefinition = {
  name: 'excel_set_slicer_selection',
  description: '控制 Excel 切片器的选中项目，支持多选和清除其他选择，适用于数据筛选、预设筛选条件或批量设置筛选状态',
  category: 'slicer',
  application: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      slicerName: {
        type: 'string',
        description: '切片器名称'
      },
      selectedItems: {
        type: 'array',
        description: '要选择的项目名称列表',
        items: {
          type: 'string'
        }
      },
      clearOthers: {
        type: 'boolean',
        description: '是否清除其他选择',
        default: true
      }
    },
    required: ['slicerName', 'selectedItems']
  },
  handler: async (args: any) => sendIPCCommand('excel_set_slicer_selection', args),
  examples: [
    {
      description: '选择切片器项目',
      input: {
        slicerName: 'Region Slicer',
        selectedItems: ['北京', '上海'],
        clearOthers: true
      },
      output: {
        success: true,
        message: '成功设置切片器选择'
      }
    }
  ]
}

/**
 * 清除切片器选择
 */
export const excelClearSlicerSelectionTool: ToolDefinition = {
  name: 'excel_clear_slicer_selection',
  description: '重置 Excel 切片器为未筛选状态，清除所有选择项，适用于重置筛选、显示全部数据或准备新的筛选操作',
  category: 'slicer',
  application: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      slicerName: {
        type: 'string',
        description: '切片器名称'
      }
    },
    required: ['slicerName']
  },
  handler: async (args: any) => sendIPCCommand('excel_clear_slicer_selection', args),
  examples: [
    {
      description: '清除切片器选择',
      input: {
        slicerName: 'Region Slicer'
      },
      output: {
        success: true,
        message: '成功清除切片器选择'
      }
    }
  ]
}

/**
 * 删除切片器
 */
export const excelDeleteSlicerTool: ToolDefinition = {
  name: 'excel_delete_slicer',
  description: '移除指定的 Excel 切片器，适用于清理工作表、重新创建切片器或移除不需要的筛选控件',
  category: 'slicer',
  application: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      slicerName: {
        type: 'string',
        description: '切片器名称'
      }
    },
    required: ['slicerName']
  },
  handler: async (args: any) => sendIPCCommand('excel_delete_slicer', args),
  examples: [
    {
      description: '删除切片器',
      input: {
        slicerName: 'Region Slicer'
      },
      output: {
        success: true,
        message: '成功删除切片器'
      }
    }
  ]
}

/**
 * 获取切片器项目
 */
export const excelGetSlicerItemsTool: ToolDefinition = {
  name: 'excel_get_slicer_items',
  description: '查询 Excel 切片器中所有可用项目的详细信息，包括名称、选择状态和数据存在性，适用于了解筛选选项、检查数据完整性或准备筛选逻辑',
  category: 'slicer',
  application: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      slicerName: {
        type: 'string',
        description: '切片器名称'
      }
    },
    required: ['slicerName']
  },
  handler: async (args: any) => sendIPCCommand('excel_get_slicer_items', args),
  examples: [
    {
      description: '获取切片器项目',
      input: {
        slicerName: 'Region Slicer'
      },
      output: {
        success: true,
        message: '成功获取切片器项目',
        data: {
          items: [
            { name: '北京', selected: true, hasData: true },
            { name: '上海', selected: true, hasData: true },
            { name: '广州', selected: false, hasData: true },
            { name: '深圳', selected: false, hasData: false }
          ]
        }
      }
    }
  ]
}
