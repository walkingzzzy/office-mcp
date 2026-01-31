/**
 * ppt_education - 教育场景工具
 * 合并 2 个原工具
 */

import { createActionTool, required } from '@office-mcp/shared'

const SUPPORTED_ACTIONS = [
  'lessonSlides', 'exerciseSlide'
] as const

export const pptEducationTool = createActionTool({
  name: 'ppt_education',
  description: `教育场景工具。支持的操作(action):
- lessonSlides: 创建课件幻灯片 (需要 title, content, 可选 layout, images)
- exerciseSlide: 创建练习幻灯片 (需要 questions, 可选 answerSlide)`,
  category: 'education',
  application: 'powerpoint',
  actions: SUPPORTED_ACTIONS,
  commandMap: {
    lessonSlides: 'ppt_lesson_slides',
    exerciseSlide: 'ppt_exercise_slide'
  },
  paramRules: {
    lessonSlides: [required('title', 'string'), required('content', 'array')],
    exerciseSlide: [required('questions', 'array')]
  },
  pathParams: {
    imagePath: ['images']
  },
  properties: {
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
  metadata: {
    version: '2.0.0',
    priority: 'P1',
    intentKeywords: ['课件', '教学', '练习', '题目', '教育'],
    mergedTools: ['ppt_lesson_slides', 'ppt_exercise_slide']
  },
  examples: [
    {
      description: '创建课件幻灯片',
      input: { action: 'lessonSlides', title: '第一章 绑定', content: ['概念介绍', '示例演示'] },
      output: { success: true, message: '成功创建课件', action: 'lessonSlides' }
    }
  ]
})
