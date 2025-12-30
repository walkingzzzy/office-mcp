/**
 * PowerPoint Slide Tools
 */

import type { ToolDefinition } from './types.js'
import type { PowerPointAddSlideArgs, ToolExecutionResult } from '../types/index.js'

/**
 * Tool: ppt_add_slide
 * Add a new slide to PowerPoint presentation
 */
export const pptAddSlideTool: ToolDefinition = {
  name: 'ppt_add_slide',
  description: '向 PowerPoint 演示文稿添加新幻灯片（带指定布局）',
  category: 'powerpoint',
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
        description:
          'Position to insert slide (0-based index). If not specified, adds to end of presentation'
      }
    },
    required: []
  },
  handler: async (args: PowerPointAddSlideArgs): Promise<ToolExecutionResult> => {
    // Validate index if provided
    if (args.index !== undefined && args.index < 0) {
      return {
        success: false,
        error: 'Invalid index. Must be >= 0'
      }
    }

    return {
      success: true,
      message: 'Tool handler registered. Execution happens in Office plugin via IPC.',
      data: {
        toolName: 'ppt_add_slide',
        args
      }
    }
  }
}
