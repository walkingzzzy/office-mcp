/**
 * ppt_shape - 形状与文本操作
 * 合并 12 个原工具
 * 
 * 使用工具工厂创建，包含参数验证
 */

import { createActionTool, required } from '@office-mcp/shared'

const SUPPORTED_ACTIONS = [
  'addTextBox', 'addShape', 'delete', 'move', 'resize',
  'setFill', 'setOutline', 'setTextFormat', 'align',
  'group', 'ungroup', 'rotate'
] as const

export const pptShapeTool = createActionTool({
  name: 'ppt_shape',
  description: `形状与文本操作工具。支持的操作(action):
- addTextBox: 添加文本框 (需要 slideIndex, text, position)
- addShape: 添加形状 (需要 slideIndex, shapeType, position)
- delete: 删除形状 (需要 slideIndex, shapeId)
- move: 移动形状 (需要 slideIndex, shapeId, left, top)
- resize: 调整大小 (需要 slideIndex, shapeId, width, height)
- setFill: 设置填充 (需要 slideIndex, shapeId, fill)
- setOutline: 设置轮廓 (需要 slideIndex, shapeId, outline)
- setTextFormat: 设置文本格式 (需要 slideIndex, shapeId, textFormat)
- align: 对齐形状 (需要 slideIndex, shapeIds, alignType)
- group: 组合形状 (需要 slideIndex, shapeIds)
- ungroup: 取消组合 (需要 slideIndex, shapeId)
- rotate: 旋转形状 (需要 slideIndex, shapeId, angle)`,
  category: 'shape',
  application: 'powerpoint',
  actions: SUPPORTED_ACTIONS,
  commandMap: {
    addTextBox: 'ppt_add_text_box',
    addShape: 'ppt_add_shape',
    delete: 'ppt_delete_shape',
    move: 'ppt_move_shape',
    resize: 'ppt_resize_shape',
    setFill: 'ppt_set_shape_fill',
    setOutline: 'ppt_set_shape_outline',
    setTextFormat: 'ppt_set_text_format',
    align: 'ppt_align_shapes',
    group: 'ppt_group_shapes',
    ungroup: 'ppt_ungroup_shapes',
    rotate: 'ppt_rotate_shape'
  },
  paramRules: {
    addTextBox: [required('slideIndex', 'number'), required('text', 'string'), required('position', 'object')],
    addShape: [required('slideIndex', 'number'), required('shapeType', 'string'), required('position', 'object')],
    delete: [required('slideIndex', 'number'), required('shapeId', 'string')],
    move: [required('slideIndex', 'number'), required('shapeId', 'string'), required('left', 'number'), required('top', 'number')],
    resize: [required('slideIndex', 'number'), required('shapeId', 'string'), required('width', 'number'), required('height', 'number')],
    setFill: [required('slideIndex', 'number'), required('shapeId', 'string'), required('fill', 'object')],
    setOutline: [required('slideIndex', 'number'), required('shapeId', 'string'), required('outline', 'object')],
    setTextFormat: [required('slideIndex', 'number'), required('shapeId', 'string'), required('textFormat', 'object')],
    align: [required('slideIndex', 'number'), required('shapeIds', 'array'), required('alignType', 'string')],
    group: [required('slideIndex', 'number'), required('shapeIds', 'array')],
    ungroup: [required('slideIndex', 'number'), required('shapeId', 'string')],
    rotate: [required('slideIndex', 'number'), required('shapeId', 'string'), required('angle', 'number')]
  },
  properties: {
    slideIndex: { type: 'number', description: '[所有操作] 幻灯片索引' },
    shapeId: { type: 'string', description: '[多个操作] 形状ID' },
    shapeIds: { type: 'array', items: { type: 'string' }, description: '[align/group] 形状ID列表' },
    text: { type: 'string', description: '[addTextBox] 文本内容' },
    shapeType: { type: 'string', enum: ['rectangle', 'ellipse', 'triangle', 'arrow', 'star', 'callout'], description: '[addShape] 形状类型' },
    position: { type: 'object', description: '[addTextBox/addShape] 位置和大小', properties: { left: { type: 'number' }, top: { type: 'number' }, width: { type: 'number' }, height: { type: 'number' } } },
    left: { type: 'number', description: '[move] 左边距' },
    top: { type: 'number', description: '[move] 上边距' },
    width: { type: 'number', description: '[resize] 宽度' },
    height: { type: 'number', description: '[resize] 高度' },
    fill: { type: 'object', description: '[setFill] 填充设置', properties: { type: { type: 'string', enum: ['solid', 'gradient', 'pattern', 'none'] }, color: { type: 'string' }, transparency: { type: 'number' } } },
    outline: { type: 'object', description: '[setOutline] 轮廓设置', properties: { color: { type: 'string' }, weight: { type: 'number' }, dashStyle: { type: 'string', enum: ['solid', 'dash', 'dot', 'dashDot'] } } },
    textFormat: { type: 'object', description: '[setTextFormat] 文本格式', properties: { fontName: { type: 'string' }, fontSize: { type: 'number' }, fontColor: { type: 'string' }, bold: { type: 'boolean' }, italic: { type: 'boolean' } } },
    alignType: { type: 'string', enum: ['left', 'center', 'right', 'top', 'middle', 'bottom', 'distribute'], description: '[align] 对齐方式' },
    angle: { type: 'number', description: '[rotate] 旋转角度' }
  },
  metadata: {
    version: '2.1.0',
    priority: 'P0',
    intentKeywords: ['形状', '文本框', '添加形状', '删除形状', '移动', '填充', '轮廓', '对齐', '组合', '旋转'],
    mergedTools: [
      'ppt_add_text_box', 'ppt_add_shape', 'ppt_delete_shape',
      'ppt_move_shape', 'ppt_resize_shape', 'ppt_set_shape_fill',
      'ppt_set_shape_outline', 'ppt_set_text_format', 'ppt_align_shapes',
      'ppt_group_shapes', 'ppt_ungroup_shapes', 'ppt_rotate_shape'
    ]
  },
  examples: [
    {
      description: '添加文本框',
      input: { action: 'addTextBox', slideIndex: 1, text: '标题', position: { left: 100, top: 100, width: 400, height: 50 } },
      output: { success: true, message: '成功添加文本框', action: 'addTextBox' }
    }
  ]
})
