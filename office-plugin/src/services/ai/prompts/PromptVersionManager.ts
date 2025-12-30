/**
 * 提示词版本管理器 - 支持热更新和版本控制
 */

import Logger from '../../../utils/logger'
import type { PromptTemplate } from './types'

const logger = new Logger('PromptVersionManager')

interface PromptVersion {
  version: string
  template: PromptTemplate
  createdAt: number
  isActive: boolean
  rolloutPercentage: number // 0-100
}

export class PromptVersionManager {
  private versions = new Map<string, PromptVersion[]>()
  private currentVersions = new Map<string, string>()

  /**
   * 注册新版本提示词
   */
  registerVersion(
    templateId: string,
    version: string,
    template: PromptTemplate,
    rolloutPercentage: number = 0
  ): void {
    if (!this.versions.has(templateId)) {
      this.versions.set(templateId, [])
    }

    const versions = this.versions.get(templateId)!

    // 检查版本是否已存在
    const existingIndex = versions.findIndex(v => v.version === version)
    if (existingIndex >= 0) {
      versions[existingIndex] = {
        version,
        template,
        createdAt: Date.now(),
        isActive: rolloutPercentage > 0,
        rolloutPercentage
      }
    } else {
      versions.push({
        version,
        template,
        createdAt: Date.now(),
        isActive: rolloutPercentage > 0,
        rolloutPercentage
      })
    }

    logger.info('Prompt version registered', { templateId, version, rolloutPercentage })
  }

  /**
   * 获取当前活跃版本
   */
  getActiveTemplate(templateId: string): PromptTemplate | null {
    const versions = this.versions.get(templateId)
    if (!versions) {
      return null
    }

    // 获取所有活跃版本
    const activeVersions = versions.filter(v => v.isActive)
    if (activeVersions.length === 0) {
      return null
    }

    // 基于rollout百分比选择版本
    const random = Math.random() * 100
    let cumulative = 0

    for (const version of activeVersions) {
      cumulative += version.rolloutPercentage
      if (random <= cumulative) {
        logger.debug('Version selected', {
          templateId,
          version: version.version,
          rollout: version.rolloutPercentage
        })
        return version.template
      }
    }

    // 默认返回第一个活跃版本
    return activeVersions[0].template
  }

  /**
   * 热更新版本rollout百分比
   */
  updateRollout(templateId: string, version: string, rolloutPercentage: number): boolean {
    const versions = this.versions.get(templateId)
    if (!versions) {
      return false
    }

    const versionIndex = versions.findIndex(v => v.version === version)
    if (versionIndex === -1) {
      return false
    }

    versions[versionIndex].rolloutPercentage = rolloutPercentage
    versions[versionIndex].isActive = rolloutPercentage > 0

    logger.info('Version rollout updated', { templateId, version, rolloutPercentage })
    return true
  }

  /**
   * 获取版本列表
   */
  getVersions(templateId: string): PromptVersion[] {
    return this.versions.get(templateId) || []
  }

  /**
   * 回滚到指定版本
   */
  rollbackTo(templateId: string, version: string): boolean {
    const versions = this.versions.get(templateId)
    if (!versions) {
      return false
    }

    // 停用所有版本
    versions.forEach(v => {
      v.isActive = false
      v.rolloutPercentage = 0
    })

    // 激活指定版本
    const targetVersion = versions.find(v => v.version === version)
    if (targetVersion) {
      targetVersion.isActive = true
      targetVersion.rolloutPercentage = 100

      logger.info('Rolled back to version', { templateId, version })
      return true
    }

    return false
  }
}