/**
 * Word Hyperlink and Reference Tools - Phase 4 Implementation
 */

import type { ToolDefinition } from './types.js'
import { sendIPCCommand } from '@office-mcp/shared'

// Hyperlink and Reference Operations (8 tools)

export const wordInsertHyperlinkTool: ToolDefinition = {
  name: 'word_insert_hyperlink',
  description: 'Insert hyperlink in document',
  category: 'word',
  inputSchema: {
    type: 'object',
    properties: {
      text: { type: 'string', description: 'Display text for the hyperlink' },
      url: { type: 'string', description: 'URL or file path' },
      location: { type: 'string', enum: ['cursor', 'start', 'end'], default: 'cursor' },
      tooltip: { type: 'string', description: 'Tooltip text (optional)' }
    },
    required: ['text', 'url']
  },
  handler: async (args: any) => sendIPCCommand('word_insert_hyperlink', args)
}

export const wordRemoveHyperlinkTool: ToolDefinition = {
  name: 'word_remove_hyperlink',
  description: 'Remove hyperlink while keeping text',
  category: 'word',
  inputSchema: {
    type: 'object',
    properties: {
      searchText: { type: 'string', description: 'Text to find and remove hyperlink from' },
      removeAll: { type: 'boolean', default: false, description: 'Remove all hyperlinks in document' },
      hyperlinkIndex: { type: 'number', description: 'Specific hyperlink index to remove' }
    }
  },
  handler: async (args: any) => sendIPCCommand('word_remove_hyperlink', args)
}

export const wordInsertBookmarkTool: ToolDefinition = {
  name: 'word_insert_bookmark',
  description: 'Insert bookmark at current location',
  category: 'word',
  inputSchema: {
    type: 'object',
    properties: {
      name: { type: 'string', description: 'Bookmark name (must be unique)' },
      location: { type: 'string', enum: ['cursor', 'start', 'end'], default: 'cursor' },
      text: { type: 'string', description: 'Text to bookmark (optional)' }
    },
    required: ['name']
  },
  handler: async (args: any) => sendIPCCommand('word_insert_bookmark', args)
}

export const wordInsertCrossReferenceTool: ToolDefinition = {
  name: 'word_insert_cross_reference',
  description: 'Insert cross-reference to bookmark, heading, or figure',
  category: 'word',
  inputSchema: {
    type: 'object',
    properties: {
      referenceType: { type: 'string', enum: ['bookmark', 'heading', 'figure', 'table'], description: 'Type of reference' },
      targetName: { type: 'string', description: 'Name of target (bookmark name, heading text, etc.)' },
      insertAs: { type: 'string', enum: ['text', 'pageNumber', 'textAndPageNumber'], default: 'text', description: 'What to insert' },
      location: { type: 'string', enum: ['cursor', 'start', 'end'], default: 'cursor' }
    },
    required: ['referenceType', 'targetName']
  },
  handler: async (args: any) => sendIPCCommand('word_insert_cross_reference', args)
}

export const wordInsertFootnoteTool: ToolDefinition = {
  name: 'word_insert_footnote',
  description: 'Insert footnote at current location',
  category: 'word',
  inputSchema: {
    type: 'object',
    properties: {
      text: { type: 'string', description: 'Footnote text' },
      location: { type: 'string', enum: ['cursor', 'start', 'end'], default: 'cursor' },
      customMark: { type: 'string', description: 'Custom footnote mark (optional)' }
    },
    required: ['text']
  },
  handler: async (args: any) => sendIPCCommand('word_insert_footnote', args)
}

export const wordInsertEndnoteTool: ToolDefinition = {
  name: 'word_insert_endnote',
  description: 'Insert endnote at current location',
  category: 'word',
  inputSchema: {
    type: 'object',
    properties: {
      text: { type: 'string', description: 'Endnote text' },
      location: { type: 'string', enum: ['cursor', 'start', 'end'], default: 'cursor' },
      customMark: { type: 'string', description: 'Custom endnote mark (optional)' }
    },
    required: ['text']
  },
  handler: async (args: any) => sendIPCCommand('word_insert_endnote', args)
}

export const wordInsertCitationTool: ToolDefinition = {
  name: 'word_insert_citation',
  description: 'Insert citation reference',
  category: 'word',
  inputSchema: {
    type: 'object',
    properties: {
      source: { type: 'string', description: 'Citation source identifier' },
      style: { type: 'string', enum: ['APA', 'MLA', 'Chicago', 'Harvard'], default: 'APA', description: 'Citation style' },
      location: { type: 'string', enum: ['cursor', 'start', 'end'], default: 'cursor' },
      pageNumbers: { type: 'string', description: 'Page numbers (optional)' }
    },
    required: ['source']
  },
  handler: async (args: any) => sendIPCCommand('word_insert_citation', args)
}

export const wordInsertBibliographyTool: ToolDefinition = {
  name: 'word_insert_bibliography',
  description: 'Insert bibliography/references section',
  category: 'word',
  inputSchema: {
    type: 'object',
    properties: {
      style: { type: 'string', enum: ['APA', 'MLA', 'Chicago', 'Harvard'], default: 'APA', description: 'Bibliography style' },
      location: { type: 'string', enum: ['cursor', 'start', 'end'], default: 'end' },
      title: { type: 'string', default: 'References', description: 'Bibliography title' }
    }
  },
  handler: async (args: any) => sendIPCCommand('word_insert_bibliography', args)
}