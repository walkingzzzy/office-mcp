/**
 * ppt_export - 导出功能
 * 合并 3 个原工具
 */

import { sendIPCCommand } from '@office-mcp/shared'
import type { ToolDefinition } from './types.js'
import { validateAction, unsupportedActionError } from './types.js'

const SUPPORTED_ACTIONS = [
  'toPdf', 'toImages', 'toVideo'
] as const

type ExportAction = typeof SUPPORTED_ACTIONS[number]

export const pptExportTool: ToolDefinition = {
  name: 'ppt_export',
  description: `导出功能工具。支持的操作(action):
- toPdf: 导出为PDF (需要 outputPath, 可选 slideRange)
- toImages: 导出为图片 (需要 outputPath, 可选 format, slideRange)
- toVideo: 导出为视频 (需要 outputPath, 可选 resolution, fps)`,
  category: 'export',
  application: 'powerpoint',
  inputSchema: {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        enum: SUPPORTED_ACTIONS,
        description: '要执行的操作'
      },
      outputPath: {
        type: 'string',
        description: '[所有操作] 输出路径'
      },
      slideRange: {
        type: 'object',
        description: '[toPdf/toImages] 幻灯片范围',
        properties: {
          start: { type: 'number' },
          end: { type: 'number' }
        }
      },
      format: {
        type: 'string',
        enum: ['png', 'jpg', 'gif', 'bmp'],
        description: '[toImages] 图片格式'
      },
      resolution: {
        type: 'string',
        enum: ['480p', '720p', '1080p', '4k'],
        description: '[toVideo] 视频分辨率'
      },
      fps: {
        type: 'number',
        description: '[toVideo] 帧率'
      }
    },
    required: ['action', 'outputPath']
  },
  metadata: {
    version: '2.0.0',
    priority: 'P1',
    intentKeywords: ['导出', 'PDF', '图片', '视频', '转换'],
    mergedTools: [
      'ppt_export_to_pdf', 'ppt_export_slides_to_images', 'ppt_export_to_video'
    ],
    supportedActions: [...SUPPORTED_ACTIONS]
  },
  handler: async (args: Record<string, any>) => {
    const { action, ...params } = args

    if (!validateAction(action, [...SUPPORTED_ACTIONS])) {
      return unsupportedActionError(action, [...SUPPORTED_ACTIONS])
    }

    const commandMap: Record<ExportAction, string> = {
      toPdf: 'ppt_export_to_pdf',
      toImages: 'ppt_export_slides_to_images',
      toVideo: 'ppt_export_to_video'
    }

    const command = commandMap[action as ExportAction]
    const result = await sendIPCCommand(command, params)

    return { ...result, action }
  },
  examples: [
    {
      description: '导出为PDF',
      input: { action: 'toPdf', outputPath: 'C:\\output\\presentation.pdf' },
      output: { success: true, message: '成功导出PDF', action: 'toPdf' }
    }
  ]
}
