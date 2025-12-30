/**
 * PowerPoint 超链接工具
 * 使用 PowerPointApi 1.1+ 实现超链接操作
 * P1 阶段功能
 */

import { sendIPCCommand } from '@office-mcp/shared'
import type { ToolDefinition } from './types.js'

/**
 * 添加超链接到形状
 */
export const pptAddHyperlinkToShapeTool: ToolDefinition = {
  name: 'ppt_add_hyperlink_to_shape',
  description: '为 PowerPoint 幻灯片中的形状添加超链接',
  category: 'powerpoint',
  application: 'powerpoint',
  inputSchema: {
    type: 'object',
    properties: {
      slideIndex: {
        type: 'number',
        description: '幻灯片索引（从1开始）'
      },
      shapeId: {
        type: 'string',
        description: '形状ID'
      },
      url: {
        type: 'string',
        description: '超链接URL'
      },
      screenTip: {
        type: 'string',
        description: '鼠标悬停提示文本'
      }
    },
    required: ['slideIndex', 'shapeId', 'url']
  },
  handler: async (args: any) => sendIPCCommand('ppt_add_hyperlink_to_shape', args),
  examples: [
    {
      description: '为形状添加超链接',
      input: {
        slideIndex: 1,
        shapeId: 'shape1',
        url: 'https://example.com',
        screenTip: '点击访问网站'
      },
      output: { success: true, message: '成功添加超链接' }
    }
  ]
}

/**
 * 添加超链接到文本
 */
export const pptAddHyperlinkToTextTool: ToolDefinition = {
  name: 'ppt_add_hyperlink_to_text',
  description: '为 PowerPoint 幻灯片中的文本添加超链接',
  category: 'powerpoint',
  application: 'powerpoint',
  inputSchema: {
    type: 'object',
    properties: {
      slideIndex: {
        type: 'number',
        description: '幻灯片索引（从1开始）'
      },
      shapeId: {
        type: 'string',
        description: '包含文本的形状ID'
      },
      text: {
        type: 'string',
        description: '要添加超链接的文本'
      },
      url: {
        type: 'string',
        description: '超链接URL'
      }
    },
    required: ['slideIndex', 'shapeId', 'text', 'url']
  },
  handler: async (args: any) => sendIPCCommand('ppt_add_hyperlink_to_text', args),
  examples: [
    {
      description: '为文本添加超链接',
      input: {
        slideIndex: 1,
        shapeId: 'textbox1',
        text: '点击这里',
        url: 'https://example.com'
      },
      output: { success: true, message: '成功为文本添加超链接' }
    }
  ]
}

/**
 * 获取幻灯片中的所有超链接
 */
export const pptGetHyperlinksTool: ToolDefinition = {
  name: 'ppt_get_hyperlinks',
  description: '获取 PowerPoint 幻灯片中的所有超链接',
  category: 'powerpoint',
  application: 'powerpoint',
  inputSchema: {
    type: 'object',
    properties: {
      slideIndex: {
        type: 'number',
        description: '幻灯片索引（从1开始）'
      }
    },
    required: ['slideIndex']
  },
  handler: async (args: any) => sendIPCCommand('ppt_get_hyperlinks', args),
  examples: [
    {
      description: '获取幻灯片中的所有超链接',
      input: { slideIndex: 1 },
      output: {
        success: true,
        message: '成功获取 2 个超链接',
        data: {
          hyperlinks: [
            { shapeId: 'shape1', url: 'https://example.com', text: '示例网站' },
            { shapeId: 'shape2', url: 'https://google.com', text: '搜索引擎' }
          ]
        }
      }
    }
  ]
}

/**
 * 删除超链接
 */
export const pptRemoveHyperlinkTool: ToolDefinition = {
  name: 'ppt_remove_hyperlink',
  description: '删除 PowerPoint 幻灯片中形状的超链接',
  category: 'powerpoint',
  application: 'powerpoint',
  inputSchema: {
    type: 'object',
    properties: {
      slideIndex: {
        type: 'number',
        description: '幻灯片索引（从1开始）'
      },
      shapeId: {
        type: 'string',
        description: '形状ID'
      }
    },
    required: ['slideIndex', 'shapeId']
  },
  handler: async (args: any) => sendIPCCommand('ppt_remove_hyperlink', args),
  examples: [
    {
      description: '删除形状的超链接',
      input: { slideIndex: 1, shapeId: 'shape1' },
      output: { success: true, message: '成功删除超链接' }
    }
  ]
}

/**
 * 更新超链接
 */
export const pptUpdateHyperlinkTool: ToolDefinition = {
  name: 'ppt_update_hyperlink',
  description: '更新 PowerPoint 幻灯片中形状的超链接',
  category: 'powerpoint',
  application: 'powerpoint',
  inputSchema: {
    type: 'object',
    properties: {
      slideIndex: {
        type: 'number',
        description: '幻灯片索引（从1开始）'
      },
      shapeId: {
        type: 'string',
        description: '形状ID'
      },
      newUrl: {
        type: 'string',
        description: '新的URL'
      },
      newScreenTip: {
        type: 'string',
        description: '新的提示文本'
      }
    },
    required: ['slideIndex', 'shapeId', 'newUrl']
  },
  handler: async (args: any) => sendIPCCommand('ppt_update_hyperlink', args),
  examples: [
    {
      description: '更新形状的超链接',
      input: {
        slideIndex: 1,
        shapeId: 'shape1',
        newUrl: 'https://newsite.com',
        newScreenTip: '新网站'
      },
      output: { success: true, message: '成功更新超链接' }
    }
  ]
}
