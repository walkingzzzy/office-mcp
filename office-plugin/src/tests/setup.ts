/**
 * Vitest 测试环境配置
 */

import '@testing-library/jest-dom'

import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

// 每个测试后清理
afterEach(() => {
  cleanup()
})

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock Office.js
global.Office = {
  onReady: vi.fn().mockResolvedValue({
    host: 'Word',
    platform: 'PC',
  }),
} as any

global.Word = {} as any
global.Excel = {} as any
global.PowerPoint = {} as any

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

if (typeof window.ResizeObserver === 'undefined') {
  window.ResizeObserver = ResizeObserverMock as unknown as typeof ResizeObserver
}

class PointerEventMock extends MouseEvent {
  constructor(type: string, props?: PointerEventInit) {
    super(type, props)
  }
}

if (typeof window.PointerEvent === 'undefined') {
  window.PointerEvent = PointerEventMock as unknown as typeof PointerEvent
}

if (!HTMLElement.prototype.hasPointerCapture) {
  HTMLElement.prototype.hasPointerCapture = () => false
}

if (!HTMLElement.prototype.releasePointerCapture) {
  HTMLElement.prototype.releasePointerCapture = () => {}
}
