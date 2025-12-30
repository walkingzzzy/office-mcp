/**
 * PowerPoint 自定义布局工具
 * 使用 PowerPointApi 1.2+ 实现自定义布局管理
 * P2 阶段功能
 */

import { sendIPCCommand } from '@office-mcp/shared'
import type { ToolDefinition } from './types.js'

/**
 * 创建自定义布局
 */
export const pptCreateCustomLayoutTool: ToolDefinition = {
  name: 'ppt_create_custom_layout',
  description: '创建 PowerPoint 自定义幻灯片布局',
  category: 'layout',
  application: 'powerpoint',
  inputSchema: {
    type: 'object',
    properties: {
      layoutName: {
        type: 'string',
        description: '布局名称'
      },
      basedOn: {
        type: 'string',
        description: '基于的现有布局名称（可选）'
      },
      width: {
        type: 'number',
        description: '布局宽度（像素）',
        default: 960
      },
      height: {
        type: 'number',
        description: '布局高度（像素）',
        default: 540
      }
    },
    required: ['layoutName']
  },
  handler: async (args: any) => sendIPCCommand('ppt_create_custom_layout', args),
  examples: [
    {
      description: '创建自定义布局',
      input: {
        layoutName: 'My Custom Layout',
        basedOn: 'Title Slide',
        width: 960,
        height: 540
      },
      output: {
        success: true,
        message: '成功创建自定义布局',
        data: {
          layoutId: 'layout1'
        }
      }
    }
  ]
}

/**
 * 获取自定义布局列表
 */
export const pptGetCustomLayoutsTool: ToolDefinition = {
  name: 'ppt_get_custom_layouts',
  description: '获取 PowerPoint 演示文稿中的所有自定义布局',
  category: 'layout',
  application: 'powerpoint',
  inputSchema: {
    type: 'object',
    properties: {},
    required: []
  },
  handler: async (args: any) => sendIPCCommand('ppt_get_custom_layouts', args),
  examples: [
    {
      description: '获取自定义布局列表',
      input: {},
      output: {
        success: true,
        message: '成功获取 3 个自定义布局',
        data: {
          layouts: [
            {
              id: 'layout1',
              name: 'My Custom Layout',
              width: 960,
              height: 540,
              placeholderCount: 2
            }
          ]
        }
      }
    }
  ]
}

/**
 * 获取自定义布局详情
 */
export const pptGetCustomLayoutDetailTool: ToolDefinition = {
  name: 'ppt_get_custom_layout_detail',
  description: '获取指定自定义布局的详细信息',
  category: 'layout',
  application: 'powerpoint',
  inputSchema: {
    type: 'object',
    properties: {
      layoutId: {
        type: 'string',
        description: '布局 ID'
      }
    },
    required: ['layoutId']
  },
  handler: async (args: any) => sendIPCCommand('ppt_get_custom_layout_detail', args),
  examples: [
    {
      description: '获取布局详情',
      input: { layoutId: 'layout1' },
      output: {
        success: true,
        message: '成功获取布局详情',
        data: {
          id: 'layout1',
          name: 'My Custom Layout',
          width: 960,
          height: 540,
          placeholders: [
            {
              type: 'title',
              x: 50,
              y: 50,
              width: 860,
              height: 100
            },
            {
              type: 'content',
              x: 50,
              y: 200,
              width: 860,
              height: 290
            }
          ]
        }
      }
    }
  ]
}

/**
 * 添加占位符到自定义布局
 */
export const pptAddPlaceholderToLayoutTool: ToolDefinition = {
  name: 'ppt_add_placeholder_to_layout',
  description: '向自定义布局添加占位符',
  category: 'layout',
  application: 'powerpoint',
  inputSchema: {
    type: 'object',
    properties: {
      layoutId: {
        type: 'string',
        description: '布局 ID'
      },
      placeholderType: {
        type: 'string',
        description: '占位符类型',
        enum: ['title', 'subtitle', 'content', 'text', 'picture', 'chart', 'table', 'media']
      },
      x: {
        type: 'number',
        description: 'X 坐标（像素）'
      },
      y: {
        type: 'number',
        description: 'Y 坐标（像素）'
      },
      width: {
        type: 'number',
        description: '宽度（像素）'
      },
      height: {
        type: 'number',
        description: '高度（像素）'
      }
    },
    required: ['layoutId', 'placeholderType', 'x', 'y', 'width', 'height']
  },
  handler: async (args: any) => sendIPCCommand('ppt_add_placeholder_to_layout', args),
  examples: [
    {
      description: '添加标题占位符',
      input: {
        layoutId: 'layout1',
        placeholderType: 'title',
        x: 50,
        y: 50,
        width: 860,
        height: 100
      },
      output: {
        success: true,
        message: '成功添加占位符',
        data: {
          placeholderId: 'placeholder1'
        }
      }
    }
  ]
}

/**
 * 删除自定义布局
 */
export const pptDeleteCustomLayoutTool: ToolDefinition = {
  name: 'ppt_delete_custom_layout',
  description: '删除 PowerPoint 自定义布局',
  category: 'layout',
  application: 'powerpoint',
  inputSchema: {
    type: 'object',
    properties: {
      layoutId: {
        type: 'string',
        description: '布局 ID'
      }
    },
    required: ['layoutId']
  },
  handler: async (args: any) => sendIPCCommand('ppt_delete_custom_layout', args),
  examples: [
    {
      description: '删除自定义布局',
      input: { layoutId: 'layout1' },
      output: {
        success: true,
        message: '成功删除自定义布局'
      }
    }
  ]
}

/**
 * 重命名自定义布局
 */
export const pptRenameCustomLayoutTool: ToolDefinition = {
  name: 'ppt_rename_custom_layout',
  description: '重命名 PowerPoint 自定义布局',
  category: 'layout',
  application: 'powerpoint',
  inputSchema: {
    type: 'object',
    properties: {
      layoutId: {
        type: 'string',
        description: '布局 ID'
      },
      newName: {
        type: 'string',
        description: '新名称'
      }
    },
    required: ['layoutId', 'newName']
  },
  handler: async (args: any) => sendIPCCommand('ppt_rename_custom_layout', args),
  examples: [
    {
      description: '重命名布局',
      input: {
        layoutId: 'layout1',
        newName: 'Updated Layout Name'
      },
      output: {
        success: true,
        message: '成功重命名自定义布局'
      }
    }
  ]
}

/**
 * 应用自定义布局到幻灯片
 */
export const pptApplyCustomLayoutTool: ToolDefinition = {
  name: 'ppt_apply_custom_layout',
  description: '将自定义布局应用到指定幻灯片',
  category: 'layout',
  application: 'powerpoint',
  inputSchema: {
    type: 'object',
    properties: {
      slideIndex: {
        type: 'number',
        description: '幻灯片索引（从 1 开始）'
      },
      layoutId: {
        type: 'string',
        description: '布局 ID'
      }
    },
    required: ['slideIndex', 'layoutId']
  },
  handler: async (args: any) => sendIPCCommand('ppt_apply_custom_layout', args),
  examples: [
    {
      description: '应用自定义布局',
      input: {
        slideIndex: 1,
        layoutId: 'layout1'
      },
      output: {
        success: true,
        message: '成功应用自定义布局'
      }
    }
  ]
}
