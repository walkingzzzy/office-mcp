/**
 * Adapter Registry 测试
 * 
 * 验证 Adapter 架构的正确性
 */

import { describe, expect, it, beforeEach, vi } from 'vitest'

import {
  adapterRegistry,
  getAdapter,
  getActiveAdapter,
  setActiveApp,
  createAdapter,
  WordAdapter,
  ExcelAdapter,
  PowerPointAdapter
} from '../index'
import type { OfficeAppType } from '../types'

describe('AdapterRegistry', () => {
  describe('Adapter Registration', () => {
    it('should have Word, Excel, and PowerPoint adapters registered by default', () => {
      const adapters = adapterRegistry.getAll()
      const appTypes = adapters.map(a => a.appType)
      
      expect(appTypes).toContain('word')
      expect(appTypes).toContain('excel')
      expect(appTypes).toContain('powerpoint')
    })

    it('should return Word adapter for "word" type', () => {
      const adapter = getAdapter('word')
      
      expect(adapter).toBeDefined()
      expect(adapter?.appType).toBe('word')
      expect(adapter?.getToolPrefix()).toBe('word_')
    })

    it('should return Excel adapter for "excel" type', () => {
      const adapter = getAdapter('excel')
      
      expect(adapter).toBeDefined()
      expect(adapter?.appType).toBe('excel')
      expect(adapter?.getToolPrefix()).toBe('excel_')
    })

    it('should return PowerPoint adapter for "powerpoint" type', () => {
      const adapter = getAdapter('powerpoint')
      
      expect(adapter).toBeDefined()
      expect(adapter?.appType).toBe('powerpoint')
      expect(adapter?.getToolPrefix()).toBe('ppt_')
    })

    it('should return Word adapter for "none" type (default)', () => {
      const adapter = getAdapter('none')
      
      expect(adapter).toBeDefined()
      expect(adapter?.appType).toBe('word')
    })
  })

  describe('Active Adapter', () => {
    it('should return Word adapter by default', () => {
      setActiveApp('none')
      const adapter = getActiveAdapter()
      
      expect(adapter?.appType).toBe('word')
    })

    it('should switch active adapter when setActiveApp is called', () => {
      setActiveApp('excel')
      expect(getActiveAdapter()?.appType).toBe('excel')
      
      setActiveApp('powerpoint')
      expect(getActiveAdapter()?.appType).toBe('powerpoint')
      
      setActiveApp('word')
      expect(getActiveAdapter()?.appType).toBe('word')
    })
  })

  describe('Tool Identification', () => {
    it('Word adapter should identify word_ tools', () => {
      const adapter = getAdapter('word')
      
      expect(adapter?.isToolForThisApp('word_insert_text')).toBe(true)
      expect(adapter?.isToolForThisApp('word_set_heading')).toBe(true)
      expect(adapter?.isToolForThisApp('excel_set_cell_value')).toBe(false)
      expect(adapter?.isToolForThisApp('ppt_add_slide')).toBe(false)
    })

    it('Excel adapter should identify excel_ tools', () => {
      const adapter = getAdapter('excel')
      
      expect(adapter?.isToolForThisApp('excel_set_cell_value')).toBe(true)
      expect(adapter?.isToolForThisApp('excel_insert_chart')).toBe(true)
      expect(adapter?.isToolForThisApp('word_insert_text')).toBe(false)
      expect(adapter?.isToolForThisApp('ppt_add_slide')).toBe(false)
    })

    it('PowerPoint adapter should identify ppt_ tools', () => {
      const adapter = getAdapter('powerpoint')
      
      expect(adapter?.isToolForThisApp('ppt_add_slide')).toBe(true)
      expect(adapter?.isToolForThisApp('ppt_add_text_box')).toBe(true)
      expect(adapter?.isToolForThisApp('word_insert_text')).toBe(false)
      expect(adapter?.isToolForThisApp('excel_set_cell_value')).toBe(false)
    })

    it('should find adapter for tool using getAdapterForTool', () => {
      expect(adapterRegistry.getAdapterForTool('word_insert_text')?.appType).toBe('word')
      expect(adapterRegistry.getAdapterForTool('excel_set_cell_value')?.appType).toBe('excel')
      expect(adapterRegistry.getAdapterForTool('ppt_add_slide')?.appType).toBe('powerpoint')
      expect(adapterRegistry.getAdapterForTool('unknown_tool')).toBeUndefined()
    })
  })

  describe('Factory Functions', () => {
    it('should create new adapter instances', () => {
      const wordAdapter = createAdapter('word')
      const excelAdapter = createAdapter('excel')
      const pptAdapter = createAdapter('powerpoint')
      
      expect(wordAdapter).toBeInstanceOf(WordAdapter)
      expect(excelAdapter).toBeInstanceOf(ExcelAdapter)
      expect(pptAdapter).toBeInstanceOf(PowerPointAdapter)
    })

    it('should create Word adapter for "none" type', () => {
      const adapter = createAdapter('none')
      expect(adapter).toBeInstanceOf(WordAdapter)
    })
  })

  describe('System Prompt Generation', () => {
    it('Word adapter should generate Word-specific prompts', () => {
      const adapter = getAdapter('word')
      const prompt = adapter?.getSystemPromptFragment({
        appType: 'word',
        hasSelection: false,
        selectionType: 'none'
      })
      
      expect(prompt).toContain('Word')
      expect(prompt).toContain('文档')
    })

    it('Excel adapter should generate Excel-specific prompts', () => {
      const adapter = getAdapter('excel')
      const prompt = adapter?.getSystemPromptFragment({
        appType: 'excel',
        hasSelection: false,
        selectionType: 'none'
      })
      
      expect(prompt).toContain('Excel')
      expect(prompt).toContain('电子表格')
    })

    it('PowerPoint adapter should generate PPT-specific prompts', () => {
      const adapter = getAdapter('powerpoint')
      const prompt = adapter?.getSystemPromptFragment({
        appType: 'powerpoint',
        hasSelection: false,
        selectionType: 'none'
      })
      
      expect(prompt).toContain('PowerPoint')
      expect(prompt).toContain('演示文稿')
    })

    it('should include selection context in prompts', () => {
      const adapter = getAdapter('word')
      
      const promptWithSelection = adapter?.getSystemPromptFragment({
        appType: 'word',
        hasSelection: true,
        selectionType: 'text'
      })
      
      expect(promptWithSelection).toContain('选中')
    })
  })

  describe('Tool Categories', () => {
    it('Word adapter should return Word-specific categories', () => {
      const adapter = getAdapter('word')
      const categories = adapter?.getSupportedToolCategories()
      
      expect(categories).toContain('paragraph')
      expect(categories).toContain('font')
      expect(categories).toContain('style')
    })

    it('Excel adapter should return Excel-specific categories', () => {
      const adapter = getAdapter('excel')
      const categories = adapter?.getSupportedToolCategories()
      
      expect(categories).toContain('cell')
      expect(categories).toContain('formula')
      expect(categories).toContain('chart')
    })

    it('PowerPoint adapter should return PPT-specific categories', () => {
      const adapter = getAdapter('powerpoint')
      const categories = adapter?.getSupportedToolCategories()
      
      expect(categories).toContain('slide')
      expect(categories).toContain('shape')
      expect(categories).toContain('animation')
    })
  })
})
