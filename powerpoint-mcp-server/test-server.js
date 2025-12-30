#!/usr/bin/env node
/**
 * 测试脚本：验证 PowerPoint MCP Server 能否正常启动并列出工具
 */

import { spawn } from 'child_process'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

console.log('🧪 测试 PowerPoint MCP Server...\n')

// 启动服务器
const serverPath = join(__dirname, 'dist', 'server.js')
const server = spawn('node', [serverPath], {
  env: { ...process.env, NODE_ENV: 'development' }
})

let output = ''
let hasStarted = false
let toolCount = 0

// 监听标准输出
server.stdout.on('data', (data) => {
  const text = data.toString()
  output += text
  console.log('📤 服务器输出:', text.trim())

  // 检查是否启动成功
  if (text.includes('PowerPoint MCP Server 已启动')) {
    hasStarted = true
  }

  // 提取工具数量
  const match = text.match(/可用工具:\s*(\d+)\s*个/)
  if (match) {
    toolCount = parseInt(match[1])
  }
})

// 监听标准错误（logger 输出到 stderr）
server.stderr.on('data', (data) => {
  const text = data.toString()
  output += text
  console.log('📤 服务器日志:', text.trim())

  // 检查是否启动成功
  if (text.includes('PowerPoint MCP Server 已启动')) {
    hasStarted = true
  }

  // 提取工具数量
  const match = text.match(/可用工具:\s*(\d+)\s*个/)
  if (match) {
    toolCount = parseInt(match[1])
  }
})

// 监听进程退出
server.on('close', (code) => {
  console.log(`\n服务器进程退出，代码: ${code}`)
})

// 3秒后检查结果并退出
setTimeout(() => {
  console.log('\n' + '='.repeat(50))
  console.log('📊 测试结果:')
  console.log('='.repeat(50))

  if (hasStarted) {
    console.log('✅ 服务器启动成功')
  } else {
    console.log('❌ 服务器未能启动')
  }

  if (toolCount > 0) {
    console.log(`✅ 工具列表加载成功: ${toolCount} 个工具`)
  } else {
    console.log('❌ 未检测到工具')
  }

  console.log('='.repeat(50))

  // 终止服务器进程
  server.kill()

  // 退出测试脚本
  process.exit(hasStarted && toolCount > 0 ? 0 : 1)
}, 3000)
