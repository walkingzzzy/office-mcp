/**
 * Word 画布工具
 * 使用 WordApi 1.3+ 实现画布和几何图形操作
 * P3 阶段功能
 */

import { sendIPCCommand } from '@office-mcp/shared'
import type { ToolDefinition } from './types.js'

/**
 * 插入画布
 */
export const wordInsertCanvasTool: ToolDefinition = {
  name: 'word_insert_canvas',
  description: '在 Word 文档中插入绘图画布',
  category: 'canvas',
  application: 'word',
  inputSchema: {
    type: 'object',
    properties: {
      width: {
        type: 'number',
        description: '画布宽度（像素）',
        default: 400
      },
      height: {
        type: 'number',
        description: '画布高度（像素）',
        default: 300
      },
      position: {
        type: 'string',
        description: '插入位置（start: 开头，end: 结尾，replace: 替换选区）',
        enum: ['start', 'end', 'replace'],
        default: 'end'
      }
    },
    required: []
  },
  handler: async (args: any) => sendIPCCommand('word_insert_canvas', args),
  examples: [
    {
      description: '插入画布',
      input: {
        width: 500,
        height: 400,
        position: 'end'
      },
      output: {
        success: true,
        message: '成功插入画布',
        data: {
          canvasId: 'canvas1'
        }
      }
    }
  ]
}

/**
 * 插入几何图形
 */
export const wordInsertGeometricShapeTool: ToolDefinition = {
  name: 'word_insert_geometric_shape',
  description: '在 Word 文档中插入几何图形',
  category: 'canvas',
  application: 'word',
  inputSchema: {
    type: 'object',
    properties: {
      shapeType: {
        type: 'string',
        description: '图形类型',
        enum: [
          'rectangle',
          'roundedRectangle',
          'oval',
          'circle',
          'triangle',
          'rightTriangle',
          'diamond',
          'pentagon',
          'hexagon',
          'octagon',
          'star',
          'arrow',
          'line',
          'curve'
        ]
      },
      width: {
        type: 'number',
        description: '图形宽度（像素）'
      },
      height: {
        type: 'number',
        description: '图形高度（像素）'
      },
      position: {
        type: 'string',
        description: '插入位置',
        enum: ['start', 'end', 'replace'],
        default: 'end'
      },
      fillColor: {
        type: 'string',
        description: '填充颜色（十六进制格式）',
        default: '#FFFFFF'
      },
      lineColor: {
        type: 'string',
        description: '边框颜色（十六进制格式）',
        default: '#000000'
      },
      lineWeight: {
        type: 'number',
        description: '边框粗细（像素）',
        default: 1
      }
    },
    required: ['shapeType', 'width', 'height']
  },
  handler: async (args: any) => sendIPCCommand('word_insert_geometric_shape', args),
  examples: [
    {
      description: '插入圆形',
      input: {
        shapeType: 'circle',
        width: 100,
        height: 100,
        fillColor: '#FF0000',
        lineColor: '#000000',
        lineWeight: 2
      },
      output: {
        success: true,
        message: '成功插入几何图形',
        data: {
          shapeId: 'shape1'
        }
      }
    }
  ]
}

/**
 * 获取画布列表
 */
export const wordGetCanvasesTool: ToolDefinition = {
  name: 'word_get_canvases',
  description: '获取 Word 文档中的所有画布',
  category: 'canvas',
  application: 'word',
  inputSchema: {
    type: 'object',
    properties: {},
    required: []
  },
  handler: async (args: any) => sendIPCCommand('word_get_canvases', args),
  examples: [
    {
      description: '获取所有画布',
      input: {},
      output: {
        success: true,
        message: '成功获取 2 个画布',
        data: {
          canvases: [
            {
              id: 'canvas1',
              width: 500,
              height: 400,
              shapeCount: 3
            }
          ]
        }
      }
    }
  ]
}

/**
 * 删除画布
 */
export const wordDeleteCanvasTool: ToolDefinition = {
  name: 'word_delete_canvas',
  description: '删除 Word 文档中的画布',
  category: 'canvas',
  application: 'word',
  inputSchema: {
    type: 'object',
    properties: {
      canvasId: {
        type: 'string',
        description: '画布 ID'
      }
    },
    required: ['canvasId']
  },
  handler: async (args: any) => sendIPCCommand('word_delete_canvas', args),
  examples: [
    {
      description: '删除画布',
      input: { canvasId: 'canvas1' },
      output: {
        success: true,
        message: '成功删除画布'
      }
    }
  ]
}

/**
 * 在画布中添加图形
 */
export const wordAddShapeToCanvasTool: ToolDefinition = {
  name: 'word_add_shape_to_canvas',
  description: '在指定画布中添加几何图形',
  category: 'canvas',
  application: 'word',
  inputSchema: {
    type: 'object',
    properties: {
      canvasId: {
        type: 'string',
        description: '画布 ID'
      },
      shapeType: {
        type: 'string',
        description: '图形类型',
        enum: [
          'rectangle',
          'oval',
          'triangle',
          'diamond',
          'pentagon',
          'hexagon',
          'star',
          'arrow',
          'line'
        ]
      },
      x: {
        type: 'number',
        description: 'X 坐标（相对于画布）'
      },
      y: {
        type: 'number',
        description: 'Y 坐标（相对于画布）'
      },
      width: {
        type: 'number',
        description: '图形宽度'
      },
      height: {
        type: 'number',
        description: '图形高度'
      },
      fillColor: {
        type: 'string',
        description: '填充颜色',
        default: '#FFFFFF'
      },
      lineColor: {
        type: 'string',
        description: '边框颜色',
        default: '#000000'
      }
    },
    required: ['canvasId', 'shapeType', 'x', 'y', 'width', 'height']
  },
  handler: async (args: any) => sendIPCCommand('word_add_shape_to_canvas', args),
  examples: [
    {
      description: '在画布中添加矩形',
      input: {
        canvasId: 'canvas1',
        shapeType: 'rectangle',
        x: 50,
        y: 50,
        width: 100,
        height: 80,
        fillColor: '#0000FF'
      },
      output: {
        success: true,
        message: '成功添加图形到画布',
        data: {
          shapeId: 'shape2'
        }
      }
    }
  ]
}

/**
 * 获取画布中的图形
 */
export const wordGetCanvasShapesTool: ToolDefinition = {
  name: 'word_get_canvas_shapes',
  description: '获取指定画布中的所有图形',
  category: 'canvas',
  application: 'word',
  inputSchema: {
    type: 'object',
    properties: {
      canvasId: {
        type: 'string',
        description: '画布 ID'
      }
    },
    required: ['canvasId']
  },
  handler: async (args: any) => sendIPCCommand('word_get_canvas_shapes', args),
  examples: [
    {
      description: '获取画布中的图形',
      input: { canvasId: 'canvas1' },
      output: {
        success: true,
        message: '成功获取 3 个图形',
        data: {
          shapes: [
            {
              id: 'shape1',
              type: 'rectangle',
              x: 50,
              y: 50,
              width: 100,
              height: 80
            }
          ]
        }
      }
    }
  ]
}
