/**
 * PowerPoint 教育场景工具
 * 包含课件框架生成、练习题幻灯片等教育专用功能
 * 
 * 注意：PowerPoint API 的 slides.add() 返回 void，需要通过 getItemAt 获取新添加的幻灯片
 */

import type { FunctionResult } from '../../ai/types'
import type { ToolDefinition, ToolResult } from '../types'

// ============================================================================
// 辅助函数
// ============================================================================

/**
 * 添加幻灯片并获取引用
 * PowerPoint API的slides.add()返回void，需要通过索引获取新幻灯片
 */
async function addSlideAndGetRef(
  slides: PowerPoint.SlideCollection,
  context: PowerPoint.RequestContext
): Promise<PowerPoint.Slide> {
  slides.load('items')
  await context.sync()
  const countBefore = slides.items.length
  
  slides.add()
  await context.sync()
  
  return slides.getItemAt(countBefore)
}

// ============================================================================
// P1 工具实现
// ============================================================================

/**
 * ppt_lesson_slides - 课件框架生成
 * 一键生成课件基本结构
 */
async function pptLessonSlides(args: Record<string, any>): Promise<FunctionResult> {
  const {
    title,
    subject = '',
    grade = '',
    teacher = '',
    objectives = [],
    contentOutline = [],
    exercises = [],
    summary = [],
    includeQA = true,
    includeHomework = true
  } = args

  if (!title) {
    return { success: false, message: 'title 参数不能为空' }
  }

  return new Promise((resolve) => {
    PowerPoint.run(async (context) => {
      const presentation = context.presentation
      const slides = presentation.slides
      
      let slideIndex = 0
      const createdSlides: string[] = []

      // 1. 标题页
      const titleSlide = await addSlideAndGetRef(slides, context)
      titleSlide.shapes.load('items')
      await context.sync()

      // 添加标题文本框
      const titleShape = titleSlide.shapes.addTextBox(title)
      titleShape.left = 100
      titleShape.top = 200
      titleShape.width = 600
      titleShape.height = 100

      // 添加副标题
      let subtitle = ''
      if (subject) subtitle += subject
      if (grade) subtitle += ` ${grade}`
      if (teacher) subtitle += `\n授课教师：${teacher}`

      if (subtitle) {
        const subtitleShape = titleSlide.shapes.addTextBox(subtitle)
        subtitleShape.left = 100
        subtitleShape.top = 320
        subtitleShape.width = 600
        subtitleShape.height = 80
      }
      
      await context.sync()
      slideIndex++
      createdSlides.push('标题页')

      // 2. 教学目标页
      if (objectives.length > 0) {
        const objSlide = await addSlideAndGetRef(slides, context)
        objSlide.shapes.load('items')
        await context.sync()

        const objTitle = objSlide.shapes.addTextBox('教学目标')
        objTitle.left = 50
        objTitle.top = 30
        objTitle.width = 700
        objTitle.height = 50

        const objText = objectives.map((o: string, i: number) => `${i + 1}. ${o}`).join('\n')
        const objContent = objSlide.shapes.addTextBox(objText)
        objContent.left = 50
        objContent.top = 100
        objContent.width = 700
        objContent.height = 400

        await context.sync()
        slideIndex++
        createdSlides.push('教学目标')
      }

      // 3. 内容页
      for (const section of contentOutline) {
        const contentSlide = await addSlideAndGetRef(slides, context)
        contentSlide.shapes.load('items')
        await context.sync()

        const sectionTitle = contentSlide.shapes.addTextBox(section.title || '内容')
        sectionTitle.left = 50
        sectionTitle.top = 30
        sectionTitle.width = 700
        sectionTitle.height = 50

        if (section.points && section.points.length > 0) {
          const pointsText = section.points.map((p: string) => `• ${p}`).join('\n')
          const pointsContent = contentSlide.shapes.addTextBox(pointsText)
          pointsContent.left = 50
          pointsContent.top = 100
          pointsContent.width = 700
          pointsContent.height = 400
        }

        await context.sync()
        slideIndex++
        createdSlides.push(section.title || '内容')
      }

      // 4. 练习页
      if (exercises.length > 0) {
        const exSlide = await addSlideAndGetRef(slides, context)
        exSlide.shapes.load('items')
        await context.sync()

        const exTitle = exSlide.shapes.addTextBox('课堂练习')
        exTitle.left = 50
        exTitle.top = 30
        exTitle.width = 700
        exTitle.height = 50

        const exText = exercises.map((e: string, i: number) => `${i + 1}. ${e}`).join('\n\n')
        const exContent = exSlide.shapes.addTextBox(exText)
        exContent.left = 50
        exContent.top = 100
        exContent.width = 700
        exContent.height = 400

        await context.sync()
        slideIndex++
        createdSlides.push('课堂练习')
      }

      // 5. 课堂互动页
      if (includeQA) {
        const qaSlide = await addSlideAndGetRef(slides, context)
        qaSlide.shapes.load('items')
        await context.sync()

        const qaTitle = qaSlide.shapes.addTextBox('课堂互动')
        qaTitle.left = 50
        qaTitle.top = 200
        qaTitle.width = 700
        qaTitle.height = 100

        await context.sync()
        slideIndex++
        createdSlides.push('课堂互动')
      }

      // 6. 总结页
      if (summary.length > 0) {
        const sumSlide = await addSlideAndGetRef(slides, context)
        sumSlide.shapes.load('items')
        await context.sync()

        const sumTitle = sumSlide.shapes.addTextBox('课堂小结')
        sumTitle.left = 50
        sumTitle.top = 30
        sumTitle.width = 700
        sumTitle.height = 50

        const sumText = summary.map((s: string) => `✓ ${s}`).join('\n')
        const sumContent = sumSlide.shapes.addTextBox(sumText)
        sumContent.left = 50
        sumContent.top = 100
        sumContent.width = 700
        sumContent.height = 400

        await context.sync()
        slideIndex++
        createdSlides.push('课堂小结')
      }

      // 7. 作业布置页
      if (includeHomework) {
        const hwSlide = await addSlideAndGetRef(slides, context)
        hwSlide.shapes.load('items')
        await context.sync()

        const hwTitle = hwSlide.shapes.addTextBox('作业布置')
        hwTitle.left = 50
        hwTitle.top = 30
        hwTitle.width = 700
        hwTitle.height = 50

        const hwContent = hwSlide.shapes.addTextBox('1. \n\n2. \n\n3. ')
        hwContent.left = 50
        hwContent.top = 100
        hwContent.width = 700
        hwContent.height = 400

        await context.sync()
        slideIndex++
        createdSlides.push('作业布置')
      }

      // 8. 结束页
      const endSlide = await addSlideAndGetRef(slides, context)
      endSlide.shapes.load('items')
      await context.sync()

      const endTitle = endSlide.shapes.addTextBox('谢谢！')
      endTitle.left = 200
      endTitle.top = 220
      endTitle.width = 400
      endTitle.height = 100

      await context.sync()
      slideIndex++
      createdSlides.push('结束页')

      resolve({
        success: true,
        message: `课件框架生成成功，共 ${slideIndex} 页`,
        data: {
          title,
          slideCount: slideIndex,
          sections: createdSlides
        }
      })
    }).catch((error) => {
      resolve({
        success: false,
        message: `课件框架生成失败: ${error instanceof Error ? error.message : String(error)}`,
        error
      })
    })
  })
}

/**
 * ppt_exercise_slide - 练习题幻灯片
 * 创建交互式练习题页面
 */
async function pptExerciseSlide(args: Record<string, any>): Promise<FunctionResult> {
  const {
    slideTitle = '课堂练习',
    questions = [],
    showAnswerOnClick = true,
    questionsPerSlide = 1
  } = args

  if (!questions || questions.length === 0) {
    return { success: false, message: 'questions 参数不能为空' }
  }

  return new Promise((resolve) => {
    PowerPoint.run(async (context) => {
      const presentation = context.presentation
      const slides = presentation.slides

      let slideCount = 0
      let questionIndex = 0

      while (questionIndex < questions.length) {
        const slide = await addSlideAndGetRef(slides, context)
        slide.shapes.load('items')
        await context.sync()

        // 幻灯片标题
        const titleShape = slide.shapes.addTextBox(slideTitle)
        titleShape.left = 50
        titleShape.top = 20
        titleShape.width = 700
        titleShape.height = 40

        let yPosition = 80

        // 添加本页的题目
        for (let i = 0; i < questionsPerSlide && questionIndex < questions.length; i++) {
          const q = questions[questionIndex]
          const questionNum = questionIndex + 1

          // 题目内容
          let questionText = `${questionNum}. ${q.question || q}`

          // 如果是选择题，添加选项
          if (q.options && q.options.length > 0) {
            questionText += '\n' + q.options.map((opt: string, idx: number) => 
              `    ${String.fromCharCode(65 + idx)}. ${opt}`
            ).join('\n')
          }

          const qShape = slide.shapes.addTextBox(questionText)
          qShape.left = 50
          qShape.top = yPosition
          qShape.width = 700
          qShape.height = 150

          yPosition += 160

          // 答案
          if (q.answer && showAnswerOnClick) {
            const answerShape = slide.shapes.addTextBox(`答案：${q.answer}`)
            answerShape.left = 50
            answerShape.top = yPosition
            answerShape.width = 300
            answerShape.height = 30
            yPosition += 40
          }

          questionIndex++
        }

        await context.sync()
        slideCount++
      }

      resolve({
        success: true,
        message: `练习题幻灯片生成成功，共 ${slideCount} 页`,
        data: {
          slideCount,
          questionCount: questions.length,
          questionsPerSlide
        }
      })
    }).catch((error) => {
      resolve({
        success: false,
        message: `练习题幻灯片生成失败: ${error instanceof Error ? error.message : String(error)}`,
        error
      })
    })
  })
}

// ============================================================================
// 工具定义导出
// ============================================================================

export const pptEducationToolDefinitions: ToolDefinition[] = [
  {
    name: 'ppt_lesson_slides',
    handler: pptLessonSlides,
    category: 'slide',
    description: '课件框架生成'
  },
  {
    name: 'ppt_exercise_slide',
    handler: pptExerciseSlide,
    category: 'slide',
    description: '练习题幻灯片生成'
  }
]

// 导出处理函数
export {
  pptLessonSlides,
  pptExerciseSlide
}
