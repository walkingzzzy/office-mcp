/**
 * 性能基准测试脚本
 * 测试Bridge Server的延迟和吞吐量
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
const benchmarkResults = {
  tests: [],
  startTime: null,
  endTime: null,
  timestamp: new Date().toISOString(),
};

/**
 * 延迟函数
 */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 统计分析
 */
function calculateStats(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const sum = values.reduce((a, b) => a + b, 0);

  return {
    count: values.length,
    min: Math.min(...values),
    max: Math.max(...values),
    mean: sum / values.length,
    median: sorted[Math.floor(sorted.length / 2)],
    p50: sorted[Math.floor(sorted.length * 0.5)],
    p90: sorted[Math.floor(sorted.length * 0.9)],
    p95: sorted[Math.floor(sorted.length * 0.95)],
    p99: sorted[Math.floor(sorted.length * 0.99)],
  };
}

/**
 * 测试1: 健康检查延迟测试
 */
async function testHealthCheckLatency() {
  console.log('\n[测试] 健康检查延迟测试 (100次请求)');

  const times = [];
  const iterations = 100;

  for (let i = 0; i < iterations; i++) {
    const start = Date.now();
    try {
      await axios.get(`${BRIDGE_SERVER_URL}/api/health`, { timeout: 5000 });
      const duration = Date.now() - start;
      times.push(duration);
    } catch (error) {
      console.error(`  请求失败 [${i + 1}]: ${error.message}`);
    }

    // 进度提示
    if ((i + 1) % 20 === 0) {
      process.stdout.write(`  进度: ${i + 1}/${iterations}\r`);
    }
  }

  const stats = calculateStats(times);

  console.log('\n  结果:');
  console.log(`    请求数: ${stats.count}`);
  console.log(`    平均延迟: ${stats.mean.toFixed(2)}ms`);
  console.log(`    中位延迟: ${stats.median.toFixed(2)}ms`);
  console.log(`    最小延迟: ${stats.min}ms`);
  console.log(`    最大延迟: ${stats.max}ms`);
  console.log(`    P50: ${stats.p50.toFixed(2)}ms`);
  console.log(`    P90: ${stats.p90.toFixed(2)}ms`);
  console.log(`    P95: ${stats.p95.toFixed(2)}ms`);
  console.log(`    P99: ${stats.p99.toFixed(2)}ms`);

  benchmarkResults.tests.push({
    name: '健康检查延迟测试',
    iterations,
    stats,
  });

  return stats;
}

/**
 * 测试2: 工具调用延迟测试
 */
async function testToolCallLatency() {
  console.log('\n[测试] 工具调用延迟测试 (50次请求)');

  const times = [];
  const iterations = 50;

  for (let i = 0; i < iterations; i++) {
    const start = Date.now();
    try {
      await axios.post(
        `${BRIDGE_SERVER_URL}/api/tools/call`,
        {
          tool: 'get_server_info',
          parameters: {},
        },
        { timeout: 10000 }
      );
      const duration = Date.now() - start;
      times.push(duration);
    } catch (error) {
      console.error(`  请求失败 [${i + 1}]: ${error.message}`);
    }

    // 进度提示
    if ((i + 1) % 10 === 0) {
      process.stdout.write(`  进度: ${i + 1}/${iterations}\r`);
    }
  }

  const stats = calculateStats(times);

  console.log('\n  结果:');
  console.log(`    请求数: ${stats.count}`);
  console.log(`    平均延迟: ${stats.mean.toFixed(2)}ms`);
  console.log(`    中位延迟: ${stats.median.toFixed(2)}ms`);
  console.log(`    最小延迟: ${stats.min}ms`);
  console.log(`    最大延迟: ${stats.max}ms`);
  console.log(`    P95: ${stats.p95.toFixed(2)}ms`);
  console.log(`    P99: ${stats.p99.toFixed(2)}ms`);

  benchmarkResults.tests.push({
    name: '工具调用延迟测试',
    iterations,
    stats,
  });

  return stats;
}

/**
 * 测试3: 并发性能测试
 */
async function testConcurrentRequests() {
  console.log('\n[测试] 并发性能测试 (10个并发,每个10次请求)');

  const concurrency = 10;
  const requestsPerClient = 10;
  const allTimes = [];

  const startTime = Date.now();

  const clients = Array.from({ length: concurrency }, (_, i) =>
    (async () => {
      const times = [];
      for (let j = 0; j < requestsPerClient; j++) {
        const reqStart = Date.now();
        try {
          await axios.get(`${BRIDGE_SERVER_URL}/api/health`, { timeout: 5000 });
          times.push(Date.now() - reqStart);
        } catch (error) {
          console.error(`  客户端${i + 1}请求失败: ${error.message}`);
        }
      }
      return times;
    })()
  );

  const results = await Promise.all(clients);
  results.forEach(times => allTimes.push(...times));

  const totalTime = Date.now() - startTime;
  const stats = calculateStats(allTimes);
  const throughput = (allTimes.length / totalTime) * 1000; // 请求/秒

  console.log('\n  结果:');
  console.log(`    总请求数: ${allTimes.length}`);
  console.log(`    总耗时: ${totalTime}ms`);
  console.log(`    吞吐量: ${throughput.toFixed(2)} req/s`);
  console.log(`    平均延迟: ${stats.mean.toFixed(2)}ms`);
  console.log(`    P95延迟: ${stats.p95.toFixed(2)}ms`);
  console.log(`    P99延迟: ${stats.p99.toFixed(2)}ms`);

  benchmarkResults.tests.push({
    name: '并发性能测试',
    concurrency,
    requestsPerClient,
    totalRequests: allTimes.length,
    totalTime,
    throughput,
    stats,
  });

  return { throughput, stats };
}

/**
 * 测试4: 压力测试
 */
async function testStressTest() {
  console.log('\n[测试] 压力测试 (持续30秒,尽可能多的请求)');

  const duration = 30000; // 30秒
  const startTime = Date.now();
  let successCount = 0;
  let errorCount = 0;
  const times = [];

  while (Date.now() - startTime < duration) {
    const reqStart = Date.now();
    try {
      await axios.get(`${BRIDGE_SERVER_URL}/api/health`, { timeout: 5000 });
      times.push(Date.now() - reqStart);
      successCount++;
    } catch (error) {
      errorCount++;
    }

    // 进度提示
    const elapsed = Date.now() - startTime;
    if (elapsed % 5000 < 100) {
      process.stdout.write(`  进度: ${Math.floor(elapsed / 1000)}s / 30s\r`);
    }
  }

  const totalTime = Date.now() - startTime;
  const stats = calculateStats(times);
  const throughput = (successCount / totalTime) * 1000; // 请求/秒

  console.log('\n  结果:');
  console.log(`    总请求数: ${successCount + errorCount}`);
  console.log(`    成功请求: ${successCount}`);
  console.log(`    失败请求: ${errorCount}`);
  console.log(`    成功率: ${((successCount / (successCount + errorCount)) * 100).toFixed(2)}%`);
  console.log(`    总耗时: ${totalTime}ms`);
  console.log(`    吞吐量: ${throughput.toFixed(2)} req/s`);
  console.log(`    平均延迟: ${stats.mean.toFixed(2)}ms`);
  console.log(`    P99延迟: ${stats.p99.toFixed(2)}ms`);

  benchmarkResults.tests.push({
    name: '压力测试',
    duration,
    totalRequests: successCount + errorCount,
    successCount,
    errorCount,
    throughput,
    stats,
  });

  return { throughput, stats };
}

/**
 * 主测试流程
 */
async function main() {
  console.log('='.repeat(60));
  console.log('性能基准测试');
  console.log('='.repeat(60));
  console.log(`Bridge Server: ${BRIDGE_SERVER_URL}`);
  console.log(`开始时间: ${new Date().toLocaleString()}`);

  benchmarkResults.startTime = Date.now();

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
  console.log('\n开始性能测试...');

  await testHealthCheckLatency();
  await delay(1000);

  await testToolCallLatency();
  await delay(1000);

  await testConcurrentRequests();
  await delay(1000);

  await testStressTest();

  // 生成报告
  benchmarkResults.endTime = Date.now();
  benchmarkResults.duration = benchmarkResults.endTime - benchmarkResults.startTime;

  console.log('\n' + '='.repeat(60));
  console.log('性能测试汇总');
  console.log('='.repeat(60));
  console.log(`总测试数: ${benchmarkResults.tests.length}`);
  console.log(`总耗时: ${(benchmarkResults.duration / 1000).toFixed(2)}s`);
  console.log(`结束时间: ${new Date().toLocaleString()}`);

  // 保存结果
  const reportPath = path.join(TEST_RESULTS_DIR, `benchmark-${Date.now()}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(benchmarkResults, null, 2));
  console.log(`\n性能测试报告已保存: ${reportPath}`);

  console.log('\n完成! ✅');
  process.exit(0);
}

// 运行测试
main().catch((error) => {
  console.error('性能测试失败:', error);
  process.exit(1);
});
