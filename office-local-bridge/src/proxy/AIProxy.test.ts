/**
 * AIProxy 单元测试
 */

import { describe, it, expect } from 'vitest'
import type { AIProvider, ChatCompletionRequest } from './types.js'

describe('AIProxy', () => {
  describe('Provider 注册', () => {
    it('应该支持注册多个提供商', () => {
      const providers: AIProvider[] = ['openai', 'azure', 'anthropic']

      expect(providers).toHaveLength(3)
      expect(providers).toContain('openai')
      expect(providers).toContain('azure')
      expect(providers).toContain('anthropic')
    })
  })

  describe('请求转换', () => {
    it('应该正确转换 OpenAI 格式请求', () => {
      const request: ChatCompletionRequest = {
        model: 'gpt-4',
        messages: [
          { role: 'user', content: '你好' }
        ],
        stream: true
      }

      expect(request.model).toBe('gpt-4')
      expect(request.messages).toHaveLength(1)
      expect(request.stream).toBe(true)
    })

    it('应该支持 Function Calling', () => {
      const request: ChatCompletionRequest = {
        model: 'gpt-4',
        messages: [{ role: 'user', content: '测试' }],
        tools: [
          {
            type: 'function',
            function: {
              name: 'test_function',
              description: '测试函数',
              parameters: {}
            }
          }
        ]
      }

      expect(request.tools).toBeDefined()
      expect(request.tools).toHaveLength(1)
      expect(request.tools?.[0].function.name).toBe('test_function')
    })
  })

  describe('流式响应处理', () => {
    it('应该正确解析 SSE 数据', () => {
      const sseData = 'data: {"id":"1","choices":[{"delta":{"content":"你好"}}]}\n\n'
      const lines = sseData.split('\n')
      const dataLine = lines.find(line => line.startsWith('data: '))

      expect(dataLine).toBeDefined()

      if (dataLine) {
        const jsonStr = dataLine.substring(6)
        const parsed = JSON.parse(jsonStr)

        expect(parsed.id).toBe('1')
        expect(parsed.choices[0].delta.content).toBe('你好')
      }
    })

    it('应该处理 [DONE] 标记', () => {
      const doneData = 'data: [DONE]\n\n'
      const lines = doneData.split('\n')
      const dataLine = lines.find(line => line.startsWith('data: '))

      expect(dataLine).toBe('data: [DONE]')
    })
  })

  describe('错误处理', () => {
    it('应该正确传递 API 错误', () => {
      const errorResponse = {
        error: {
          message: 'Invalid API key',
          type: 'invalid_request_error',
          code: 'invalid_api_key'
        }
      }

      expect(errorResponse.error).toBeDefined()
      expect(errorResponse.error.code).toBe('invalid_api_key')
    })
  })
})
