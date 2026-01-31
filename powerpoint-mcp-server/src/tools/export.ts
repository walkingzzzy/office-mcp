/**
 * ppt_export - 导出功能
 * 合并 3 个原工具
 * 
 * 使用工具工厂创建，包含参数验证和路径验证
 */

import { createActionTool, required } from '@office-mcp/shared'

const SUPPORTED_ACTIONS = [
  'toPdf', 'toImages', 'toVideo'
] as const

export const pptExportTool = createActionTool({
  name: 'ppt_export',
  description: `导出功能工具。支持的操作(action):
- toPdf: 导出为PDF (需要 outputPath, 可选 slideRange)
- toImages: 导出为图片 (需要 outputPath, 可选 format, slideRange)
- toVideo: 导出为视频 (需要 outputPath, 可选 resolution, fps)`,
  category: 'export',
  application: 'powerpoint',
  actions: SUPPORTED_ACTIONS,
  commandMap: {
    toPdf: 'ppt_export_to_pdf',
    toImages: 'ppt_export_slides_to_images',
    toVideo: 'ppt_export_to_video'
  },
  paramRules: {
    toPdf: [required('outputPath', 'string')],
    toImages: [required('outputPath', 'string')],
    toVideo: [required('outputPath', 'string')]
  },
  pathParams: {
    filePath: ['outputPath']
  },
  properties: {
    outputPath: { type: 'string', description: '[所有操作] 输出路径' },
    slideRange: { type: 'object', description: '[toPdf/toImages] 幻灯片范围', properties: { start: { type: 'number' }, end: { type: 'number' } } },
    format: { type: 'string', enum: ['png', 'jpg', 'gif', 'bmp'], description: '[toImages] 图片格式' },
    resolution: { type: 'string', enum: ['480p', '720p', '1080p', '4k'], description: '[toVideo] 视频分辨率' },
    fps: { type: 'number', description: '[toVideo] 帧率' }
  },
  metadata: {
    version: '2.1.0',
    priority: 'P1',
    intentKeywords: ['导出', 'PDF', '图片', '视频', '转换'],
    mergedTools: [
      'ppt_export_to_pdf', 'ppt_export_slides_to_images', 'ppt_export_to_video'
    ]
  },
  examples: [
    {
      description: '导出为PDF',
      input: { action: 'toPdf', outputPath: 'C:\\output\\presentation.pdf' },
      output: { success: true, message: '成功导出PDF', action: 'toPdf' }
    }
  ]
})
