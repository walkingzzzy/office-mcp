import { describe, expect, it } from 'vitest'

import { UndoManager } from '../UndoManager'

class MockWordService {
  text: string

  constructor(initialText = '原始文档') {
    this.text = initialText
  }

  async readDocument() {
    return { text: this.text }
  }

  async replaceDocumentContent(newContent: string) {
    this.text = newContent
  }
}

describe('UndoManager', () => {
  it('captures snapshots and allows undo per message', async () => {
    const service = new MockWordService('初始内容')
    const undoManager = new UndoManager(service as any)

    const { record } = await undoManager.captureOperationWithSnapshot(
      'format_text',
      '格式化段落',
      { style: 'title' },
      'message-1',
      async () => {
        service.text = '格式化后的内容'
        return { success: true, message: 'done' }
      }
    )

    expect(record).toBeTruthy()
    expect(service.text).toBe('格式化后的内容')

    const undone = await undoManager.undoMessageOperations('message-1')
    expect(undone).toBe(1)
    expect(service.text).toBe('初始内容')
  })

  it('returns zero when there is nothing to undo', async () => {
    const service = new MockWordService()
    const undoManager = new UndoManager(service as any)

    const undone = await undoManager.undoMessageOperations('unknown-message')
    expect(undone).toBe(0)
  })
})
