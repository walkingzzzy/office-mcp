/**
 * Word 高级操作工具
 * 包含：word_insert_toc, word_update_toc, word_insert_page_break, word_insert_section_break
 * 
 * API 版本要求（根据 Microsoft 官方文档）：
 * - insertField: WordApi 1.5+（Windows/Mac 桌面版支持，Web 版只读）
 * - Word.FieldType.toc: WordApi 1.5+
 * - TableOfContents.updatePageNumber(): WordApi BETA (Preview Only) - 需要 Office Insider
 * - fields 集合: WordApi 1.4+
 * 
 * @see https://learn.microsoft.com/en-us/javascript/api/word
 * @see https://learn.microsoft.com/en-us/javascript/api/requirement-sets/word/word-api-requirement-sets
 */

import type { FunctionResult } from '../../ai/types'
import type { ToolDefinition, ToolResult } from '../types'
import Logger from '../../../utils/logger'

const logger = new Logger('WordAdvancedTools')

/**
 * 检查 Word API 版本支持
 * 根据 Microsoft 官方文档的 Requirement Sets
 */
function checkWordApiSupport(): {
  hasInsertField: boolean      // WordApi 1.5 - insertField 方法
  hasFields: boolean           // WordApi 1.4 - fields 集合
  hasTableOfContents: boolean  // WordApi BETA - TableOfContents API（Preview）
} {
  try {
    return {
      // WordApi 1.5 支持 insertField 和 Word.FieldType
      // 注意：Word on the web 对 field 主要是只读的
      hasInsertField: Office.context.requirements.isSetSupported('WordApi', '1.5'),
      // WordApi 1.4 支持 fields 集合
      hasFields: Office.context.requirements.isSetSupported('WordApi', '1.4'),
      // TableOfContents API 目前是 BETA (Preview Only)
      // 需要 Office Insider 版本，生产环境可能不可用
      // 使用 try-catch 在运行时检测
      hasTableOfContents: false // 设为 false，在运行时动态检测
    }
  } catch {
    return { hasInsertField: false, hasFields: false, hasTableOfContents: false }
  }
}

/**
 * 插入目录
 * 优先使用 insertField API（WordApi 1.5+），支持带页码和超链接的真正目录
 * 降级方案：OOXML 域代码 -> 简化文本目录
 */
async function wordInsertToc(args: Record<string, any>): Promise<FunctionResult> {
  const { 
    position = 'cursor', 
    includePageNumbers = true, 
    rightAlignPageNumbers = true, 
    useHyperlinks = true, 
    headingLevels = 3 
  } = args

  const apiSupport = checkWordApiSupport()

  return new Promise((resolve) => {
    Word.run(async (context) => {
      let insertLocation: Word.Range

      switch (position) {
        case 'start':
          insertLocation = context.document.body.getRange(Word.RangeLocation.start)
          break
        case 'end':
          insertLocation = context.document.body.getRange(Word.RangeLocation.end)
          break
        case 'cursor':
        default:
          insertLocation = context.document.getSelection()
          break
      }

      // 方案一：使用 insertField API（WordApi 1.5+）
      if (apiSupport.hasInsertField) {
        try {
          // TOC 域开关说明：
          // \o "1-3" - 包含标题 1-3 级
          // \h - 使用超链接（点击跳转）
          // \z - 隐藏 Web 版本中的制表符前导符
          // \u - 使用应用的段落大纲级别
          // \p - 页码右对齐
          const tocSwitches = []
          tocSwitches.push(`\\o "1-${headingLevels}"`)
          if (useHyperlinks) tocSwitches.push('\\h')
          tocSwitches.push('\\z')
          tocSwitches.push('\\u')
          if (rightAlignPageNumbers) tocSwitches.push('\\p')
          
          const tocFieldText = tocSwitches.join(' ')
          
          // 先插入目录标题
          const tocTitle = insertLocation.insertParagraph('目录', Word.InsertLocation.after)
          tocTitle.styleBuiltIn = Word.BuiltInStyleName.tocHeading
          await context.sync()
          
          // 获取标题后的位置
          const tocTitleRange = tocTitle.getRange(Word.RangeLocation.after)
          
          // 使用 insertField 插入 TOC 域
          // @ts-ignore - insertField 在 WordApi 1.5+ 中可用
          const tocField = tocTitleRange.insertField(
            Word.InsertLocation.after,
            'TOC', // Word.FieldType.toc
            tocFieldText,
            true // removeFormatting
          )
          
          await context.sync()

          // 尝试更新目录
          // 注意：TableOfContents API 目前是 BETA (Preview Only)
          // 需要 Office Insider 版本，在运行时动态检测可用性
          let tocUpdated = false
          try {
            // @ts-ignore - tablesOfContents 是 BETA API，可能不存在
            if (context.document.tablesOfContents) {
              // @ts-ignore
              const tocs = context.document.tablesOfContents
              tocs.load('items')
              await context.sync()

              if (tocs.items && tocs.items.length > 0) {
                // 更新最后插入的目录
                const lastToc = tocs.items[tocs.items.length - 1]
                // @ts-ignore - updatePageNumber 是 BETA API
                if (lastToc.updatePageNumber) {
                  lastToc.updatePageNumbers()
                  await context.sync()
                  tocUpdated = true
                }
              }
            }
          } catch (updateError) {
            // BETA API 不可用，这是预期的行为
            logger.info('TableOfContents BETA API not available (expected in non-Insider builds)', { error: updateError })
          }

          resolve({
            success: true,
            message: tocUpdated ? '目录已插入并更新（带页码和超链接）' : '目录已插入（使用 Field API）',
            data: { 
              position,
              headingLevels,
              includePageNumbers,
              useHyperlinks,
              rightAlignPageNumbers,
              method: 'insertField',
              tocUpdated,
              note: tocUpdated 
                ? '目录已生成，点击条目可跳转到对应章节' 
                : '目录已插入。如页码未显示，请按 F9 或右键选择"更新域"'
            }
          })
          return
        } catch (insertFieldError) {
          logger.warn('insertField API failed, falling back to OOXML', { error: insertFieldError })
        }
      }

      // 方案二：使用 OOXML 插入 TOC 域代码
      const tocSwitches = []
      tocSwitches.push(`\\\\o "1-${headingLevels}"`)
      if (useHyperlinks) tocSwitches.push('\\\\h')
      tocSwitches.push('\\\\z')
      tocSwitches.push('\\\\u')
      
      const tocFieldCode = `TOC ${tocSwitches.join(' ')}`
      
      const tocOoxml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<pkg:package xmlns:pkg="http://schemas.microsoft.com/office/2006/xmlPackage">
  <pkg:part pkg:name="/_rels/.rels" pkg:contentType="application/vnd.openxmlformats-package.relationships+xml">
    <pkg:xmlData>
      <Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
        <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
      </Relationships>
    </pkg:xmlData>
  </pkg:part>
  <pkg:part pkg:name="/word/document.xml" pkg:contentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml">
    <pkg:xmlData>
      <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
        <w:body>
          <w:p>
            <w:pPr>
              <w:pStyle w:val="TOCHeading"/>
            </w:pPr>
            <w:r>
              <w:t>目录</w:t>
            </w:r>
          </w:p>
          <w:p>
            <w:r>
              <w:fldChar w:fldCharType="begin"/>
            </w:r>
            <w:r>
              <w:instrText xml:space="preserve"> ${tocFieldCode} </w:instrText>
            </w:r>
            <w:r>
              <w:fldChar w:fldCharType="separate"/>
            </w:r>
            <w:r>
              <w:t>请按 F9 或右键选择"更新域"来生成目录内容</w:t>
            </w:r>
            <w:r>
              <w:fldChar w:fldCharType="end"/>
            </w:r>
          </w:p>
        </w:body>
      </w:document>
    </pkg:xmlData>
  </pkg:part>
</pkg:package>`

      try {
        insertLocation.insertOoxml(tocOoxml, Word.InsertLocation.after)
        await context.sync()

        resolve({
          success: true,
          message: '目录已插入（使用域代码）',
          data: { 
            position,
            headingLevels,
            includePageNumbers,
            useHyperlinks,
            method: 'ooxml_field',
            note: '目录已插入。请按 F9 或右键选择"更新域"来生成带页码的完整目录。'
          }
        })
      } catch (ooxmlError) {
        // 方案三：降级到简化版本
        logger.warn('OOXML TOC insertion failed, falling back to simplified version', { error: ooxmlError })
        
        const paragraphs = context.document.body.paragraphs
        paragraphs.load('items')
        await context.sync()

        const headings: Array<{ level: number; text: string }> = []
        for (const paragraph of paragraphs.items) {
          paragraph.load('style,text')
        }
        await context.sync()

        for (const paragraph of paragraphs.items) {
          const style = paragraph.style
          if (style) {
            const headingMatch = style.match(/Heading\s*(\d)/i) || style.match(/标题\s*(\d)/)
            if (headingMatch) {
              const level = parseInt(headingMatch[1], 10)
              if (level <= headingLevels) {
                headings.push({ level, text: paragraph.text.trim() })
              }
            }
          }
        }

        const tocTitle = insertLocation.insertParagraph('目录', Word.InsertLocation.after)
        tocTitle.styleBuiltIn = Word.BuiltInStyleName.tocHeading

        if (headings.length === 0) {
          const placeholder = tocTitle.insertParagraph(
            '[请先为文档添加标题（使用标题1、标题2等样式），然后在 Word 中使用"引用-目录"功能插入带页码的完整目录。]',
            Word.InsertLocation.after
          )
          placeholder.font.italic = true
          placeholder.font.color = 'gray'
        } else {
          let lastParagraph = tocTitle
          for (const heading of headings) {
            const indent = '  '.repeat(heading.level - 1)
            const tocEntry = lastParagraph.insertParagraph(
              indent + heading.text,
              Word.InsertLocation.after
            )
            tocEntry.font.size = 11
            lastParagraph = tocEntry
          }

          const note = lastParagraph.insertParagraph(
            '\n[这是简化目录。如需带页码的完整目录，请在 Word 中使用"引用-目录"功能。]',
            Word.InsertLocation.after
          )
          note.font.italic = true
          note.font.color = 'gray'
          note.font.size = 9
        }

        await context.sync()

        resolve({
          success: true,
          message: '目录已插入（简化版本）',
          data: { 
            position,
            headingLevels,
            headingsFound: headings.length,
            method: 'simplified',
            note: 'API 限制，已生成简化目录。如需带页码的完整目录，请在 Word 中使用"引用-目录"功能。'
          }
        })
      }
    }).catch((error) => {
      resolve({
        success: false,
        message: `插入目录失败: ${error instanceof Error ? error.message : String(error)}`,
        error
      })
    })
  })
}

/**
 * 更新目录
 * 
 * API 说明（根据 Microsoft 官方文档）：
 * - TableOfContents.updatePageNumber(): WordApi BETA (Preview Only)
 * - 需要 Office Insider 版本才能使用
 * - 在生产环境中会降级到提示用户手动更新
 * 
 * @see https://learn.microsoft.com/en-us/javascript/api/word/word.tableofcontents
 */
async function wordUpdateToc(args: Record<string, any>): Promise<FunctionResult> {
  const { tocIndex = 0, updatePageNumbers = true, updateEntireTable = false } = args

  const apiSupport = checkWordApiSupport()

  return new Promise((resolve) => {
    Word.run(async (context) => {
      // 方案一：尝试使用 TableOfContents BETA API（运行时检测）
      try {
        // @ts-ignore - tablesOfContents 是 BETA API，可能不存在
        if (context.document.tablesOfContents) {
          // @ts-ignore
          const tocs = context.document.tablesOfContents
          tocs.load('items')
          await context.sync()

          if (!tocs.items || tocs.items.length === 0) {
            resolve({
              success: false,
              message: '文档中没有找到目录',
              data: { 
                suggestion: '请先使用 word_insert_toc 插入目录，或在 Word 中通过"引用-目录"插入目录'
              }
            })
            return
          }

          const targetIndex = Math.min(tocIndex, tocs.items.length - 1)
          const toc = tocs.items[targetIndex]

          // 更新目录 - BETA API
          // @ts-ignore - updatePageNumber 是 BETA API
          if (toc.updatePageNumber) {
            toc.updatePageNumbers()
            await context.sync()

            resolve({
              success: true,
              message: '目录已更新',
              data: { 
                tocIndex: targetIndex,
                totalTocs: tocs.items.length,
                updatePageNumbers,
                method: 'tableOfContents_api',
                note: '目录页码和超链接已更新'
              }
            })
            return
          }
        }
      } catch (apiError) {
        logger.info('TableOfContents BETA API not available', { error: apiError })
      }

      // 降级方案：尝试通过 Field API 更新
      if (apiSupport.hasInsertField) {
        try {
          // @ts-ignore - fields 在 WordApi 1.4+ 中可用
          const fields = context.document.body.fields
          fields.load('items')
          await context.sync()

          // 查找 TOC 类型的域
          let tocFieldFound = false
          for (const field of fields.items) {
            field.load('code')
            await context.sync()
            
            if (field.code && field.code.toUpperCase().includes('TOC')) {
              // @ts-ignore - updateResult 在某些版本可用
              if (field.updateResult) {
                field.updateResult()
                tocFieldFound = true
              }
            }
          }
          
          if (tocFieldFound) {
            await context.sync()
            resolve({
              success: true,
              message: '目录域已更新',
              data: { 
                method: 'field_update',
                note: '已通过域更新功能更新目录'
              }
            })
            return
          }
        } catch (fieldError) {
          logger.warn('Field update failed', { error: fieldError })
        }
      }

      // 最终降级：提示手动更新
      resolve({
        success: false,
        message: '当前 Word 版本不支持通过 API 更新目录',
        data: { 
          tocIndex, 
          updatePageNumbers, 
          updateEntireTable,
          apiSupport,
          suggestion: '请在 Word 中右键点击目录，选择"更新域"来更新目录',
          alternativeMethods: [
            '1. 右键点击目录 -> 更新域',
            '2. 选中目录后按 F9 键',
            '3. 使用 Ctrl+A 全选后按 F9 更新所有域'
          ]
        }
      })
    }).catch((error) => {
      resolve({
        success: false,
        message: `更新目录失败: ${error instanceof Error ? error.message : String(error)}`,
        error
      })
    })
  })
}

/**
 * 插入分页符
 */
async function wordInsertPageBreak(args: Record<string, any>): Promise<FunctionResult> {
  const { position = 'cursor' } = args

  return new Promise((resolve) => {
    Word.run(async (context) => {
      let insertPoint: Word.Range

      switch (position) {
        case 'before':
          // 在选区之前插入
          insertPoint = context.document.getSelection()
          insertPoint.insertBreak(Word.BreakType.page, Word.InsertLocation.before)
          break
        case 'after':
          // 在选区之后插入
          insertPoint = context.document.getSelection()
          insertPoint.insertBreak(Word.BreakType.page, Word.InsertLocation.after)
          break
        case 'cursor':
        default:
          // 在光标位置插入
          insertPoint = context.document.getSelection()
          insertPoint.insertBreak(Word.BreakType.page, Word.InsertLocation.after)
          break
      }

      await context.sync()

      resolve({
        success: true,
        message: '分页符已插入',
        data: { position }
      })
    }).catch((error) => {
      resolve({
        success: false,
        message: `插入分页符失败: ${error instanceof Error ? error.message : String(error)}`,
        error
      })
    })
  })
}

/**
 * 插入分节符
 */
async function wordInsertSectionBreak(args: Record<string, any>): Promise<FunctionResult> {
  const { breakType = 'nextPage', position = 'cursor' } = args

  const breakTypeMap: Record<string, Word.BreakType> = {
    nextPage: Word.BreakType.sectionNext,
    continuous: Word.BreakType.sectionContinuous,
    evenPage: Word.BreakType.sectionEven,
    oddPage: Word.BreakType.sectionOdd
  }

  const wordBreakType = breakTypeMap[breakType] || Word.BreakType.sectionNext

  return new Promise((resolve) => {
    Word.run(async (context) => {
      let insertPoint: Word.Range

      switch (position) {
        case 'before':
          insertPoint = context.document.getSelection()
          insertPoint.insertBreak(wordBreakType, Word.InsertLocation.before)
          break
        case 'after':
          insertPoint = context.document.getSelection()
          insertPoint.insertBreak(wordBreakType, Word.InsertLocation.after)
          break
        case 'cursor':
        default:
          insertPoint = context.document.getSelection()
          insertPoint.insertBreak(wordBreakType, Word.InsertLocation.after)
          break
      }

      await context.sync()

      const breakTypeNames: Record<string, string> = {
        nextPage: '下一页',
        continuous: '连续',
        evenPage: '偶数页',
        oddPage: '奇数页'
      }

      resolve({
        success: true,
        message: `分节符（${breakTypeNames[breakType] || breakType}）已插入`,
        data: { breakType, position }
      })
    }).catch((error) => {
      resolve({
        success: false,
        message: `插入分节符失败: ${error instanceof Error ? error.message : String(error)}`,
        error
      })
    })
  })
}

/**
 * 导出高级操作工具定义
 */
export const advancedTools: ToolDefinition[] = [
  { name: 'word_insert_toc', handler: wordInsertToc, category: 'text', description: '插入目录' },
  { name: 'word_update_toc', handler: wordUpdateToc, category: 'text', description: '更新目录' },
  { name: 'word_insert_page_break', handler: wordInsertPageBreak, category: 'text', description: '插入分页符' },
  { name: 'word_insert_section_break', handler: wordInsertSectionBreak, category: 'text', description: '插入分节符' }
]
