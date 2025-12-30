/**
 * PowerPoint 类型定义
 * 定义 PowerPoint 相关的数据结构和接口
 */

/**
 * 幻灯片文本形状
 */
export interface PowerPointTextShape {
  /** 形状 ID */
  id: string
  /** 文本内容 */
  text: string
  /** 形状类型 */
  shapeType: string
}

/**
 * 幻灯片内容
 */
export interface PowerPointSlide {
  /** 幻灯片索引 (从 1 开始) */
  index: number
  /** 幻灯片 ID */
  id: string
  /** 标题 */
  title: string
  /** 文本内容 (所有文本形状的合并) */
  content: string
  /** 文本形状列表 */
  textShapes: PowerPointTextShape[]
  /** 备注内容 */
  notes?: string
}

/**
 * 演示文稿内容
 */
export interface PowerPointPresentationContent {
  /** 演示文稿标题 */
  title: string
  /** 幻灯片列表 */
  slides: PowerPointSlide[]
  /** 总幻灯片数 */
  slideCount: number
}

/**
 * 幻灯片文本修改
 */
export interface PowerPointSlideTextChange {
  /** 唯一标识符 */
  id: string
  /** 幻灯片索引 */
  slideIndex: number
  /** 原始文本 */
  oldText: string
  /** 新文本 */
  newText: string
  /** 修改部分 (标题/正文/备注) */
  part: 'title' | 'content' | 'notes'
  /** 状态 */
  status: 'pending' | 'accepted' | 'rejected'
  /** 说明 */
  description?: string
}

/**
 * 幻灯片文本差异
 */
export interface PowerPointTextDiff {
  /** 幻灯片索引 */
  slideIndex: number
  /** 修改部分 */
  part: 'title' | 'content' | 'notes'
  /** 原始文本 */
  oldText: string
  /** 新文本 */
  newText: string
  /** 是否有变化 */
  hasChanges: boolean
}

/**
 * 批量修改结果
 */
export interface PowerPointBatchChangeResult {
  /** 总数 */
  total: number
  /** 成功数 */
  success: number
  /** 失败数 */
  failed: number
  /** 失败的幻灯片索引 */
  failedSlides: number[]
  /** 错误信息 */
  errors: Array<{
    slideIndex: number
    error: string
  }>
}

/**
 * 演示文稿分析结果
 */
export interface PowerPointAnalysisResult {
  /** 演示文稿标题 */
  title: string
  /** 总幻灯片数 */
  slideCount: number
  /** 幻灯片摘要 */
  slideSummaries: Array<{
    index: number
    title: string
    textLength: number
    hasNotes: boolean
  }>
  /** 总文本长度 */
  totalTextLength: number
}

/**
 * 幻灯片内容更新选项（AI 已生成内容）
 */
export interface SlideContentUpdate {
  /** 幻灯片索引 (从 1 开始) */
  slideIndex: number
  /** 新标题（可选，由 AI 生成）*/
  newTitle?: string
  /** 新内容（可选，由 AI 生成）*/
  newContent?: string
}

/**
 * 批量更新幻灯片内容的结果
 */
export interface UpdateSlideContentResult {
  /** 是否成功 */
  success: boolean
  /** 消息 */
  message: string
  /** 更新的幻灯片数量 */
  updatedCount: number
  /** 失败的幻灯片索引 */
  failedSlides?: number[]
  /** 错误信息 */
  errors?: Array<{
    slideIndex: number
    error: string
  }>
}

/**
 * 新幻灯片配置（AI 已生成内容）
 */
export interface NewSlideConfig {
  /** 标题（由 AI 生成）*/
  title: string
  /** 内容（由 AI 生成）*/
  content: string
  /** 插入位置（在此索引之后插入，可选）*/
  insertAfter?: number
}

/**
 * 添加幻灯片的结果
 */
export interface AddSlidesResult {
  /** 是否成功 */
  success: boolean
  /** 消息 */
  message: string
  /** 添加的幻灯片数量 */
  addedCount: number
  /** 新幻灯片的索引列表 */
  newSlideIndices: number[]
}

/**
 * 删除幻灯片的结果
 */
export interface DeleteSlidesResult {
  /** 是否成功 */
  success: boolean
  /** 消息 */
  message: string
  /** 删除的幻灯片数量 */
  deletedCount: number
  /** 失败的幻灯片索引 */
  failedSlides?: number[]
}

/**
 * 形状类型枚举
 */
export type ShapeType = 'rectangle' | 'ellipse' | 'line' | 'triangle' | 'pentagon' | 'hexagon'

/**
 * 形状配置接口
 */
export interface ShapeConfig {
  /** 形状类型 */
  type: ShapeType
  /** X坐标（点） */
  left: number
  /** Y坐标（点） */
  top: number
  /** 宽度（点） */
  width: number
  /** 高度（点） */
  height: number
  /** 可选文本内容 */
  text?: string
  /** 填充颜色（十六进制，如 "#FF0000"） */
  fillColor?: string
  /** 边框颜色 */
  lineColor?: string
  /** 边框宽度（点） */
  lineWidth?: number
}

/**
 * 添加形状的结果
 */
export interface AddShapesResult {
  /** 是否成功 */
  success: boolean
  /** 添加的形状数量 */
  addedCount: number
  /** 错误信息列表 */
  errors: string[]
}

/**
 * 图片配置接口
 */
export interface ImageConfig {
  /** Base64编码的图片数据（不含data:image前缀） */
  base64: string
  /** X坐标（点） */
  left: number
  /** Y坐标（点） */
  top: number
  /** 宽度（点） */
  width: number
  /** 高度（点） */
  height: number
  /** 图片描述（alt text） */
  description?: string
}

/**
 * 添加图片的结果
 */
export interface AddImagesResult {
  /** 是否成功 */
  success: boolean
  /** 添加的图片数量 */
  addedCount: number
  /** 错误信息列表 */
  errors: string[]
}

/**
 * 文本格式配置接口
 */
export interface TextFormatConfig {
  /** 字体名称，如 "Arial", "微软雅黑" */
  fontFamily?: string
  /** 字体大小（点） */
  fontSize?: number
  /** 字体颜色（十六进制，如 "#000000"） */
  fontColor?: string
  /** 是否粗体 */
  bold?: boolean
  /** 是否斜体 */
  italic?: boolean
  /** 是否下划线 */
  underline?: boolean
}

/**
 * 文本范围配置（用于格式化特定文本）
 */
export interface TextRangeFormat {
  /** 幻灯片索引（0-based） */
  slideIndex: number
  /** 形状索引（可选，如果不指定则格式化所有文本） */
  shapeIndex?: number
  /** 格式配置 */
  format: TextFormatConfig
}

/**
 * 格式化文本的结果
 */
export interface FormatTextResult {
  /** 是否成功 */
  success: boolean
  /** 格式化的文本对象数量 */
  formattedCount: number
  /** 错误信息列表 */
  errors: string[]
}

/**
 * 表格单元格数据
 */
export interface TableCell {
  /** 单元格文本 */
  text: string
  /** 背景颜色（十六进制） */
  backgroundColor?: string
  /** 文字颜色（十六进制） */
  textColor?: string
}

/**
 * 表格配置接口
 */
export interface TableConfig {
  /** 行数 */
  rows: number
  /** 列数 */
  columns: number
  /** X坐标（点） */
  left: number
  /** Y坐标（点） */
  top: number
  /** 总宽度（点） */
  width: number
  /** 总高度（点） */
  height: number
  /** 表格数据（二维数组） */
  data?: TableCell[][]
  /** 是否第一行为表头 */
  headerRow?: boolean
}

/**
 * 添加表格的结果
 */
export interface AddTablesResult {
  /** 是否成功 */
  success: boolean
  /** 添加的表格数量 */
  addedCount: number
  /** 错误信息列表 */
  errors: string[]
}

/**
 * 配色方案配置
 */
export interface ColorScheme {
  /** 主色（十六进制） */
  primary: string
  /** 辅助色（十六进制） */
  secondary: string
  /** 强调色（十六进制） */
  accent: string
  /** 背景色（十六进制） */
  background: string
  /** 文字色（十六进制） */
  text: string
}

/**
 * 配色方案应用配置
 */
export interface ApplyColorSchemeConfig {
  /** 幻灯片索引（0-based） */
  slideIndex: number
  /** 配色方案 */
  scheme: ColorScheme
  /** 是否应用到背景（默认true） */
  applyToBackground?: boolean
  /** 是否应用到形状（默认true） */
  applyToShapes?: boolean
  /** 是否应用到文本（默认true） */
  applyToText?: boolean
}

/**
 * 应用配色方案的结果
 */
export interface ApplyColorSchemeResult {
  /** 是否成功 */
  success: boolean
  /** 应用配色的幻灯片数量 */
  appliedCount: number
  /** 错误信息列表 */
  errors: string[]
}

/**
 * 视觉元素类型
 */
export type VisualElementType = 'flowchart' | 'mindmap' | 'timeline' | 'comparison'

/**
 * 流程图节点
 */
export interface FlowchartNode {
  /** 节点ID */
  id: string
  /** 节点文本 */
  text: string
  /** 节点类型，默认'process' */
  type?: 'process' | 'decision' | 'start' | 'end'
}

/**
 * 流程图连接
 */
export interface FlowchartConnection {
  /** 起始节点ID */
  from: string
  /** 目标节点ID */
  to: string
  /** 连接线标签（可选） */
  label?: string
}

/**
 * 流程图配置
 */
export interface FlowchartConfig {
  /** 节点列表 */
  nodes: FlowchartNode[]
  /** 连接列表 */
  connections: FlowchartConnection[]
  /** 布局方向，默认'vertical' */
  layout?: 'vertical' | 'horizontal'
}

/**
 * 思维导图节点
 */
export interface MindmapNode {
  /** 节点文本 */
  text: string
  /** 子节点（可选） */
  children?: MindmapNode[]
}

/**
 * 思维导图配置
 */
export interface MindmapConfig {
  /** 根节点 */
  root: MindmapNode
}

/**
 * 时间线事件
 */
export interface TimelineEvent {
  /** 日期 */
  date: string
  /** 标题 */
  title: string
  /** 描述（可选） */
  description?: string
}

/**
 * 时间线配置
 */
export interface TimelineConfig {
  /** 事件列表 */
  events: TimelineEvent[]
  /** 方向，默认'horizontal' */
  orientation?: 'horizontal' | 'vertical'
}

/**
 * 对比项
 */
export interface ComparisonItem {
  /** 标题 */
  title: string
  /** 要点列表 */
  points: string[]
}

/**
 * 对比配置
 */
export interface ComparisonConfig {
  /** 对比项列表（通常2个） */
  items: ComparisonItem[]
}

/**
 * 视觉元素配置
 */
export interface VisualElementConfig {
  /** 视觉元素类型 */
  type: VisualElementType
  /** X坐标（点） */
  left: number
  /** Y坐标（点） */
  top: number
  /** 宽度（点） */
  width: number
  /** 高度（点） */
  height: number
  /** 流程图配置（type为'flowchart'时必需） */
  flowchart?: FlowchartConfig
  /** 思维导图配置（type为'mindmap'时必需） */
  mindmap?: MindmapConfig
  /** 时间线配置（type为'timeline'时必需） */
  timeline?: TimelineConfig
  /** 对比配置（type为'comparison'时必需） */
  comparison?: ComparisonConfig
}

/**
 * 插入视觉元素的结果
 */
export interface InsertVisualElementsResult {
  /** 是否成功 */
  success: boolean
  /** 插入的元素数量 */
  insertedCount: number
  /** 错误信息列表 */
  errors: string[]
}
