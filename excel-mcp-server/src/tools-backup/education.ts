/**
 * Excel Education Tools - P0/P1/P2 Implementation
 * 教育场景专用Excel工具
 */

import { sendIPCCommand } from '@office-mcp/shared'
import type { ToolDefinition } from './types.js'

// ============================================================================
// P0 工具 - 高优先级
// ============================================================================

/**
 * excel_class_stats - 班级成绩综合统计工具
 * 一键计算平均分、及格率、优秀率、最高分、最低分、标准差
 */
export const excelClassStatsTool: ToolDefinition = {
  name: 'excel_class_stats',
  description: '一键计算班级成绩综合统计数据，包括平均分、及格率、优秀率、最高分、最低分、标准差等。适用于教师快速分析考试成绩。',
  category: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      scoreRange: {
        type: 'string',
        description: '成绩数据范围，如 "B2:B52" 或 "C2:C100"'
      },
      passScore: {
        type: 'number',
        default: 60,
        description: '及格分数线，默认60分'
      },
      excellentScore: {
        type: 'number',
        default: 90,
        description: '优秀分数线，默认90分'
      },
      outputRange: {
        type: 'string',
        description: '统计结果输出位置（可选），如 "E2"。如果指定，会将统计结果写入表格'
      }
    },
    required: ['scoreRange']
  },
  metadata: {
    version: '1.0.0',
    priority: 'P0',
    tags: ['education', 'grade', 'statistics'],
    intentKeywords: ['成绩统计', '平均分', '及格率', '优秀率', '班级分析', '考试分析'],
    scenario: '期中/期末考试成绩分析'
  },
  handler: async (args: any) => sendIPCCommand('excel_class_stats', args)
}

/**
 * excel_generate_ranking - 学生排名生成工具
 * 根据成绩自动生成排名列
 */
export const excelGenerateRankingTool: ToolDefinition = {
  name: 'excel_generate_ranking',
  description: '根据成绩自动生成学生排名。支持多种排名方式：标准排名（同分同名次，后续跳号）、连续排名（同分同名次，后续连续）、奥运式排名。',
  category: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      nameRange: {
        type: 'string',
        description: '学生姓名范围，如 "A2:A52"'
      },
      scoreRange: {
        type: 'string',
        description: '成绩范围，如 "B2:B52"'
      },
      rankOutputColumn: {
        type: 'string',
        description: '排名输出列，如 "C" 或 "D"'
      },
      rankType: {
        type: 'string',
        enum: ['standard', 'dense', 'olympic'],
        default: 'standard',
        description: '排名方式：standard=标准(1,2,2,4)、dense=连续(1,2,2,3)、olympic=奥运式'
      },
      order: {
        type: 'string',
        enum: ['desc', 'asc'],
        default: 'desc',
        description: '排序方向：desc=从高到低、asc=从低到高'
      },
      startRow: {
        type: 'number',
        default: 2,
        description: '数据起始行（用于确定排名输出位置）'
      }
    },
    required: ['nameRange', 'scoreRange']
  },
  metadata: {
    version: '1.0.0',
    priority: 'P0',
    tags: ['education', 'grade', 'ranking'],
    intentKeywords: ['排名', '名次', '成绩排序', '班级排名', '年级排名'],
    scenario: '生成学生成绩排名'
  },
  handler: async (args: any) => sendIPCCommand('excel_generate_ranking', args)
}

// ============================================================================
// P2 工具 - 中期实现
// ============================================================================

/**
 * excel_attendance_stats - 考勤统计工具
 * 统计出勤率、缺勤次数、迟到早退等
 */
export const excelAttendanceStatsTool: ToolDefinition = {
  name: 'excel_attendance_stats',
  description: '统计班级考勤数据，计算出勤率、缺勤次数、迟到次数等。支持自定义考勤符号。',
  category: 'excel',
  inputSchema: {
    type: 'object',
    properties: {
      attendanceRange: {
        type: 'string',
        description: '考勤数据范围，如 "B2:AF52"（行=学生，列=日期）'
      },
      nameRange: {
        type: 'string',
        description: '学生姓名范围，如 "A2:A52"'
      },
      presentSymbol: {
        type: 'string',
        default: '√',
        description: '出勤标记符号'
      },
      absentSymbol: {
        type: 'string',
        default: '×',
        description: '缺勤标记符号'
      },
      lateSymbol: {
        type: 'string',
        default: '迟',
        description: '迟到标记符号'
      },
      leaveSymbol: {
        type: 'string',
        default: '假',
        description: '请假标记符号'
      },
      outputRange: {
        type: 'string',
        description: '统计结果输出位置'
      }
    },
    required: ['attendanceRange']
  },
  metadata: {
    version: '1.0.0',
    priority: 'P2',
    tags: ['education', 'attendance', 'statistics'],
    intentKeywords: ['考勤', '出勤率', '缺勤', '迟到', '请假统计'],
    scenario: '月度/学期考勤统计'
  },
  handler: async (args: any) => sendIPCCommand('excel_attendance_stats', args)
}

// ============================================================================
// 导出所有教育工具
// ============================================================================

export const excelEducationTools: ToolDefinition[] = [
  // P0 工具
  excelClassStatsTool,
  excelGenerateRankingTool,
  // P2 工具
  excelAttendanceStatsTool
]

export function getExcelEducationTools(): ToolDefinition[] {
  return excelEducationTools
}

