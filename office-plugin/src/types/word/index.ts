/**
 * Word 类型定义统一导出
 * 专注于P0功能所需的核心类型定义
 */

// 基础类型
export interface BaseResult {
  success: boolean
  message?: string
  error?: string
}

// 文档相关类型
export interface WordDocumentContent {
  text: string
  paragraphs: WordParagraph[]
  wordCount: number
  characterCount: number
}

export interface WordParagraph {
  text: string
  style?: string
  level?: number
  index: number
}

// 选择相关类型
/**
 * 选区内容
 */
export interface WordSelection {
  /** 选区文本 */
  text: string
  /** 选区内的表格 */
  tables?: WordSelectionTableContext[]
  /** 是否包含表格 */
  hasTables?: boolean
  /** 表格摘要 */
  tableSummary?: string
  /** 选区内的图片 */
  images?: WordSelectionImageContext[]
  /** 是否包含图片 */
  hasImages?: boolean
  /** 图片摘要 */
  imageSummary?: string
  /** Word API 原始范围 - Office.js Range 对象 */
  range?: Word.Range
  /** 选区起始位置 */
  start?: number
  /** 选区结束位置 */
  end?: number
}

export interface WordSelectionTableContext {
  tableIndex: number
  rowCount: number
  columnCount: number
  style?: string
  headerPreview?: string
  firstRow?: string[]
}

export interface WordSelectionImageContext {
  imageIndex: number
  type: 'inline' | 'floating' | 'contentControl' | 'unknown'
  width?: number
  height?: number
  description?: string
}

// 搜索相关类型
export interface WordSearchResult {
  found: boolean
  text?: string
  index: number
  context?: string
  /** Word API 原始范围 - Office.js Range 对象 */
  range?: Word.Range
  /** 搜索结果范围数组 */
  ranges?: Word.Range[]
  /** 匹配结果数组 */
  matches?: Array<{ text: string; index: number }>
  length?: number
  searchText?: string
  hasFormatConditions?: boolean
}

export interface EnhancedSearchOptions {
  matchCase?: boolean
  matchWholeWord?: boolean
  useWildcards?: boolean
  useRegex?: boolean
  ignorePunctuation?: boolean
  ignoreSpace?: boolean
  searchText?: string
  formatConditions?: {
    fontName?: string
    fontSize?: number
    bold?: boolean
    italic?: boolean
    underline?: boolean
    color?: string
  }
}

// 批注相关类型
export interface CommentOptions {
  text: string
  author?: string
  initial?: string
  position?: DocumentPosition
}

export interface CommentResult extends BaseResult {
  commentId?: string
}

// 图片相关类型
export interface PictureInsertOptions {
  width?: number
  height?: number
  wrapText?: boolean
  position?: DocumentPosition
  base64?: string
  url?: string
  description?: string
  targetText?: string
  insertLocation?: 'replace' | 'start' | 'end'
}

export interface PictureAdjustOptions {
  width?: number
  height?: number
  maintainAspectRatio?: boolean
}

export interface PictureResult extends BaseResult {
  pictureId?: string
  actualWidth?: number
  actualHeight?: number
}

// 查找替换相关类型
export interface FindAndReplaceOptions {
  findtext: string
  replacetext: string
  matchCase?: boolean
  matchWholeWord?: boolean
  useWildcards?: boolean
  useRegex?: boolean
  replaceAll?: boolean
}

export interface FindAndReplaceResult extends BaseResult {
  replacedCount?: number
  matches?: Array<{
    text: string
    index: number
    context: string
  }>
}

// 位置相关类型
export interface DocumentPosition {
  paragraphIndex?: number
  characterOffset?: number
  paragraphText?: string
  globalPosition?: number
  paragraph?: number
  character?: number
  page?: number
}

// 高亮相关类型
export interface HighlightOptions {
  color?: string
  textColor?: string
  bold?: boolean
  italic?: boolean
  duration?: number
  textLength?: number
  scrollIntoView?: boolean
  scrollToPosition?: boolean
}

// 兼容性别名
export type WordHighlightOptions = HighlightOptions

// 进度回调相关类型
export type ProgressCallback = (progress: number | ProgressInfo, message?: string) => void

// 进度信息接口
export interface ProgressInfo {
  currentStep: number
  current?: number
  total?: number
  totalSteps: number
  stepDescription?: string
  message?: string
  functionName?: string
  percentage: number
  chunkIndex?: number
  totalChunks?: number
  stage?: string
}

// 格式化相关类型
export interface FontFormatOptions {
  bold?: boolean
  italic?: boolean
  underline?:
    | boolean
    | 'none'
    | 'single'
    | 'double'
    | 'wave'
    | 'dotted'
    | 'dash'
    | 'dashLong'
    | 'doubleWave'
    | 'heavyWave'
    | 'longDash'
    | 'thick'
    | 'dottedHeavy'
    | 'dashLineHeavy'
    | 'dashLineLong'
    | 'wavyDouble'
    | 'wavyHeavy'
  color?: string
  name?: string
  size?: number
  scope?: 'selection' | 'paragraph' | 'document' | 'search'
  searchText?: string
  spacing?: number
  scale?: number
  highlightColor?: string
  strikeThrough?: boolean
  superscript?: boolean
  doubleStrikeThrough?: boolean
}

export interface ParagraphFormatOptions {
  alignment?: 'left' | 'center' | 'right' | 'justify' | 'centered' | 'justified' | 'mixed'
  lineSpacing?: number
  spaceBefore?: number
  spaceAfter?: number
  indent?: number
  firstLineIndent?: number
  leftIndent?: number
  rightIndent?: number
  lineSpacingRule?: 'single' | 'double' | 'oneAndHalf' | 'onePointFive' | 'atLeast' | 'exactly' | 'multiple'
  scope?: 'selection' | 'paragraph' | 'document' | 'search'
  searchText?: string
  outlineLevel?: number
}

// 样式相关类型
export interface StyleOptions {
  name?: string
  styleName?: string
  basedOn?: string
  font?: FontFormatOptions
  paragraph?: ParagraphFormatOptions
  scope?: 'selection' | 'paragraph' | 'document'
  targetText?: string
}

// 列表相关类型
export interface ListOptions {
  type?: 'bulleted' | 'numbered'
  level?: number
  bulletStyle?: string
  numberingStyle?: string
  scope?: 'selection' | 'paragraph' | 'document'
  targetText?: string
}

export interface ListLevelOptions {
  level: number
  bullet?: string
  numbering?: string
  format?: string
  targetLevel?: number
}

// 表格相关类型
export interface TableInsertOptions {
  rows: number
  columns: number
  style?: string
  width?: number
  values?: string[][]
  targetText?: string
  insertLocation?: 'replace' | 'start' | 'end' | 'before' | 'after' | 'Replace' | 'Start' | 'End' | 'Before' | 'After'
  preferredWidth?: number
  bandedRows?: boolean
  bandedColumns?: boolean
  headerRow?: boolean
  totalRow?: boolean
  cellFormatting?: {
    backgroundColor?: string
    headerBackgroundColor?: string
  }
  borderStyle?: 'single' | 'double' | 'none' | 'thick'
  borderColor?: string
  shadingColor?: string
}

export interface TableUpdateOptions {
  style?: string
  width?: number
  headerRow?: boolean
  totalRow?: boolean
  firstColumn?: boolean
  lastColumn?: boolean
  bandedRows?: boolean
  bandedColumns?: boolean
  tableIndex?: number
  targetText?: string
  insertLocation?: 'replace' | 'start' | 'end'
  rowCount?: number
  columnCount?: number
}

export interface TableStyleOptions {
  tableIndex?: number
  targetText?: string
  style?: string
  headerRow?: boolean
  totalRow?: boolean
  firstColumn?: boolean
  lastColumn?: boolean
  bandedRows?: boolean
  bandedColumns?: boolean
  borderStyle?: 'single' | 'double' | 'none' | 'thick'
  borderColor?: string
  cellFormatting?: {
    backgroundColor?: string
    headerBackgroundColor?: string
  }
  cellTarget?: TableCellTargetOptions
}

export interface TableCellTargetOptions {
  rows?: number[]
  rowRange?: {
    start?: number
    end?: number
  }
  columns?: number[]
  columnRange?: {
    start?: number
    end?: number
  }
  includeHeader?: boolean
  includeBody?: boolean
  includeTotal?: boolean
}

export interface TableMergeOptions {
  startRow?: number
  startColumn?: number
  endRow?: number
  endColumn?: number
  startCell?: {
    rowIndex: number
    columnIndex: number
  }
  endCell?: {
    rowIndex: number
    columnIndex: number
  }
  tableIndex?: number
  targetText?: string
}

export interface TableSplitOptions {
  row?: number
  column?: number
  splitBefore?: boolean
  cell?: {
    rowIndex: number
    columnIndex: number
  }
  rowCount?: number
  columnCount?: number
  tableIndex?: number
  targetText?: string
}

// 差异对比相关类型
export interface DiffItemContext {
  before?: string
  after?: string
}

export interface DiffItem {
  id: string
  type: 'add' | 'remove' | 'modify' | 'insert' | 'delete'
  status?: 'pending' | 'accepted' | 'rejected' | 'error'
  content: string
  text?: string
  context?: string | DiffItemContext
  position: number
  oldContent?: string
  applied?: boolean
  unchanged?: boolean
}

export interface DiffStatistics {
  insertions: number
  deletions: number
  modifications: number
  total: number
  applied?: boolean
  unchanged?: boolean
}

export interface DiffResult {
  changes: DiffItem[]
  diffs?: DiffItem[]
  totalChanges: number
  hasChanges: boolean
  statistics?: DiffStatistics
  originalText?: string
}

// 编辑相关类型
export interface DocumentChange {
  type: 'insert' | 'delete' | 'replace'
  position: number
  content: string
  oldContent?: string
  timestamp: Date
  author?: string
}

export interface EditHistoryItem {
  id: string
  timestamp: Date
  author?: string
  changes?: DocumentChange[]
  description?: string
  originalContent?: string
  modifiedContent?: string
  action?: string
  aiResponse?: string
  summary?: string
  isSelectionMode?: boolean
  technique?: 'trackChanges' | 'fontFormatting'
  statistics?: ChangeStats
}

export interface EditReport {
  totalChanges: number
  changesByType: Record<string, number>
  changesByAuthor: Record<string, number>
  timeRange: {
    start: Date
    end: Date
  }
  id?: string
  documentTitle?: string
  generatedAt?: Date
  summary?: {
    totalChanges?: number
    totalEdits?: number
    totalInsertions?: number
    totalDeletions?: number
    insertions?: number
    deletions?: number
    modifications?: number
    selectionEdits?: number
    documentEdits?: number
    trackChangesUsage?: number
    fontApiUsage?: number
    authors?: string[]
    dateRange?: string
  }
  history?: EditHistoryItem[]
}

export interface ChangeStats {
  insertions: number
  deletions: number
  replacements: number
  total: number
  formatChanges?: number
}

// Word 文本变更类型
export interface WordTextChange {
  type: 'insert' | 'delete' | 'replace'
  position?: number
  text?: string
  newText?: string
  oldText?: string
  searchText?: string
}

// 兼容性相关类型
export interface ApiCompatibilityInfo {
  isSupported: boolean
  version?: string
  alternativeMethod?: string
  requirements?: string[]
}

// AI相关类型
export interface AiProcessingOptions {
  context?: string
  language?: string
  confidence?: number
  maxResults?: number
}

export interface AiResult<T = unknown> extends BaseResult {
  data?: T
  confidence?: number
  processingTime?: number
}

// 错误相关类型
export interface WordError extends Error {
  code?: string
  details?: Record<string, unknown>
  context?: Record<string, unknown>
}

// 事件相关类型
export interface WordEvent {
  type: string
  data?: Record<string, unknown>
  timestamp: Date
}

// 配置相关类型
export interface WordConfig {
  language?: string
  autoSave?: boolean
  trackChanges?: boolean
  showComments?: boolean
}

// 工具相关类型
export interface ToolResult<T = unknown> extends BaseResult {
  data?: T
  metadata?: Record<string, unknown>
}

// 函数调用相关类型
export interface FunctionParameter {
  name: string
  type: string
  description: string
  required?: boolean
  default?: unknown
}

export interface FunctionDefinition {
  name: string
  description: string
  parameters: {
    type: string
    properties: Record<string, FunctionParameter>
    required?: string[]
  }
}

// 内容控件相关类型
export interface ContentControlOptions {
  type?: string
  title?: string
  tag?: string
  color?: string
  lock?: boolean
  lockContents?: boolean
  lockControl?: boolean
  placeholderText?: string
  text?: string
  appearance?: string
}

export interface ContentControlBindingOptions {
  dataBinding?: {
    storeItemID?: string
    bindingType?: string
    prefixMappings?: Record<string, string>
  }
  tag?: string
  title?: string
  lockContent?: boolean
  lockControl?: boolean
  html?: string
  text?: string
}

// 页面设置相关类型
export interface PageSetupOptions {
  orientation?: 'portrait' | 'landscape'
  margins?: {
    top: number
    bottom: number
    left: number
    right: number
  }
  size?: {
    width: number
    height: number
  }
  topMargin?: number
  bottomMargin?: number
  leftMargin?: number
  rightMargin?: number
  pageWidth?: number
  pageHeight?: number
}

// OOXML相关类型
export interface InsertOoxmlOptions {
  ooxml: string
  insertLocation?: 'replace' | 'start' | 'end'
  targetText?: string
}

export interface TableOoxmlOptions {
  ooxml: string
  insertLocation?: 'replace' | 'start' | 'end'
  tableOptions?: TableInsertOptions
  headingShading?: string
  firstRow?: boolean
  style?: string
}

// 使 TableOoxmlOptions 的 ooxml 属性可选，用于默认参数
export type PartialTableOoxmlOptions = Partial<TableOoxmlOptions>

export interface AdvancedOoxmlTemplateOptions {
  template: string
  variables?: Record<string, string>
  insertLocation?: 'replace' | 'start' | 'end'
  title?: string
  sections?: Array<{
    title?: string
    content?: string
    type?: string
    [key: string]: unknown
  }>
}

export interface ReplaceTextOptions {
  text: string
  replacement: string
  replaceText?: string // 别名
  matchCase?: boolean
  matchWholeWord?: boolean
  searchText?: string
  scope?: 'selection' | 'paragraph' | 'document' | 'search'
  replaceWithOoxml?: string
  formatConditions?: {
    bold?: boolean
    italic?: boolean
    underline?: boolean
    color?: string
    [key: string]: unknown
  }
  maxReplacements?: number
  useWildcards?: boolean
}

// 修订相关类型
export interface TrackChangesStatus {
  isEnabled: boolean
  viewMode?: 'simple' | 'all' | 'none'
  author?: string
  mode?: string
  changeCount?: number
}

export interface TrackedChangeInfo {
  id: string
  type: 'insertion' | 'deletion' | 'formatChange'
  author: string
  date: Date
  text?: string
  range?: Word.Range
  rangeText?: string
  position?: DocumentPosition
}

export interface RevisionItem {
  id: string
  type: string
  author: string
  date: Date
  content?: string
  text?: string
  position?: number | { paragraphIndex?: number }
  located?: boolean
  range?: Word.Range
  timestamp?: Date
}

// 视觉增强相关类型
export interface VisualEnhancementOptions {
  enabled?: boolean
  highlight?: boolean
  color?: string
  bold?: boolean
  italic?: boolean
  underline?: boolean
  insertionColor?: string
  deletionColor?: string
  useStrikethrough?: boolean
  useUnderline?: boolean
}

// 分块相关类型
export interface ChunkOptions {
  size?: number
  overlap?: number
  separator?: string
  maxChunkSize?: number
  chunkByParagraph?: boolean
}

// 统计相关类型
export interface WordStatistics {
  wordCount: number
  characterCount: number
  paragraphCount: number
  sentenceCount: number
  pageCount?: number
}

// Office.js 类型别名（避免直接导入冲突）
export type WordRange = Word.Range
export type WordDocument = Word.Document
export type WordContentControl = Word.ContentControl
export type WordComment = Word.Comment
export type WordPicture = Word.InlinePicture
export type WordTable = Word.Table
export type RequestContext = Word.RequestContext

// Office.js 列表相关枚举类型
export type ListBullet = 'Solid' | 'Square' | 'Arrow' | 'Checkmark' | 'Diamonds' | 'Hollow' | 'Custom'
export type ListNumbering = 'None' | 'Arabic' | 'UpperRoman' | 'LowerRoman' | 'UpperLetter' | 'LowerLetter'

// Office.js API 兼容性类型
export interface ClientRequestContext {
  load: (propertyNames: string | string[]) => void
  sync: () => Promise<void>
  trackedObjects: unknown
}

// Office.js 枚举类型
export enum InsertLocation {
  start = 'Start',
  end = 'End',
  replace = 'Replace',
  before = 'Before',
  after = 'After'
}

export enum ListType {
  bullet = 'Bullet',
  numbered = 'Numbered',
  multilevel = 'Multilevel'
}

export enum TrackedChangeType {
  inserted = 'Inserted',
  deleted = 'Deleted',
  formatted = 'Formatted',
  insertion = 'Insertion',
  deletion = 'Deletion',
  formatChange = 'FormatChange'
}

export enum FillPattern {
  none = 'None',
  solid = 'Solid',
  lightGray = 'LightGray',
  darkGray = 'DarkGray'
}

export enum FieldType {
  toc = 'Toc'
}

export enum DeleteLocation {
  entire = 'Entire'
}

export enum StyleBuiltIn {
  heading1 = 'Heading1'
}

// Office.js SearchOptions 接口
export interface SearchOptions {
  context?: string
  ignorePunct?: boolean
  ignoreSpace?: boolean
  matchCase?: boolean
  matchPrefix?: boolean
  matchSuffix?: boolean
  matchWholeWord?: boolean
  matchWildcards?: boolean
}

// 图片环绕类型
export type PictureWrapOptions = {
  type?: 'inLine' | 'square' | 'tight' | 'behind' | 'inFront' | 'topAndBottom' | 'through'
  side?: 'both' | 'left' | 'right' | 'largest'
  distance?: {
    top?: number
    bottom?: number
    left?: number
    right?: number
  }
  convertToFloat?: boolean
  wrapType?: 'inLine' | 'square' | 'tight' | 'behind' | 'inFront' | 'topAndBottom' | 'through'
  wrapSide?: 'both' | 'left' | 'right' | 'largest'
  wrapDistanceTop?: number
  wrapDistanceBottom?: number
  wrapDistanceLeft?: number
  wrapDistanceRight?: number
}

// 样式批量修改选项
export interface StyleBatchModifyOptions {
  styleName?: string
  modifications?: StyleOptions
  scope?: 'selection' | 'paragraph' | 'document'
  findAndReplace?: boolean
  fromStyle?: string
  toStyle?: string
  modifyProperties?: {
    color?: string
    size?: number
    bold?: boolean
    italic?: boolean
  }
}

// 回调函数类型
export type WordCallback<T = void> = (result: T) => void
export type WordErrorCallback = (error: WordError) => void

// Promise 类型
export type WordPromise<T = void> = Promise<T>

// 可选类型
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

// 必需类型（避免与内置Required冲突）
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>

// 深度部分类型
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

// 深度必需类型
export type DeepRequired<T> = {
  [P in keyof T]-?: T[P] extends object ? DeepRequired<T[P]> : T[P]
}

// 类型映射工具
export const alignmentMap: Record<string, string> = {
  left: 'Left',
  center: 'Center',
  right: 'Right',
  justified: 'Justified',
  centered: 'Centered',
  mixed: 'Mixed',
  justify: 'Justified'
}

export const lineSpacingRuleMap: Record<string, string> = {
  single: 'Single',
  double: 'Double',
  onePointFive: 'OnePointFive',
  oneAndHalf: 'OneAndHalf',
  atLeast: 'AtLeast',
  exactly: 'Exactly',
  multiple: 'Multiple'
}

export const underlineMap: Record<string, string> = {
  true: 'Single',
  false: 'None'
}
