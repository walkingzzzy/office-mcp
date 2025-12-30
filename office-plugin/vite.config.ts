import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react-swc'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { defineConfig, type Plugin } from 'vite'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// 自定义插件：提供 Office.js 及其所有依赖文件
function copyOfficeJs(): Plugin {
  const officeJsDistPath = path.resolve(__dirname, 'node_modules/@microsoft/office-js/dist')

  // 递归复制目录
  function copyRecursiveSync(src: string, dest: string) {
    const exists = fs.existsSync(src)
    const stats = exists && fs.statSync(src)
    const isDirectory = exists && stats && stats.isDirectory()

    if (isDirectory) {
      if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true })
      }
      fs.readdirSync(src).forEach((childItemName) => {
        copyRecursiveSync(path.join(src, childItemName), path.join(dest, childItemName))
      })
    } else {
      fs.copyFileSync(src, dest)
    }
  }

  return {
    name: 'copy-office-js',
    // 在构建开始时复制 Office.js 文件
    buildStart() {
      const dest = path.resolve(__dirname, 'dist/libs')
      copyRecursiveSync(officeJsDistPath, dest)
      console.log('Copied Office.js dist directory to dist/libs/')
    },
    // 确保在构建结束时也复制一次（以防清理）
    closeBundle() {
      const dest = path.resolve(__dirname, 'dist/libs')
      copyRecursiveSync(officeJsDistPath, dest)
      console.log('Copied Office.js dist directory to dist/libs/')
    },
    // 在开发服务器中提供所有 Office.js 文件
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        // 匹配 /libs/* 路径
        if (req.url?.startsWith('/libs/')) {
          const relativePath = req.url.substring('/libs/'.length).split('?')[0]
          const filePath = path.join(officeJsDistPath, relativePath)

          // 检查文件是否存在
          if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
            // 设置正确的 Content-Type
            const ext = path.extname(filePath)
            const contentType = ext === '.js' ? 'application/javascript' : ext === '.css' ? 'text/css' : 'text/plain'
            res.setHeader('Content-Type', contentType)
            fs.createReadStream(filePath).pipe(res)
            return
          }
        }
        next()
      })
    }
  }
}

// HTTPS 证书路径 (使用 office-addin-dev-certs 生成)
const certPath = path.join(process.env.HOME || process.env.USERPROFILE || '', '.office-addin-dev-certs')
const keyPath = path.join(certPath, 'localhost.key')
const certFilePath = path.join(certPath, 'localhost.crt')

// 检查证书是否存在
const httpsConfig =
  fs.existsSync(keyPath) && fs.existsSync(certFilePath)
    ? {
        key: fs.readFileSync(keyPath),
        cert: fs.readFileSync(certFilePath)
      }
    : undefined

if (!httpsConfig) {
  console.warn('HTTPS certificates not found, please run: yarn cert:install')
  console.warn('   Office plugin requires HTTPS to work properly')
}

export default defineConfig({
  plugins: [react(), tailwindcss(), copyOfficeJs()],
  root: 'src',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        taskpane: path.resolve(__dirname, 'src/taskpane/index.html'),
        commands: path.resolve(__dirname, 'src/commands.html')
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: '[name].js',
        assetFileNames: '[name].[ext]'
      },
      external: ['/libs/office.js']
    }
  },
  // 禁用 rolldown 以避免 Rust panic
  experimental: {
    renderBuiltUrl: undefined
  },
  server: {
    port: parseInt(process.env.OFFICE_PLUGIN_PORT || '3000', 10),
    https: httpsConfig,
    open: false,
    cors: true,
    host: '0.0.0.0',
    fs: {
      // 允许 Vite 访问 node_modules 中的 office.js
      allow: ['..']
    },
    // 代理 API 请求到桥接服务（解决 HTTPS -> HTTP 混合内容问题）
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false
      },
      '/health': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false
      }
    }
  },
  // 配置 public 目录别名，用于开发模式
  publicDir: false, // 禁用默认 public 目录，使用插件复制
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@shared': path.resolve(__dirname, '../shared')
    }
  },
  optimizeDeps: {
    include: ['react', 'react-dom', '@fluentui/react-components', '@fluentui/react-icons']
  },
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/setup-excel.ts'],
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'tests/', '**/*.test.ts', '**/*.test.tsx', 'dist/']
    }
  }
})
