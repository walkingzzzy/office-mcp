/**
 * word_paragraph - 段落管理
 * 合并 10 个原工具：add, insertAt, delete, get,
 * setSpacing, setAlignment, setIndent, merge, split, move
 * 
 * 使用工具工厂创建，包含参数验证
 */

import { createActionTool, required } from '@office-mcp/shared'

const SUPPORTED_ACTIONS = [
  'add', 'insertAt', 'delete', 'get',
  'setSpacing', 'setAlignment', 'setIndent',
  'merge', 'split', 'move'
] as const

export const wordParagraphTool = createActionTool({
  name: 'word_paragraph',
  description: `段落管理工具。支持的操作(action):
- add: 添加段落 (需要 text)
- insertAt: 在指定位置插入段落 (需要 index, text)
- delete: 删除段落 (需要 index)
- get: 获取段落列表
- setSpacing: 设置段落间距 (需要 index)
- setAlignment: 设置对齐方式 (需要 index, alignment)
- setIndent: 设置缩进 (需要 index)
- merge: 合并段落 (需要 startIndex, endIndex)
- split: 拆分段落 (需要 index, position)
- move: 移动段落 (需要 fromIndex, toIndex)`,
  category: 'paragraph',
  application: 'word',
  actions: SUPPORTED_ACTIONS,
  commandMap: {
    add: 'word_add_paragraph',
    insertAt: 'word_insert_paragraph_at',
    delete: 'word_delete_paragraph',
    get: 'word_get_paragraphs',
    setSpacing: 'word_set_paragraph_spacing',
    setAlignment: 'word_set_paragraph_alignment',
    setIndent: 'word_set_paragraph_indent',
    merge: 'word_merge_paragraphs',
    split: 'word_split_paragraph',
    move: 'word_move_paragraph'
  },
  paramRules: {
    add: [required('text', 'string')],
    insertAt: [required('index', 'number'), required('text', 'string')],
    delete: [required('index', 'number')],
    get: [],
    setSpacing: [required('index', 'number')],
    setAlignment: [required('index', 'number'), required('alignment', 'string')],
    setIndent: [required('index', 'number')],
    merge: [required('startIndex', 'number'), required('endIndex', 'number')],
    split: [required('index', 'number'), required('position', 'number')],
    move: [required('fromIndex', 'number'), required('toIndex', 'number')]
  },
  properties: {
    index: { type: 'number', description: '[多个操作] 段落索引（从0开始）' },
    text: { type: 'string', description: '[add/insertAt] 段落文本' },
    spaceBefore: { type: 'number', description: '[setSpacing] 段前间距（磅）' },
    spaceAfter: { type: 'number', description: '[setSpacing] 段后间距（磅）' },
    lineSpacing: { type: 'number', description: '[setSpacing] 行间距（倍数）' },
    alignment: { type: 'string', enum: ['left', 'center', 'right', 'justify'], description: '[setAlignment] 对齐方式' },
    leftIndent: { type: 'number', description: '[setIndent] 左缩进（磅）' },
    rightIndent: { type: 'number', description: '[setIndent] 右缩进（磅）' },
    firstLineIndent: { type: 'number', description: '[setIndent] 首行缩进（磅）' },
    startIndex: { type: 'number', description: '[merge] 起始段落索引' },
    endIndex: { type: 'number', description: '[merge] 结束段落索引' },
    position: { type: 'number', description: '[split] 拆分位置（字符位置）' },
    fromIndex: { type: 'number', description: '[move] 源段落索引' },
    toIndex: { type: 'number', description: '[move] 目标位置索引' }
  },
  metadata: {
    version: '2.1.0',
    priority: 'P0',
    intentKeywords: ['段落', '添加段落', '删除段落', '段落间距', '对齐', '缩进', '首行缩进', '合并段落', '拆分段落'],
    mergedTools: [
      'word_add_paragraph', 'word_insert_paragraph_at', 'word_delete_paragraph',
      'word_get_paragraphs', 'word_set_paragraph_spacing', 'word_set_paragraph_alignment',
      'word_set_paragraph_indent', 'word_merge_paragraphs', 'word_split_paragraph',
      'word_move_paragraph'
    ]
  },
  examples: [
    {
      description: '添加新段落',
      input: { action: 'add', text: '这是一个新段落。' },
      output: { success: true, message: '成功添加段落', action: 'add' }
    },
    {
      description: '设置段落居中对齐',
      input: { action: 'setAlignment', index: 0, alignment: 'center' },
      output: { success: true, message: '成功设置对齐方式', action: 'setAlignment' }
    }
  ]
})
