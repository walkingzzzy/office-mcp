/**
 * word_formatting - 字体格式设置
 * 合并 12 个原工具：setFont, setFontSize, setFontColor, setBold,
 * setItalic, setUnderline, setHighlight, setStrikethrough,
 * setSubscript, setSuperscript, formatText, setFontName
 */

import { sendIPCCommand } from '@office-mcp/shared'
import type { ToolDefinition } from './types.js'

export const wordFormattingTool: ToolDefinition = {
  name: 'word_formatting',
  description: `字体格式设置工具。可同时设置多个格式属性。
目标选择方式（三选一）：
- searchText: 查找并格式化匹配的文本
- range: 指定字符范围 { start, end }
- paragraphIndex: 指定段落索引

可设置的格式属性：
- fontName: 字体名称
- fontSize: 字号（磅）
- fontColor: 字体颜色（十六进制）
- bold: 粗体
- italic: 斜体
- underline: 下划线（boolean 或 'single'/'double'/'dotted'/'dashed'）
- highlight: 高亮颜色
- strikethrough: 删除线
- subscript: 下标
- superscript: 上标`,
  category: 'formatting',
  application: 'word',
  inputSchema: {
    type: 'object',
    properties: {
      // 目标选择（三选一）
      searchText: {
        type: 'string',
        description: '要格式化的文本（查找匹配）'
      },
      range: {
        type: 'object',
        description: '字符范围',
        properties: {
          start: { type: 'number', description: '起始位置' },
          end: { type: 'number', description: '结束位置' }
        }
      },
      paragraphIndex: {
        type: 'number',
        description: '段落索引'
      },
      // 格式设置（可同时设置多个）
      fontName: {
        type: 'string',
        description: '字体名称（如 "宋体", "Arial"）'
      },
      fontSize: {
        type: 'number',
        description: '字号（磅）'
      },
      fontColor: {
        type: 'string',
        description: '字体颜色（十六进制，如 "#FF0000"）'
      },
      bold: {
        type: 'boolean',
        description: '粗体'
      },
      italic: {
        type: 'boolean',
        description: '斜体'
      },
      underline: {
        oneOf: [
          { type: 'boolean' },
          { type: 'string', enum: ['single', 'double', 'dotted', 'dashed'] }
        ],
        description: '下划线'
      },
      highlight: {
        type: 'string',
        description: '高亮颜色（颜色名称或 "none"）'
      },
      strikethrough: {
        type: 'boolean',
        description: '删除线'
      },
      subscript: {
        type: 'boolean',
        description: '下标'
      },
      superscript: {
        type: 'boolean',
        description: '上标'
      }
    }
  },
  metadata: {
    version: '2.0.0',
    priority: 'P0',
    intentKeywords: [
      '字体', '字号', '颜色', '粗体', '斜体', '下划线',
      '高亮', '删除线', '上标', '下标', '格式'
    ],
    applicableFor: ['text'],
    mergedTools: [
      'word_set_font', 'word_set_font_size', 'word_set_font_color',
      'word_set_bold', 'word_set_italic', 'word_set_underline',
      'word_set_highlight', 'word_set_strikethrough', 'word_set_subscript',
      'word_set_superscript', 'word_format_text', 'word_set_font_name'
    ],
    supportedActions: ['format']
  },
  handler: async (args: Record<string, any>) => {
    const { searchText, range, paragraphIndex, ...formatOptions } = args

    // 构建格式化参数
    const formatParams: Record<string, any> = {}

    // 确定目标
    if (searchText) {
      formatParams.searchText = searchText
    } else if (range) {
      formatParams.startPosition = range.start
      formatParams.endPosition = range.end
    } else if (paragraphIndex !== undefined) {
      formatParams.paragraphIndex = paragraphIndex
    }

    // 收集所有格式设置
    const formatKeys = [
      'fontName', 'fontSize', 'fontColor', 'bold', 'italic',
      'underline', 'highlight', 'strikethrough', 'subscript', 'superscript'
    ]

    const appliedFormats: string[] = []

    // 逐个应用格式（因为原始工具是分开的）
    const results: any[] = []

    for (const key of formatKeys) {
      if (args[key] !== undefined) {
        appliedFormats.push(key)

        // 映射到原始命令
        const commandMap: Record<string, string> = {
          fontName: 'word_set_font',
          fontSize: 'word_set_font_size',
          fontColor: 'word_set_font_color',
          bold: 'word_set_bold',
          italic: 'word_set_italic',
          underline: 'word_set_underline',
          highlight: 'word_set_highlight',
          strikethrough: 'word_set_strikethrough',
          subscript: 'word_set_subscript',
          superscript: 'word_set_superscript'
        }

        const command = commandMap[key]
        if (command) {
          const cmdParams = { ...formatParams, [key]: args[key] }
          // 特殊处理某些参数名
          if (key === 'fontName') {
            cmdParams.font = args[key]
            delete cmdParams.fontName
          }
          if (key === 'fontSize') {
            cmdParams.size = args[key]
            delete cmdParams.fontSize
          }
          if (key === 'fontColor') {
            cmdParams.color = args[key]
            delete cmdParams.fontColor
          }

          const result = await sendIPCCommand(command, cmdParams)
          results.push({ format: key, result })
        }
      }
    }

    // 如果没有指定任何格式，使用通用格式化命令
    if (appliedFormats.length === 0) {
      return {
        success: false,
        error: '请至少指定一个格式属性',
        message: '可用属性: fontName, fontSize, fontColor, bold, italic, underline, highlight, strikethrough, subscript, superscript'
      }
    }

    // 检查是否所有操作都成功
    const allSuccess = results.every(r => r.result?.success !== false)

    return {
      success: allSuccess,
      message: allSuccess
        ? `成功应用格式: ${appliedFormats.join(', ')}`
        : '部分格式应用失败',
      data: {
        appliedFormats,
        details: results
      }
    }
  },
  examples: [
    {
      description: '设置选中文本为粗体红色',
      input: { searchText: '重要', bold: true, fontColor: '#FF0000' },
      output: { success: true, message: '成功应用格式: bold, fontColor' }
    },
    {
      description: '设置段落字体和字号',
      input: { paragraphIndex: 0, fontName: '宋体', fontSize: 14 },
      output: { success: true, message: '成功应用格式: fontName, fontSize' }
    },
    {
      description: '设置文本高亮和下划线',
      input: { searchText: '注意', highlight: 'yellow', underline: true },
      output: { success: true, message: '成功应用格式: highlight, underline' }
    }
  ]
}
