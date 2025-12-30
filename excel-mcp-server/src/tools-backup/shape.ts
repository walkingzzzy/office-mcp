/**
 * Excel 形状工具
 * 使用 ExcelApi 1.9+ 实现形状操作
 * P2 阶段功能
 */

import { sendIPCCommand } from '@office-mcp/shared'
import type { ToolDefinition } from './types.js'

/**
 * 添加形状
 */
export const excelAddShapeTool: ToolDefinition = {
  name: 'excel_add_shape',
  description: '在 Excel 工作表中创建各种几何形状，支持矩形、椭圆、线条、箭头等多种类型，适用于流程图制作、标注说明或装饰设计',
  category: 'shape',
  application: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      shapeType: {
        type: 'string',
        description: '形状类型（rectangle: 矩形，oval: 椭圆，line: 直线，arrow: 箭头等）',
        enum: ['rectangle', 'oval', 'line', 'arrow', 'triangle', 'diamond', 'pentagon', 'hexagon']
      },
      position: {
        type: 'object',
        description: '形状位置',
        properties: {
          left: {
            type: 'number',
            description: '左边距（像素）'
          },
          top: {
            type: 'number',
            description: '上边距（像素）'
          }
        },
        required: ['left', 'top']
      },
      size: {
        type: 'object',
        description: '形状大小',
        properties: {
          width: {
            type: 'number',
            description: '宽度（像素）'
          },
          height: {
            type: 'number',
            description: '高度（像素）'
          }
        },
        required: ['width', 'height']
      },
      worksheetName: {
        type: 'string',
        description: '工作表名称（可选，默认为当前工作表）'
      }
    },
    required: ['shapeType', 'position', 'size']
  },
  handler: async (args: any) => sendIPCCommand('excel_add_shape', args),
  examples: [
    {
      description: '添加矩形形状',
      input: {
        shapeType: 'rectangle',
        position: {
          left: 100,
          top: 100
        },
        size: {
          width: 200,
          height: 100
        }
      },
      output: {
        success: true,
        message: '成功添加形状',
        data: {
          shapeId: 'shape1',
          shapeName: 'Rectangle 1'
        }
      }
    }
  ]
}

/**
 * 获取所有形状
 */
export const excelGetShapesTool: ToolDefinition = {
  name: 'excel_get_shapes',
  description: '获取指定工作表中所有形状的列表和基本信息，包括类型、位置和尺寸，适用于形状管理、批量操作或生成形状清单',
  category: 'shape',
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
  handler: async (args: any) => sendIPCCommand('excel_get_shapes', args),
  examples: [
    {
      description: '获取所有形状',
      input: {},
      output: {
        success: true,
        message: '成功获取 3 个形状',
        data: {
          shapes: [
            {
              id: 'shape1',
              name: 'Rectangle 1',
              type: 'rectangle',
              left: 100,
              top: 100,
              width: 200,
              height: 100
            }
          ]
        }
      }
    }
  ]
}

/**
 * 获取形状详情
 */
export const excelGetShapeDetailTool: ToolDefinition = {
  name: 'excel_get_shape_detail',
  description: '获取指定形状的完整属性信息，包括位置、大小、旋转、填充和边框样式，适用于状态检查、属性分析或准备修改操作',
  category: 'shape',
  application: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      shapeName: {
        type: 'string',
        description: '形状名称'
      },
      worksheetName: {
        type: 'string',
        description: '工作表名称（可选）'
      }
    },
    required: ['shapeName']
  },
  handler: async (args: any) => sendIPCCommand('excel_get_shape_detail', args),
  examples: [
    {
      description: '获取形状详情',
      input: {
        shapeName: 'Rectangle 1'
      },
      output: {
        success: true,
        message: '成功获取形状详情',
        data: {
          id: 'shape1',
          name: 'Rectangle 1',
          type: 'rectangle',
          left: 100,
          top: 100,
          width: 200,
          height: 100,
          rotation: 0,
          visible: true,
          zOrderPosition: 1,
          fill: {
            type: 'solid',
            color: '#FF0000'
          },
          line: {
            color: '#000000',
            weight: 1,
            style: 'solid'
          }
        }
      }
    }
  ]
}

/**
 * 更新形状
 */
export const excelUpdateShapeTool: ToolDefinition = {
  name: 'excel_update_shape',
  description: '修改 Excel 形状的各种属性，包括位置、大小、旋转角度和可见性，适用于布局调整、动画准备或重新设计',
  category: 'shape',
  application: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      shapeName: {
        type: 'string',
        description: '形状名称'
      },
      position: {
        type: 'object',
        description: '形状位置',
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
        description: '形状大小',
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
      rotation: {
        type: 'number',
        description: '旋转角度（度）'
      },
      visible: {
        type: 'boolean',
        description: '是否可见'
      },
      worksheetName: {
        type: 'string',
        description: '工作表名称（可选）'
      }
    },
    required: ['shapeName']
  },
  handler: async (args: any) => sendIPCCommand('excel_update_shape', args),
  examples: [
    {
      description: '更新形状位置和大小',
      input: {
        shapeName: 'Rectangle 1',
        position: {
          left: 200,
          top: 200
        },
        size: {
          width: 300,
          height: 150
        },
        rotation: 45
      },
      output: {
        success: true,
        message: '成功更新形状'
      }
    }
  ]
}

/**
 * 设置形状填充
 */
export const excelSetShapeFillTool: ToolDefinition = {
  name: 'excel_set_shape_fill',
  description: '配置 Excel 形状的填充效果，支持纯色、渐变、图案和图片填充，适用于美化外观、创建层次感或实现特殊视觉效果',
  category: 'shape',
  application: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      shapeName: {
        type: 'string',
        description: '形状名称'
      },
      fillType: {
        type: 'string',
        description: '填充类型（solid: 纯色，gradient: 渐变，pattern: 图案，picture: 图片，none: 无填充）',
        enum: ['solid', 'gradient', 'pattern', 'picture', 'none']
      },
      color: {
        type: 'string',
        description: '填充颜色（十六进制格式，如 #FF0000）'
      },
      transparency: {
        type: 'number',
        description: '透明度（0-1）',
        default: 0
      },
      worksheetName: {
        type: 'string',
        description: '工作表名称（可选）'
      }
    },
    required: ['shapeName', 'fillType']
  },
  handler: async (args: any) => sendIPCCommand('excel_set_shape_fill', args),
  examples: [
    {
      description: '设置形状填充为红色',
      input: {
        shapeName: 'Rectangle 1',
        fillType: 'solid',
        color: '#FF0000',
        transparency: 0.5
      },
      output: {
        success: true,
        message: '成功设置形状填充'
      }
    }
  ]
}

/**
 * 设置形状边框
 */
export const excelSetShapeLineTool: ToolDefinition = {
  name: 'excel_set_shape_line',
  description: '自定义 Excel 形状的边框样式，包括颜色、粗细、线型和透明度，适用于突出显示、分类标记或创建统一风格',
  category: 'shape',
  application: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      shapeName: {
        type: 'string',
        description: '形状名称'
      },
      color: {
        type: 'string',
        description: '边框颜色（十六进制格式）'
      },
      weight: {
        type: 'number',
        description: '边框粗细（像素）'
      },
      style: {
        type: 'string',
        description: '边框样式（solid: 实线，dash: 虚线，dot: 点线，dashDot: 点划线）',
        enum: ['solid', 'dash', 'dot', 'dashDot']
      },
      transparency: {
        type: 'number',
        description: '透明度（0-1）',
        default: 0
      },
      worksheetName: {
        type: 'string',
        description: '工作表名称（可选）'
      }
    },
    required: ['shapeName']
  },
  handler: async (args: any) => sendIPCCommand('excel_set_shape_line', args),
  examples: [
    {
      description: '设置形状边框',
      input: {
        shapeName: 'Rectangle 1',
        color: '#000000',
        weight: 2,
        style: 'solid'
      },
      output: {
        success: true,
        message: '成功设置形状边框'
      }
    }
  ]
}

/**
 * 添加形状文本
 */
export const excelAddShapeTextTool: ToolDefinition = {
  name: 'excel_add_shape_text',
  description: '向 Excel 形状中添加文本内容，支持设置字体大小、颜色、加粗和斜体，适用于添加标签、说明文字或创建图文结合的效果',
  category: 'shape',
  application: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      shapeName: {
        type: 'string',
        description: '形状名称'
      },
      text: {
        type: 'string',
        description: '文本内容'
      },
      fontSize: {
        type: 'number',
        description: '字体大小',
        default: 11
      },
      fontColor: {
        type: 'string',
        description: '字体颜色（十六进制格式）',
        default: '#000000'
      },
      bold: {
        type: 'boolean',
        description: '是否加粗',
        default: false
      },
      italic: {
        type: 'boolean',
        description: '是否斜体',
        default: false
      },
      worksheetName: {
        type: 'string',
        description: '工作表名称（可选）'
      }
    },
    required: ['shapeName', 'text']
  },
  handler: async (args: any) => sendIPCCommand('excel_add_shape_text', args),
  examples: [
    {
      description: '在形状中添加文本',
      input: {
        shapeName: 'Rectangle 1',
        text: '重要提示',
        fontSize: 14,
        fontColor: '#FFFFFF',
        bold: true
      },
      output: {
        success: true,
        message: '成功添加形状文本'
      }
    }
  ]
}

/**
 * 删除形状
 */
export const excelDeleteShapeTool: ToolDefinition = {
  name: 'excel_delete_shape',
  description: '移除指定的 Excel 形状，适用于清理工作表、重新设计布局或删除临时标注',
  category: 'shape',
  application: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      shapeName: {
        type: 'string',
        description: '形状名称'
      },
      worksheetName: {
        type: 'string',
        description: '工作表名称（可选）'
      }
    },
    required: ['shapeName']
  },
  handler: async (args: any) => sendIPCCommand('excel_delete_shape', args),
  examples: [
    {
      description: '删除形状',
      input: {
        shapeName: 'Rectangle 1'
      },
      output: {
        success: true,
        message: '成功删除形状'
      }
    }
  ]
}
