/**
 * Word OOXML 相关类型定义
 */

import type { EnhancedSearchOptions } from './search'

/**
 * OOXML 插入选项
 */
export interface InsertOoxmlOptions {
  ooxml: string
  insertLocation?: 'Before' | 'After' | 'Start' | 'End'
  targetText?: string
}

/**
 * 生成 OOXML 表格选项
 */
export interface TableOoxmlOptions {
  style?: string
  firstRow?: boolean
  headingShading?: string
}

/**
 * 高级替换选项
 */
export interface ReplaceTextOptions {
  searchText: string
  replaceText?: string
  replaceWithOoxml?: string
  useWildcards?: boolean
  matchCase?: boolean
  matchWholeWord?: boolean
  maxReplacements?: number
  formatConditions?: EnhancedSearchOptions['formatConditions']
}

/**
 * 高级 OOXML 模板生成选项
 */
export interface AdvancedOoxmlTemplateOptions {
  title?: string
  sections: Array<{
    heading?: string
    paragraphs?: string[]
    table?: {
      data: string[][]
      options?: TableOoxmlOptions
    }
  }>
}
