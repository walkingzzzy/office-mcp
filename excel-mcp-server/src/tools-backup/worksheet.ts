/**
 * Excel Worksheet Tools - Phase 5 Implementation
 */

import { sendIPCCommand } from '@office-mcp/shared'
import type { ToolDefinition } from './types.js'

// Worksheet Operations (10 tools)

export const excelAddWorksheetTool: ToolDefinition = {
  name: 'excel_add_worksheet',
  description: '向工作簿添加新工作表。可指定名称和位置，适用于数据分类、报表分离、模块化管理等场景',
  category: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      name: { type: 'string', description: 'Worksheet name' },
      position: { type: 'number', description: 'Position index (optional)' }
    },
    required: ['name']
  },
  handler: async (args: any) => sendIPCCommand('excel_add_worksheet', args)
}

export const excelDeleteWorksheetTool: ToolDefinition = {
  name: 'excel_delete_worksheet',
  description: '从工作簿删除工作表。永久移除指定工作表，适用于清理冗余、结构调整、临时文件删除等场景',
  category: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      name: { type: 'string', description: 'Worksheet name' }
    },
    required: ['name']
  },
  handler: async (args: any) => sendIPCCommand('excel_delete_worksheet', args)
}

export const excelRenameWorksheetTool: ToolDefinition = {
  name: 'excel_rename_worksheet',
  description: '重命名工作表。修改工作表名称以更好反映内容，适用于标识管理、主题分类、规范化命名等场景',
  category: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      oldName: { type: 'string', description: 'Current worksheet name' },
      newName: { type: 'string', description: 'New worksheet name' }
    },
    required: ['oldName', 'newName']
  },
  handler: async (args: any) => sendIPCCommand('excel_rename_worksheet', args)
}

export const excelCopyWorksheetTool: ToolDefinition = {
  name: 'excel_copy_worksheet',
  description: '复制工作表。创建工作表的完整副本，适用于模板制作、数据备份、快速创建相似表等场景',
  category: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      sourceName: { type: 'string', description: 'Source worksheet name' },
      targetName: { type: 'string', description: 'Target worksheet name' }
    },
    required: ['sourceName', 'targetName']
  },
  handler: async (args: any) => sendIPCCommand('excel_copy_worksheet', args)
}

export const excelMoveWorksheetTool: ToolDefinition = {
  name: 'excel_move_worksheet',
  description: '移动工作表位置。调整工作表在工作簿中的顺序，适用于逻辑排序、流程优化、视图组织等场景',
  category: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      name: { type: 'string', description: 'Worksheet name' },
      position: { type: 'number', description: 'New position index' }
    },
    required: ['name', 'position']
  },
  handler: async (args: any) => sendIPCCommand('excel_move_worksheet', args)
}

export const excelHideWorksheetTool: ToolDefinition = {
  name: 'excel_hide_worksheet',
  description: '隐藏工作表。临时隐藏工作表内容，适用于简化视图、数据保护、后台数据处理等场景',
  category: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      name: { type: 'string', description: 'Worksheet name' }
    },
    required: ['name']
  },
  handler: async (args: any) => sendIPCCommand('excel_hide_worksheet', args)
}

export const excelUnhideWorksheetTool: ToolDefinition = {
  name: 'excel_unhide_worksheet',
  description: '取消隐藏工作表。显示之前隐藏的工作表，适用于数据恢复、视图还原、完整访问等场景',
  category: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      name: { type: 'string', description: 'Worksheet name' }
    },
    required: ['name']
  },
  handler: async (args: any) => sendIPCCommand('excel_unhide_worksheet', args)
}

export const excelProtectWorkbookTool: ToolDefinition = {
  name: 'excel_protect_workbook',
  description: '保护工作簿结构。设置密码防止工作表的添加、删除、重命名，适用于模板保护、权限控制、结构锁定等场景',
  category: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      password: { type: 'string', description: 'Protection password (optional)' }
    }
  },
  handler: async (args: any) => sendIPCCommand('excel_protect_workbook', args)
}

export const excelGetSheetNamesTool: ToolDefinition = {
  name: 'excel_get_sheet_names',
  description: '获取所有工作表名称。返回工作簿中所有工作表的名称列表，适用于目录浏览、批量操作、导航定位等场景',
  category: 'excel',
  inputSchema: {
    type: 'object',
    properties: {}
  },
  handler: async (args: any) => sendIPCCommand('excel_get_sheet_names', args)
}

export const excelActivateWorksheetTool: ToolDefinition = {
  name: 'excel_activate_worksheet',
  description: '激活工作表。切换到指定工作表使其成为当前活动表，适用于数据操作、视图切换、焦点定位等场景',
  category: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      name: { type: 'string', description: 'Worksheet name' }
    },
    required: ['name']
  },
  handler: async (args: any) => sendIPCCommand('excel_activate_worksheet', args)
}

export const excelCreateWorksheetTool: ToolDefinition = {
  name: 'excel_create_worksheet',
  description: '创建新工作表。在工作簿中创建新的工作表，适用于数据分类、报表分离、模块化管理等场景',
  category: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      name: { type: 'string', description: 'Worksheet name' },
      position: { type: 'number', description: 'Position index (optional, adds at end if not specified)' }
    },
    required: ['name']
  },
  handler: async (args: any) => sendIPCCommand('excel_create_worksheet', args)
}

export const excelProtectWorksheetTool: ToolDefinition = {
  name: 'excel_protect_worksheet',
  description: '保护工作表。设置密码保护工作表内容，适用于数据保护、权限控制、防止误操作等场景',
  category: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      name: { type: 'string', description: 'Worksheet name' },
      password: { type: 'string', description: 'Protection password (optional)' },
      allowFormatCells: { type: 'boolean', default: false, description: 'Allow format cells' },
      allowFormatColumns: { type: 'boolean', default: false, description: 'Allow format columns' },
      allowFormatRows: { type: 'boolean', default: false, description: 'Allow format rows' },
      allowInsertColumns: { type: 'boolean', default: false, description: 'Allow insert columns' },
      allowInsertRows: { type: 'boolean', default: false, description: 'Allow insert rows' },
      allowDeleteColumns: { type: 'boolean', default: false, description: 'Allow delete columns' },
      allowDeleteRows: { type: 'boolean', default: false, description: 'Allow delete rows' }
    },
    required: ['name']
  },
  handler: async (args: any) => sendIPCCommand('excel_protect_worksheet', args)
}

export const excelUnprotectWorksheetTool: ToolDefinition = {
  name: 'excel_unprotect_worksheet',
  description: '取消保护工作表。移除工作表的密码保护，适用于恢复编辑权限、更新保护设置等场景',
  category: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      name: { type: 'string', description: 'Worksheet name' },
      password: { type: 'string', description: 'Protection password (if set)' }
    },
    required: ['name']
  },
  handler: async (args: any) => sendIPCCommand('excel_unprotect_worksheet', args)
}

export const excelShowWorksheetTool: ToolDefinition = {
  name: 'excel_show_worksheet',
  description: '显示隐藏的工作表。使之前隐藏的工作表重新可见，适用于数据恢复、视图还原、完整访问等场景',
  category: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      name: { type: 'string', description: 'Worksheet name to show' }
    },
    required: ['name']
  },
  handler: async (args: any) => sendIPCCommand('excel_show_worksheet', args)
}
