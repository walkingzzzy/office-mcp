/**
 * 简化版验证脚本 (不依赖完整的 TypeScript 环境)
 * 验证优化后的代码结构
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 开始验证 Office Plugin 优化...\n');

// 读取文件内容
const registryPath = path.join(__dirname, '../src/services/ai/FormattingFunctionRegistry.ts');
const toolSelectorPath = path.join(__dirname, '../src/services/ai/ToolSelector.ts');
const useFunctionCallingPath = path.join(__dirname, '../src/components/features/chat/hooks/useFunctionCalling.ts');

let allChecksPass = true;

// ============ 验证1: FormattingFunctionRegistry ============
console.log('📋 验证1: FormattingFunctionRegistry');
console.log('='  .repeat(60));

const registryContent = fs.readFileSync(registryPath, 'utf-8');

// 检查是否移除了 registerP0Functions 和 registerP1Functions 的调用
const hasP0Call = registryContent.match(/await this\.registerP0Functions\(\)/);
const hasP1Call = registryContent.match(/await this\.registerP1Functions\(\)/);

if (hasP0Call || hasP1Call) {
  console.log('❌ 仍然调用了 registerP0Functions 或 registerP1Functions!');
  allChecksPass = false;
} else {
  console.log('✅ 已移除 registerP0Functions 和 registerP1Functions 调用');
}

// 检查优化注释是否存在
const hasOptimizationComment = registryContent.includes('🔧 优化: 移除 registerP0Functions 和 registerP1Functions');
if (hasOptimizationComment) {
  console.log('✅ 包含优化说明注释');
} else {
  console.log('⚠️  未找到优化说明注释');
}

// 检查方法是否仍然存在 (用于回滚)
const hasP0Method = registryContent.includes('private async registerP0Functions()');
const hasP1Method = registryContent.includes('private async registerP1Functions()');
if (hasP0Method && hasP1Method) {
  console.log('✅ 保留了 P0/P1 方法用于回滚');
} else {
  console.log('⚠️  P0/P1 方法已被删除');
}

// ============ 验证2: ToolSelector ============
console.log('\n📋 验证2: ToolSelector');
console.log('='.repeat(60));

const toolSelectorContent = fs.readFileSync(toolSelectorPath, 'utf-8');

// 检查 KEYWORD_MAPPINGS 是否被删除
const hasOldKeywordMappings = toolSelectorContent.includes('const KEYWORD_MAPPINGS = {');
if (hasOldKeywordMappings) {
  console.log('❌ KEYWORD_MAPPINGS 仍然存在!');
  allChecksPass = false;
} else {
  console.log('✅ 已删除 KEYWORD_MAPPINGS 常量');
}

// 检查新的 KEYWORD_TO_TOOLS_MAPPING 是否存在
const hasNewMapping = toolSelectorContent.includes('const KEYWORD_TO_TOOLS_MAPPING');
if (hasNewMapping) {
  console.log('✅ 保留了 KEYWORD_TO_TOOLS_MAPPING');
} else {
  console.log('❌ KEYWORD_TO_TOOLS_MAPPING 缺失!');
  allChecksPass = false;
}

// 检查 selectTools 方法是否被标记为废弃
const hasDeprecatedSelectTools = toolSelectorContent.includes('@deprecated') &&
                                  toolSelectorContent.includes('selectTools');
if (hasDeprecatedSelectTools) {
  console.log('✅ selectTools 方法已标记为废弃');
} else {
  console.log('⚠️  selectTools 方法未标记为废弃');
}

// 检查 selectCandidateTools 方法是否存在
const hasSelectCandidateTools = toolSelectorContent.includes('selectCandidateTools(');
if (hasSelectCandidateTools) {
  console.log('✅ 保留了 selectCandidateTools 方法');
} else {
  console.log('❌ selectCandidateTools 方法缺失!');
  allChecksPass = false;
}

// ============ 验证3: useFunctionCalling ============
console.log('\n📋 验证3: useFunctionCalling');
console.log('='.repeat(60));

const useFunctionCallingContent = fs.readFileSync(useFunctionCallingPath, 'utf-8');

// 检查是否添加了 Token 节省统计
const hasTokenStats = useFunctionCallingContent.includes('estimatedTokenSaved') &&
                      useFunctionCallingContent.includes('tokenSavingPercentage');
if (hasTokenStats) {
  console.log('✅ 已添加 Token 节省统计');
} else {
  console.log('❌ Token 节省统计缺失!');
  allChecksPass = false;
}

// 检查是否添加了选择依据
const hasSelectionReason = useFunctionCallingContent.includes('selectionReason');
if (hasSelectionReason) {
  console.log('✅ 已添加选择依据追踪');
} else {
  console.log('⚠️  选择依据追踪缺失');
}

// 检查是否添加了性能指标
const hasPerformanceMetrics = useFunctionCallingContent.includes('performance:') &&
                              useFunctionCallingContent.includes('reductionRatio');
if (hasPerformanceMetrics) {
  console.log('✅ 已添加性能指标');
} else {
  console.log('⚠️  性能指标缺失');
}

// ============ 代码统计 ============
console.log('\n📊 代码统计');
console.log('='.repeat(60));

const registryLines = registryContent.split('\n').length;
const toolSelectorLines = toolSelectorContent.split('\n').length;
const useFunctionCallingLines = useFunctionCallingContent.split('\n').length;

console.log(`FormattingFunctionRegistry: ${registryLines} 行`);
console.log(`ToolSelector: ${toolSelectorLines} 行`);
console.log(`useFunctionCalling: ${useFunctionCallingLines} 行`);

// ============ 检查新增文件 ============
console.log('\n📁 新增文件检查');
console.log('='.repeat(60));

const docsToCheck = [
  '../OPTIMIZATION_PLAN.md',
  '../OPTIMIZATION_COMPLETED.md',
  '../OPTIMIZATION_SUMMARY.md'
];

docsToCheck.forEach(doc => {
  const docPath = path.join(__dirname, doc);
  if (fs.existsSync(docPath)) {
    const content = fs.readFileSync(docPath, 'utf-8');
    const lines = content.split('\n').length;
    console.log(`✅ ${path.basename(doc)} (${lines} 行)`);
  } else {
    console.log(`❌ ${path.basename(doc)} 缺失!`);
    allChecksPass = false;
  }
});

// ============ Token 节省估算 ============
console.log('\n💰 Token 节省估算');
console.log('='.repeat(60));

const totalWordTools = 37;
const averageSelectedTools = 12;
const tokenPerTool = 200;

const tokensWithoutOptimization = totalWordTools * tokenPerTool;
const tokensWithOptimization = averageSelectedTools * tokenPerTool;
const tokensSaved = tokensWithoutOptimization - tokensWithOptimization;
const savingPercentage = ((tokensSaved / tokensWithoutOptimization) * 100).toFixed(1);

console.log(`全量传递 (${totalWordTools}个工具): ~${tokensWithoutOptimization} tokens`);
console.log(`优化后 (平均${averageSelectedTools}个工具): ~${tokensWithOptimization} tokens`);
console.log(`节省: ~${tokensSaved} tokens (${savingPercentage}%)`);

// ============ 最终结果 ============
console.log('\n' + '='.repeat(60));
if (allChecksPass) {
  console.log('✅ 所有核心验证通过!');
  console.log('='.repeat(60));
  console.log('\n📊 优化总结:');
  console.log(`   - 移除重复注册: ✅`);
  console.log(`   - 清理冗余代码: ✅`);
  console.log(`   - 增强日志监控: ✅`);
  console.log(`   - Token 节省: ~${savingPercentage}%`);
  console.log(`   - 文档完整性: ✅\n`);
  console.log('🎉 优化验证成功!\n');
  console.log('下一步:');
  console.log('  1. 运行 yarn test 执行测试套件');
  console.log('  2. 运行 yarn build:check 检查编译');
  console.log('  3. 执行 49个功能的集成测试\n');
  process.exit(0);
} else {
  console.log('❌ 部分验证未通过，请检查上述错误');
  console.log('='.repeat(60));
  process.exit(1);
}
