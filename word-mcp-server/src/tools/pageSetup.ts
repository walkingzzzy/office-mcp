/**
 * word_page_setup - 页面设置
 * 合并 6 个原工具：setMargins, getMargins, setOrientation,
 * getOrientation, setSize, getSize
 * 采用 Get/Set 合并模式：当设置参数存在时为设置，否则为获取
 */

import { sendIPCCommand } from '@office-mcp/shared'
import type { ToolDefinition } from './types.js'

export const wordPageSetupTool: ToolDefinition = {
  name: 'word_page_setup',
  description: `页面设置工具。采用智能模式：
- 当提供设置参数时，执行设置操作
- 当不提供设置参数时，执行获取操作

可设置/获取的属性：
- margins: 页边距 { top, bottom, left, right }（磅）
- orientation: 页面方向 ('portrait' | 'landscape')
- size: 页面大小 { width, height }（磅）或预设名称`,
  category: 'page',
  application: 'word',
  inputSchema: {
    type: 'object',
    properties: {
      // 页边距
      margins: {
        type: 'object',
        description: '页边距设置（磅）。提供时设置，不提供时获取',
        properties: {
          top: { type: 'number', description: '上边距' },
          bottom: { type: 'number', description: '下边距' },
          left: { type: 'number', description: '左边距' },
          right: { type: 'number', description: '右边距' }
        }
      },
      // 页面方向
      orientation: {
        type: 'string',
        enum: ['portrait', 'landscape'],
        description: '页面方向。提供时设置，不提供时获取'
      },
      // 页面大小
      size: {
        oneOf: [
          {
            type: 'object',
            properties: {
              width: { type: 'number', description: '宽度（磅）' },
              height: { type: 'number', description: '高度（磅）' }
            }
          },
          {
            type: 'string',
            enum: ['A4', 'A3', 'A5', 'Letter', 'Legal', 'B5'],
            description: '预设纸张大小'
          }
        ],
        description: '页面大小。提供时设置，不提供时获取'
      }
    }
  },
  metadata: {
    version: '2.0.0',
    priority: 'P0',
    intentKeywords: [
      '页面设置', '页边距', '纸张方向', '横向', '纵向',
      '纸张大小', 'A4', '页面大小'
    ],
    mergedTools: [
      'word_set_page_margins', 'word_get_page_margins',
      'word_set_page_orientation', 'word_get_page_orientation',
      'word_set_page_size', 'word_get_page_size'
    ],
    supportedActions: ['get', 'set']
  },
  handler: async (args: Record<string, any>) => {
    const { margins, orientation, size } = args
    const results: any[] = []
    const operations: string[] = []

    // 处理页边距
    if (margins !== undefined) {
      operations.push('margins')
      const result = await sendIPCCommand('word_set_page_margins', margins)
      results.push({ property: 'margins', operation: 'set', result })
    } else {
      // 获取页边距
      const result = await sendIPCCommand('word_get_page_margins', {})
      results.push({ property: 'margins', operation: 'get', result })
    }

    // 处理页面方向
    if (orientation !== undefined) {
      operations.push('orientation')
      const result = await sendIPCCommand('word_set_page_orientation', { orientation })
      results.push({ property: 'orientation', operation: 'set', result })
    }

    // 处理页面大小
    if (size !== undefined) {
      operations.push('size')
      const sizeParams = typeof size === 'string' ? { preset: size } : size
      const result = await sendIPCCommand('word_set_page_size', sizeParams)
      results.push({ property: 'size', operation: 'set', result })
    }

    // 如果没有任何设置参数，返回所有页面设置
    if (operations.length === 0) {
      const [marginsResult, orientationResult, sizeResult] = await Promise.all([
        sendIPCCommand('word_get_page_margins', {}),
        sendIPCCommand('word_get_page_orientation', {}),
        sendIPCCommand('word_get_page_size', {})
      ])

      return {
        success: true,
        message: '成功获取页面设置',
        data: {
          margins: marginsResult.data,
          orientation: orientationResult.data,
          size: sizeResult.data
        }
      }
    }

    // 检查所有操作是否成功
    const allSuccess = results.every(r => r.result?.success !== false)

    return {
      success: allSuccess,
      message: allSuccess
        ? `成功设置: ${operations.join(', ')}`
        : '部分设置失败',
      data: {
        operations,
        details: results
      }
    }
  },
  examples: [
    {
      description: '获取所有页面设置',
      input: {},
      output: {
        success: true,
        message: '成功获取页面设置',
        data: {
          margins: { top: 72, bottom: 72, left: 90, right: 90 },
          orientation: 'portrait',
          size: { width: 595, height: 842 }
        }
      }
    },
    {
      description: '设置页边距',
      input: { margins: { top: 72, bottom: 72, left: 72, right: 72 } },
      output: { success: true, message: '成功设置: margins' }
    },
    {
      description: '设置横向和 A4 纸张',
      input: { orientation: 'landscape', size: 'A4' },
      output: { success: true, message: '成功设置: orientation, size' }
    }
  ]
}
