/**
 * PowerPoint 导出工具
 * 使用 PowerPointApi 1.1+ 实现导出操作
 * P1 阶段功能
 */

import { sendIPCCommand } from '@office-mcp/shared'
import type { ToolDefinition } from './types.js'

/**
 * 导出演示文稿为 PDF
 */
export const pptExportToPdfTool: ToolDefinition = {
  name: 'ppt_export_to_pdf',
  description: '将 PowerPoint 演示文稿导出为 PDF 文件',
  category: 'powerpoint',
  application: 'powerpoint',
  inputSchema: {
    type: 'object',
    properties: {
      filePath: {
        type: 'string',
        description: '导出的 PDF 文件路径'
      },
      includeHiddenSlides: {
        type: 'boolean',
        description: '是否包含隐藏的幻灯片',
        default: false
      }
    },
    required: ['filePath']
  },
  handler: async (args: any) => sendIPCCommand('ppt_export_to_pdf', args),
  examples: [
    {
      description: '导出为 PDF',
      input: { filePath: 'C:\\Documents\\presentation.pdf', includeHiddenSlides: false },
      output: { success: true, message: '成功导出为 PDF' }
    }
  ]
}

/**
 * 导出幻灯片为图片
 */
export const pptExportSlidesToImagesTool: ToolDefinition = {
  name: 'ppt_export_slides_to_images',
  description: '将 PowerPoint 幻灯片导出为图片文件',
  category: 'powerpoint',
  application: 'powerpoint',
  inputSchema: {
    type: 'object',
    properties: {
      folderPath: {
        type: 'string',
        description: '导出图片的文件夹路径'
      },
      format: {
        type: 'string',
        enum: ['png', 'jpg', 'gif', 'bmp'],
        description: '图片格式',
        default: 'png'
      },
      slideIndexes: {
        type: 'array',
        items: { type: 'number' },
        description: '要导出的幻灯片索引数组（不提供则导出全部）'
      },
      width: {
        type: 'number',
        description: '图片宽度（像素）',
        default: 1920
      },
      height: {
        type: 'number',
        description: '图片高度（像素）',
        default: 1080
      }
    },
    required: ['folderPath']
  },
  handler: async (args: any) => sendIPCCommand('ppt_export_slides_to_images', args),
  examples: [
    {
      description: '导出所有幻灯片为 PNG',
      input: { folderPath: 'C:\\Images', format: 'png', width: 1920, height: 1080 },
      output: { success: true, message: '成功导出 5 张幻灯片' }
    }
  ]
}

/**
 * 导出演示文稿为视频
 */
export const pptExportToVideoTool: ToolDefinition = {
  name: 'ppt_export_to_video',
  description: '将 PowerPoint 演示文稿导出为视频文件',
  category: 'powerpoint',
  application: 'powerpoint',
  inputSchema: {
    type: 'object',
    properties: {
      filePath: {
        type: 'string',
        description: '导出的视频文件路径'
      },
      quality: {
        type: 'string',
        enum: ['low', 'medium', 'high', 'ultra'],
        description: '视频质量',
        default: 'high'
      },
      secondsPerSlide: {
        type: 'number',
        description: '每张幻灯片显示秒数',
        default: 5
      }
    },
    required: ['filePath']
  },
  handler: async (args: any) => sendIPCCommand('ppt_export_to_video', args),
  examples: [
    {
      description: '导出为视频',
      input: { filePath: 'C:\\Videos\\presentation.mp4', quality: 'high', secondsPerSlide: 5 },
      output: { success: true, message: '成功导出为视频' }
    }
  ]
}
