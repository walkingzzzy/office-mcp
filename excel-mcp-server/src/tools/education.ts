/**
 * excel_education - 教育场景工具
 * 合并 3 个原工具
 */

import { sendIPCCommand } from '@office-mcp/shared'
import type { ToolDefinition } from './types.js'
import { validateAction, unsupportedActionError } from './types.js'

const SUPPORTED_ACTIONS = [
  'classStats', 'generateRanking', 'attendanceStats'
] as const

type EducationAction = typeof SUPPORTED_ACTIONS[number]

export const excelEducationTool: ToolDefinition = {
  name: 'excel_education',
  description: `教育场景工具。支持的操作(action):
- classStats: 班级统计 (需要 range, 可选 options)
- generateRanking: 生成排名 (需要 range, 可选 rankColumn, order)
- attendanceStats: 考勤统计 (需要 range, 可选 dateRange)`,
  category: 'education',
  application: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        enum: SUPPORTED_ACTIONS,
        description: '要执行的操作'
      },
      range: {
        type: 'string',
        description: '[所有操作] 数据区域'
      },
      options: {
        type: 'object',
        description: '[classStats] 统计选项',
        properties: {
          includeAverage: { type: 'boolean' },
          includeMax: { type: 'boolean' },
          includeMin: { type: 'boolean' },
          includePassRate: { type: 'boolean' },
          passScore: { type: 'number' }
        }
      },
      rankColumn: {
        type: 'string',
        description: '[generateRanking] 排名结果列'
      },
      order: {
        type: 'string',
        enum: ['asc', 'desc'],
        description: '[generateRanking] 排序方式',
        default: 'desc'
      },
      dateRange: {
        type: 'object',
        description: '[attendanceStats] 日期范围',
        properties: {
          start: { type: 'string' },
          end: { type: 'string' }
        }
      }
    },
    required: ['action', 'range']
  },
  metadata: {
    version: '2.0.0',
    priority: 'P1',
    intentKeywords: [
      '班级统计', '成绩统计', '排名', '考勤',
      '出勤率', '及格率', '平均分'
    ],
    mergedTools: [
      'excel_class_stats', 'excel_generate_ranking', 'excel_attendance_stats'
    ],
    supportedActions: [...SUPPORTED_ACTIONS]
  },
  handler: async (args: Record<string, any>) => {
    const { action, ...params } = args

    if (!validateAction(action, [...SUPPORTED_ACTIONS])) {
      return unsupportedActionError(action, [...SUPPORTED_ACTIONS])
    }

    const commandMap: Record<EducationAction, string> = {
      classStats: 'excel_class_stats',
      generateRanking: 'excel_generate_ranking',
      attendanceStats: 'excel_attendance_stats'
    }

    const command = commandMap[action as EducationAction]
    const result = await sendIPCCommand(command, params)

    return { ...result, action }
  },
  examples: [
    {
      description: '班级成绩统计',
      input: { action: 'classStats', range: 'A1:E30', options: { includeAverage: true, passScore: 60 } },
      output: { success: true, message: '成功生成班级统计', action: 'classStats' }
    }
  ]
}
