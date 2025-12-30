/**
 * Excel 数据透视表层级工具
 * 使用 ExcelApi 1.8+ 实现数据透视表层级管理
 * P2 阶段功能
 */

import { sendIPCCommand } from '@office-mcp/shared'
import type { ToolDefinition } from './types.js'

/**
 * 获取数据透视表层级
 */
export const excelGetPivotHierarchiesTool: ToolDefinition = {
  name: 'excel_get_pivot_hierarchies',
  description: '获取数据透视表的层级结构信息，支持按行、列、数据和筛选分类查看，适用于了解报表架构、分析数据组织方式或准备层级操作',
  category: 'pivot',
  application: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      pivotTableName: {
        type: 'string',
        description: '数据透视表名称'
      },
      hierarchyType: {
        type: 'string',
        description: '层级类型（row: 行层级，column: 列层级，data: 数据层级，filter: 筛选层级）',
        enum: ['row', 'column', 'data', 'filter']
      }
    },
    required: ['pivotTableName']
  },
  handler: async (args: any) => sendIPCCommand('excel_get_pivot_hierarchies', args),
  examples: [
    {
      description: '获取行层级',
      input: {
        pivotTableName: 'SalesPivot',
        hierarchyType: 'row'
      },
      output: {
        success: true,
        message: '成功获取 2 个层级',
        data: {
          hierarchies: [
            {
              id: 'hierarchy1',
              name: 'Region',
              position: 0,
              fields: ['North', 'South', 'East', 'West']
            },
            {
              id: 'hierarchy2',
              name: 'Product',
              position: 1,
              fields: ['Product A', 'Product B']
            }
          ]
        }
      }
    }
  ]
}

/**
 * 添加数据透视表层级
 */
export const excelAddPivotHierarchyTool: ToolDefinition = {
  name: 'excel_add_pivot_hierarchy',
  description: '向数据透视表的指定区域添加字段作为层级，支持行、列、数据和筛选四种层级类型，适用于重构报表、添加维度或扩展分析视角',
  category: 'pivot',
  application: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      pivotTableName: {
        type: 'string',
        description: '数据透视表名称'
      },
      fieldName: {
        type: 'string',
        description: '字段名称'
      },
      hierarchyType: {
        type: 'string',
        description: '层级类型',
        enum: ['row', 'column', 'data', 'filter']
      },
      position: {
        type: 'number',
        description: '插入位置（可选）'
      }
    },
    required: ['pivotTableName', 'fieldName', 'hierarchyType']
  },
  handler: async (args: any) => sendIPCCommand('excel_add_pivot_hierarchy', args),
  examples: [
    {
      description: '添加行层级',
      input: {
        pivotTableName: 'SalesPivot',
        fieldName: 'Category',
        hierarchyType: 'row',
        position: 0
      },
      output: {
        success: true,
        message: '成功添加层级',
        data: {
          hierarchyId: 'hierarchy3'
        }
      }
    }
  ]
}

/**
 * 移除数据透视表层级
 */
export const excelRemovePivotHierarchyTool: ToolDefinition = {
  name: 'excel_remove_pivot_hierarchy',
  description: '从数据透视表中移除指定的层级字段，适用于简化报表结构、移除冗余维度或重新组织数据展示',
  category: 'pivot',
  application: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      pivotTableName: {
        type: 'string',
        description: '数据透视表名称'
      },
      hierarchyId: {
        type: 'string',
        description: '层级 ID'
      }
    },
    required: ['pivotTableName', 'hierarchyId']
  },
  handler: async (args: any) => sendIPCCommand('excel_remove_pivot_hierarchy', args),
  examples: [
    {
      description: '移除层级',
      input: {
        pivotTableName: 'SalesPivot',
        hierarchyId: 'hierarchy1'
      },
      output: {
        success: true,
        message: '成功移除层级'
      }
    }
  ]
}

/**
 * 展开数据透视表层级
 */
export const excelExpandPivotHierarchyTool: ToolDefinition = {
  name: 'excel_expand_pivot_hierarchy',
  description: '展开数据透视表中的指定层级以显示详细数据，支持展开全部或特定项目，适用于深入分析、查看明细或逐层下钻',
  category: 'pivot',
  application: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      pivotTableName: {
        type: 'string',
        description: '数据透视表名称'
      },
      hierarchyId: {
        type: 'string',
        description: '层级 ID'
      },
      itemName: {
        type: 'string',
        description: '要展开的项目名称（可选，不提供则展开所有）'
      }
    },
    required: ['pivotTableName', 'hierarchyId']
  },
  handler: async (args: any) => sendIPCCommand('excel_expand_pivot_hierarchy', args),
  examples: [
    {
      description: '展开指定项目',
      input: {
        pivotTableName: 'SalesPivot',
        hierarchyId: 'hierarchy1',
        itemName: 'North'
      },
      output: {
        success: true,
        message: '成功展开层级'
      }
    }
  ]
}

/**
 * 收起数据透视表层级
 */
export const excelCollapsePivotHierarchyTool: ToolDefinition = {
  name: 'excel_collapse_pivot_hierarchy',
  description: '收起数据透视表中的指定层级以隐藏详细数据，支持收起全部或特定项目，适用于简化视图、汇总展示或逐层上卷',
  category: 'pivot',
  application: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      pivotTableName: {
        type: 'string',
        description: '数据透视表名称'
      },
      hierarchyId: {
        type: 'string',
        description: '层级 ID'
      },
      itemName: {
        type: 'string',
        description: '要收起的项目名称（可选，不提供则收起所有）'
      }
    },
    required: ['pivotTableName', 'hierarchyId']
  },
  handler: async (args: any) => sendIPCCommand('excel_collapse_pivot_hierarchy', args),
  examples: [
    {
      description: '收起指定项目',
      input: {
        pivotTableName: 'SalesPivot',
        hierarchyId: 'hierarchy1',
        itemName: 'North'
      },
      output: {
        success: true,
        message: '成功收起层级'
      }
    }
  ]
}

/**
 * 移动数据透视表层级位置
 */
export const excelMovePivotHierarchyTool: ToolDefinition = {
  name: 'excel_move_pivot_hierarchy',
  description: '调整数据透视表中层级字段的显示顺序，通过设置位置索引重排，适用于优化布局、突出重点或调整分析顺序',
  category: 'pivot',
  application: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      pivotTableName: {
        type: 'string',
        description: '数据透视表名称'
      },
      hierarchyId: {
        type: 'string',
        description: '层级 ID'
      },
      newPosition: {
        type: 'number',
        description: '新位置索引（从 0 开始）'
      }
    },
    required: ['pivotTableName', 'hierarchyId', 'newPosition']
  },
  handler: async (args: any) => sendIPCCommand('excel_move_pivot_hierarchy', args),
  examples: [
    {
      description: '移动层级到第一位',
      input: {
        pivotTableName: 'SalesPivot',
        hierarchyId: 'hierarchy2',
        newPosition: 0
      },
      output: {
        success: true,
        message: '成功移动层级'
      }
    }
  ]
}

/**
 * 设置数据透视表层级排序
 */
export const excelSetPivotHierarchySortTool: ToolDefinition = {
  name: 'excel_set_pivot_hierarchy_sort',
  description: '配置数据透视表层级的排序规则，支持升序、降序和手动排序，适用于数据组织、趋势展示或自定义排序需求',
  category: 'pivot',
  application: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      pivotTableName: {
        type: 'string',
        description: '数据透视表名称'
      },
      hierarchyId: {
        type: 'string',
        description: '层级 ID'
      },
      sortOrder: {
        type: 'string',
        description: '排序方式（ascending: 升序，descending: 降序，manual: 手动）',
        enum: ['ascending', 'descending', 'manual']
      }
    },
    required: ['pivotTableName', 'hierarchyId', 'sortOrder']
  },
  handler: async (args: any) => sendIPCCommand('excel_set_pivot_hierarchy_sort', args),
  examples: [
    {
      description: '设置升序排序',
      input: {
        pivotTableName: 'SalesPivot',
        hierarchyId: 'hierarchy1',
        sortOrder: 'ascending'
      },
      output: {
        success: true,
        message: '成功设置层级排序'
      }
    }
  ]
}

/**
 * 获取数据透视表层级项目
 */
export const excelGetPivotHierarchyItemsTool: ToolDefinition = {
  name: 'excel_get_pivot_hierarchy_items',
  description: '查询数据透视表指定层级中的所有项目信息，包括可见性和展开状态，适用于了解数据构成、检查项目状态或准备层级操作',
  category: 'pivot',
  application: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      pivotTableName: {
        type: 'string',
        description: '数据透视表名称'
      },
      hierarchyId: {
        type: 'string',
        description: '层级 ID'
      }
    },
    required: ['pivotTableName', 'hierarchyId']
  },
  handler: async (args: any) => sendIPCCommand('excel_get_pivot_hierarchy_items', args),
  examples: [
    {
      description: '获取层级项目',
      input: {
        pivotTableName: 'SalesPivot',
        hierarchyId: 'hierarchy1'
      },
      output: {
        success: true,
        message: '成功获取 4 个项目',
        data: {
          items: [
            {
              name: 'North',
              visible: true,
              expanded: true
            },
            {
              name: 'South',
              visible: true,
              expanded: false
            }
          ]
        }
      }
    }
  ]
}
