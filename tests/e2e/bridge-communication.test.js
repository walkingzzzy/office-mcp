/**
 * 端到端通信测试脚本
 * 测试 Office Add-in → Bridge Server → MCP Server 完整链路
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

// 配置
const BRIDGE_SERVER_URL = 'http://localhost:3001';
const TEST_RESULTS_DIR = path.join(__dirname, '../results');

// 确保结果目录存在
if (!fs.existsSync(TEST_RESULTS_DIR)) {
  fs.mkdirSync(TEST_RESULTS_DIR, { recursive: true });
}

// 测试结果
const testResults = {
  totalTests: 0,
  passedTests: 0,
  failedTests: 0,
  tests: [],
  startTime: null,
  endTime: null,
  duration: 0,
};

/**
 * 延迟函数
 */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 执行测试用例
 */
async function runTest(name, testFn) {
  testResults.totalTests++;
  const startTime = Date.now();

  try {
    console.log(`\n[测试] ${name}`);
    await testFn();
    const duration = Date.now() - startTime;

    testResults.passedTests++;
    testResults.tests.push({
      name,
      status: 'passed',
      duration,
    });

    console.log(`  ✅ 通过 (${duration}ms)`);
    return true;
  } catch (error) {
    const duration = Date.now() - startTime;

    testResults.failedTests++;
    testResults.tests.push({
      name,
      status: 'failed',
      duration,
      error: error.message,
    });

    console.log(`  ❌ 失败: ${error.message} (${duration}ms)`);
    return false;
  }
}

/**
 * 测试1: 健康检查
 */
async function testHealthCheck() {
  const response = await axios.get(`${BRIDGE_SERVER_URL}/api/health`);

  if (response.status !== 200) {
    throw new Error(`期望状态码200,实际${response.status}`);
  }

  if (!response.data.success) {
    throw new Error('健康检查失败');
  }

  if (response.data.data.mcpServer !== 'connected') {
    throw new Error('MCP服务器未连接');
  }
}

/**
 * 测试2: 获取服务器信息
 */
async function testGetServerInfo() {
  const response = await axios.get(`${BRIDGE_SERVER_URL}/api/server/info`);

  if (response.status !== 200) {
    throw new Error(`期望状态码200,实际${response.status}`);
  }

  if (!response.data.success) {
    throw new Error('获取服务器信息失败');
  }

  if (!response.data.data.name) {
    throw new Error('服务器信息缺少name字段');
  }
}

/**
 * 测试3: 获取工具列表
 */
async function testListTools() {
  const response = await axios.get(`${BRIDGE_SERVER_URL}/api/tools/list`);

  if (response.status !== 200) {
    throw new Error(`期望状态码200,实际${response.status}`);
  }

  if (!response.data.success) {
    throw new Error('获取工具列表失败');
  }

  if (!Array.isArray(response.data.data.tools)) {
    throw new Error('工具列表不是数组');
  }

  if (response.data.data.tools.length === 0) {
    throw new Error('工具列表为空');
  }

  console.log(`  📋 找到 ${response.data.data.tools.length} 个工具`);
}

/**
 * 测试4: 调用MCP工具
 */
async function testCallTool() {
  const response = await axios.post(`${BRIDGE_SERVER_URL}/api/tools/call`, {
    tool: 'get_server_info',
    parameters: {},
  });

  if (response.status !== 200) {
    throw new Error(`期望状态码200,实际${response.status}`);
  }

  if (!response.data.success) {
    throw new Error(`工具调用失败: ${response.data.error}`);
  }
}

/**
 * 测试5: 响应时间测试
 */
async function testResponseTime() {
  const iterations = 10;
  const times = [];

  for (let i = 0; i < iterations; i++) {
    const start = Date.now();
    await axios.get(`${BRIDGE_SERVER_URL}/api/health`);
    const duration = Date.now() - start;
    times.push(duration);
  }

  const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
  const maxTime = Math.max(...times);
  const minTime = Math.min(...times);

  console.log(`  ⏱️  平均响应时间: ${avgTime.toFixed(2)}ms`);
  console.log(`  ⏱️  最大响应时间: ${maxTime}ms`);
  console.log(`  ⏱️  最小响应时间: ${minTime}ms`);

  if (avgTime > 1000) {
    throw new Error(`平均响应时间过长: ${avgTime.toFixed(2)}ms`);
  }
}

/**
 * 测试6: 错误处理
 */
async function testErrorHandling() {
  try {
    await axios.post(`${BRIDGE_SERVER_URL}/api/tools/call`, {
      parameters: {}, // 缺少tool参数
    });
    throw new Error('应该返回错误');
  } catch (error) {
    if (error.response && error.response.status === 400) {
      // 正确的错误响应
      return;
    }
    throw new Error(`期望400错误,实际: ${error.message}`);
  }
}

/**
 * 测试7: 404处理
 */
async function test404Handling() {
  try {
    await axios.get(`${BRIDGE_SERVER_URL}/api/nonexistent`);
    throw new Error('应该返回404');
  } catch (error) {
    if (error.response && error.response.status === 404) {
      // 正确的404响应
      return;
    }
    throw new Error(`期望404错误,实际: ${error.message}`);
  }
}

/**
 * 主测试流程
 */
async function main() {
  console.log('='.repeat(60));
  console.log('端到端通信测试');
  console.log('='.repeat(60));
  console.log(`Bridge Server: ${BRIDGE_SERVER_URL}`);
  console.log(`开始时间: ${new Date().toLocaleString()}`);

  testResults.startTime = Date.now();

  // 等待服务器启动
  console.log('\n等待Bridge Server启动...');
  let retries = 10;
  while (retries > 0) {
    try {
      await axios.get(`${BRIDGE_SERVER_URL}/api/health`, { timeout: 1000 });
      console.log('✅ Bridge Server已就绪');
      break;
    } catch (error) {
      retries--;
      if (retries === 0) {
        console.error('❌ 无法连接到Bridge Server');
        process.exit(1);
      }
      await delay(2000);
    }
  }

  // 执行测试
  console.log('\n开始测试...');

  await runTest('健康检查', testHealthCheck);
  await runTest('获取服务器信息', testGetServerInfo);
  await runTest('获取工具列表', testListTools);
  await runTest('调用MCP工具', testCallTool);
  await runTest('响应时间测试', testResponseTime);
  await runTest('错误处理', testErrorHandling);
  await runTest('404处理', test404Handling);

  // 生成报告
  testResults.endTime = Date.now();
  testResults.duration = testResults.endTime - testResults.startTime;

  console.log('\n' + '='.repeat(60));
  console.log('测试结果汇总');
  console.log('='.repeat(60));
  console.log(`总测试数: ${testResults.totalTests}`);
  console.log(`通过: ${testResults.passedTests}`);
  console.log(`失败: ${testResults.failedTests}`);
  console.log(`成功率: ${((testResults.passedTests / testResults.totalTests) * 100).toFixed(2)}%`);
  console.log(`总耗时: ${testResults.duration}ms`);
  console.log(`结束时间: ${new Date().toLocaleString()}`);

  // 保存结果
  const reportPath = path.join(TEST_RESULTS_DIR, `e2e-test-${Date.now()}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(testResults, null, 2));
  console.log(`\n测试报告已保存: ${reportPath}`);

  // 退出
  process.exit(testResults.failedTests > 0 ? 1 : 0);
}

// 运行测试
main().catch((error) => {
  console.error('测试执行失败:', error);
  process.exit(1);
});
