/**
 * PowerPoint Education Tools - P1 Implementation
 * 教育场景专用PowerPoint工具
 */

import { sendIPCCommand } from '@office-mcp/shared'
import type { ToolDefinition } from './types.js'

// ============================================================================
// P1 工具 - 短期实现
// ============================================================================

/**
 * ppt_lesson_slides - 课件框架生成工具
 * 一键生成课件基本结构
 */
export const pptLessonSlidesTool: ToolDefinition = {
  name: 'ppt_lesson_slides',
  description: '一键生成课件基本结构，包括标题页、教学目标页、内容页、练习页、总结页。适用于教师快速制作课件框架。',
  category: 'powerpoint',
  inputSchema: {
    type: 'object',
    properties: {
      title: {
        type: 'string',
        description: '课程/课件标题'
      },
      subject: {
        type: 'string',
        description: '科目名称'
      },
      grade: {
        type: 'string',
        description: '年级'
      },
      teacher: {
        type: 'string',
        description: '授课教师（可选）'
      },
      objectives: {
        type: 'array',
        items: { type: 'string' },
        description: '教学目标列表'
      },
      contentOutline: {
        type: 'array',
        description: '内容大纲，每项生成一个内容页',
        items: {
          type: 'object',
          properties: {
            title: {
              type: 'string',
              description: '章节标题'
            },
            points: {
              type: 'array',
              items: { type: 'string' },
              description: '知识要点列表'
            }
          }
        }
      },
      exercises: {
        type: 'array',
        items: { type: 'string' },
        description: '课堂练习题目列表'
      },
      summary: {
        type: 'array',
        items: { type: 'string' },
        description: '课堂总结要点'
      },
      includeQA: {
        type: 'boolean',
        default: true,
        description: '是否包含"课堂互动"页'
      },
      includeHomework: {
        type: 'boolean',
        default: true,
        description: '是否包含"作业布置"页'
      },
      theme: {
        type: 'string',
        enum: ['education-blue', 'education-green', 'minimal', 'colorful'],
        default: 'education-blue',
        description: '课件主题风格'
      }
    },
    required: ['title']
  },
  metadata: {
    version: '1.0.0',
    priority: 'P1',
    tags: ['education', 'presentation', 'lesson'],
    intentKeywords: ['课件', 'PPT', '幻灯片', '演示文稿', '备课'],
    scenario: '快速生成课件框架'
  },
  handler: async (args: any) => sendIPCCommand('ppt_lesson_slides', args)
}

/**
 * ppt_exercise_slide - 练习题幻灯片工具
 * 创建交互式练习题页面
 */
export const pptExerciseSlideTool: ToolDefinition = {
  name: 'ppt_exercise_slide',
  description: '创建课堂练习幻灯片，支持选择题、判断题等题型，可设置点击显示答案。',
  category: 'powerpoint',
  inputSchema: {
    type: 'object',
    properties: {
      slideTitle: {
        type: 'string',
        default: '课堂练习',
        description: '幻灯片标题'
      },
      questions: {
        type: 'array',
        description: '练习题列表',
        items: {
          type: 'object',
          properties: {
            type: {
              type: 'string',
              enum: ['choice', 'truefalse', 'fillblank'],
              description: '题型：choice=选择题、truefalse=判断题、fillblank=填空题'
            },
            question: {
              type: 'string',
              description: '题目内容'
            },
            options: {
              type: 'array',
              items: { type: 'string' },
              description: '选项列表（选择题使用）'
            },
            answer: {
              type: 'string',
              description: '正确答案'
            }
          },
          required: ['question']
        }
      },
      showAnswerOnClick: {
        type: 'boolean',
        default: true,
        description: '是否点击显示答案（添加动画效果）'
      },
      questionsPerSlide: {
        type: 'number',
        default: 1,
        description: '每页显示的题目数量'
      }
    },
    required: ['questions']
  },
  metadata: {
    version: '1.0.0',
    priority: 'P1',
    tags: ['education', 'exercise', 'interactive'],
    intentKeywords: ['练习题', '课堂练习', '互动', '测验'],
    scenario: '课堂互动练习'
  },
  handler: async (args: any) => sendIPCCommand('ppt_exercise_slide', args)
}

// ============================================================================
// 导出所有教育工具
// ============================================================================

export const powerPointEducationTools: ToolDefinition[] = [
  pptLessonSlidesTool,
  pptExerciseSlideTool
]

export function getPowerPointEducationTools(): ToolDefinition[] {
  return powerPointEducationTools
}

