/**
 * excel_worksheet - 工作表管理
 * 合并 14 个原工具
 */

import { sendIPCCommand } from '@office-mcp/shared'
import type { ToolDefinition } from './types.js'
import { validateAction, unsupportedActionError } from './types.js'

const SUPPORTED_ACTIONS = [
  'add', 'create', 'delete', 'rename', 'copy', 'move',
  'hide', 'unhide', 'show', 'protect', 'unprotect',
  'protectWorkbook', 'getNames', 'activate'
] as const

type WorksheetAction = typeof SUPPORTED_ACTIONS[number]

export const excelWorksheetTool: ToolDefinition = {
  name: 'excel_worksheet',
  description: `工作表管理工具。支持的操作(action):
- add: 添加工作表 (可选 name, position)
- create: 创建工作表 (需要 name)
- delete: 删除工作表 (需要 name)
- rename: 重命名工作表 (需要 oldName, newName)
- copy: 复制工作表 (需要 name, 可选 newName)
- move: 移动工作表 (需要 name, position)
- hide: 隐藏工作表 (需要 name)
- unhide: 显示工作表 (需要 name)
- show: 显示工作表 (需要 name)
- protect: 保护工作表 (需要 name, 可选 password)
- unprotect: 取消保护 (需要 name, 可选 password)
- protectWorkbook: 保护工作簿 (可选 password)
- getNames: 获取所有工作表名称
- activate: 激活工作表 (需要 name)`,
  category: 'worksheet',
  application: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        enum: SUPPORTED_ACTIONS,
        description: '要执行的操作'
      },
      name: {
        type: 'string',
        description: '[多个操作] 工作表名称'
      },
      oldName: {
        type: 'string',
        description: '[rename] 原名称'
      },
      newName: {
        type: 'string',
        description: '[rename/copy] 新名称'
      },
      position: {
        type: 'number',
        description: '[add/move] 位置索引'
      },
      password: {
        type: 'string',
        description: '[protect/unprotect/protectWorkbook] 密码'
      }
    },
    required: ['action']
  },
  metadata: {
    version: '2.0.0',
    priority: 'P0',
    intentKeywords: [
      '工作表', '添加', '删除', '重命名', '复制',
      '移动', '隐藏', '保护', '激活'
    ],
    mergedTools: [
      'excel_add_worksheet', 'excel_create_worksheet', 'excel_delete_worksheet',
      'excel_rename_worksheet', 'excel_copy_worksheet', 'excel_move_worksheet',
      'excel_hide_worksheet', 'excel_unhide_worksheet', 'excel_show_worksheet',
      'excel_protect_worksheet', 'excel_unprotect_worksheet',
      'excel_protect_workbook', 'excel_get_sheet_names', 'excel_activate_worksheet'
    ],
    supportedActions: [...SUPPORTED_ACTIONS]
  },
  handler: async (args: Record<string, any>) => {
    const { action, ...params } = args

    if (!validateAction(action, [...SUPPORTED_ACTIONS])) {
      return unsupportedActionError(action, [...SUPPORTED_ACTIONS])
    }

    const commandMap: Record<WorksheetAction, string> = {
      add: 'excel_add_worksheet',
      create: 'excel_create_worksheet',
      delete: 'excel_delete_worksheet',
      rename: 'excel_rename_worksheet',
      copy: 'excel_copy_worksheet',
      move: 'excel_move_worksheet',
      hide: 'excel_hide_worksheet',
      unhide: 'excel_unhide_worksheet',
      show: 'excel_show_worksheet',
      protect: 'excel_protect_worksheet',
      unprotect: 'excel_unprotect_worksheet',
      protectWorkbook: 'excel_protect_workbook',
      getNames: 'excel_get_sheet_names',
      activate: 'excel_activate_worksheet'
    }

    const command = commandMap[action as WorksheetAction]
    const result = await sendIPCCommand(command, params)

    return { ...result, action }
  },
  examples: [
    {
      description: '添加工作表',
      input: { action: 'add', name: '数据分析' },
      output: { success: true, message: '成功添加工作表', action: 'add' }
    },
    {
      description: '获取所有工作表名称',
      input: { action: 'getNames' },
      output: { success: true, action: 'getNames', data: { names: ['Sheet1', 'Sheet2'] } }
    }
  ]
}
