/**
 * DocumentParser - 文档解析服务
 * 支持解析多种文档格式并提取文本内容
 * 
 * 支持的格式：
 * - PDF (.pdf) - 使用 CDN 动态加载 pdf.js
 * - Word (.docx) - 使用 JSZip 解析 XML 内容（浏览器兼容）
 * - Excel (.xlsx, .xls, .csv) - 使用动态加载的 xlsx
 * - 文本文件 (.txt, .md, .json, .xml, .html, .htm)
 * - 代码文件 (.js, .ts, .py, .java, .c, .cpp, .go, .rs, .sql 等)
 */

import Logger from '../utils/logger'

const logger = new Logger('DocumentParser')

// 缓存已加载的库
let pdfjsLib: unknown = null
let XLSX: unknown = null
let JSZip: unknown = null

// PDF.js CDN 版本
const PDFJS_VERSION = '4.4.168'
const PDFJS_CDN_URL = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}/pdf.min.mjs`
const PDFJS_WORKER_URL = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}/pdf.worker.min.mjs`

// 从 CDN 加载 PDF.js
async function loadPdfJs(): Promise<any> {
  if (pdfjsLib) return pdfjsLib
  
  try {
    // 使用动态 import 从 CDN 加载
    pdfjsLib = await import(/* @vite-ignore */ PDFJS_CDN_URL)
    ;(pdfjsLib as { GlobalWorkerOptions: { workerSrc: string } }).GlobalWorkerOptions.workerSrc = PDFJS_WORKER_URL
    logger.info('PDF.js loaded from CDN')
    return pdfjsLib
  } catch (error) {
    logger.error('Failed to load PDF.js from CDN', error instanceof Error ? error : { error })
    throw new Error('无法加载 PDF 解析库，请检查网络连接')
  }
}

async function loadXLSX(): Promise<typeof import('xlsx')> {
  if (!XLSX) {
    XLSX = await import('xlsx')
  }
  return XLSX as typeof import('xlsx')
}

async function loadJSZip(): Promise<unknown> {
  if (!JSZip) {
    JSZip = await import('jszip').then(m => m.default)
  }
  return JSZip
}

/** 文档结构元素 */
export interface DocumentSection {
  type: 'heading' | 'paragraph' | 'list' | 'table' | 'code' | 'image'
  level?: number  // 标题级别 1-6
  content: string
  startIndex?: number  // 在原文中的起始位置
}

/** 文档元数据 */
export interface DocumentMetadata {
  title?: string
  author?: string
  createdAt?: string
  modifiedAt?: string
  subject?: string
  keywords?: string[]
}

/** 文档摘要 */
export interface DocumentSummary {
  brief: string  // 简短摘要（100字以内）
  keyPoints: string[]  // 关键点列表
  tableOfContents?: string[]  // 目录结构
}

export interface ParseResult {
  success: boolean
  text: string
  error?: string
  pageCount?: number
  wordCount?: number
  sheetCount?: number  // Excel 工作表数量
  slideCount?: number  // PPT 幻灯片数量
  /** 结构化内容（章节、段落等） */
  sections?: DocumentSection[]
  /** 文档元数据 */
  metadata?: DocumentMetadata
  /** 自动生成的摘要 */
  summary?: DocumentSummary
  /** 检测到的内容类型 */
  contentType?: 'document' | 'spreadsheet' | 'presentation' | 'code' | 'data'
  /** 文件语言（代码文件） */
  language?: string
}

// 支持的文件扩展名
const TEXT_EXTENSIONS = [
  '.txt', '.md', '.markdown', '.rst', '.log',
  '.json', '.xml', '.yaml', '.yml', '.toml', '.ini', '.cfg', '.conf',
  '.html', '.htm', '.css', '.scss', '.less', '.sass',
  '.js', '.ts', '.jsx', '.tsx', '.mjs', '.cjs',
  '.py', '.pyw', '.pyi',
  '.java', '.kt', '.kts', '.groovy', '.scala',
  '.c', '.h', '.cpp', '.hpp', '.cc', '.cxx',
  '.cs', '.fs', '.vb',
  '.go', '.rs', '.swift', '.m', '.mm',
  '.rb', '.php', '.pl', '.pm', '.lua',
  '.r', '.R', '.rmd', '.Rmd',
  '.sql', '.sh', '.bash', '.zsh', '.ps1', '.bat', '.cmd',
  '.dockerfile', '.gitignore', '.env', '.editorconfig'
]

const CODE_EXTENSIONS = [
  '.js', '.ts', '.jsx', '.tsx', '.mjs', '.cjs',
  '.py', '.pyw', '.pyi',
  '.java', '.kt', '.kts', '.groovy', '.scala',
  '.c', '.h', '.cpp', '.hpp', '.cc', '.cxx',
  '.cs', '.fs', '.vb',
  '.go', '.rs', '.swift', '.m', '.mm',
  '.rb', '.php', '.pl', '.pm', '.lua',
  '.r', '.R', '.sql', '.sh', '.bash', '.zsh', '.ps1', '.bat', '.cmd'
]

class DocumentParserClass {
  constructor() {
    // 构造函数为空，库按需动态加载
  }

  /**
   * 获取支持的文件类型列表
   */
  getSupportedFormats(): string {
    return `
支持的文档格式：
• PDF 文档 (.pdf)
• Word 文档 (.docx, .doc)
• Excel 表格 (.xlsx, .xls, .csv)
• PowerPoint 演示文稿 (.pptx)
• 文本文件 (.txt, .md, .json, .xml, .html, .yaml 等)
• 代码文件 (.js, .ts, .py, .java, .go, .rs 等)
    `.trim()
  }

  /**
   * 检查文件是否支持解析
   */
  isSupported(fileName: string): boolean {
    const ext = this.getExtension(fileName)
    return this.isSupportedExtension(ext)
  }

  /**
   * 解析文档并提取文本
   */
  async parse(file: File): Promise<ParseResult> {
    const fileName = file.name.toLowerCase()
    const ext = this.getExtension(fileName)

    logger.info('开始解析文档', { fileName, fileType: file.type })

    try {
      // PDF 文档
      if (ext === '.pdf') {
        return await this.parsePDF(file)
      }

      // Word 文档 (.docx)
      if (ext === '.docx') {
        return await this.parseDocx(file)
      }

      // 旧版 Word 文档 (.doc)
      if (ext === '.doc') {
        return await this.parseDoc(file)
      }

      // Excel 文档
      if (['.xlsx', '.xls'].includes(ext)) {
        return await this.parseExcel(file)
      }

      // CSV 文件
      if (ext === '.csv') {
        return await this.parseCSV(file)
      }

      // PowerPoint 文档
      if (ext === '.pptx') {
        return await this.parsePPTX(file)
      }

      // 文本/代码文件
      if (this.isTextFile(ext)) {
        return await this.parseText(file, CODE_EXTENSIONS.includes(ext))
      }

      // 尝试作为文本文件读取
      if (file.type.startsWith('text/')) {
        return await this.parseText(file, false)
      }

      return {
        success: false,
        text: '',
        error: `不支持的文件格式: ${ext || file.type}`
      }
    } catch (error) {
      logger.error('解析失败', error instanceof Error ? error : { error })
      return {
        success: false,
        text: '',
        error: error instanceof Error ? error.message : '解析失败'
      }
    }
  }

  /**
   * 解析 PDF 文档
   */
  private async parsePDF(file: File): Promise<ParseResult> {
    try {
      const pdfjs = await loadPdfJs()
      const arrayBuffer = await file.arrayBuffer()
      const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise

      const textParts: string[] = []
      const pageCount = pdf.numPages

      for (let i = 1; i <= pageCount; i++) {
        const page = await pdf.getPage(i)
        const textContent = await page.getTextContent()
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ')
        textParts.push(pageText)
      }

      const fullText = textParts.join('\n\n')
      const wordCount = this.countWords(fullText)

      logger.info('PDF 解析完成', { pageCount, wordCount })

      return {
        success: true,
        text: fullText,
        pageCount,
        wordCount
      }
    } catch (error) {
      logger.error('PDF 解析失败', error instanceof Error ? error : { error })
      return {
        success: false,
        text: '',
        error: `PDF 解析失败: ${error instanceof Error ? error.message : '未知错误'}`
      }
    }
  }

  /**
   * 解析 Word 文档 (.docx)
   * 使用 JSZip 解压并提取 XML 中的文本内容（浏览器兼容）
   */
  private async parseDocx(file: File): Promise<ParseResult> {
    try {
      const arrayBuffer = await file.arrayBuffer()
      const zip = await this.unzip(arrayBuffer)
      
      // docx 的主文档内容在 word/document.xml 中
      const documentXml = zip['word/document.xml']
      if (!documentXml) {
        throw new Error('无法找到文档内容')
      }

      const text = this.extractTextFromDocx(documentXml)
      const wordCount = this.countWords(text)

      // 提取结构化信息
      const sections = this.extractSections(text)
      const summary = this.generateSummary(text, sections)

      // 提取元数据
      const coreXml = zip['docProps/core.xml']
      const metadata = this.extractDocxMetadata(coreXml)

      logger.info('Word (.docx) 解析完成', { 
        wordCount, 
        sectionCount: sections.length,
        hasMetadata: !!metadata 
      })

      return {
        success: true,
        text,
        wordCount,
        sections,
        summary,
        metadata,
        contentType: 'document'
      }
    } catch (error) {
      logger.error('Word (.docx) 解析失败', error instanceof Error ? error : { error })
      return {
        success: false,
        text: '',
        error: `Word 解析失败: ${error instanceof Error ? error.message : '未知错误'}`
      }
    }
  }

  /**
   * 解析旧版 Word 文档 (.doc)
   * 注意：浏览器环境不支持直接解析 .doc 格式
   */
  private async parseDoc(_file: File): Promise<ParseResult> {
    // .doc 是 OLE 二进制格式，在浏览器中难以直接解析
    // 建议用户转换为 .docx 格式
    return {
      success: false,
      text: '',
      error: '浏览器不支持直接解析 .doc 格式。请将文件另存为 .docx 格式后重新上传。'
    }
  }

  /**
   * 解析 Excel 文档
   */
  private async parseExcel(file: File): Promise<ParseResult> {
    try {
      const xlsxLib = await loadXLSX()
      const arrayBuffer = await file.arrayBuffer()
      const workbook = xlsxLib.read(arrayBuffer, { type: 'array' })

      const textParts: string[] = []
      const sheetCount = workbook.SheetNames.length

      for (const sheetName of workbook.SheetNames) {
        const worksheet = workbook.Sheets[sheetName]
        const csv = xlsxLib.utils.sheet_to_csv(worksheet)
        textParts.push(`=== 工作表: ${sheetName} ===\n${csv}`)
      }

      const fullText = textParts.join('\n\n')
      const wordCount = this.countWords(fullText)

      logger.info('Excel 解析完成', { sheetCount, wordCount })

      return {
        success: true,
        text: fullText,
        sheetCount,
        wordCount
      }
    } catch (error) {
      logger.error('Excel 解析失败', error instanceof Error ? error : { error })
      return {
        success: false,
        text: '',
        error: `Excel 解析失败: ${error instanceof Error ? error.message : '未知错误'}`
      }
    }
  }

  /**
   * 解析 CSV 文件
   */
  private async parseCSV(file: File): Promise<ParseResult> {
    const text = await file.text()
    const wordCount = this.countWords(text)

    // 计算行数作为大概的记录数
    const lineCount = text.split('\n').filter(line => line.trim()).length

    logger.info('CSV 解析完成', { lineCount, wordCount })

    return {
      success: true,
      text: `=== CSV 数据 (${lineCount} 行) ===\n${text}`,
      wordCount
    }
  }

  /**
   * 解析 PowerPoint 文档 (.pptx)
   * 注意：.pptx 是 ZIP 格式，包含 XML 文件
   */
  private async parsePPTX(file: File): Promise<ParseResult> {
    try {
      const arrayBuffer = await file.arrayBuffer()
      const zip = await this.unzip(arrayBuffer)
      
      const textParts: string[] = []
      let slideCount = 0

      // PPTX 的幻灯片内容在 ppt/slides/slide*.xml 中
      const slideFiles = Object.keys(zip).filter(name => 
        name.match(/ppt\/slides\/slide\d+\.xml/)
      ).sort((a, b) => {
        const numA = parseInt(a.match(/slide(\d+)/)?.[1] || '0')
        const numB = parseInt(b.match(/slide(\d+)/)?.[1] || '0')
        return numA - numB
      })

      for (const slideFile of slideFiles) {
        slideCount++
        const xmlContent = zip[slideFile]
        const slideText = this.extractTextFromXML(xmlContent)
        if (slideText.trim()) {
          textParts.push(`=== 幻灯片 ${slideCount} ===\n${slideText}`)
        }
      }

      const fullText = textParts.join('\n\n')
      const wordCount = this.countWords(fullText)

      logger.info('PowerPoint 解析完成', { slideCount, wordCount })

      return {
        success: true,
        text: fullText,
        slideCount,
        wordCount
      }
    } catch (error) {
      logger.error('PPTX 解析失败', error instanceof Error ? error : { error })
      return {
        success: false,
        text: '',
        error: `PowerPoint 解析失败: ${error instanceof Error ? error.message : '未知错误'}`
      }
    }
  }

  /**
   * 简单的 ZIP 解压（用于 PPTX）
   */
  private async unzip(arrayBuffer: ArrayBuffer): Promise<Record<string, string>> {
    const zip: Record<string, string> = {}
    
    try {
      const JSZipLib = await loadJSZip() as { loadAsync: (data: Blob) => Promise<{ files: Record<string, { dir: boolean; async: (type: string) => Promise<string> }> }> }
      const uint8Array = new Uint8Array(arrayBuffer)
      const blob = new Blob([uint8Array])
      
      const zipFile = await JSZipLib.loadAsync(blob)
      for (const [name, file] of Object.entries(zipFile.files)) {
        if (!file.dir) {
          try {
            zip[name] = await file.async('string')
          } catch {
            // 跳过无法读取的文件
          }
        }
      }
    } catch (error) {
      logger.error('ZIP 解压失败', error instanceof Error ? error : { error })
    }
    
    return zip
  }

  /**
   * 从 PPTX XML 中提取纯文本
   */
  private extractTextFromXML(xml: string): string {
    // 移除 XML 标签，保留文本内容
    // 特别处理 <a:t> 标签（PowerPoint 文本标签）
    const textMatches = xml.match(/<a:t[^>]*>([^<]*)<\/a:t>/g) || []
    const texts = textMatches.map(match => {
      const content = match.replace(/<[^>]+>/g, '')
      return content
    })
    return texts.join(' ')
  }

  /**
   * 从 DOCX XML 中提取纯文本
   */
  private extractTextFromDocx(xml: string): string {
    const paragraphs: string[] = []
    
    // 匹配段落 <w:p>...</w:p>
    const paragraphRegex = /<w:p[^>]*>([\s\S]*?)<\/w:p>/g
    let paragraphMatch
    
    while ((paragraphMatch = paragraphRegex.exec(xml)) !== null) {
      const paragraphContent = paragraphMatch[1]
      const texts: string[] = []
      
      // 在段落中匹配文本 <w:t>...</w:t> 或 <w:t ...>...</w:t>
      const textRegex = /<w:t[^>]*>([^<]*)<\/w:t>/g
      let textMatch
      
      while ((textMatch = textRegex.exec(paragraphContent)) !== null) {
        if (textMatch[1]) {
          texts.push(textMatch[1])
        }
      }
      
      if (texts.length > 0) {
        paragraphs.push(texts.join(''))
      }
    }
    
    return paragraphs.join('\n')
  }

  /**
   * 解析纯文本文件
   */
  private async parseText(file: File, isCode: boolean): Promise<ParseResult> {
    const text = await file.text()
    const wordCount = this.countWords(text)
    const lineCount = text.split('\n').length

    logger.info('文本解析完成', { wordCount, lineCount, isCode })

    // 如果是代码文件，添加语言标识
    let formattedText = text
    if (isCode) {
      const ext = this.getExtension(file.name)
      const lang = this.getLanguageFromExt(ext)
      formattedText = `\`\`\`${lang}\n${text}\n\`\`\``
    }

    return {
      success: true,
      text: formattedText,
      wordCount
    }
  }

  /**
   * 根据扩展名获取编程语言
   */
  private getLanguageFromExt(ext: string): string {
    const langMap: Record<string, string> = {
      '.js': 'javascript',
      '.ts': 'typescript',
      '.jsx': 'jsx',
      '.tsx': 'tsx',
      '.py': 'python',
      '.java': 'java',
      '.kt': 'kotlin',
      '.go': 'go',
      '.rs': 'rust',
      '.c': 'c',
      '.cpp': 'cpp',
      '.h': 'c',
      '.hpp': 'cpp',
      '.cs': 'csharp',
      '.rb': 'ruby',
      '.php': 'php',
      '.swift': 'swift',
      '.sql': 'sql',
      '.sh': 'bash',
      '.bash': 'bash',
      '.ps1': 'powershell',
      '.r': 'r',
      '.R': 'r'
    }
    return langMap[ext] || ext.slice(1)
  }

  /**
   * 获取文件扩展名
   */
  private getExtension(fileName: string): string {
    const lastDot = fileName.lastIndexOf('.')
    return lastDot >= 0 ? fileName.slice(lastDot).toLowerCase() : ''
  }

  /**
   * 判断是否为文本文件
   */
  private isTextFile(ext: string): boolean {
    return TEXT_EXTENSIONS.includes(ext)
  }

  /**
   * 判断扩展名是否支持
   */
  private isSupportedExtension(ext: string): boolean {
    const docExtensions = ['.pdf', '.doc', '.docx', '.xlsx', '.xls', '.csv', '.pptx']
    return docExtensions.includes(ext) || this.isTextFile(ext)
  }

  /**
   * 统计字数（中文按字符，英文按单词）
   */
  private countWords(text: string): number {
    const cleanText = text.replace(/\s+/g, ' ').trim()
    if (!cleanText) return 0

    const chineseChars = (cleanText.match(/[\u4e00-\u9fa5]/g) || []).length
    const englishWords = cleanText
      .replace(/[\u4e00-\u9fa5]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 0).length

    return chineseChars + englishWords
  }

  /**
   * 截断文本（如果太长）
   */
  truncateText(text: string, maxLength: number = 50000): string {
    if (text.length <= maxLength) return text

    const truncated = text.substring(0, maxLength)
    return truncated + '\n\n[文档内容已截断，原文共 ' + text.length + ' 字符]'
  }

  /**
   * 从文本中提取结构化内容
   */
  extractSections(text: string): DocumentSection[] {
    const sections: DocumentSection[] = []
    const lines = text.split('\n')
    let currentIndex = 0

    for (const line of lines) {
      const trimmedLine = line.trim()
      if (!trimmedLine) {
        currentIndex += line.length + 1
        continue
      }

      // 检测 Markdown 标题
      const headingMatch = trimmedLine.match(/^(#{1,6})\s+(.+)$/)
      if (headingMatch) {
        sections.push({
          type: 'heading',
          level: headingMatch[1].length,
          content: headingMatch[2],
          startIndex: currentIndex
        })
        currentIndex += line.length + 1
        continue
      }

      // 检测中文数字标题（如：一、二、三）
      const chineseHeadingMatch = trimmedLine.match(/^[一二三四五六七八九十]+[、.．]\s*(.+)$/)
      if (chineseHeadingMatch) {
        sections.push({
          type: 'heading',
          level: 1,
          content: trimmedLine,
          startIndex: currentIndex
        })
        currentIndex += line.length + 1
        continue
      }

      // 检测阿拉伯数字标题（如：1. 2. 或 1.1）
      const numberHeadingMatch = trimmedLine.match(/^(\d+\.)+\s*(.+)$/)
      if (numberHeadingMatch && trimmedLine.length < 100) {
        const level = (numberHeadingMatch[1].match(/\./g) || []).length
        sections.push({
          type: 'heading',
          level: Math.min(level, 6),
          content: trimmedLine,
          startIndex: currentIndex
        })
        currentIndex += line.length + 1
        continue
      }

      // 检测列表项
      if (/^[-*•]\s+/.test(trimmedLine) || /^\d+[.)]\s+/.test(trimmedLine)) {
        sections.push({
          type: 'list',
          content: trimmedLine,
          startIndex: currentIndex
        })
        currentIndex += line.length + 1
        continue
      }

      // 检测代码块
      if (trimmedLine.startsWith('```')) {
        sections.push({
          type: 'code',
          content: trimmedLine,
          startIndex: currentIndex
        })
        currentIndex += line.length + 1
        continue
      }

      // 普通段落
      if (trimmedLine.length > 0) {
        sections.push({
          type: 'paragraph',
          content: trimmedLine,
          startIndex: currentIndex
        })
      }

      currentIndex += line.length + 1
    }

    return sections
  }

  /**
   * 生成文档摘要
   */
  generateSummary(text: string, sections: DocumentSection[]): DocumentSummary {
    // 提取目录（标题列表）
    const tableOfContents = sections
      .filter(s => s.type === 'heading')
      .map(s => {
        const indent = '  '.repeat((s.level || 1) - 1)
        return `${indent}${s.content}`
      })

    // 提取关键点（前几个段落或列表项）
    const keyPoints: string[] = []
    const headings = sections.filter(s => s.type === 'heading')
    
    // 从标题提取关键点
    headings.slice(0, 5).forEach(h => {
      if (h.content.length < 50) {
        keyPoints.push(h.content)
      }
    })

    // 生成简短摘要
    let brief = ''
    const firstParagraph = sections.find(s => s.type === 'paragraph')
    if (firstParagraph) {
      brief = firstParagraph.content.slice(0, 100)
      if (firstParagraph.content.length > 100) {
        brief += '...'
      }
    } else if (headings.length > 0) {
      brief = `本文档包含 ${headings.length} 个章节`
      if (headings[0]) {
        brief += `，首章: ${headings[0].content}`
      }
    } else {
      brief = text.slice(0, 100) + (text.length > 100 ? '...' : '')
    }

    return {
      brief,
      keyPoints,
      tableOfContents: tableOfContents.length > 0 ? tableOfContents : undefined
    }
  }

  /**
   * 从 DOCX XML 提取元数据
   */
  private extractDocxMetadata(coreXml: string | undefined): DocumentMetadata | undefined {
    if (!coreXml) return undefined

    const metadata: DocumentMetadata = {}

    // 提取标题
    const titleMatch = coreXml.match(/<dc:title>([^<]*)<\/dc:title>/)
    if (titleMatch) metadata.title = titleMatch[1]

    // 提取作者
    const authorMatch = coreXml.match(/<dc:creator>([^<]*)<\/dc:creator>/)
    if (authorMatch) metadata.author = authorMatch[1]

    // 提取主题
    const subjectMatch = coreXml.match(/<dc:subject>([^<]*)<\/dc:subject>/)
    if (subjectMatch) metadata.subject = subjectMatch[1]

    // 提取关键词
    const keywordsMatch = coreXml.match(/<cp:keywords>([^<]*)<\/cp:keywords>/)
    if (keywordsMatch) {
      metadata.keywords = keywordsMatch[1].split(/[,;，；]/).map(k => k.trim()).filter(Boolean)
    }

    // 提取创建时间
    const createdMatch = coreXml.match(/<dcterms:created[^>]*>([^<]*)<\/dcterms:created>/)
    if (createdMatch) metadata.createdAt = createdMatch[1]

    // 提取修改时间
    const modifiedMatch = coreXml.match(/<dcterms:modified[^>]*>([^<]*)<\/dcterms:modified>/)
    if (modifiedMatch) metadata.modifiedAt = modifiedMatch[1]

    return Object.keys(metadata).length > 0 ? metadata : undefined
  }

  /**
   * 格式化文档内容用于 AI 上下文
   * 包含结构化信息和摘要
   */
  formatForAIContext(parseResult: ParseResult, fileName: string): string {
    const parts: string[] = []

    // 文件基本信息
    parts.push(`📄 文件: ${fileName}`)
    
    if (parseResult.wordCount) {
      parts.push(`📊 字数: ${parseResult.wordCount}`)
    }
    if (parseResult.pageCount) {
      parts.push(`📄 页数: ${parseResult.pageCount}`)
    }
    if (parseResult.sheetCount) {
      parts.push(`📋 工作表: ${parseResult.sheetCount}`)
    }
    if (parseResult.slideCount) {
      parts.push(`🎯 幻灯片: ${parseResult.slideCount}`)
    }

    // 元数据
    if (parseResult.metadata) {
      const meta = parseResult.metadata
      if (meta.title) parts.push(`📌 标题: ${meta.title}`)
      if (meta.author) parts.push(`👤 作者: ${meta.author}`)
    }

    // 摘要
    if (parseResult.summary) {
      parts.push('')
      parts.push('【文档摘要】')
      parts.push(parseResult.summary.brief)
      
      if (parseResult.summary.tableOfContents && parseResult.summary.tableOfContents.length > 0) {
        parts.push('')
        parts.push('【目录结构】')
        parts.push(parseResult.summary.tableOfContents.slice(0, 10).join('\n'))
        if (parseResult.summary.tableOfContents.length > 10) {
          parts.push(`... 还有 ${parseResult.summary.tableOfContents.length - 10} 个章节`)
        }
      }
    }

    // 完整内容
    parts.push('')
    parts.push('【完整内容】')
    parts.push(parseResult.text)

    return parts.join('\n')
  }
}

// 单例导出
export const DocumentParser = new DocumentParserClass()
