import type { ToolCategory, ToolDefinition } from '../types.js'

type SelectionAffinity = 'text' | 'image' | 'table' | 'none'

interface DomainConfig {
  prefix: string
  scenario: string
  condition: string
  defaultKeywords: string[]
  tags: string[]
  defaultSelection: SelectionAffinity[]
  defaultPriority: 'P0' | 'P1'
}

const DOMAIN_CONFIG: Partial<Record<ToolCategory, DomainConfig>> = {
  word: {
    prefix: '【Word 教案】',
    scenario: '备课讲稿、教案排版与批注整理',
    condition: '需在 Word 中打开目标教案或讲稿，定位到相关段落/选区',
    defaultKeywords: ['教案', '段落', '排版', '讲稿'],
    tags: ['word', 'teaching'],
    defaultSelection: ['text'],
    defaultPriority: 'P0'
  },
  excel: {
    prefix: '【Excel 成绩】',
    scenario: '成绩统计、数据分析与排课表维护',
    condition: '需在 Excel 中打开成绩或数据模板，并选中相关区域',
    defaultKeywords: ['成绩', '数据', '统计', '表格'],
    tags: ['excel', 'analysis'],
    defaultSelection: ['table'],
    defaultPriority: 'P0'
  },
  powerpoint: {
    prefix: '【课件演示】',
    scenario: 'PPT 课件制作、动画与多媒体编排',
    condition: '需在 PowerPoint 中打开课件并保持幻灯片处于可编辑状态',
    defaultKeywords: ['课件', '幻灯片', '演示'],
    tags: ['powerpoint', 'presentation'],
    defaultSelection: ['none'],
    defaultPriority: 'P0'
  },
  common: {
    prefix: '【通用自动化】',
    scenario: '跨应用自动化、诊断或批量操作',
    condition: '需保证 MCP 服务器与应用均在线',
    defaultKeywords: ['自动化', '批量'],
    tags: ['common'],
    defaultSelection: ['none'],
    defaultPriority: 'P1'
  }
}

const TOKEN_KEYWORDS: Record<string, string[]> = {
  insert: ['插入', '添加'],
  add: ['添加', '补充'],
  delete: ['删除', '移除'],
  remove: ['删除', '移除'],
  replace: ['替换', '改写'],
  update: ['更新', '刷新'],
  heading: ['标题', '章节'],
  title: ['标题'],
  paragraph: ['段落'],
  text: ['文本', '内容'],
  style: ['样式', '格式'],
  list: ['列表', '提纲'],
  table: ['表格', '成绩表'],
  cell: ['单元格'],
  row: ['行'],
  column: ['列'],
  image: ['图片', '插图'],
  picture: ['图片', '插图'],
  chart: ['图表', '趋势'],
  data: ['数据'],
  formula: ['公式', '函数'],
  pivot: ['透视表'],
  hyperlink: ['链接', '超链接'],
  toc: ['目录'],
  slide: ['幻灯片', '课件'],
  animation: ['动画'],
  video: ['视频'],
  audio: ['音频'],
  theme: ['主题'],
  comment: ['批注', '注释'],
  note: ['批注', '注释'],
  caption: ['图题', '说明'],
  layout: ['布局'],
  format: ['格式'],
  merge: ['合并'],
  split: ['拆分']
}

const SCENARIO_HINTS: Array<{
  keywords: string[]
  hint: string
  selection?: SelectionAffinity[]
}> = [
  { keywords: ['heading', 'title'], hint: '统一章节标题层级，生成“第一单元/第二单元”等结构', selection: ['text'] },
  { keywords: ['paragraph', 'style', 'format'], hint: '批量整理段落与样式，保持教案版式一致', selection: ['text'] },
  { keywords: ['table', 'cell', 'row', 'column'], hint: '快速维护成绩表或排课表的行列结构', selection: ['table'] },
  { keywords: ['image', 'picture', 'caption'], hint: '插入/调整讲义插图，让图文排版更清晰', selection: ['image'] },
  { keywords: ['chart', 'data', 'pivot', 'formula'], hint: '展示历次测验趋势或统计班级成绩', selection: ['table'] },
  { keywords: ['hyperlink', 'toc', 'reference'], hint: '构建资料索引或目录，方便课堂跳转', selection: ['text'] },
  { keywords: ['slide', 'animation', 'theme', 'video', 'audio'], hint: '完善课件播放节奏和多媒体素材', selection: ['none'] },
  { keywords: ['comment', 'note'], hint: '批量整理批注或评语，便于教研分享', selection: ['text'] }
]

const MAX_KEYWORDS = 12

function tokenize(name: string): string[] {
  return name.split(/[_-]/).map((token) => token.toLowerCase()).filter(Boolean)
}

function deriveScenarioHint(tokens: string[], config: DomainConfig): { text: string; selection: SelectionAffinity[] } {
  for (const scenario of SCENARIO_HINTS) {
    if (scenario.keywords.some((keyword) => tokens.includes(keyword))) {
      return {
        text: scenario.hint,
        selection: scenario.selection || config.defaultSelection
      }
    }
  }
  return { text: config.scenario, selection: config.defaultSelection }
}

function buildKeywords(tokens: string[], config: DomainConfig, description?: string): string[] {
  const keywords = new Set<string>(config.defaultKeywords)
  tokens.forEach((token) => {
    const mapped = TOKEN_KEYWORDS[token]
    if (mapped) {
      mapped.forEach((keyword) => keywords.add(keyword))
    } else if (token.length > 2) {
      keywords.add(token)
    }
  })
  if (description) {
    description.replace(/[【】]/g, '')
      .split(/[^a-zA-Z0-9\u4e00-\u9fa5]+/)
      .filter(Boolean)
      .slice(0, 4)
      .forEach((word) => keywords.add(word))
  }
  return Array.from(keywords).slice(0, MAX_KEYWORDS)
}

function buildDescription(original: string, config: DomainConfig, scenario: string): string {
  const trimmed = original.trim().replace(/[。.\s]+$/, '')
  return `${config.prefix}${trimmed}。典型场景：${scenario}。适用条件：${config.condition}`
}

function enhanceTool(tool: ToolDefinition, domain: ToolCategory): ToolDefinition {
  const config = DOMAIN_CONFIG[domain] ?? DOMAIN_CONFIG.common!
  if (!config) {
    return tool
  }
  const tokens = tokenize(tool.name)
  const scenario = deriveScenarioHint(tokens, config)
  const enrichedDescription = buildDescription(tool.description || `MCP 工具 ${tool.name}`, config, scenario.text)
  const intentKeywords = buildKeywords(tokens, config, tool.description)

  return {
    ...tool,
    description: enrichedDescription,
    metadata: {
      ...tool.metadata,
      scenario: scenario.text,
      contextTip: config.condition,
      audience: '一线教师与教研员',
      documentTypes: [domain],
      applicableFor: scenario.selection,
      priority: config.defaultPriority,
      intentKeywords,
      tags: Array.from(
        new Set([...(tool.metadata?.tags || []), ...config.tags, scenario.text.includes('成绩') ? 'score' : ''])
      ).filter(Boolean)
    }
  }
}

export function enhanceToolsForDomain(tools: ToolDefinition[], domain: ToolCategory): ToolDefinition[] {
  return tools.map((tool) => enhanceTool(tool, domain))
}
