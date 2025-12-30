/**
 * Word 形状工具
 * 使用 Office.js API (WordApi 1.3+) 实现形状操作
 *
 * 注意：Shape API 仅在桌面版 Office 中可用（Windows/Mac）
 * Web 版 Office 不支持 Shape API
 *
 * 错误处理：
 * - 使用统一的错误码体系
 * - 提供友好的错误提示和恢复建议
 * - 支持参数验证和平台检测
 */

import type { ToolDefinition } from './types.js'
import { sendIPCCommand } from '@office-mcp/shared'
import { ToolErrorHandler } from '../utils/ToolErrorHandler.js'

/**
 * 插入形状
 * 支持的形状类型：rectangle, ellipse, triangle, rightTriangle, parallelogram, trapezoid,
 * diamond, pentagon, hexagon, octagon, star, plus, arrow, line 等
 */
export const wordInsertShapeTool: ToolDefinition = {
  name: 'word_insert_shape',
  description: '在 Word 文档中插入形状（仅桌面版支持）',
  category: 'word',
  application: 'word',
  inputSchema: {
    type: 'object',
    properties: {
      shapeType: {
        type: 'string',
        description: '形状类型：rectangle（矩形）, ellipse（椭圆）, triangle（三角形）, diamond（菱形）, pentagon（五边形）, hexagon（六边形）, star（星形）, arrow（箭头）等',
        enum: ['rectangle', 'ellipse', 'triangle', 'rightTriangle', 'parallelogram', 'trapezoid', 'diamond', 'pentagon', 'hexagon', 'octagon', 'star', 'plus', 'arrow', 'line']
      },
      width: {
        type: 'number',
        description: '形状宽度（磅）',
        minimum: 1
      },
      height: {
        type: 'number',
        description: '形状高度（磅）',
        minimum: 1
      },
      left: {
        type: 'number',
        description: '左边距（磅）',
        default: 0
      },
      top: {
        type: 'number',
        description: '上边距（磅）',
        default: 0
      }
    },
    required: ['shapeType', 'width', 'height']
  },
  handler: ToolErrorHandler.wrapHandler(async (args: any) => {
    // 参数验证
    const paramError = ToolErrorHandler.validateRequiredParams(args, ['shapeType', 'width', 'height'])
    if (paramError) {
      return paramError
    }

    const typeError = ToolErrorHandler.validateParamTypes(args, {
      shapeType: 'string',
      width: 'number',
      height: 'number',
      left: 'number',
      top: 'number'
    })
    if (typeError) {
      return typeError
    }

    // 调用 IPC 命令
    try {
      const result = await sendIPCCommand('word_insert_shape', args)
      return result
    } catch (error: any) {
      return ToolErrorHandler.handleIpcError(error.message, error)
    }
  }),
  examples: [
    {
      description: '插入矩形',
      input: { shapeType: 'rectangle', width: 200, height: 100, left: 50, top: 50 },
      output: { success: true, message: '成功插入形状', data: { shapeId: 'shape1' } }
    },
    {
      description: '插入星形',
      input: { shapeType: 'star', width: 150, height: 150 },
      output: { success: true, message: '成功插入形状', data: { shapeId: 'shape2' } }
    }
  ]
}

/**
 * 删除形状
 */
export const wordDeleteShapeTool: ToolDefinition = {
  name: 'word_delete_shape',
  description: '删除 Word 文档中的形状（仅桌面版支持）',
  category: 'word',
  application: 'word',
  inputSchema: {
    type: 'object',
    properties: {
      shapeId: {
        type: 'string',
        description: '形状 ID'
      },
      shapeIndex: {
        type: 'number',
        description: '形状索引（从 0 开始，与 shapeId 二选一）'
      }
    },
    required: []
  },
  handler: ToolErrorHandler.wrapHandler(async (args: any) => {
    // 至少需要一个标识符
    if (!args.shapeId && args.shapeIndex === undefined) {
      return ToolErrorHandler.handleMissingRequiredParam('shapeId 或 shapeIndex')
    }

    try {
      const result = await sendIPCCommand('word_delete_shape', args)
      return result
    } catch (error: any) {
      return ToolErrorHandler.handleIpcError(error.message, error)
    }
  }),
  examples: [
    {
      description: '通过索引删除形状',
      input: { shapeIndex: 0 },
      output: { success: true, message: '成功删除形状' }
    }
  ]
}

/**
 * 获取形状信息
 */
export const wordGetShapeTool: ToolDefinition = {
  name: 'word_get_shape',
  description: '获取 Word 文档中形状的信息（仅桌面版支持）',
  category: 'word',
  application: 'word',
  inputSchema: {
    type: 'object',
    properties: {
      shapeId: {
        type: 'string',
        description: '形状 ID'
      },
      shapeIndex: {
        type: 'number',
        description: '形状索引（从 0 开始，与 shapeId 二选一）'
      }
    },
    required: []
  },
  handler: async (args: any) => sendIPCCommand('word_get_shape', args),
  examples: [
    {
      description: '获取形状信息',
      input: { shapeIndex: 0 },
      output: {
        success: true,
        data: {
          id: 'shape1',
          type: 'rectangle',
          width: 200,
          height: 100,
          left: 50,
          top: 50,
          rotation: 0
        }
      }
    }
  ]
}

/**
 * 设置形状属性
 */
export const wordSetShapePropertiesTool: ToolDefinition = {
  name: 'word_set_shape_properties',
  description: '设置 Word 文档中形状的属性（仅桌面版支持）',
  category: 'word',
  application: 'word',
  inputSchema: {
    type: 'object',
    properties: {
      shapeId: {
        type: 'string',
        description: '形状 ID'
      },
      shapeIndex: {
        type: 'number',
        description: '形状索引（从 0 开始，与 shapeId 二选一）'
      },
      width: {
        type: 'number',
        description: '宽度（磅）'
      },
      height: {
        type: 'number',
        description: '高度（磅）'
      },
      rotation: {
        type: 'number',
        description: '旋转角度（度）',
        minimum: -360,
        maximum: 360
      },
      lockAspectRatio: {
        type: 'boolean',
        description: '是否锁定纵横比'
      }
    },
    required: []
  },
  handler: ToolErrorHandler.wrapHandler(async (args: any) => {
    if (!args.shapeId && args.shapeIndex === undefined) {
      return ToolErrorHandler.handleMissingRequiredParam('shapeId 或 shapeIndex')
    }

    try {
      const result = await sendIPCCommand('word_set_shape_properties', args)
      return result
    } catch (error: any) {
      return ToolErrorHandler.handleIpcError(error.message, error)
    }
  }),
  examples: [
    {
      description: '调整形状大小',
      input: { shapeIndex: 0, width: 300, height: 150 },
      output: { success: true, message: '成功设置形状属性' }
    },
    {
      description: '旋转形状',
      input: { shapeIndex: 0, rotation: 45 },
      output: { success: true, message: '成功设置形状属性' }
    }
  ]
}

/**
 * 移动形状
 */
export const wordMoveShapeTool: ToolDefinition = {
  name: 'word_move_shape',
  description: '移动 Word 文档中的形状位置（仅桌面版支持）',
  category: 'word',
  application: 'word',
  inputSchema: {
    type: 'object',
    properties: {
      shapeId: {
        type: 'string',
        description: '形状 ID'
      },
      shapeIndex: {
        type: 'number',
        description: '形状索引（从 0 开始，与 shapeId 二选一）'
      },
      left: {
        type: 'number',
        description: '新的左边距（磅）'
      },
      top: {
        type: 'number',
        description: '新的上边距（磅）'
      }
    },
    required: ['left', 'top']
  },
  handler: ToolErrorHandler.wrapHandler(async (args: any) => {
    if (!args.shapeId && args.shapeIndex === undefined) {
      return ToolErrorHandler.handleMissingRequiredParam('shapeId 或 shapeIndex')
    }

    const paramError = ToolErrorHandler.validateRequiredParams(args, ['left', 'top'])
    if (paramError) {
      return paramError
    }

    try {
      const result = await sendIPCCommand('word_move_shape', args)
      return result
    } catch (error: any) {
      return ToolErrorHandler.handleIpcError(error.message, error)
    }
  }),
  examples: [
    {
      description: '移动形状位置',
      input: { shapeIndex: 0, left: 100, top: 200 },
      output: { success: true, message: '成功移动形状' }
    }
  ]
}

/**
 * 调整形状大小
 */
export const wordResizeShapeTool: ToolDefinition = {
  name: 'word_resize_shape',
  description: '调整 Word 文档中形状的大小（仅桌面版支持）',
  category: 'word',
  application: 'word',
  inputSchema: {
    type: 'object',
    properties: {
      shapeId: {
        type: 'string',
        description: '形状 ID'
      },
      shapeIndex: {
        type: 'number',
        description: '形状索引（从 0 开始，与 shapeId 二选一）'
      },
      width: {
        type: 'number',
        description: '新宽度（磅）',
        minimum: 1
      },
      height: {
        type: 'number',
        description: '新高度（磅）',
        minimum: 1
      },
      maintainAspectRatio: {
        type: 'boolean',
        description: '是否保持纵横比',
        default: false
      }
    },
    required: []
  },
  handler: ToolErrorHandler.wrapHandler(async (args: any) => {
    if (!args.shapeId && args.shapeIndex === undefined) {
      return ToolErrorHandler.handleMissingRequiredParam('shapeId 或 shapeIndex')
    }

    if (!args.width && !args.height) {
      return ToolErrorHandler.handleMissingRequiredParam('width 或 height')
    }

    try {
      const result = await sendIPCCommand('word_resize_shape', args)
      return result
    } catch (error: any) {
      return ToolErrorHandler.handleIpcError(error.message, error)
    }
  }),
  examples: [
    {
      description: '调整形状大小',
      input: { shapeIndex: 0, width: 250, height: 125, maintainAspectRatio: true },
      output: { success: true, message: '成功调整形状大小' }
    }
  ]
}

/**
 * 设置形状填充
 */
export const wordSetShapeFillTool: ToolDefinition = {
  name: 'word_set_shape_fill',
  description: '设置 Word 文档中形状的填充颜色（仅桌面版支持）',
  category: 'word',
  application: 'word',
  inputSchema: {
    type: 'object',
    properties: {
      shapeId: {
        type: 'string',
        description: '形状 ID'
      },
      shapeIndex: {
        type: 'number',
        description: '形状索引（从 0 开始，与 shapeId 二选一）'
      },
      fillType: {
        type: 'string',
        description: '填充类型',
        enum: ['solid', 'gradient', 'pattern', 'picture', 'none'],
        default: 'solid'
      },
      color: {
        type: 'string',
        description: '填充颜色（十六进制格式，如 #FF0000）'
      },
      transparency: {
        type: 'number',
        description: '透明度（0-1）',
        minimum: 0,
        maximum: 1,
        default: 0
      }
    },
    required: []
  },
  handler: ToolErrorHandler.wrapHandler(async (args: any) => {
    if (!args.shapeId && args.shapeIndex === undefined) {
      return ToolErrorHandler.handleMissingRequiredParam('shapeId 或 shapeIndex')
    }

    try {
      const result = await sendIPCCommand('word_set_shape_fill', args)
      return result
    } catch (error: any) {
      return ToolErrorHandler.handleIpcError(error.message, error)
    }
  }),
  examples: [
    {
      description: '设置形状填充为红色',
      input: { shapeIndex: 0, fillType: 'solid', color: '#FF0000' },
      output: { success: true, message: '成功设置形状填充' }
    },
    {
      description: '设置形状半透明蓝色填充',
      input: { shapeIndex: 0, fillType: 'solid', color: '#0000FF', transparency: 0.5 },
      output: { success: true, message: '成功设置形状填充' }
    }
  ]
}

/**
 * 设置形状边框
 */
export const wordSetShapeLineTool: ToolDefinition = {
  name: 'word_set_shape_line',
  description: '设置 Word 文档中形状的边框样式（仅桌面版支持）',
  category: 'word',
  application: 'word',
  inputSchema: {
    type: 'object',
    properties: {
      shapeId: {
        type: 'string',
        description: '形状 ID'
      },
      shapeIndex: {
        type: 'number',
        description: '形状索引（从 0 开始，与 shapeId 二选一）'
      },
      color: {
        type: 'string',
        description: '边框颜色（十六进制格式，如 #000000）'
      },
      weight: {
        type: 'number',
        description: '边框粗细（磅）',
        minimum: 0
      },
      dashStyle: {
        type: 'string',
        description: '边框样式',
        enum: ['solid', 'dash', 'dot', 'dashDot', 'dashDotDot', 'longDash', 'longDashDot'],
        default: 'solid'
      },
      transparency: {
        type: 'number',
        description: '透明度（0-1）',
        minimum: 0,
        maximum: 1,
        default: 0
      }
    },
    required: []
  },
  handler: ToolErrorHandler.wrapHandler(async (args: any) => {
    if (!args.shapeId && args.shapeIndex === undefined) {
      return ToolErrorHandler.handleMissingRequiredParam('shapeId 或 shapeIndex')
    }

    try {
      const result = await sendIPCCommand('word_set_shape_line', args)
      return result
    } catch (error: any) {
      return ToolErrorHandler.handleIpcError(error.message, error)
    }
  }),
  examples: [
    {
      description: '设置形状黑色实线边框',
      input: { shapeIndex: 0, color: '#000000', weight: 2, dashStyle: 'solid' },
      output: { success: true, message: '成功设置形状边框' }
    },
    {
      description: '设置形状虚线边框',
      input: { shapeIndex: 0, color: '#FF0000', weight: 1.5, dashStyle: 'dash' },
      output: { success: true, message: '成功设置形状边框' }
    }
  ]
}
