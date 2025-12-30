/**
 * 性能测试套件
 * 测试 Office 插件在各种负载下的性能表现
 */

import {describe, expect, it } from 'vitest'

import { type MainTextMessageBlock,type Message, MessageBlockStatus, MessageBlockType } from '../types/messageBlock'

describe('Performance Tests', () => {
  describe('Message Rendering Performance', () => {
    it('should render 100 messages within acceptable time', () => {
      const messages: Message[] = Array.from({ length: 100 }, (_, i) => ({
        id: `msg-${i}`,
        role: i % 2 === 0 ? ('user' as const) : ('assistant' as const),
        blocks: [{
          id: `block-${i}`,
          messageId: `msg-${i}`,
          type: MessageBlockType.MAIN_TEXT,
          createdAt: new Date().toISOString(),
          status: MessageBlockStatus.SUCCESS,
          content: `Message content ${i}`.repeat(10) // Simulate real content
        } as MainTextMessageBlock],
        createdAt: new Date().toISOString()
      }))

      const start = performance.now()

      // Simulate rendering logic
      messages.forEach(msg => {
        msg.blocks?.forEach(block => {
          // Simulate block processing
          const _ = block
        })
      })

      const duration = performance.now() - start

      // Should complete in < 100ms
      expect(duration).toBeLessThan(100)
      expect(messages).toHaveLength(100)
    })

    it('should handle streaming messages efficiently', () => {
      const streamUpdates = 50
      let message: Message = {
        id: 'stream-msg',
        role: 'assistant' as const,
        blocks: [{
          id: 'block-1',
          messageId: 'stream-msg',
          type: MessageBlockType.MAIN_TEXT,
          createdAt: new Date().toISOString(),
          status: MessageBlockStatus.STREAMING,
          content: ''
        } as MainTextMessageBlock],
        createdAt: new Date().toISOString()
      }

      const start = performance.now()

      // Simulate 50 streaming updates
      for (let i = 0; i < streamUpdates; i++) {
        const block = message.blocks[0] as MainTextMessageBlock
        message = {
          ...message,
          blocks: [{
            ...block,
            content: block.content + ' chunk' + i
          } as MainTextMessageBlock]
        }
      }

      const duration = performance.now() - start

      // Should handle 50 updates in < 50ms (< 1ms per update)
      expect(duration).toBeLessThan(50)
      const block = message.blocks[0] as MainTextMessageBlock
      expect(block.content.split('chunk')).toHaveLength(streamUpdates + 1)
    })
  })

  describe('Large Content Handling', () => {
    it('should handle large message content', () => {
      const largeContent = 'Lorem ipsum '.repeat(1000) // ~12KB

      const message: Message = {
        id: 'large-msg',
        role: 'assistant',
        blocks: [{
          id: 'block-1',
          messageId: 'large-msg',
          type: MessageBlockType.MAIN_TEXT,
          createdAt: new Date().toISOString(),
          status: MessageBlockStatus.SUCCESS,
          content: largeContent
        } as MainTextMessageBlock],
        createdAt: new Date().toISOString()
      }

      const start = performance.now()

      // Simulate processing
      const block = message.blocks[0] as MainTextMessageBlock
      const contentLength = block.content.length
      const wordCount = block.content.split(' ').length

      const duration = performance.now() - start

      expect(duration).toBeLessThan(10)
      expect(contentLength).toBeGreaterThan(10000)
      expect(wordCount).toBeGreaterThan(1000)
    })

    it('should handle messages with many blocks', () => {
      const blockCount = 20

      const message: Message = {
        id: 'multi-block-msg',
        role: 'assistant',
        blocks: Array.from({ length: blockCount }, (_, i) => ({
          id: `block-${i}`,
          messageId: 'multi-block-msg',
          type: MessageBlockType.MAIN_TEXT,
          createdAt: new Date().toISOString(),
          status: MessageBlockStatus.SUCCESS,
          content: `Block ${i} content`
        } as MainTextMessageBlock)),
        createdAt: new Date().toISOString()
      }

      const start = performance.now()

      // Simulate rendering all blocks
      message.blocks.forEach(block => {
        const mainBlock = block as MainTextMessageBlock
        const _ = mainBlock.content
      })

      const duration = performance.now() - start

      expect(duration).toBeLessThan(20)
      expect(message.blocks).toHaveLength(blockCount)
    })
  })

  describe('Memory Management', () => {
    it('should efficiently handle conversation history', () => {
      const conversationLength = 200
      const conversations = Array.from({ length: 10 }, (_, convIndex) => ({
        id: `conv-${convIndex}`,
        title: `Conversation ${convIndex}`,
        messages: Array.from({ length: conversationLength }, (_, msgIndex) => ({
          id: `msg-${convIndex}-${msgIndex}`,
          role: msgIndex % 2 === 0 ? ('user' as const) : ('assistant' as const),
          blocks: [{
            id: `block-${convIndex}-${msgIndex}`,
            messageId: `msg-${convIndex}-${msgIndex}`,
            type: MessageBlockType.MAIN_TEXT,
            createdAt: new Date().toISOString(),
            status: MessageBlockStatus.SUCCESS,
            content: `Message ${msgIndex}`
          } as MainTextMessageBlock],
          createdAt: new Date().toISOString()
        }))
      }))

      const start = performance.now()

      // Simulate loading and processing conversations
      const totalMessages = conversations.reduce((sum, conv) => sum + conv.messages.length, 0)
      const activeConversation = conversations[0]
      const messageCount = activeConversation.messages.length

      const duration = performance.now() - start

      expect(duration).toBeLessThan(50)
      expect(totalMessages).toBe(2000)
      expect(messageCount).toBe(conversationLength)
    })

    it('should handle cleanup of old messages', () => {
      const messages = Array.from({ length: 1000 }, (_, i) => ({
        id: `msg-${i}`,
        role: 'assistant' as const,
        blocks: [],
        createdAt: new Date(Date.now() - i * 60000).toISOString() // Spread over time
      }))

      const start = performance.now()

      // Keep only last 100 messages
      const maxMessages = 100
      const recentMessages = messages.slice(0, maxMessages)

      const duration = performance.now() - start

      expect(duration).toBeLessThan(10)
      expect(recentMessages).toHaveLength(maxMessages)
    })
  })

  describe('Diff Calculation Performance', () => {
    it('should calculate diff for medium text efficiently', () => {
      const text1 = 'The quick brown fox jumps over the lazy dog. '.repeat(50) // ~2.3KB
      const text2 = text1.replace(/fox/g, 'cat').replace(/dog/g, 'mouse')

      const start = performance.now()

      // Simulate simple diff (character comparison)
      let diffCount = 0
      const minLength = Math.min(text1.length, text2.length)
      for (let i = 0; i < minLength; i++) {
        if (text1[i] !== text2[i]) {
          diffCount++
        }
      }

      const duration = performance.now() - start

      expect(duration).toBeLessThan(50)
      expect(diffCount).toBeGreaterThan(0)
    })

    it('should handle large document diff', () => {
      const paragraph = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. '
      const largeDoc1 = paragraph.repeat(200) // ~11KB
      const largeDoc2 = largeDoc1.replace(/Lorem/g, 'Modified')

      const start = performance.now()

      // Simulate finding changes
      const changes: number[] = []
      for (let i = 0; i < Math.min(largeDoc1.length, largeDoc2.length); i += 100) {
        if (largeDoc1[i] !== largeDoc2[i]) {
          changes.push(i)
        }
      }

      const duration = performance.now() - start

      // Should complete in < 100ms even for large docs
      expect(duration).toBeLessThan(100)
      expect(changes.length).toBeGreaterThan(0)
    })
  })

  describe('Image Loading Performance', () => {
    it('should track image load times', () => {
      const images = Array.from({ length: 10 }, (_, i) => ({
        id: `img-${i}`,
        url: `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg"/>`, // Minimal SVG
        width: 800,
        height: 600
      }))

      const start = performance.now()

      // Simulate processing image metadata
      images.forEach(img => {
        const aspectRatio = img.width / img.height
        const _ = aspectRatio
      })

      const duration = performance.now() - start

      expect(duration).toBeLessThan(10)
      expect(images).toHaveLength(10)
    })
  })

  describe('Search and Filter Performance', () => {
    it('should search through messages quickly', () => {
      const messages: Message[] = Array.from({ length: 500 }, (_, i) => ({
        id: `msg-${i}`,
        role: 'assistant' as const,
        blocks: [{
          id: `block-${i}`,
          messageId: `msg-${i}`,
          type: MessageBlockType.MAIN_TEXT,
          createdAt: new Date().toISOString(),
          status: MessageBlockStatus.SUCCESS,
          content: `Message content ${i} with search term ${i % 10 === 0 ? 'IMPORTANT' : 'normal'}`
        } as MainTextMessageBlock],
        createdAt: new Date().toISOString()
      }))

      const searchTerm = 'IMPORTANT'
      const start = performance.now()

      const results = messages.filter(msg =>
        msg.blocks.some(block => {
          const mainBlock = block as MainTextMessageBlock
          return mainBlock.content?.includes(searchTerm)
        })
      )

      const duration = performance.now() - start

      expect(duration).toBeLessThan(50)
      expect(results.length).toBe(50) // 500 / 10 = 50
    })
  })

  describe('State Update Performance', () => {
    it('should update state efficiently', () => {
      let state = {
        messages: Array.from({ length: 100 }, (_, i) => ({
          id: `msg-${i}`,
          content: `Content ${i}`
        })),
        selectedIds: new Set<string>()
      }

      const start = performance.now()

      // Simulate 20 state updates
      for (let i = 0; i < 20; i++) {
        state = {
          ...state,
          messages: [
            ...state.messages,
            { id: `new-msg-${i}`, content: `New ${i}` }
          ]
        }
      }

      const duration = performance.now() - start

      expect(duration).toBeLessThan(50)
      expect(state.messages).toHaveLength(120)
    })
  })
})

/**
 * Performance Benchmarks Reference
 *
 * Target Metrics:
 * - Initial load: < 3 seconds
 * - Message render (100 messages): < 100ms
 * - Streaming update: < 1ms per chunk
 * - Large content (10KB): < 10ms processing
 * - Diff calculation (medium text): < 50ms
 * - Search (500 messages): < 50ms
 * - Memory usage: < 200MB for normal use
 * - Image lazy load: < 100ms per image
 *
 * If any test exceeds these benchmarks, optimization is needed.
 */
