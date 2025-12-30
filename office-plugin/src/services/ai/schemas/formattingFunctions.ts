/**
 * 格式化函数 Schema 定义
 * 遵循简洁设计原则：description < 100 字符
 */

import { FunctionCategory } from '../types'

/**
 * Schema 类型定义
 */
interface FunctionSchema {
  type: 'function'
  function: {
    name: string
    description: string
    parameters: {
      type: 'object'
      properties: Record<string, unknown>
      required?: string[]
    }
  }
}

/**
 * 基础 Schema 模板
 */
const BaseSchema = {
  type: 'object' as const,
  properties: {
    target: {
      type: 'string',
      description: '目标范围：selection(选区)/document(全文)/paragraph(段落)',
      enum: ['selection', 'document', 'paragraph', 'paragraphs']
    }
  },
  required: ['target']
}

/**
 * 字体格式化函数 Schema
 */
export const FontFormattingSchema = {
  type: 'function',
  function: {
    name: 'apply_font_formatting',
    description: '应用字体格式（名称、大小、颜色、粗体、斜体、下划线）',
    parameters: {
      ...BaseSchema,
      properties: {
        ...BaseSchema.properties,
        name: {
          type: 'string',
          description: '字体名称（如：Arial、Times New Roman、微软雅黑）'
        },
        size: {
          type: 'number',
          description: '字体大小（点数，如：12、14、16）'
        },
        color: {
          type: 'string',
          description: '字体颜色（名称：red/blue 或十六进制：#FF0000）'
        },
        bold: {
          type: 'boolean',
          description: '是否加粗'
        },
        italic: {
          type: 'boolean',
          description: '是否斜体'
        },
        underline: {
          type: 'string',
          description: '下划线样式',
          enum: ['none', 'single', 'double', 'dotted', 'dashed']
        }
      }
    }
  }
}

/**
 * 段落格式化函数 Schema
 */
export const ParagraphFormattingSchema = {
  type: 'function',
  function: {
    name: 'apply_paragraph_formatting',
    description: '应用段落格式（对齐、缩进、行距）',
    parameters: {
      ...BaseSchema,
      properties: {
        ...BaseSchema.properties,
        alignment: {
          type: 'string',
          description: '对齐方式',
          enum: ['left', 'centered', 'right', 'justified']
        },
        firstLineIndent: {
          type: 'number',
          description: '首行缩进（点数，如：24表示1英寸）'
        },
        leftIndent: {
          type: 'number',
          description: '左缩进（点数）'
        },
        rightIndent: {
          type: 'number',
          description: '右缩进（点数）'
        },
        lineSpacingRule: {
          type: 'string',
          description: '行距规则',
          enum: ['single', 'onePointFive', 'double', 'atLeast', 'exactly']
        },
        lineSpacing: {
          type: 'number',
          description: '行距值（当lineSpacingRule为atLeast或exactly时使用）'
        },
        spaceBefore: {
          type: 'number',
          description: '段前间距（点数）'
        },
        spaceAfter: {
          type: 'number',
          description: '段后间距（点数）'
        }
      }
    }
  }
}

/**
 * 样式应用函数 Schema
 */
export const StyleApplicationSchema = {
  type: 'function',
  function: {
    name: 'apply_style',
    description: '应用内置样式（标题1-6、正文、引用等）',
    parameters: {
      type: 'object',
      properties: {
        styleName: {
          type: 'string',
          description: '样式名称',
          enum: [
            'Normal',
            'Heading 1',
            'Heading 2',
            'Heading 3',
            'Heading 4',
            'Heading 5',
            'Heading 6',
            'Title',
            'Subtitle',
            'Quote',
            'Intense Quote',
            'List Paragraph',
            'Caption'
          ]
        },
        target: {
          type: 'string',
          description: '目标范围',
          enum: ['selection', 'document', 'paragraph', 'paragraphs']
        }
      },
      required: ['styleName', 'target']
    }
  }
}

/**
 * 文档优化函数 Schema（P1 阶段）
 */
export const DocumentOptimizationSchema = {
  type: 'function',
  function: {
    name: 'optimize_document_format',
    description: '智能优化文档格式（学术/商务/休闲风格）',
    parameters: {
      type: 'object',
      properties: {
        documentType: {
          type: 'string',
          description: '文档类型',
          enum: ['academic', 'business', 'casual']
        }
      },
      required: ['documentType']
    }
  }
}

/**
 * 批量样式修改函数 Schema（P1 阶段）
 */
export const BatchStyleModificationSchema = {
  type: 'function',
  function: {
    name: 'batch_modify_style',
    description: '批量修改所有指定样式的段落格式',
    parameters: {
      type: 'object',
      properties: {
        targetStyle: {
          type: 'string',
          description: '目标样式名称（如：Heading 1）'
        },
        formatting: {
          type: 'object',
          description: '新的格式设置',
          properties: {
            name: { type: 'string' },
            size: { type: 'number' },
            color: { type: 'string' },
            bold: { type: 'boolean' },
            italic: { type: 'boolean' },
            underline: { type: 'string' }
          }
        }
      },
      required: ['targetStyle', 'formatting']
    }
  }
}

/**
 * 列表格式化函数 Schema（P2 阶段）
 */
export const ListFormattingSchema = {
  type: 'function',
  function: {
    name: 'apply_list_formatting',
    description: '应用列表格式（项目符号/编号/多级）',
    parameters: {
      type: 'object',
      properties: {
        listType: {
          type: 'string',
          description: '列表类型',
          enum: ['bullet', 'number', 'multilevel']
        },
        target: {
          type: 'string',
          description: '目标范围',
          enum: ['selection', 'paragraph', 'paragraphs']
        },
        level: {
          type: 'number',
          description: '列表级别（多级列表使用，1-9）',
          minimum: 1,
          maximum: 9
        }
      },
      required: ['listType', 'target']
    }
  }
}

/**
 * 表格插入函数 Schema（P2 阶段）
 */
export const TableInsertionSchema = {
  type: 'function',
  function: {
    name: 'insert_table',
    description: '插入指定行列数的表格',
    parameters: {
      type: 'object',
      properties: {
        rows: {
          type: 'number',
          description: '行数',
          minimum: 1,
          maximum: 50
        },
        columns: {
          type: 'number',
          description: '列数',
          minimum: 1,
          maximum: 20
        },
        data: {
          type: 'array',
          description: '表格数据（二维字符串数组，可选）',
          items: {
            type: 'array',
            items: { type: 'string' }
          }
        },
        position: {
          type: 'string',
          description: '插入位置',
          enum: ['selection', 'end'],
          default: 'selection'
        }
      },
      required: ['rows', 'columns']
    }
  }
}

/**
 * 表格样式应用函数 Schema（P2 阶段）
 */
export const TableStyleSchema = {
  type: 'function',
  function: {
    name: 'apply_table_style',
    description: '应用表格样式（网格/列表/简洁）',
    parameters: {
      type: 'object',
      properties: {
        tableIndex: {
          type: 'number',
          description: '表格索引（从0开始）',
          minimum: 0
        },
        style: {
          type: 'string',
          description: '表格样式',
          enum: ['grid', 'list', 'plain', 'medium']
        },
        headerRow: {
          type: 'boolean',
          description: '是否有标题行',
          default: true
        },
        firstColumn: {
          type: 'boolean',
          description: '是否突出显示第一列',
          default: false
        }
      },
      required: ['tableIndex', 'style']
    }
  }
}

/**
 * 页面设置函数 Schema（P3 阶段）
 */
export const PageSetupSchema = {
  type: 'function',
  function: {
    name: 'apply_page_setup',
    description: '设置页面布局（方向、大小、边距）',
    parameters: {
      type: 'object',
      properties: {
        orientation: {
          type: 'string',
          description: '页面方向',
          enum: ['portrait', 'landscape']
        },
        pageSize: {
          type: 'string',
          description: '纸张大小',
          enum: ['A4', 'Letter', 'Legal', 'A3', 'A5']
        },
        margins: {
          type: 'object',
          description: '页边距（单位：磅）',
          properties: {
            top: { type: 'number', minimum: 0 },
            bottom: { type: 'number', minimum: 0 },
            left: { type: 'number', minimum: 0 },
            right: { type: 'number', minimum: 0 }
          }
        }
      }
    }
  }
}

/**
 * Schema 注册表
 * 按优先级和类别组织
 */
export const SCHEMA_REGISTRY = {
  // P0 阶段 - 基础格式化
  [FunctionCategory.FONT]: {
    priority: 1,
    schemas: [FontFormattingSchema]
  },

  [FunctionCategory.PARAGRAPH]: {
    priority: 1,
    schemas: [ParagraphFormattingSchema]
  },

  [FunctionCategory.STYLE]: {
    priority: 1,
    schemas: [StyleApplicationSchema]
  },

  // P1 阶段 - 智能场景
  [FunctionCategory.SMART]: {
    priority: 2,
    schemas: [DocumentOptimizationSchema, BatchStyleModificationSchema]
  },

  // P2 阶段 - 高级格式化
  [FunctionCategory.LIST]: {
    priority: 3,
    schemas: [ListFormattingSchema]
  },

  [FunctionCategory.TABLE]: {
    priority: 3,
    schemas: [TableInsertionSchema, TableStyleSchema]
  },

  // P3 阶段 - 页面布局
  [FunctionCategory.LAYOUT]: {
    priority: 4,
    schemas: [PageSetupSchema]
  }
}

/**
 * 获取所有 P0 阶段的 Schema
 */
export function getP0Schemas() {
  return [
    FontFormattingSchema,
    ParagraphFormattingSchema,
    StyleApplicationSchema
  ]
}

/**
 * 获取所有 Schema（用于完整测试）
 */
export function getAllSchemas(): FunctionSchema[] {
  return Object.values(SCHEMA_REGISTRY)
    .flatMap(category => category.schemas as FunctionSchema[])
}

/**
 * 根据类别获取 Schema
 */
export function getSchemasByCategory(category: FunctionCategory): FunctionSchema[] {
  const registry = SCHEMA_REGISTRY as Partial<Record<FunctionCategory, { priority: number; schemas: FunctionSchema[] }>>
  return registry[category]?.schemas || []
}

/**
 * 根据优先级获取 Schema
 */
export function getSchemasByPriority(maxPriority: number): FunctionSchema[] {
  return Object.entries(SCHEMA_REGISTRY)
    .filter(([_, config]) => config.priority <= maxPriority)
    .flatMap(([_, config]) => config.schemas as FunctionSchema[])
}