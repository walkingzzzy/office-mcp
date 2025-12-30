/**
 * Excel 图片工具
 * 使用 Office.js API (ExcelApi 1.2+) 实现图片操作
 */

import type { ToolDefinition } from './types.js'
import { sendIPCCommand } from '@office-mcp/shared'

/**
 * 插入图片
 */
export const excelInsertImageTool: ToolDefinition = {
  name: 'excel_insert_image',
  description: '在 Excel 工作表中插入图片，支持通过 Base64 编码或 URL 方式插入，可自定义位置和大小，适用于添加公司 Logo、产品图片、数据可视化图表等场景',
  category: 'excel',
  application: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      base64: {
        type: 'string',
        description: '图片的 Base64 编码字符串'
      },
      url: {
        type: 'string',
        description: '图片 URL（与 base64 二选一）'
      },
      name: {
        type: 'string',
        description: '图片名称'
      },
      left: {
        type: 'number',
        description: '图片左边距（像素）',
        default: 0
      },
      top: {
        type: 'number',
        description: '图片上边距（像素）',
        default: 0
      },
      width: {
        type: 'number',
        description: '图片宽度（像素）'
      },
      height: {
        type: 'number',
        description: '图片高度（像素）'
      }
    },
    required: []
  },
  handler: async (args: any) => sendIPCCommand('excel_insert_image', args),
  examples: [
    {
      description: '插入图片到工作表',
      input: { base64: 'iVBORw0KGgo...', name: 'logo', left: 100, top: 100, width: 200, height: 100 },
      output: { success: true, message: '成功插入图片' }
    }
  ]
}

/**
 * 删除图片
 */
export const excelDeleteImageTool: ToolDefinition = {
  name: 'excel_delete_image',
  description: '删除 Excel 工作表中的指定图片，支持通过图片名称或索引定位删除，适用于清理临时图片、更新图片资源或批量管理工作表中的图片元素',
  category: 'excel',
  application: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        description: '图片名称'
      },
      index: {
        type: 'number',
        description: '图片索引（从 0 开始）'
      }
    },
    required: []
  },
  handler: async (args: any) => sendIPCCommand('excel_delete_image', args),
  examples: [
    {
      description: '通过名称删除图片',
      input: { name: 'logo' },
      output: { success: true, message: '成功删除图片' }
    }
  ]
}

/**
 * 调整图片大小
 */
export const excelResizeImageTool: ToolDefinition = {
  name: 'excel_resize_image',
  description: '调整 Excel 工作表中图片的大小，支持直接设置像素尺寸或按比例缩放，可锁定纵横比保持图片比例，适用于适配不同布局需求和统一图片尺寸规范',
  category: 'excel',
  application: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        description: '图片名称'
      },
      index: {
        type: 'number',
        description: '图片索引（从 0 开始）'
      },
      width: {
        type: 'number',
        description: '新宽度（像素）'
      },
      height: {
        type: 'number',
        description: '新高度（像素）'
      },
      scaleWidth: {
        type: 'number',
        description: '宽度缩放比例（0-1）'
      },
      scaleHeight: {
        type: 'number',
        description: '高度缩放比例（0-1）'
      }
    },
    required: []
  },
  handler: async (args: any) => sendIPCCommand('excel_resize_image', args),
  examples: [
    {
      description: '调整图片大小',
      input: { name: 'logo', width: 300, height: 150 },
      output: { success: true, message: '成功调整图片大小' }
    }
  ]
}

/**
 * 移动图片
 */
export const excelMoveImageTool: ToolDefinition = {
  name: 'excel_move_image',
  description: '移动 Excel 工作表中图片到指定位置，通过设置左边距和上边距精确控制图片位置，适用于重新布局工作表、对齐多个图片或创建图文混排效果',
  category: 'excel',
  application: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        description: '图片名称'
      },
      index: {
        type: 'number',
        description: '图片索引（从 0 开始）'
      },
      left: {
        type: 'number',
        description: '新的左边距（像素）'
      },
      top: {
        type: 'number',
        description: '新的上边距（像素）'
      }
    },
    required: []
  },
  handler: async (args: any) => sendIPCCommand('excel_move_image', args),
  examples: [
    {
      description: '移动图片位置',
      input: { name: 'logo', left: 200, top: 200 },
      output: { success: true, message: '成功移动图片' }
    }
  ]
}

/**
 * 获取所有图片
 */
export const excelGetImagesTool: ToolDefinition = {
  name: 'excel_get_images',
  description: '获取 Excel 工作表中所有图片的详细信息列表，包括图片名称、位置、尺寸等属性，适用于批量管理图片、检查图片状态或生成图片清单报告',
  category: 'excel',
  application: 'excel',
  inputSchema: {
    type: 'object',
    properties: {},
    required: []
  },
  handler: async (args: any) => sendIPCCommand('excel_get_images', args),
  examples: [
    {
      description: '获取所有图片',
      input: {},
      output: { success: true, data: { images: [] } }
    }
  ]
}

/**
 * 设置图片属性
 */
export const excelSetImagePropertiesTool: ToolDefinition = {
  name: 'excel_set_image_properties',
  description: '设置 Excel 工作表中图片的各种属性，包括锁定纵横比、旋转角度、透明度等，适用于创建特殊视觉效果、保护图片比例或实现图片叠加效果',
  category: 'excel',
  application: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        description: '图片名称'
      },
      index: {
        type: 'number',
        description: '图片索引（从 0 开始）'
      },
      lockAspectRatio: {
        type: 'boolean',
        description: '是否锁定纵横比'
      },
      rotation: {
        type: 'number',
        description: '旋转角度（度）'
      },
      transparency: {
        type: 'number',
        description: '透明度（0-1）'
      }
    },
    required: []
  },
  handler: async (args: any) => sendIPCCommand('excel_set_image_properties', args),
  examples: [
    {
      description: '设置图片属性',
      input: { name: 'logo', lockAspectRatio: true, rotation: 45 },
      output: { success: true, message: '成功设置图片属性' }
    }
  ]
}
