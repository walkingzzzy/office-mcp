/**
 * PowerPoint Presentation and Export Operations - Phase 6 Implementation
 */

import type { ToolDefinition } from './types.js'
import { sendIPCCommand } from '@office-mcp/shared'

// Presentation and Export Operations (8 tools)

export const pptStartSlideshowTool: ToolDefinition = {
  name: 'ppt_start_slideshow',
  description: 'Start presentation slideshow',
  category: 'powerpoint',
  inputSchema: {
    type: 'object',
    properties: {
      startSlide: { type: 'number', description: 'Starting slide index (1-based, optional)' },
      fullScreen: { type: 'boolean', default: true, description: 'Start in full screen mode' }
    }
  },
  handler: async (args: any) => sendIPCCommand('ppt_start_slideshow', args)
}

export const pptEndSlideshowTool: ToolDefinition = {
  name: 'ppt_end_slideshow',
  description: 'End presentation slideshow',
  category: 'powerpoint',
  inputSchema: {
    type: 'object',
    properties: {}
  },
  handler: async (args: any) => sendIPCCommand('ppt_end_slideshow', args)
}

export const pptNextSlideTool: ToolDefinition = {
  name: 'ppt_next_slide',
  description: 'Navigate to next slide in slideshow',
  category: 'powerpoint',
  inputSchema: {
    type: 'object',
    properties: {}
  },
  handler: async (args: any) => sendIPCCommand('ppt_next_slide', args)
}

export const pptPreviousSlideTool: ToolDefinition = {
  name: 'ppt_previous_slide',
  description: 'Navigate to previous slide in slideshow',
  category: 'powerpoint',
  inputSchema: {
    type: 'object',
    properties: {}
  },
  handler: async (args: any) => sendIPCCommand('ppt_previous_slide', args)
}

export const pptExportToPdfTool: ToolDefinition = {
  name: 'ppt_export_to_pdf',
  description: 'Export presentation to PDF',
  category: 'powerpoint',
  inputSchema: {
    type: 'object',
    properties: {
      filePath: { type: 'string', description: 'Output PDF file path' },
      slideRange: { type: 'string', description: 'Slide range (e.g., "1-5", "all")' },
      includeNotes: { type: 'boolean', default: false, description: 'Include speaker notes' },
      quality: { type: 'string', enum: ['high', 'medium', 'low'], default: 'medium', description: 'Export quality' }
    },
    required: ['filePath']
  },
  handler: async (args: any) => sendIPCCommand('ppt_export_to_pdf', args)
}

export const pptExportToImagesTool: ToolDefinition = {
  name: 'ppt_export_to_images',
  description: 'Export slides as images',
  category: 'powerpoint',
  inputSchema: {
    type: 'object',
    properties: {
      outputFolder: { type: 'string', description: 'Output folder path' },
      format: { type: 'string', enum: ['png', 'jpg', 'gif'], default: 'png', description: 'Image format' },
      slideRange: { type: 'string', description: 'Slide range (e.g., "1-5", "all")' },
      width: { type: 'number', description: 'Image width in pixels' },
      height: { type: 'number', description: 'Image height in pixels' }
    },
    required: ['outputFolder']
  },
  handler: async (args: any) => sendIPCCommand('ppt_export_to_images', args)
}

export const pptSavePresentationTool: ToolDefinition = {
  name: 'ppt_save_presentation',
  description: 'Save presentation file',
  category: 'powerpoint',
  inputSchema: {
    type: 'object',
    properties: {
      filePath: { type: 'string', description: 'File path to save (optional, saves to current location if not specified)' },
      format: { type: 'string', enum: ['pptx', 'ppt', 'pdf', 'odp'], default: 'pptx', description: 'File format' }
    }
  },
  handler: async (args: any) => sendIPCCommand('ppt_save_presentation', args)
}

export const pptPrintPresentationTool: ToolDefinition = {
  name: 'ppt_print_presentation',
  description: 'Print presentation',
  category: 'powerpoint',
  inputSchema: {
    type: 'object',
    properties: {
      printerName: { type: 'string', description: 'Printer name (optional, uses default printer)' },
      slideRange: { type: 'string', description: 'Slide range (e.g., "1-5", "all")' },
      printWhat: { type: 'string', enum: ['slides', 'handouts', 'notes', 'outline'], default: 'slides', description: 'What to print' },
      copies: { type: 'number', minimum: 1, default: 1, description: 'Number of copies' },
      collate: { type: 'boolean', default: true, description: 'Collate copies' }
    }
  },
  handler: async (args: any) => sendIPCCommand('ppt_print_presentation', args)
}