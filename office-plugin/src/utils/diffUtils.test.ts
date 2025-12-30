/**
 * diffUtils 单元测试
 * 测试文本差异计算功能
 */

import DiffMatchPatch from 'diff-match-patch'
import { beforeEach,describe, expect, it } from 'vitest'

describe('diffUtils', () => {
  let dmp: DiffMatchPatch

  beforeEach(() => {
    dmp = new DiffMatchPatch()
  })

  describe('Text Diff Calculation', () => {
    it('should detect simple text replacement', () => {
      const oldText = 'Hello World'
      const newText = 'Hello Universe'

      const diffs = dmp.diff_main(oldText, newText)
      dmp.diff_cleanupSemantic(diffs)

      const hasChanges = diffs.some(([op]) => op !== 0)
      expect(hasChanges).toBe(true)
    })

    it('should detect text insertion', () => {
      const oldText = 'Hello'
      const newText = 'Hello World'

      const diffs = dmp.diff_main(oldText, newText)
      dmp.diff_cleanupSemantic(diffs)

      const insertions = diffs.filter(([op]) => op === 1)
      expect(insertions.length).toBeGreaterThan(0)
    })

    it('should detect text deletion', () => {
      const oldText = 'Hello World'
      const newText = 'Hello'

      const diffs = dmp.diff_main(oldText, newText)
      dmp.diff_cleanupSemantic(diffs)

      const deletions = diffs.filter(([op]) => op === -1)
      expect(deletions.length).toBeGreaterThan(0)
    })

    it('should handle identical texts', () => {
      const text = 'No changes here'

      const diffs = dmp.diff_main(text, text)

      expect(diffs).toHaveLength(1)
      expect(diffs[0][0]).toBe(0) // DIFF_EQUAL
    })

    it('should handle empty strings', () => {
      const diffs1 = dmp.diff_main('', 'New text')
      const diffs2 = dmp.diff_main('Old text', '')

      expect(diffs1.some(([op]) => op === 1)).toBe(true) // Has insertion
      expect(diffs2.some(([op]) => op === -1)).toBe(true) // Has deletion
    })
  })

  describe('Semantic Cleanup', () => {
    it('should cleanup diffs semantically', () => {
      const oldText = 'The quick brown fox'
      const newText = 'The fast brown fox'

      const diffs = dmp.diff_main(oldText, newText)
      dmp.diff_cleanupSemantic(diffs)

      // Should have EQUAL, DELETE, INSERT, EQUAL
      const hasEqual = diffs.some(([op]) => op === 0)
      expect(hasEqual).toBe(true)
    })

    it('should merge small changes', () => {
      const oldText = 'a b c'
      const newText = 'a x c'

      const diffs = dmp.diff_main(oldText, newText)
      const lengthBefore = diffs.length

      dmp.diff_cleanupSemantic(diffs)
      const lengthAfter = diffs.length

      // Cleanup may reduce the number of diff chunks
      expect(lengthAfter).toBeLessThanOrEqual(lengthBefore)
    })
  })

  describe('Patch Generation', () => {
    it('should create patches from diffs', () => {
      const oldText = 'Hello World'
      const newText = 'Hello Universe'

      const diffs = dmp.diff_main(oldText, newText)
      const patches = dmp.patch_make(oldText, diffs)

      expect(patches.length).toBeGreaterThan(0)
    })

    it('should apply patches correctly', () => {
      const oldText = 'The quick brown fox'
      const newText = 'The fast brown fox'

      const patches = dmp.patch_make(oldText, newText)
      const [result, success] = dmp.patch_apply(patches, oldText)

      expect(result).toBe(newText)
      expect(success.every(Boolean)).toBe(true)
    })

    it('should handle multiple changes', () => {
      const oldText = 'First line\nSecond line\nThird line'
      const newText = 'First line\nModified second\nThird line'

      const patches = dmp.patch_make(oldText, newText)
      const [result] = dmp.patch_apply(patches, oldText)

      expect(result).toBe(newText)
    })
  })

  describe('Line-based Diff', () => {
    it('should diff by lines', () => {
      const oldText = 'Line 1\nLine 2\nLine 3'
      const newText = 'Line 1\nModified Line 2\nLine 3'

      const diffs = dmp.diff_main(oldText, newText)
      dmp.diff_cleanupSemantic(diffs)

      const hasChanges = diffs.some(([op]) => op !== 0)
      expect(hasChanges).toBe(true)
    })

    it('should detect line additions', () => {
      const oldText = 'Line 1\nLine 2'
      const newText = 'Line 1\nLine 2\nLine 3'

      const diffs = dmp.diff_main(oldText, newText)

      const added = diffs.filter(([op]) => op === 1)
      expect(added.length).toBeGreaterThan(0)
    })

    it('should detect line deletions', () => {
      const oldText = 'Line 1\nLine 2\nLine 3'
      const newText = 'Line 1\nLine 3'

      const diffs = dmp.diff_main(oldText, newText)

      const deleted = diffs.filter(([op]) => op === -1)
      expect(deleted.length).toBeGreaterThan(0)
    })
  })

  describe('Performance', () => {
    it('should handle large text efficiently', () => {
      const largeText = 'Lorem ipsum dolor sit amet. '.repeat(1000)
      const modifiedText = largeText.replace('ipsum', 'IPSUM')

      const start = Date.now()
      const diffs = dmp.diff_main(largeText, modifiedText)
      dmp.diff_cleanupSemantic(diffs)
      const duration = Date.now() - start

      // Should complete in reasonable time (< 1 second)
      expect(duration).toBeLessThan(1000)
      expect(diffs.length).toBeGreaterThan(0)
    })

    it('should set timeout for very large diffs', () => {
      dmp.Diff_Timeout = 0.1 // 100ms timeout

      const text1 = 'a'.repeat(10000)
      const text2 = 'b'.repeat(10000)

      const start = Date.now()
      dmp.diff_main(text1, text2)
      const duration = Date.now() - start

      // Should timeout and return quickly
      expect(duration).toBeLessThan(500)
    })
  })

  describe('Edge Cases', () => {
    it('should handle special characters', () => {
      const oldText = 'Hello @World #2024'
      const newText = 'Hello @Universe #2025'

      const diffs = dmp.diff_main(oldText, newText)

      expect(diffs.length).toBeGreaterThan(0)
    })

    it('should handle Unicode characters', () => {
      const oldText = '你好世界'
      const newText = '你好宇宙'

      const diffs = dmp.diff_main(oldText, newText)
      dmp.diff_cleanupSemantic(diffs)

      const hasChanges = diffs.some(([op]) => op !== 0)
      expect(hasChanges).toBe(true)
    })

    it('should handle whitespace changes', () => {
      const oldText = 'Hello  World' // Two spaces
      const newText = 'Hello World' // One space

      const diffs = dmp.diff_main(oldText, newText)

      expect(diffs.some(([op]) => op !== 0)).toBe(true)
    })
  })
})
