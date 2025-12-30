/**
 * Excel 教育场景工具
 * 包含成绩统计、排名生成、考勤统计等教育专用功能
 */

import type { FunctionResult } from '../../ai/types'
import type { ToolDefinition, ToolResult } from '../types'

// ============================================================================
// P0 工具实现
// ============================================================================

/**
 * excel_class_stats - 班级成绩综合统计
 * 一键计算平均分、及格率、优秀率、最高分、最低分、标准差
 */
async function excelClassStats(args: Record<string, any>): Promise<FunctionResult> {
  const { scoreRange, passScore = 60, excellentScore = 90, outputRange } = args

  if (!scoreRange) {
    return { success: false, message: 'scoreRange 参数不能为空' }
  }

  return new Promise((resolve) => {
    Excel.run(async (context) => {
      const sheet = context.workbook.worksheets.getActiveWorksheet()
      const range = sheet.getRange(scoreRange)
      range.load('values')
      await context.sync()

      // 提取有效数字
      const scores: number[] = []
      for (const row of range.values) {
        for (const cell of row) {
          if (typeof cell === 'number' && !isNaN(cell)) {
            scores.push(cell)
          }
        }
      }

      if (scores.length === 0) {
        resolve({ success: false, message: '未找到有效的成绩数据' })
        return
      }

      // 计算统计数据
      const count = scores.length
      const sum = scores.reduce((a, b) => a + b, 0)
      const average = sum / count
      const max = Math.max(...scores)
      const min = Math.min(...scores)
      const passCount = scores.filter(s => s >= passScore).length
      const excellentCount = scores.filter(s => s >= excellentScore).length

      // 计算标准差
      const variance = scores.reduce((acc, s) => acc + Math.pow(s - average, 2), 0) / count
      const standardDeviation = Math.sqrt(variance)

      const stats = {
        count,
        average: Math.round(average * 100) / 100,
        max,
        min,
        passCount,
        passRate: `${Math.round((passCount / count) * 100)}%`,
        excellentCount,
        excellentRate: `${Math.round((excellentCount / count) * 100)}%`,
        standardDeviation: Math.round(standardDeviation * 100) / 100
      }

      // 如果指定了输出位置，写入统计结果
      if (outputRange) {
        const output = sheet.getRange(outputRange)
        const outputData = [
          ['统计项', '数值'],
          ['总人数', stats.count],
          ['平均分', stats.average],
          ['最高分', stats.max],
          ['最低分', stats.min],
          ['及格人数', stats.passCount],
          ['及格率', stats.passRate],
          ['优秀人数', stats.excellentCount],
          ['优秀率', stats.excellentRate],
          ['标准差', stats.standardDeviation]
        ]
        output.getResizedRange(outputData.length - 1, 1).values = outputData
      }

      await context.sync()

      resolve({
        success: true,
        message: '成绩统计完成',
        data: stats
      })
    }).catch((error) => {
      resolve({
        success: false,
        message: `成绩统计失败: ${error instanceof Error ? error.message : String(error)}`,
        error
      })
    })
  })
}

/**
 * excel_generate_ranking - 学生排名生成
 * 根据成绩自动生成排名列
 */
async function excelGenerateRanking(args: Record<string, any>): Promise<FunctionResult> {
  const {
    nameRange,
    scoreRange,
    rankOutputColumn,
    rankType = 'standard',
    order = 'desc',
    startRow = 2
  } = args

  if (!nameRange || !scoreRange) {
    return { success: false, message: 'nameRange 和 scoreRange 参数不能为空' }
  }

  return new Promise((resolve) => {
    Excel.run(async (context) => {
      const sheet = context.workbook.worksheets.getActiveWorksheet()
      const namesRng = sheet.getRange(nameRange)
      const scoresRng = sheet.getRange(scoreRange)

      namesRng.load('values')
      scoresRng.load('values')
      await context.sync()

      // 收集学生数据
      const students: { name: string; score: number; index: number }[] = []
      const names = namesRng.values.flat()
      const scores = scoresRng.values.flat()

      for (let i = 0; i < names.length; i++) {
        if (names[i] && typeof scores[i] === 'number') {
          students.push({
            name: String(names[i]),
            score: scores[i] as number,
            index: i
          })
        }
      }

      // 排序
      students.sort((a, b) => order === 'desc' ? b.score - a.score : a.score - b.score)

      // 计算排名
      const rankings: number[] = new Array(students.length)

      if (rankType === 'dense') {
        // 连续排名：1, 2, 2, 3
        let currentRank = 1
        for (let i = 0; i < students.length; i++) {
          if (i > 0 && students[i].score !== students[i - 1].score) {
            currentRank++
          }
          rankings[students[i].index] = currentRank
        }
      } else if (rankType === 'olympic') {
        // 奥运式排名：同分同名次，后续按实际位置
        for (let i = 0; i < students.length; i++) {
          let rank = 1
          for (let j = 0; j < students.length; j++) {
            if (order === 'desc') {
              if (students[j].score > students[i].score) rank++
            } else {
              if (students[j].score < students[i].score) rank++
            }
          }
          rankings[students[i].index] = rank
        }
      } else {
        // 标准排名：1, 2, 2, 4
        for (let i = 0; i < students.length; i++) {
          if (i === 0) {
            rankings[students[i].index] = 1
          } else if (students[i].score === students[i - 1].score) {
            rankings[students[i].index] = rankings[students[i - 1].index]
          } else {
            rankings[students[i].index] = i + 1
          }
        }
      }

      // 写入排名
      if (rankOutputColumn) {
        const rankValues = rankings.map(r => [r])
        const outputAddress = `${rankOutputColumn}${startRow}:${rankOutputColumn}${startRow + rankings.length - 1}`
        const outputRng = sheet.getRange(outputAddress)
        outputRng.values = rankValues
      }

      await context.sync()

      resolve({
        success: true,
        message: `排名生成完成，共 ${students.length} 名学生`,
        data: {
          studentCount: students.length,
          rankType,
          order,
          top3: students.slice(0, 3).map((s, i) => ({
            rank: i + 1,
            name: s.name,
            score: s.score
          }))
        }
      })
    }).catch((error) => {
      resolve({
        success: false,
        message: `排名生成失败: ${error instanceof Error ? error.message : String(error)}`,
        error
      })
    })
  })
}

// ============================================================================
// P2 工具实现
// ============================================================================

/**
 * excel_attendance_stats - 考勤统计
 * 统计出勤率、缺勤次数、迟到次数等
 */
async function excelAttendanceStats(args: Record<string, any>): Promise<FunctionResult> {
  const {
    attendanceRange,
    nameRange,
    presentSymbol = '√',
    absentSymbol = '×',
    lateSymbol = '迟',
    leaveSymbol = '假',
    outputRange
  } = args

  if (!attendanceRange) {
    return { success: false, message: 'attendanceRange 参数不能为空' }
  }

  return new Promise((resolve) => {
    Excel.run(async (context) => {
      const sheet = context.workbook.worksheets.getActiveWorksheet()
      const dataRng = sheet.getRange(attendanceRange)
      dataRng.load('values')

      let names: any[] = []
      if (nameRange) {
        const namesRng = sheet.getRange(nameRange)
        namesRng.load('values')
        await context.sync()
        names = namesRng.values.flat()
      } else {
        await context.sync()
      }

      const data = dataRng.values
      const stats: any[] = []

      for (let i = 0; i < data.length; i++) {
        const row = data[i]
        let present = 0
        let absent = 0
        let late = 0
        let leave = 0
        let total = 0

        for (const cell of row) {
          const value = String(cell).trim()
          if (value === presentSymbol) {
            present++
            total++
          } else if (value === absentSymbol) {
            absent++
            total++
          } else if (value === lateSymbol) {
            late++
            total++
          } else if (value === leaveSymbol) {
            leave++
            total++
          }
        }

        stats.push({
          name: names[i] || `学生${i + 1}`,
          present,
          absent,
          late,
          leave,
          total,
          attendanceRate: total > 0 ? `${Math.round((present / total) * 100)}%` : '0%'
        })
      }

      // 写入统计结果
      if (outputRange) {
        const output = sheet.getRange(outputRange)
        const outputData = [
          ['姓名', '出勤', '缺勤', '迟到', '请假', '出勤率'],
          ...stats.map(s => [s.name, s.present, s.absent, s.late, s.leave, s.attendanceRate])
        ]
        output.getResizedRange(outputData.length - 1, outputData[0].length - 1).values = outputData
      }

      await context.sync()

      // 计算班级整体统计
      const totalPresent = stats.reduce((sum, s) => sum + s.present, 0)
      const totalRecords = stats.reduce((sum, s) => sum + s.total, 0)
      const classAttendanceRate = totalRecords > 0
        ? `${Math.round((totalPresent / totalRecords) * 100)}%`
        : '0%'

      resolve({
        success: true,
        message: '考勤统计完成',
        data: {
          studentCount: stats.length,
          classAttendanceRate,
          details: stats
        }
      })
    }).catch((error) => {
      resolve({
        success: false,
        message: `考勤统计失败: ${error instanceof Error ? error.message : String(error)}`,
        error
      })
    })
  })
}

// ============================================================================
// 工具定义导出
// ============================================================================

export const excelEducationToolDefinitions: ToolDefinition[] = [
  // P0 工具
  {
    name: 'excel_class_stats',
    handler: excelClassStats,
    category: 'chart',
    description: '班级成绩综合统计（平均分、及格率、优秀率等）'
  },
  {
    name: 'excel_generate_ranking',
    handler: excelGenerateRanking,
    category: 'chart',
    description: '学生成绩排名生成'
  },
  // P2 工具
  {
    name: 'excel_attendance_stats',
    handler: excelAttendanceStats,
    category: 'chart',
    description: '班级考勤统计'
  }
]

// 导出处理函数（用于直接调用）
export {
  excelClassStats,
  excelGenerateRanking,
  excelAttendanceStats
}

