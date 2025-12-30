/**
 * Word 教育场景工具
 * 这些工具因业务特殊性保持独立，不进行合并
 */

import { sendIPCCommand } from '@office-mcp/shared'
import type { ToolDefinition } from './types.js'

/**
 * 邮件合并工具
 */
export const wordMailMergeTool: ToolDefinition = {
  name: 'word_mail_merge',
  description: '执行邮件合并操作，将数据源与模板合并生成多个文档',
  category: 'education',
  application: 'word',
  inputSchema: {
    type: 'object',
    properties: {
      dataSource: {
        type: 'string',
        description: '数据源文件路径（Excel 或 CSV）'
      },
      outputPath: {
        type: 'string',
        description: '输出目录路径'
      },
      outputFormat: {
        type: 'string',
        enum: ['docx', 'pdf'],
        description: '输出格式',
        default: 'docx'
      },
      mergeType: {
        type: 'string',
        enum: ['letters', 'labels', 'envelopes', 'directory'],
        description: '合并类型',
        default: 'letters'
      }
    },
    required: ['dataSource']
  },
  metadata: {
    version: '2.0.0',
    priority: 'P0',
    intentKeywords: ['邮件合并', '批量生成', '模板合并']
  },
  handler: async (args: Record<string, any>) => sendIPCCommand('word_mail_merge', args)
}

/**
 * 考试试卷头工具
 */
export const wordExamHeaderTool: ToolDefinition = {
  name: 'word_exam_header',
  description: '生成标准考试试卷头，包含学校名称、考试科目、时间等信息',
  category: 'education',
  application: 'word',
  inputSchema: {
    type: 'object',
    properties: {
      schoolName: {
        type: 'string',
        description: '学校名称'
      },
      examName: {
        type: 'string',
        description: '考试名称（如 "2024年春季期中考试"）'
      },
      subject: {
        type: 'string',
        description: '科目名称'
      },
      duration: {
        type: 'number',
        description: '考试时长（分钟）'
      },
      totalScore: {
        type: 'number',
        description: '总分'
      },
      includeStudentInfo: {
        type: 'boolean',
        description: '是否包含学生信息填写区',
        default: true
      }
    },
    required: ['schoolName', 'examName', 'subject']
  },
  metadata: {
    version: '2.0.0',
    priority: 'P0',
    intentKeywords: ['试卷头', '考试', '试卷']
  },
  handler: async (args: Record<string, any>) => sendIPCCommand('word_exam_header', args)
}

/**
 * 试题分区工具
 */
export const wordQuestionSectionTool: ToolDefinition = {
  name: 'word_question_section',
  description: '创建试题分区，包含题型标题、分值说明和题目编号',
  category: 'education',
  application: 'word',
  inputSchema: {
    type: 'object',
    properties: {
      sectionType: {
        type: 'string',
        enum: ['choice', 'fillBlank', 'shortAnswer', 'essay', 'calculation', 'comprehensive'],
        description: '题型'
      },
      sectionTitle: {
        type: 'string',
        description: '分区标题（如 "一、选择题"）'
      },
      questionCount: {
        type: 'number',
        description: '题目数量'
      },
      pointsPerQuestion: {
        type: 'number',
        description: '每题分值'
      },
      startNumber: {
        type: 'number',
        description: '起始题号',
        default: 1
      }
    },
    required: ['sectionType', 'questionCount']
  },
  metadata: {
    version: '2.0.0',
    priority: 'P1',
    intentKeywords: ['试题', '题型', '选择题', '填空题']
  },
  handler: async (args: Record<string, any>) => sendIPCCommand('word_question_section', args)
}

/**
 * 教案模板工具
 */
export const wordLessonPlanTool: ToolDefinition = {
  name: 'word_lesson_plan',
  description: '生成标准教案模板，包含教学目标、重难点、教学过程等',
  category: 'education',
  application: 'word',
  inputSchema: {
    type: 'object',
    properties: {
      subject: {
        type: 'string',
        description: '科目'
      },
      topic: {
        type: 'string',
        description: '课题'
      },
      grade: {
        type: 'string',
        description: '年级'
      },
      duration: {
        type: 'number',
        description: '课时（分钟）',
        default: 45
      },
      objectives: {
        type: 'array',
        items: { type: 'string' },
        description: '教学目标'
      },
      keyPoints: {
        type: 'array',
        items: { type: 'string' },
        description: '教学重点'
      },
      difficulties: {
        type: 'array',
        items: { type: 'string' },
        description: '教学难点'
      }
    },
    required: ['subject', 'topic']
  },
  metadata: {
    version: '2.0.0',
    priority: 'P1',
    intentKeywords: ['教案', '课程计划', '教学设计']
  },
  handler: async (args: Record<string, any>) => sendIPCCommand('word_lesson_plan', args)
}

/**
 * 公文抬头工具
 */
export const wordOfficialHeaderTool: ToolDefinition = {
  name: 'word_official_header',
  description: '生成标准公文抬头，符合公文格式规范',
  category: 'education',
  application: 'word',
  inputSchema: {
    type: 'object',
    properties: {
      organizationName: {
        type: 'string',
        description: '发文机关名称'
      },
      documentNumber: {
        type: 'string',
        description: '发文字号'
      },
      secretLevel: {
        type: 'string',
        enum: ['公开', '内部', '秘密', '机密'],
        description: '密级',
        default: '公开'
      },
      urgencyLevel: {
        type: 'string',
        enum: ['普通', '加急', '特急'],
        description: '紧急程度',
        default: '普通'
      },
      title: {
        type: 'string',
        description: '公文标题'
      }
    },
    required: ['organizationName', 'title']
  },
  metadata: {
    version: '2.0.0',
    priority: 'P2',
    intentKeywords: ['公文', '红头文件', '发文']
  },
  handler: async (args: Record<string, any>) => sendIPCCommand('word_official_header', args)
}
