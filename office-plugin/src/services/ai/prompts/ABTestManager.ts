/**
 * A/B测试管理器 - 支持提示词模板的A/B测试
 */

import Logger from '../../../utils/logger'
import type { PromptTemplate } from './types'

const logger = new Logger('ABTestManager')

interface ABTestConfig {
  testId: string
  templateA: PromptTemplate
  templateB: PromptTemplate
  trafficSplit: number // 0-1之间，A组流量比例
  isActive: boolean
}

interface TestResult {
  testId: string
  variant: 'A' | 'B'
  timestamp: number
  success: boolean
  responseTime: number
  tokenCount: number
}

export class ABTestManager {
  private activeTests = new Map<string, ABTestConfig>()
  private results: TestResult[] = []
  private maxResults = 1000

  /**
   * 创建A/B测试
   */
  createTest(
    testId: string,
    templateA: PromptTemplate,
    templateB: PromptTemplate,
    trafficSplit: number = 0.5
  ): void {
    this.activeTests.set(testId, {
      testId,
      templateA,
      templateB,
      trafficSplit,
      isActive: true
    })

    logger.info('A/B test created', { testId, trafficSplit })
  }

  /**
   * 获取测试变体
   */
  getTestVariant(testId: string): PromptTemplate | null {
    const test = this.activeTests.get(testId)
    if (!test || !test.isActive) {
      return null
    }

    // 基于随机数决定使用哪个变体
    const random = Math.random()
    const variant = random < test.trafficSplit ? 'A' : 'B'
    const template = variant === 'A' ? test.templateA : test.templateB

    logger.debug('A/B test variant selected', { testId, variant, random })
    return template
  }

  /**
   * 记录测试结果
   */
  recordResult(
    testId: string,
    variant: 'A' | 'B',
    success: boolean,
    responseTime: number,
    tokenCount: number
  ): void {
    const result: TestResult = {
      testId,
      variant,
      timestamp: Date.now(),
      success,
      responseTime,
      tokenCount
    }

    this.results.push(result)

    // 限制结果数量
    if (this.results.length > this.maxResults) {
      this.results = this.results.slice(-this.maxResults)
    }

    logger.debug('A/B test result recorded', result)
  }

  /**
   * 获取测试统计
   */
  getTestStats(testId: string) {
    const testResults = this.results.filter(r => r.testId === testId)

    if (testResults.length === 0) {
      return null
    }

    const variantA = testResults.filter(r => r.variant === 'A')
    const variantB = testResults.filter(r => r.variant === 'B')

    const calculateStats = (results: TestResult[]) => ({
      count: results.length,
      successRate: results.filter(r => r.success).length / results.length,
      avgResponseTime: results.reduce((sum, r) => sum + r.responseTime, 0) / results.length,
      avgTokenCount: results.reduce((sum, r) => sum + r.tokenCount, 0) / results.length
    })

    return {
      testId,
      totalSamples: testResults.length,
      variantA: calculateStats(variantA),
      variantB: calculateStats(variantB)
    }
  }

  /**
   * 停止测试
   */
  stopTest(testId: string): void {
    const test = this.activeTests.get(testId)
    if (test) {
      test.isActive = false
      logger.info('A/B test stopped', { testId })
    }
  }
}