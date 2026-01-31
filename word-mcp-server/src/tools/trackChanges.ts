/**
 * word_track_changes - 修订跟踪
 * 合并 8 个原工具：enable, disable, getStatus, list,
 * accept, reject, acceptAll, rejectAll
 */

import { createActionTool, required } from '@office-mcp/shared'

const SUPPORTED_ACTIONS = [
  'enable', 'disable', 'getStatus', 'list',
  'accept', 'reject', 'acceptAll', 'rejectAll'
] as const

export const wordTrackChangesTool = createActionTool({
  name: 'word_track_changes',
  description: `修订跟踪工具。支持的操作(action):
- enable: 启用修订跟踪
- disable: 禁用修订跟踪
- getStatus: 获取修订跟踪状态
- list: 列出所有修订
- accept: 接受单个修订 (需要 changeId)
- reject: 拒绝单个修订 (需要 changeId)
- acceptAll: 接受所有修订
- rejectAll: 拒绝所有修订`,
  category: 'collaboration',
  application: 'word',
  actions: SUPPORTED_ACTIONS,
  commandMap: {
    enable: 'word_enable_track_changes',
    disable: 'word_disable_track_changes',
    getStatus: 'word_get_track_changes_status',
    list: 'word_get_track_changes',
    accept: 'word_accept_track_change',
    reject: 'word_reject_track_change',
    acceptAll: 'word_accept_all_track_changes',
    rejectAll: 'word_reject_all_track_changes'
  },
  paramRules: {
    accept: [required('changeId', 'string')],
    reject: [required('changeId', 'string')]
  },
  properties: {
    changeId: {
      type: 'string',
      description: '[accept/reject] 修订 ID'
    },
    includeAccepted: {
      type: 'boolean',
      description: '[list] 包含已接受的修订',
      default: false
    },
    includeRejected: {
      type: 'boolean',
      description: '[list] 包含已拒绝的修订',
      default: false
    }
  },
  metadata: {
    version: '2.0.0',
    priority: 'P1',
    intentKeywords: ['修订', '跟踪修订', '接受修订', '拒绝修订', '审阅'],
    mergedTools: [
      'word_enable_track_changes', 'word_disable_track_changes',
      'word_get_track_changes_status', 'word_get_track_changes',
      'word_accept_track_change', 'word_reject_track_change',
      'word_accept_all_track_changes', 'word_reject_all_track_changes'
    ]
  },
  examples: [
    {
      description: '启用修订跟踪',
      input: { action: 'enable' },
      output: { success: true, message: '成功启用修订跟踪', action: 'enable' }
    },
    {
      description: '接受所有修订',
      input: { action: 'acceptAll' },
      output: { success: true, message: '成功接受所有修订', action: 'acceptAll' }
    }
  ]
})
