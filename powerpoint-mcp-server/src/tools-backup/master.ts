/**
 * PowerPoint 幻灯片母版工具
 * 使用 Office.js API (PowerPointApi 1.1+) 实现母版操作
 */

import type { ToolDefinition } from './types.js'
import { sendIPCCommand } from '@office-mcp/shared'

/**
 * 获取所有幻灯片母版
 */
export const pptGetSlideMastersTool: ToolDefinition = {
  name: 'ppt_get_slide_masters',
  description: '获取 PowerPoint 演示文稿中的所有幻灯片母版',
  category: 'powerpoint',
  application: 'powerpoint',
  inputSchema: {
    type: 'object',
    properties: {},
    required: []
  },
  handler: async (args: any) => sendIPCCommand('ppt_get_slide_masters', args),
  examples: [
    {
      description: '获取所有母版',
      input: {},
      output: {
        success: true,
        data: {
          masters: [
            { id: 'master1', name: 'Office 主题', layoutCount: 11 },
            { id: 'master2', name: '自定义母版', layoutCount: 5 }
          ]
        }
      }
    }
  ]
}

/**
 * 获取母版的布局列表
 */
export const pptGetMasterLayoutsTool: ToolDefinition = {
  name: 'ppt_get_master_layouts',
  description: '获取指定幻灯片母版的所有布局',
  category: 'powerpoint',
  application: 'powerpoint',
  inputSchema: {
    type: 'object',
    properties: {
      masterId: {
        type: 'string',
        description: '母版ID'
      },
      masterIndex: {
        type: 'number',
        description: '母版索引（从0开始，与masterId二选一）'
      }
    },
    required: []
  },
  handler: async (args: any) => sendIPCCommand('ppt_get_master_layouts', args),
  examples: [
    {
      description: '获取第一个母版的布局',
      input: { masterIndex: 0 },
      output: {
        success: true,
        data: {
          layouts: [
            { id: 'layout1', name: '标题幻灯片' },
            { id: 'layout2', name: '标题和内容' },
            { id: 'layout3', name: '节标题' }
          ]
        }
      }
    }
  ]
}

/**
 * 应用母版到幻灯片
 */
export const pptApplySlideMasterTool: ToolDefinition = {
  name: 'ppt_apply_slide_master',
  description: '将指定的幻灯片母版应用到幻灯片',
  category: 'powerpoint',
  application: 'powerpoint',
  inputSchema: {
    type: 'object',
    properties: {
      slideIndex: {
        type: 'number',
        description: '幻灯片索引（从1开始）'
      },
      masterId: {
        type: 'string',
        description: '母版ID'
      },
      masterIndex: {
        type: 'number',
        description: '母版索引（从0开始，与masterId二选一）'
      },
      layoutId: {
        type: 'string',
        description: '布局ID（可选）'
      },
      layoutIndex: {
        type: 'number',
        description: '布局索引（从0开始，与layoutId二选一）'
      }
    },
    required: []
  },
  handler: async (args: any) => sendIPCCommand('ppt_apply_slide_master', args),
  examples: [
    {
      description: '应用第一个母版到第一张幻灯片',
      input: { slideIndex: 1, masterIndex: 0, layoutIndex: 1 },
      output: { success: true, message: '成功应用母版' }
    }
  ]
}

/**
 * 复制母版
 */
export const pptCopySlideMasterTool: ToolDefinition = {
  name: 'ppt_copy_slide_master',
  description: '复制幻灯片母版',
  category: 'powerpoint',
  application: 'powerpoint',
  inputSchema: {
    type: 'object',
    properties: {
      masterId: {
        type: 'string',
        description: '要复制的母版ID'
      },
      masterIndex: {
        type: 'number',
        description: '要复制的母版索引（从0开始，与masterId二选一）'
      },
      newName: {
        type: 'string',
        description: '新母版的名称'
      }
    },
    required: []
  },
  handler: async (args: any) => sendIPCCommand('ppt_copy_slide_master', args),
  examples: [
    {
      description: '复制第一个母版',
      input: { masterIndex: 0, newName: '自定义母版副本' },
      output: { success: true, message: '成功复制母版', data: { newMasterId: 'master3' } }
    }
  ]
}

/**
 * 删除母版
 */
export const pptDeleteSlideMasterTool: ToolDefinition = {
  name: 'ppt_delete_slide_master',
  description: '删除幻灯片母版',
  category: 'powerpoint',
  application: 'powerpoint',
  inputSchema: {
    type: 'object',
    properties: {
      masterId: {
        type: 'string',
        description: '要删除的母版ID'
      },
      masterIndex: {
        type: 'number',
        description: '要删除的母版索引（从0开始，与masterId二选一）'
      }
    },
    required: []
  },
  handler: async (args: any) => sendIPCCommand('ppt_delete_slide_master', args),
  examples: [
    {
      description: '删除第二个母版',
      input: { masterIndex: 1 },
      output: { success: true, message: '成功删除母版' }
    }
  ]
}

/**
 * 重命名母版
 */
export const pptRenameSlideMasterTool: ToolDefinition = {
  name: 'ppt_rename_slide_master',
  description: '重命名幻灯片母版',
  category: 'powerpoint',
  application: 'powerpoint',
  inputSchema: {
    type: 'object',
    properties: {
      masterId: {
        type: 'string',
        description: '母版ID'
      },
      masterIndex: {
        type: 'number',
        description: '母版索引（从0开始，与masterId二选一）'
      },
      newName: {
        type: 'string',
        description: '新名称'
      }
    },
    required: ['newName']
  },
  handler: async (args: any) => sendIPCCommand('ppt_rename_slide_master', args),
  examples: [
    {
      description: '重命名第一个母版',
      input: { masterIndex: 0, newName: '公司标准母版' },
      output: { success: true, message: '成功重命名母版' }
    }
  ]
}
