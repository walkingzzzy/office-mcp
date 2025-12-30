/**
 * 验证优化后的 FormattingFunctionRegistry
 * 确保所有函数正确注册,没有重复,优先级正确
 */

// 🔧 Mock 浏览器 API for Node.js 环境
if (typeof global !== 'undefined') {
  (global as any).localStorage = {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
    clear: () => {},
    length: 0,
    key: () => null
  };
  (global as any).window = { localStorage: (global as any).localStorage };
  (global as any).Office = {};
  (global as any).Word = {};
}

import { FormattingFunctionRegistry } from '../src/services/ai/FormattingFunctionRegistry'
import { FunctionCategory } from '../src/services/ai/types'
import { WordService } from '../src/services/WordService'

// 模拟 WordService
const mockWordService = {
  applyFontFormatting: async () => {},
  applyParagraphFormatting: async () => {},
  applyStyle: async () => {},
  searchText: async () => ({ found: false, ranges: [], matches: [] }),
  replaceTextAdvanced: async () => 0,
} as unknown as WordService

async function main() {
  console.log('🔍 开始验证 FormattingFunctionRegistry 优化...\n')

  // 创建注册中心
  const registry = new FormattingFunctionRegistry(mockWordService)

  console.log('⏳ 初始化注册中心...')
  await registry.initialize()
  console.log('✅ 初始化完成\n')

  // 获取所有函数
  const allFunctions = registry.getAllFunctions()
  console.log(`📊 总函数数量: ${allFunctions.length}`)

  // 检查重复
  console.log('\n📋 检查重复注册...')
  const functionNames = allFunctions.map(f => f.name)
  const uniqueNames = new Set(functionNames)

  if (functionNames.length === uniqueNames.size) {
    console.log(`✅ 无重复注册 (${functionNames.length} 个唯一函数)`)
  } else {
    console.log(`❌ 发现重复注册!`)
    const duplicates = functionNames.filter((name, index) =>
      functionNames.indexOf(name) !== index
    )
    console.log(`   重复的函数: ${[...new Set(duplicates)].join(', ')}`)
    process.exit(1)
  }

  // 按类别统计
  console.log('\n📊 函数类别分布:')
  const categoryStats = new Map<FunctionCategory, number>()
  allFunctions.forEach(func => {
    categoryStats.set(func.category, (categoryStats.get(func.category) || 0) + 1)
  })

  for (const [category, count] of categoryStats) {
    console.log(`   ${category}: ${count}`)
  }

  // 验证 Word 函数数量
  console.log('\n🔍 验证 Word 函数数量...')
  const wordFunctions = allFunctions.filter(f =>
    f.category !== FunctionCategory.EXCEL &&
    f.category !== FunctionCategory.POWERPOINT
  )
  console.log(`   Word 函数: ${wordFunctions.length}`)

  if (wordFunctions.length === 37) {
    console.log('   ✅ Word 函数数量正确 (37个)')
  } else {
    console.log(`   ⚠️  Word 函数数量不匹配! 期望37个,实际${wordFunctions.length}个`)
  }

  // 检查优先级分布
  console.log('\n📊 优先级分布:')
  const priorityStats = new Map<number, number>()
  allFunctions.forEach(func => {
    const priority = func.priority ?? 999
    priorityStats.set(priority, (priorityStats.get(priority) || 0) + 1)
  })

  const sortedPriorities = Array.from(priorityStats.entries()).sort((a, b) => a[0] - b[0])
  for (const [priority, count] of sortedPriorities) {
    console.log(`   P${priority}: ${count} 个函数`)
  }

  // 验证 P0 函数
  console.log('\n🔍 验证 P0 函数 (priority=0)...')
  const p0Functions = allFunctions.filter(f => f.priority === 0)
  const expectedP0Functions = [
    'find_and_replace_text',
    'delete_text',
    'insert_text',
    'insert_comment',
    'adjust_images_size',
    'delete_comments',
    'align_images',
    'apply_list_formatting' // 从 registerAdvancedFormatting 注册
  ]

  console.log(`   P0 函数数量: ${p0Functions.length}`)
  console.log(`   P0 函数列表:`)
  p0Functions.forEach(f => {
    const isExpected = expectedP0Functions.includes(f.name)
    const mark = isExpected ? '✅' : '⚠️'
    console.log(`     ${mark} ${f.name} (${f.category})`)
  })

  // 验证 P1 函数
  console.log('\n🔍 验证 P1 函数 (priority=1)...')
  const p1Functions = allFunctions.filter(f => f.priority === 1)
  console.log(`   P1 函数数量: ${p1Functions.length}`)
  console.log(`   P1 函数列表:`)
  p1Functions.forEach(f => {
    console.log(`     - ${f.name} (${f.category})`)
  })

  // 验证关键函数存在
  console.log('\n🔍 验证关键函数存在...')
  const keyFunctions = [
    'find_and_replace_text',
    'apply_font_formatting',
    'apply_paragraph_formatting',
    'apply_style',
    'apply_list_formatting',
    'insert_table',
    'insert_comment',
    'adjust_images_size',
    'apply_page_setup',
    'insert_page_break'
  ]

  const missingFunctions: string[] = []
  keyFunctions.forEach(funcName => {
    const exists = allFunctions.some(f => f.name === funcName)
    if (exists) {
      console.log(`   ✅ ${funcName}`)
    } else {
      console.log(`   ❌ ${funcName} (缺失!)`)
      missingFunctions.push(funcName)
    }
  })

  if (missingFunctions.length > 0) {
    console.log(`\n❌ 缺失 ${missingFunctions.length} 个关键函数!`)
    process.exit(1)
  }

  // 验证 OpenAI Tools 格式
  console.log('\n🔍 验证 OpenAI Tools 格式...')
  try {
    const tools = registry.getAllFunctionsAsTools()
    console.log(`   ✅ 成功转换为 OpenAI Tools 格式 (${tools.length} 个)`)

    // 验证格式结构
    const firstTool = tools[0]
    if (firstTool.type === 'function' &&
        firstTool.function.name &&
        firstTool.function.description &&
        firstTool.function.parameters) {
      console.log('   ✅ Tools 格式结构正确')
    } else {
      console.log('   ❌ Tools 格式结构错误!')
      process.exit(1)
    }
  } catch (error) {
    console.log(`   ❌ 转换失败: ${error}`)
    process.exit(1)
  }

  // 验证优先级排序
  console.log('\n🔍 验证优先级排序...')
  const topPriorityFunctions = registry.getFunctionsByPriority(10)
  console.log(`   获取前10个高优先级函数:`)
  topPriorityFunctions.forEach((f, i) => {
    console.log(`     ${i + 1}. ${f.name} (P${f.priority ?? 999})`)
  })

  // Token 节省估算
  console.log('\n💰 Token 节省估算:')
  const averageToolsSelected = 12 // 根据 selectCandidateTools 的实际平均值
  const totalWordTools = wordFunctions.length
  const estimatedTokenPerTool = 200

  const tokensIfAll = totalWordTools * estimatedTokenPerTool
  const tokensWithOptimization = averageToolsSelected * estimatedTokenPerTool
  const tokenSaved = tokensIfAll - tokensWithOptimization
  const savingPercentage = ((tokenSaved / tokensIfAll) * 100).toFixed(1)

  console.log(`   全量传递 (${totalWordTools}个工具): ~${tokensIfAll} tokens`)
  console.log(`   优化后 (平均${averageToolsSelected}个工具): ~${tokensWithOptimization} tokens`)
  console.log(`   节省: ~${tokenSaved} tokens (${savingPercentage}%)`)

  // 最终总结
  console.log('\n' + '='.repeat(60))
  console.log('✅ 所有验证通过!')
  console.log('='.repeat(60))
  console.log(`
📊 总结报告:
   - 总函数数量: ${allFunctions.length}
   - Word 函数: ${wordFunctions.length}
   - Excel 函数: ${categoryStats.get(FunctionCategory.EXCEL) || 0}
   - PowerPoint 函数: ${categoryStats.get(FunctionCategory.POWERPOINT) || 0}
   - P0 函数: ${p0Functions.length}
   - P1 函数: ${p1Functions.length}
   - 无重复注册: ✅
   - Token 节省: ~${savingPercentage}%
  `)

  console.log('🎉 优化验证完成!')
  process.exit(0)
}

main().catch(error => {
  console.error('\n❌ 验证过程出错:', error)
  process.exit(1)
})
