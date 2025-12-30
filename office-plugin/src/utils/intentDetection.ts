/**
 * 意图检测工具
 * 判断用户输入是要查询/分析文档，还是要编辑/修改文档
 */

/**
 * 用户意图类型
 */
export enum UserIntent {
  /** 命令执行型：AI 直接执行工具函数，用户只需确认结果 */
  COMMAND = 'command',
  /** 查询/分析文档内容 */
  QUERY = 'query',
  /** 编辑/修改文档 */
  EDIT = 'edit',
  /** 普通对话（不涉及文档） */
  CHAT = 'chat'
}

/**
 * 命令意图的关键词（明确指示AI执行操作）
 */
const COMMAND_KEYWORDS = [
  // 直接命令类
  '将', '把', '把...改成', '把...换成', '将...改为', '将...替换为',
  '删除所有', '清除所有', '移除所有',
  '删除选中', '删除这个', '删除当前', '删掉选中', '删掉这个', '删掉当前',
  '移除选中', '移除这个', '移除当前', '清除选中', '清除这个', '清除当前',
  '插入', '添加', '加入', '应用', // 🔧 添加"应用"关键词

  // 设置类
  '设置为', '调整为', '改成', '换成', '替换为',
  '设置为', '设为', '调整到',

  // 批量操作类
  '全部', '所有', '每一个', '每个',
  '批量', '全局', '统一',

  // 英文命令词
  'set to', 'change to', 'replace with', 'convert to',
  'delete all', 'remove all', 'clear all',
  'delete selected', 'delete this', 'delete current',
  'remove selected', 'remove this', 'remove current',
  'make all', 'update all', 'insert', 'add', 'apply' // 🔧 添加"apply"关键词
]

/**
 * 强命令意图的短语（最高优先级）
 */
const STRONG_COMMAND_PHRASES = [
  '将...', '把...', '删除所有', '移除所有', '清除所有',
  '删除选中', '删除这个', '删除当前', '删掉选中', '删掉这个',
  '移除选中', '移除这个', '清除选中', '清除这个',
  '设置为...', '调整为...', '改成...', '换成...',
  '在...插入', '在...添加', '插入...', '添加...',
  'find and replace', 'delete all', 'replace all', 'insert at', 'add at',
  'delete selected', 'delete this', 'remove selected', 'remove this'
]

/**
 * 编辑意图的关键词
 */
const EDIT_KEYWORDS = [
  // 修改类
  '修改', '改', '更改', '调整', '优化', '改进', '完善',
  '修正', '纠正', '更新', '编辑', '重写', '改写',

  // 添加类（不包括单独的"添加"，因为它是命令词）
  '加上', '增加', '补充',

  // 格式类
  '格式化', '排版', '调整格式', '美化',

  // 翻译类
  '翻译', '译成', '翻译成',

  // 扩写/缩写
  '扩写', '扩充', '详细说明', '缩写', '精简', '简化',

  // 英文编辑词（不包括明确的命令词）
  'edit', 'modify', 'update', 'rewrite', 'revise', 'format'
]

/**
 * 查询意图的关键词
 */
const QUERY_KEYWORDS = [
  // 询问类
  '什么', '哪些', '怎么', '如何', '为什么', '是什么', '有什么',
  '讲的是', '说的是', '内容是', '主题是',

  // 总结类
  '总结', '概括', '摘要', '归纳', '梳理',

  // 分析类
  '分析', '解释', '说明', '阐述', '评价',

  // 提取类
  '提取', '找出', '列出', '罗列',

  // 查询类
  '查找', '搜索', '检索', '查询',

  // 理解类
  '理解', '懂', '明白', '意思',

  // 🆕 审查/检查类（查看问题，不修改）
  '审查', '检查', '查看', '问题', '存在的', '有哪些',

  // 英文查询词
  'what', 'why', 'how', 'summarize', 'summary', 'explain',
  'analyze', 'analysis', 'tell me', 'show me', 'list',
  'find', 'search', 'extract', 'review', 'check', 'issues'
]

/**
 * 强编辑意图的短语（优先级更高）
 */
const STRONG_EDIT_PHRASES = [
  '帮我修改', '帮我改', '请修改', '请改',
  '把...改成', '把...换成', '将...改为',
  '修改一下', '改一下', '优化一下',
  // 🆕 基于审查/分析结果修改的短语
  '修改文档', '调整文档', '修改这些问题', '修改上述问题',
  '根据审查', '根据分析', '根据问题', '按照建议',
  '执行修改', '进行修改', '开始修改',
  '需要调整的部分', '需要修改的部分', '需要改进的部分',
  'please edit', 'please modify', 'please change',
  'fix the issues', 'fix these issues', 'make the changes'
]

/**
 * 强查询意图的短语（优先级更高）
 */
const STRONG_QUERY_PHRASES = [
  '这个文档', '这篇文档', '文档内容', '文档说',
  '讲了什么', '说了什么', '写了什么',
  '主要内容', '核心内容', '关键内容',
  // 🆕 审查/检查类短语
  '存在的问题', '有什么问题', '查看问题', '文档审查', '文档检查',
  '排版问题', '格式问题', '存在哪些问题', '有哪些问题',
  '不需要调用工具', '不要调用工具', '不要修改', '不需要修改',
  '先执行审查', '先审查', '先检查',
  'what does', 'what is', 'tell me about', 'explain the',
  'review the document', 'check for issues', 'find issues'
]

/**
 * 检测用户意图
 * @param userInput 用户输入的文本
 * @param hasDocument 是否有文档上下文
 * @returns 用户意图类型
 */
export function detectUserIntent(
  userInput: string,
  hasDocument: boolean = false
): UserIntent {
  if (!userInput || !hasDocument) {
    return UserIntent.CHAT
  }

  const lowerInput = userInput.toLowerCase().trim()

  // 1. 最高优先级：检查强命令意图短语
  for (const phrase of STRONG_COMMAND_PHRASES) {
    if (lowerInput.includes(phrase.toLowerCase())) {
      return UserIntent.COMMAND
    }
  }

  // 2. 高优先级：检查强编辑和查询意图短语
  for (const phrase of STRONG_EDIT_PHRASES) {
    if (lowerInput.includes(phrase.toLowerCase())) {
      return UserIntent.EDIT
    }
  }

  for (const phrase of STRONG_QUERY_PHRASES) {
    if (lowerInput.includes(phrase.toLowerCase())) {
      return UserIntent.QUERY
    }
  }

  // 3. 统计各类关键词的出现次数
  let commandScore = 0
  let editScore = 0
  let queryScore = 0

  // 命令关键词（最高权重）
  for (const keyword of COMMAND_KEYWORDS) {
    if (lowerInput.includes(keyword.toLowerCase())) {
      commandScore += 2 // 命令关键词权重更高
    }
  }

  // 编辑关键词
  for (const keyword of EDIT_KEYWORDS) {
    if (lowerInput.includes(keyword.toLowerCase())) {
      editScore++
    }
  }

  // 查询关键词
  for (const keyword of QUERY_KEYWORDS) {
    if (lowerInput.includes(keyword.toLowerCase())) {
      queryScore++
    }
  }

  // 4. 特殊情况处理
  // 如果输入很短且包含问号，倾向于查询
  if (userInput.length < 20 && (userInput.includes('?') || userInput.includes('？'))) {
    queryScore += 2
  }

  // 如果以"请"、"帮我"开头，但不包含命令词，倾向于编辑
  if ((lowerInput.startsWith('请') || lowerInput.startsWith('帮我') || lowerInput.startsWith('please')) && commandScore === 0) {
    editScore += 0.5
  }

  // 5. 根据得分判断意图
  if (commandScore === 0 && editScore === 0 && queryScore === 0) {
    // 没有明确关键词，默认为查询（更安全）
    return UserIntent.QUERY
  }

  // 命令意图优先级最高
  if (commandScore > 0) {
    return UserIntent.COMMAND
  }

  // 编辑和查询之间的比较
  if (editScore > queryScore) {
    return UserIntent.EDIT
  } else if (queryScore > editScore) {
    return UserIntent.QUERY
  } else {
    // 得分相同，默认为查询（更安全）
    return UserIntent.QUERY
  }
}

/**
 * 判断是否应该包含文档上下文
 * @param userInput 用户输入
 * @param hasDocument 是否有文档
 * @returns 是否应该包含文档上下文
 */
export function shouldIncludeDocumentContext(
  userInput: string,
  hasDocument: boolean
): boolean {
  if (!hasDocument) {
    return false
  }

  const intent = detectUserIntent(userInput, hasDocument)

  // 命令、查询和编辑意图都需要文档上下文
  return intent === UserIntent.COMMAND || intent === UserIntent.QUERY || intent === UserIntent.EDIT
}

/**
 * 获取意图的显示文本
 */
export function getIntentDisplayText(intent: UserIntent): string {
  switch (intent) {
    case UserIntent.COMMAND:
      return '执行命令'
    case UserIntent.QUERY:
      return '查询文档'
    case UserIntent.EDIT:
      return '编辑文档'
    case UserIntent.CHAT:
      return '普通对话'
    default:
      return '未知'
  }
}
