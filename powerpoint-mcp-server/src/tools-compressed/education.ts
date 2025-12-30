/**
 * ppt_education - 教育场景工具
 * 合并 2 个原工具
 */

import { sendIPCCommand } from '@office-mcp/shared'
import type { ToolDefinition } from './types.js'
import { validateAction, unsupportedActionError } from './types.js'

const SUPPORTED_ACTIONS = [
  'lessonSlides', 'exerciseSlide'
] as const

type EducationAction = typeof SUPPORTED_ACTIONS[number]

export const pptEducationTool: ToolDefinition = {
  name: 'ppt_education',
  description: `教育场景工具。支持的操作(action):
- lessonSlides: 创建课件幻灯片 (需要 title, content, 可选 layout, images)
- exerciseSlide: 创建练习幻灯片 (需要 questions, 可选 answerSlide)`,
  category: 'education',
  application: 'powerpoint',
  inputSchema: {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        enum: SUPPORTED_ACTIONS,
        description: '要执行的操作'
      },
      title: {
        type: 'string',
        description: '[lessonSlides] 课件标题'
      },
      content: {
        type: 'array',
        items: { type: 'string' },
        description: '[lessonSlides] 课件内容要点'
      },
      layout: {
        type: 'string',
        description: '[lessonSlides] 布局类型'
      },
      images: {
        type: 'array',
        items: { type: 'string' },
        description: '[lessonSlides] 图片路径列表'
      },
      questions: {
        type: 'array',
        description: '[exerciseSlide] 练习题目',
        items: {
          type: 'object',
          properties: {
            question: { type: 'string' },
            options: { type: 'array', items: { type: 'string' } },
            answer: { type: 'string' }
          }
        }
      },
      answerSlide: {
        type: 'boolean',
        description: '[exerciseSlide] 是否生成答案幻灯片'
      }
    },
    required: ['action']
  },
  metadata: {
    version: '2.0.0',
    priority: 'P1',
    intentKeywords: ['课件', '教学', '练习', '题目', '教育'],
    mergedTools: ['ppt_lesson_slides', 'ppt_exercise_slide'],
    supportedActions: [...SUPPORTED_ACTIONS]
  },
  handler: async (args: Record<string, any>) => {
    const { action, ...params } = args

    if (!validateAction(action, [...SUPPORTED_ACTIONS])) {
      return unsupportedActionError(action, [...SUPPORTED_ACTIONS])
    }

    const commandMap: Record<EducationAction, string> = {
      lessonSlides: 'ppt_lesson_slides',
      exerciseSlide: 'ppt_exercise_slide'
    }

    const command = commandMap[action as EducationAction]
    const result = await sendIPCCommand(command, params)

    return { ...result, action }
  },
  examples: [
    {
      description: '创建课件幻灯片',
      input: { action: 'lessonSlides', title: '第一章 绑定', content: ['概念介绍', '示例演示'] },
      output: { success: true, message: '成功创建课件', action: 'lessonSlides' }
    }
  ]
}
