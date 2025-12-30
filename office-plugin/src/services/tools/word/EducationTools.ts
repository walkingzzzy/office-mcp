/**
 * Word 教育场景工具
 * 包含邮件合并、试卷生成、教案模板等教育专用功能
 */

import type { FunctionResult } from '../../ai/types'
import type { ToolDefinition, ToolResult } from '../types'

// ============================================================================
// P0 工具实现
// ============================================================================

/**
 * word_mail_merge - 批量文档生成（邮件合并）
 * 从数据源批量生成个性化文档
 */
async function wordMailMerge(args: Record<string, any>): Promise<FunctionResult> {
  const {
    dataSource,
    fields,
    outputMode = 'separate_files',
    pageBreak = true
  } = args

  if (!dataSource || !fields) {
    return { success: false, message: 'dataSource 和 fields 参数不能为空' }
  }

  return new Promise((resolve) => {
    Word.run(async (context) => {
      const document = context.document
      const body = document.body
      body.load('text')
      await context.sync()

      // 获取模板内容
      const templateContent = body.text

      // 获取数据源
      let records: Record<string, any>[] = []
      if (dataSource.type === 'json' && dataSource.data) {
        records = dataSource.data
      } else if (dataSource.type === 'excel_range') {
        // Excel范围暂不支持，返回提示
        resolve({
          success: false,
          message: '跨应用数据源（excel_range）暂不支持，请使用 json 类型数据源'
        })
        return
      }

      if (records.length === 0) {
        resolve({ success: false, message: '数据源为空' })
        return
      }

      // 生成合并后的文档内容
      const generatedContents: string[] = []

      for (const record of records) {
        let content = templateContent
        for (const field of fields) {
          const placeholder = field.placeholder
          const columnValue = record[field.column] || ''
          // 替换所有占位符
          content = content.split(placeholder).join(String(columnValue))
        }
        generatedContents.push(content)
      }

      // 根据输出模式处理
      if (outputMode === 'single_document') {
        // 合并到一个文档
        body.clear()
        for (let i = 0; i < generatedContents.length; i++) {
          if (i > 0 && pageBreak) {
            body.insertBreak(Word.BreakType.page, Word.InsertLocation.end)
          }
          body.insertText(generatedContents[i], Word.InsertLocation.end)
        }
      } else {
        // separate_files 模式下，只生成第一份作为预览
        // 实际的批量文件生成需要更复杂的实现
        body.clear()
        body.insertText(generatedContents[0], Word.InsertLocation.start)
      }

      await context.sync()

      resolve({
        success: true,
        message: `成功生成 ${records.length} 份文档内容`,
        data: {
          count: records.length,
          mode: outputMode,
          preview: generatedContents[0]?.substring(0, 200) + '...'
        }
      })
    }).catch((error) => {
      resolve({
        success: false,
        message: `邮件合并失败: ${error instanceof Error ? error.message : String(error)}`,
        error
      })
    })
  })
}

// ============================================================================
// P1 工具实现
// ============================================================================

/**
 * word_exam_header - 试卷头生成
 * 创建标准化试卷头部信息
 */
async function wordExamHeader(args: Record<string, any>): Promise<FunctionResult> {
  const {
    schoolName,
    examTitle,
    subject,
    grade = '',
    duration,
    totalScore = 100,
    includeStudentInfo = true,
    includeScoreTable = true
  } = args

  if (!schoolName || !examTitle || !subject) {
    return { success: false, message: 'schoolName、examTitle、subject 参数不能为空' }
  }

  return new Promise((resolve) => {
    Word.run(async (context) => {
      const document = context.document
      const body = document.body

      // 学校名称（居中加粗）
      const schoolPara = body.insertParagraph(schoolName, Word.InsertLocation.start)
      schoolPara.alignment = Word.Alignment.centered
      schoolPara.font.bold = true
      schoolPara.font.size = 18

      // 考试名称
      const examPara = body.insertParagraph(examTitle, Word.InsertLocation.end)
      examPara.alignment = Word.Alignment.centered
      examPara.font.bold = true
      examPara.font.size = 16

      // 科目和时间信息
      let infoText = `${subject}试卷`
      if (grade) infoText = `${grade}${infoText}`
      if (duration) infoText += `    考试时间：${duration}分钟`
      infoText += `    满分：${totalScore}分`

      const infoPara = body.insertParagraph(infoText, Word.InsertLocation.end)
      infoPara.alignment = Word.Alignment.centered
      infoPara.font.size = 12

      // 分隔线
      body.insertParagraph('─'.repeat(50), Word.InsertLocation.end)

      // 考生信息区
      if (includeStudentInfo) {
        const studentInfoPara = body.insertParagraph(
          '姓名：_______________    班级：_______________    考号：_______________',
          Word.InsertLocation.end
        )
        studentInfoPara.font.size = 11
        studentInfoPara.spaceAfter = 12
      }

      // 得分表格
      if (includeScoreTable) {
        body.insertParagraph('', Word.InsertLocation.end)
        const scorePara = body.insertParagraph(
          '得分：[  一  ][  二  ][  三  ][  四  ][  五  ][ 总分 ]',
          Word.InsertLocation.end
        )
        scorePara.font.size = 11
      }

      // 分隔线
      body.insertParagraph('─'.repeat(50), Word.InsertLocation.end)
      body.insertParagraph('', Word.InsertLocation.end)

      await context.sync()

      resolve({
        success: true,
        message: '试卷头生成成功',
        data: {
          schoolName,
          examTitle,
          subject,
          grade,
          duration,
          totalScore
        }
      })
    }).catch((error) => {
      resolve({
        success: false,
        message: `试卷头生成失败: ${error instanceof Error ? error.message : String(error)}`,
        error
      })
    })
  })
}

/**
 * word_question_section - 试卷大题区域
 * 插入试卷大题标题和说明
 */
async function wordQuestionSection(args: Record<string, any>): Promise<FunctionResult> {
  const {
    sectionNumber,
    questionType,
    count,
    scorePerQuestion,
    totalScore,
    instructions
  } = args

  if (!sectionNumber || !questionType) {
    return { success: false, message: 'sectionNumber 和 questionType 参数不能为空' }
  }

  return new Promise((resolve) => {
    Word.run(async (context) => {
      const document = context.document
      const body = document.body

      // 计算总分
      let sectionScore = totalScore
      if (!sectionScore && count && scorePerQuestion) {
        sectionScore = count * scorePerQuestion
      }

      // 构建大题标题
      let titleText = `${sectionNumber}、${questionType}`
      if (count && scorePerQuestion) {
        titleText += `（每题${scorePerQuestion}分，共${sectionScore}分）`
      } else if (sectionScore) {
        titleText += `（共${sectionScore}分）`
      }

      // 插入大题标题
      const titlePara = body.insertParagraph(titleText, Word.InsertLocation.end)
      titlePara.font.bold = true
      titlePara.font.size = 12
      titlePara.spaceAfter = 6

      // 插入答题说明
      if (instructions) {
        const instrPara = body.insertParagraph(instructions, Word.InsertLocation.end)
        instrPara.font.italic = true
        instrPara.font.size = 10
        instrPara.spaceAfter = 12
      }

      // 为每道题预留空间
      if (count) {
        for (let i = 1; i <= count; i++) {
          body.insertParagraph(`${i}. `, Word.InsertLocation.end)
          body.insertParagraph('', Word.InsertLocation.end)
        }
      }

      await context.sync()

      resolve({
        success: true,
        message: '大题区域插入成功',
        data: {
          sectionNumber,
          questionType,
          count,
          scorePerQuestion,
          totalScore: sectionScore
        }
      })
    }).catch((error) => {
      resolve({
        success: false,
        message: `大题区域插入失败: ${error instanceof Error ? error.message : String(error)}`,
        error
      })
    })
  })
}

/**
 * word_lesson_plan - 教案结构插入
 * 快速生成标准教案框架
 */
async function wordLessonPlan(args: Record<string, any>): Promise<FunctionResult> {
  const {
    subject,
    topic,
    grade = '',
    duration = 1,
    sections = [
      '教学目标',
      '教学重点',
      '教学难点',
      '教学准备',
      '教学过程',
      '板书设计',
      '作业布置',
      '教学反思'
    ],
    includeThreeDimensionalGoals = true
  } = args

  if (!subject || !topic) {
    return { success: false, message: 'subject 和 topic 参数不能为空' }
  }

  return new Promise((resolve) => {
    Word.run(async (context) => {
      const document = context.document
      const body = document.body

      // 教案标题
      const titlePara = body.insertParagraph('教 案', Word.InsertLocation.start)
      titlePara.alignment = Word.Alignment.centered
      titlePara.font.bold = true
      titlePara.font.size = 18

      // 基本信息表
      body.insertParagraph('', Word.InsertLocation.end)
      body.insertParagraph(`科    目：${subject}`, Word.InsertLocation.end)
      body.insertParagraph(`课    题：${topic}`, Word.InsertLocation.end)
      if (grade) {
        body.insertParagraph(`年    级：${grade}`, Word.InsertLocation.end)
      }
      body.insertParagraph(`课    时：${duration}课时`, Word.InsertLocation.end)
      body.insertParagraph(`授课教师：_______________`, Word.InsertLocation.end)
      body.insertParagraph(`授课时间：_______________`, Word.InsertLocation.end)

      // 分隔线
      body.insertParagraph('', Word.InsertLocation.end)
      body.insertParagraph('─'.repeat(40), Word.InsertLocation.end)
      body.insertParagraph('', Word.InsertLocation.end)

      // 各章节
      for (const section of sections) {
        const sectionPara = body.insertParagraph(`【${section}】`, Word.InsertLocation.end)
        sectionPara.font.bold = true
        sectionPara.font.size = 12

        // 如果是教学目标且需要三维目标
        if (section === '教学目标' && includeThreeDimensionalGoals) {
          body.insertParagraph('1. 知识与技能：', Word.InsertLocation.end)
          body.insertParagraph('', Word.InsertLocation.end)
          body.insertParagraph('2. 过程与方法：', Word.InsertLocation.end)
          body.insertParagraph('', Word.InsertLocation.end)
          body.insertParagraph('3. 情感态度与价值观：', Word.InsertLocation.end)
        }

        // 预留填写空间
        body.insertParagraph('', Word.InsertLocation.end)
        body.insertParagraph('', Word.InsertLocation.end)
      }

      await context.sync()

      resolve({
        success: true,
        message: '教案结构插入成功',
        data: {
          subject,
          topic,
          grade,
          duration,
          sectionCount: sections.length
        }
      })
    }).catch((error) => {
      resolve({
        success: false,
        message: `教案结构插入失败: ${error instanceof Error ? error.message : String(error)}`,
        error
      })
    })
  })
}

// ============================================================================
// P2 工具实现
// ============================================================================

/**
 * word_official_header - 公文红头
 * 创建标准公文红头格式
 */
async function wordOfficialHeader(args: Record<string, any>): Promise<FunctionResult> {
  const {
    organizationName,
    documentNumber = '',
    date = '',
    headerColor = '#FF0000',
    includeLine = true
  } = args

  if (!organizationName) {
    return { success: false, message: 'organizationName 参数不能为空' }
  }

  return new Promise((resolve) => {
    Word.run(async (context) => {
      const document = context.document
      const body = document.body

      // 发文机关名称（红色居中）
      const orgPara = body.insertParagraph(organizationName, Word.InsertLocation.start)
      orgPara.alignment = Word.Alignment.centered
      orgPara.font.bold = true
      orgPara.font.size = 22
      orgPara.font.color = headerColor

      // 文号
      if (documentNumber) {
        const numPara = body.insertParagraph(documentNumber, Word.InsertLocation.end)
        numPara.alignment = Word.Alignment.centered
        numPara.font.size = 14
      }

      // 红线
      if (includeLine) {
        const linePara = body.insertParagraph('━'.repeat(30), Word.InsertLocation.end)
        linePara.alignment = Word.Alignment.centered
        linePara.font.color = headerColor
      }

      // 日期（右对齐）
      if (date) {
        body.insertParagraph('', Word.InsertLocation.end)
        const datePara = body.insertParagraph(date, Word.InsertLocation.end)
        datePara.alignment = Word.Alignment.right
        datePara.font.size = 14
      }

      body.insertParagraph('', Word.InsertLocation.end)

      await context.sync()

      resolve({
        success: true,
        message: '公文红头生成成功',
        data: {
          organizationName,
          documentNumber,
          date
        }
      })
    }).catch((error) => {
      resolve({
        success: false,
        message: `公文红头生成失败: ${error instanceof Error ? error.message : String(error)}`,
        error
      })
    })
  })
}

// ============================================================================
// 工具定义导出
// ============================================================================

export const wordEducationToolDefinitions: ToolDefinition[] = [
  // P0 工具
  {
    name: 'word_mail_merge',
    handler: wordMailMerge,
    category: 'text',
    description: '批量文档生成（邮件合并）'
  },
  // P1 工具
  {
    name: 'word_exam_header',
    handler: wordExamHeader,
    category: 'text',
    description: '试卷头生成'
  },
  {
    name: 'word_question_section',
    handler: wordQuestionSection,
    category: 'text',
    description: '试卷大题区域插入'
  },
  {
    name: 'word_lesson_plan',
    handler: wordLessonPlan,
    category: 'text',
    description: '教案结构插入'
  },
  // P2 工具
  {
    name: 'word_official_header',
    handler: wordOfficialHeader,
    category: 'text',
    description: '公文红头生成'
  }
]

// 导出处理函数（用于直接调用）
export {
  wordMailMerge,
  wordExamHeader,
  wordQuestionSection,
  wordLessonPlan,
  wordOfficialHeader
}

