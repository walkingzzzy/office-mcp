/**
 * PowerPoint Browser Tools
 *
 * 这些工具通过 IPC 调用浏览器端的 Office.js API
 * 对应 MCPToolExecutor 中的 PowerPoint 工具
 */

import type { ToolDefinition } from '../types.js'
import { getBrowserToolExecutor } from './BrowserToolExecutor.js'

/**
 * PowerPoint - 添加幻灯片 (浏览器端)
 */
export const pptAddSlideBrowserTool: ToolDefinition = {
  name: 'ppt_add_slide_browser',
  description: 'Add a new slide to PowerPoint presentation with specified layout (browser execution)',
  category: 'powerpoint',
  metadata: {
    documentTypes: ['powerpoint'],
    intentKeywords: ['幻灯片', '添加', '新建', 'slide', 'add', '插入页'],
    applicableFor: ['none'],
    priority: 'P0',
    scenario: '在 PowerPoint 中添加新幻灯片'
  },
  inputSchema: {
    type: 'object',
    properties: {
      layoutName: {
        type: 'string',
        enum: ['blank', 'title', 'titleOnly', 'titleAndBody', 'twoColumns'],
        description:
          'Slide layout type: blank (empty slide), title (title slide), titleOnly (title only), titleAndBody (title and content), twoColumns (two column layout)',
        default: 'blank'
      },
      index: {
        type: 'number',
        description: 'Position to insert slide (0-based index). If not specified, adds to end of presentation'
      }
    },
    required: []
  },
  handler: async (args) => {
    const executor = getBrowserToolExecutor()
    return await executor.executeBrowserTool('ppt_add_slide', args)
  }
}

/**
 * 获取所有 PowerPoint 浏览器工具
 */
export function getPowerPointBrowserTools(): ToolDefinition[] {
  return [pptAddSlideBrowserTool]
}
