/**
 * PowerPoint 编辑 Hook
 * 管理 PowerPoint 幻灯片修改的状态和操作
 * 
 * @deprecated 此 Hook 使用已废弃的 PowerPointService，建议使用 MCP 工具
 * 注意：PowerPointService 已被移除，此 Hook 暂时不可用
 */

import { useCallback, useState } from 'react'

// import { powerPointService } from '../services/deprecated/PowerPointService'
import type {
  PowerPointBatchChangeResult,
  PowerPointPresentationContent,
  PowerPointSlideTextChange,
  PowerPointTextDiff} from '../types/powerpoint'
import { calculateDiff } from '../utils/diffUtils'
import Logger from '../utils/logger'

const logger = new Logger('usePowerPointEdit')

// 模拟 powerPointService 接口，避免编译错误
const powerPointService = {
  readPresentation: async (): Promise<PowerPointPresentationContent> => {
    throw new Error('PowerPointService has been deprecated. Please use MCP tools instead.')
  },
  replaceSlideTitle: async (_slideIndex: number, _title: string) => {},
  replaceSlideContent: async (_slideIndex: number, _shapeIndex: number | undefined, _content: string) => {},
  applyChanges: async (changes: PowerPointSlideTextChange[]): Promise<PowerPointBatchChangeResult> => ({
    total: changes.length,
    success: 0,
    failed: changes.length,
    failedSlides: changes.map(c => c.slideIndex),
    errors: changes.map(c => ({ slideIndex: c.slideIndex, error: 'PowerPointService has been deprecated' }))
  }),
  navigateToSlide: async (_slideIndex: number) => {}
}

/**
 * 生成唯一 ID
 */
function generateId(): string {
  return `ppt-change-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`
}

/**
 * PowerPoint 编辑 Hook
 */
export function usePowerPointEdit() {
  const [presentationContent, setPresentationContent] =
    useState<PowerPointPresentationContent | null>(null)
  const [slideChanges, setSlideChanges] = useState<PowerPointSlideTextChange[]>([])
  const [textDiffs, setTextDiffs] = useState<PowerPointTextDiff[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * 读取演示文稿内容
   */
  const readPresentation = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const content = await powerPointService.readPresentation()
      setPresentationContent(content)

      logger.info('Presentation loaded', {
        title: content.title,
        slideCount: content.slideCount
      })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err)
      setError(errorMessage)
      logger.error('Failed to read presentation', { error: err })
    } finally {
      setIsLoading(false)
    }
  }, [])

  /**
   * 计算幻灯片文本差异
   * @param aiText AI 生成的文本内容(可以是完整演示文稿或单个幻灯片)
   */
  const calculateSlideDiff = useCallback(
    async (aiText: string) => {
      try {
        setIsLoading(true)
        setError(null)

        if (!presentationContent) {
          await readPresentation()
          return
        }

        // 简单的启发式:如果 AI 文本包含多个"幻灯片"或"Slide"关键字,视为完整演示文稿
        const isFullPresentation =
          (aiText.match(/幻灯片|Slide/gi) || []).length >= 2

        const diffs: PowerPointTextDiff[] = []
        const changes: PowerPointSlideTextChange[] = []

        if (isFullPresentation) {
          // 处理完整演示文稿:尝试匹配每个幻灯片
          for (const slide of presentationContent.slides) {
            // 简单匹配:查找包含幻灯片标题的段落
            const slidePattern = new RegExp(`${slide.title}[\\s\\S]*?(?=幻灯片|Slide|$)`, 'i')
            const match = aiText.match(slidePattern)

            if (match) {
              const aiSlideText = match[0].trim()

              // 计算差异
              const originalText = `${slide.title}\n${slide.content}`
              const diffResult = calculateDiff(originalText, aiSlideText)

              const totalChanges =
                diffResult.statistics.insertions + diffResult.statistics.deletions

              if (totalChanges > 0) {
                diffs.push({
                  slideIndex: slide.index,
                  part: 'content',
                  oldText: originalText,
                  newText: aiSlideText,
                  hasChanges: true
                })

                changes.push({
                  id: generateId(),
                  slideIndex: slide.index,
                  oldText: originalText,
                  newText: aiSlideText,
                  part: 'content',
                  status: 'pending',
                  description: `${diffResult.statistics.insertions} 处新增, ${diffResult.statistics.deletions} 处删除`
                })
              }
            }
          }
        } else {
          // 处理单个幻灯片:与当前选中或第一张幻灯片比较
          const slide = presentationContent.slides[0]
          const originalText = `${slide.title}\n${slide.content}`

          const diffResult = calculateDiff(originalText, aiText)

          const totalChanges =
            diffResult.statistics.insertions + diffResult.statistics.deletions

          if (totalChanges > 0) {
            diffs.push({
              slideIndex: slide.index,
              part: 'content',
              oldText: originalText,
              newText: aiText,
              hasChanges: true
            })

            changes.push({
              id: generateId(),
              slideIndex: slide.index,
              oldText: originalText,
              newText: aiText,
              part: 'content',
              status: 'pending',
              description: `${diffResult.statistics.insertions} 处新增, ${diffResult.statistics.deletions} 处删除`
            })
          }
        }

        setTextDiffs(diffs)
        setSlideChanges(changes)

        logger.info('Slide diff calculated', {
          diffCount: diffs.length,
          changeCount: changes.length
        })
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err)
        setError(errorMessage)
        logger.error('Failed to calculate slide diff', { error: err })
      } finally {
        setIsLoading(false)
      }
    },
    [presentationContent, readPresentation]
  )

  /**
   * 添加幻灯片修改建议
   */
  const addSlideChange = useCallback(
    (change: Omit<PowerPointSlideTextChange, 'id' | 'status'>) => {
      const newChange: PowerPointSlideTextChange = {
        ...change,
        id: generateId(),
        status: 'pending'
      }

      setSlideChanges((prev) => [...prev, newChange])

      logger.info('Slide change added', { slideIndex: change.slideIndex, part: change.part })
    },
    []
  )

  /**
   * 接受单个幻灯片修改
   */
  const acceptChange = useCallback(
    async (changeId: string) => {
      try {
        const change = slideChanges.find((c) => c.id === changeId)
        if (!change) {
          throw new Error(`Change not found: ${changeId}`)
        }

        // 应用修改
        if (change.part === 'title') {
          await powerPointService.replaceSlideTitle(change.slideIndex, change.newText)
        } else if (change.part === 'content') {
          await powerPointService.replaceSlideContent(
            change.slideIndex,
            undefined,
            change.newText
          )
        }
        // 'notes' part is not supported by PowerPoint API

        // 更新状态
        setSlideChanges((prev) =>
          prev.map((c) => (c.id === changeId ? { ...c, status: 'accepted' as const } : c))
        )

        logger.info('Change accepted', { changeId, slideIndex: change.slideIndex })
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err)
        setError(errorMessage)
        logger.error('Failed to accept change', { error: err, changeId })
      }
    },
    [slideChanges]
  )

  /**
   * 拒绝单个幻灯片修改
   */
  const rejectChange = useCallback((changeId: string) => {
    setSlideChanges((prev) =>
      prev.map((c) => (c.id === changeId ? { ...c, status: 'rejected' as const } : c))
    )

    logger.info('Change rejected', { changeId })
  }, [])

  /**
   * 接受所有修改
   */
  const acceptAllChanges = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const pendingChanges = slideChanges.filter((c) => c.status === 'pending')

      if (pendingChanges.length === 0) {
        logger.info('No pending changes to accept')
        return
      }

      // 批量应用修改
      const result: PowerPointBatchChangeResult =
        await powerPointService.applyChanges(pendingChanges)

      // 更新状态
      setSlideChanges((prev) =>
        prev.map((c) =>
          c.status === 'pending' && !result.failedSlides.includes(c.slideIndex)
            ? { ...c, status: 'accepted' as const }
            : c
        )
      )

      if (result.failed > 0) {
        setError(`${result.failed} 个幻灯片修改失败`)
      }

      logger.info('All changes accepted', {
        total: result.total,
        success: result.success,
        failed: result.failed
      })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err)
      setError(errorMessage)
      logger.error('Failed to accept all changes', { error: err })
    } finally {
      setIsLoading(false)
    }
  }, [slideChanges])

  /**
   * 拒绝所有修改
   */
  const rejectAllChanges = useCallback(() => {
    setSlideChanges((prev) =>
      prev.map((c) =>
        c.status === 'pending' ? { ...c, status: 'rejected' as const } : c
      )
    )

    logger.info('All changes rejected')
  }, [])

  /**
   * 导航到指定幻灯片
   */
  const navigateToSlide = useCallback(async (slideIndex: number) => {
    try {
      await powerPointService.navigateToSlide(slideIndex)

      logger.info('Navigated to slide', { slideIndex })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err)
      setError(errorMessage)
      logger.error('Failed to navigate to slide', { error: err, slideIndex })
    }
  }, [])

  /**
   * 清空所有修改
   */
  const clearChanges = useCallback(() => {
    setSlideChanges([])
    setTextDiffs([])
    logger.info('Changes cleared')
  }, [])

  return {
    // 状态
    presentationContent,
    slideChanges,
    textDiffs,
    isLoading,
    error,

    // 统计
    totalChanges: slideChanges.length,
    pendingChanges: slideChanges.filter((c) => c.status === 'pending').length,
    acceptedChanges: slideChanges.filter((c) => c.status === 'accepted').length,
    rejectedChanges: slideChanges.filter((c) => c.status === 'rejected').length,

    // 操作
    readPresentation,
    calculateSlideDiff,
    addSlideChange,
    acceptChange,
    rejectChange,
    acceptAllChanges,
    rejectAllChanges,
    navigateToSlide,
    clearChanges
  }
}
