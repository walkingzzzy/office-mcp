/**
 * Word Education Tools - P0/P1/P2 Implementation
 * 教育场景专用Word工具
 */

import { sendIPCCommand } from '@office-mcp/shared'
import type { ToolDefinition } from './types.js'

// ============================================================================
// P0 工具 - 高优先级
// ============================================================================

/**
 * word_mail_merge - 批量文档生成工具（邮件合并）
 * 从数据源批量生成个性化文档
 */
export const wordMailMergeTool: ToolDefinition = {
  name: 'word_mail_merge',
  description: '批量生成个性化文档（奖状、通知、成绩单等）。支持从JSON数据源读取学生信息，替换文档中的占位符生成多份文档。',
  category: 'word',
  inputSchema: {
    type: 'object',
    properties: {
      dataSource: {
        type: 'object',
        description: '数据源配置',
        properties: {
          type: {
            type: 'string',
            enum: ['json', 'excel_range'],
            description: '数据源类型：json=直接传入数据、excel_range=从Excel读取'
          },
          data: {
            type: 'array',
            description: '当type为json时，直接传入数据数组',
            items: {
              type: 'object'
            }
          },
          range: {
            type: 'string',
            description: '当type为excel_range时，指定Excel数据范围'
          }
        },
        required: ['type']
      },
      fields: {
        type: 'array',
        description: '字段映射配置',
        items: {
          type: 'object',
          properties: {
            placeholder: {
              type: 'string',
              description: '文档中的占位符，如 "{{姓名}}" 或 "{{成绩}}"'
            },
            column: {
              type: 'string',
              description: '数据源中的列名或字段名'
            }
          },
          required: ['placeholder', 'column']
        }
      },
      outputMode: {
        type: 'string',
        enum: ['single_document', 'separate_files'],
        default: 'separate_files',
        description: '输出模式：single_document=合并到一个文档、separate_files=每条记录独立文件'
      },
      filenameTemplate: {
        type: 'string',
        description: '文件名模板（separate_files模式下），如 "奖状_{{姓名}}"'
      },
      pageBreak: {
        type: 'boolean',
        default: true,
        description: '在single_document模式下，每条记录之间是否插入分页符'
      }
    },
    required: ['dataSource', 'fields']
  },
  metadata: {
    version: '1.0.0',
    priority: 'P0',
    tags: ['education', 'batch', 'mail-merge'],
    intentKeywords: ['批量生成', '奖状', '通知', '邮件合并', '批量打印', '证书'],
    scenario: '批量生成学生奖状、家长通知等'
  },
  handler: async (args: any) => sendIPCCommand('word_mail_merge', args)
}

// ============================================================================
// P1 工具 - 短期实现
// ============================================================================

/**
 * word_exam_header - 试卷头生成工具
 * 创建标准化试卷头部信息
 */
export const wordExamHeaderTool: ToolDefinition = {
  name: 'word_exam_header',
  description: '创建标准化试卷头部，包含学校名称、考试名称、科目、时间、总分、考生信息填写区等。',
  category: 'word',
  inputSchema: {
    type: 'object',
    properties: {
      schoolName: {
        type: 'string',
        description: '学校名称'
      },
      examTitle: {
        type: 'string',
        description: '考试名称，如 "2024年秋季期中考试"'
      },
      subject: {
        type: 'string',
        description: '科目名称'
      },
      grade: {
        type: 'string',
        description: '年级，如 "三年级" 或 "高一"'
      },
      duration: {
        type: 'number',
        description: '考试时长（分钟）'
      },
      totalScore: {
        type: 'number',
        default: 100,
        description: '试卷总分'
      },
      includeStudentInfo: {
        type: 'boolean',
        default: true,
        description: '是否包含考生信息填写区（姓名、班级、考号）'
      },
      includeScoreTable: {
        type: 'boolean',
        default: true,
        description: '是否包含得分表格'
      }
    },
    required: ['schoolName', 'examTitle', 'subject']
  },
  metadata: {
    version: '1.0.0',
    priority: 'P1',
    tags: ['education', 'exam', 'template'],
    intentKeywords: ['试卷', '考试', '试卷头', '考试模板'],
    scenario: '创建标准化试卷'
  },
  handler: async (args: any) => sendIPCCommand('word_exam_header', args)
}

/**
 * word_question_section - 试卷大题区域工具
 * 插入试卷大题标题和说明
 */
export const wordQuestionSectionTool: ToolDefinition = {
  name: 'word_question_section',
  description: '插入试卷大题区域标题，如 "一、选择题（每题2分，共20分）"。自动计算总分并添加答题说明。',
  category: 'word',
  inputSchema: {
    type: 'object',
    properties: {
      sectionNumber: {
        type: 'string',
        description: '大题号，使用中文数字，如 "一"、"二"、"三"'
      },
      questionType: {
        type: 'string',
        description: '题型名称，如 "选择题"、"填空题"、"简答题"、"计算题"'
      },
      count: {
        type: 'number',
        description: '小题数量'
      },
      scorePerQuestion: {
        type: 'number',
        description: '每小题分值'
      },
      totalScore: {
        type: 'number',
        description: '本大题总分（如果不指定，自动计算 count × scorePerQuestion）'
      },
      instructions: {
        type: 'string',
        description: '答题说明，如 "每题只有一个正确答案，请将答案填写在答题卡上"'
      }
    },
    required: ['sectionNumber', 'questionType']
  },
  metadata: {
    version: '1.0.0',
    priority: 'P1',
    tags: ['education', 'exam', 'question'],
    intentKeywords: ['大题', '题型', '选择题', '填空题', '简答题'],
    scenario: '试卷结构化生成'
  },
  handler: async (args: any) => sendIPCCommand('word_question_section', args)
}

/**
 * word_lesson_plan - 教案结构插入工具
 * 快速生成标准教案框架
 */
export const wordLessonPlanTool: ToolDefinition = {
  name: 'word_lesson_plan',
  description: '插入标准教案结构框架，包含教学目标、重难点、教学过程、板书设计、作业布置等章节。',
  category: 'word',
  inputSchema: {
    type: 'object',
    properties: {
      subject: {
        type: 'string',
        description: '科目名称'
      },
      topic: {
        type: 'string',
        description: '课题/课文名称'
      },
      grade: {
        type: 'string',
        description: '年级'
      },
      duration: {
        type: 'number',
        description: '课时数量'
      },
      sections: {
        type: 'array',
        items: { type: 'string' },
        default: [
          '教学目标',
          '教学重点',
          '教学难点',
          '教学准备',
          '教学过程',
          '板书设计',
          '作业布置',
          '教学反思'
        ],
        description: '教案章节列表'
      },
      includeThreeDimensionalGoals: {
        type: 'boolean',
        default: true,
        description: '是否在教学目标下细分三维目标（知识与技能、过程与方法、情感态度价值观）'
      }
    },
    required: ['subject', 'topic']
  },
  metadata: {
    version: '1.0.0',
    priority: 'P1',
    tags: ['education', 'lesson-plan', 'template'],
    intentKeywords: ['教案', '备课', '教学设计', '教学计划'],
    scenario: '快速生成教案框架'
  },
  handler: async (args: any) => sendIPCCommand('word_lesson_plan', args)
}

// ============================================================================
// P2 工具 - 中期实现
// ============================================================================

/**
 * word_official_header - 公文红头工具
 * 创建标准公文红头格式
 */
export const wordOfficialHeaderTool: ToolDefinition = {
  name: 'word_official_header',
  description: '创建标准公文红头（发文机关名称、文号、日期），适用于学校行政公文。',
  category: 'word',
  inputSchema: {
    type: 'object',
    properties: {
      organizationName: {
        type: 'string',
        description: '发文机关名称，如 "XX中学"'
      },
      documentNumber: {
        type: 'string',
        description: '文号，如 "校办发〔2024〕1号"'
      },
      date: {
        type: 'string',
        description: '发文日期，如 "2024年12月1日"'
      },
      headerColor: {
        type: 'string',
        default: '#FF0000',
        description: '红头颜色'
      },
      includeLine: {
        type: 'boolean',
        default: true,
        description: '是否包含红线分隔'
      }
    },
    required: ['organizationName']
  },
  metadata: {
    version: '1.0.0',
    priority: 'P2',
    tags: ['education', 'official', 'document'],
    intentKeywords: ['公文', '红头', '通知', '文件', '发文'],
    scenario: '学校行政公文制作'
  },
  handler: async (args: any) => sendIPCCommand('word_official_header', args)
}

// ============================================================================
// 导出所有教育工具
// ============================================================================

export const wordEducationTools: ToolDefinition[] = [
  // P0 工具
  wordMailMergeTool,
  // P1 工具
  wordExamHeaderTool,
  wordQuestionSectionTool,
  wordLessonPlanTool,
  // P2 工具
  wordOfficialHeaderTool
]

export function getWordEducationTools(): ToolDefinition[] {
  return wordEducationTools
}

