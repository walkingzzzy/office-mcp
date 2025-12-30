/**
 * Vitest 配置文件
 */

import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/types/'
      ]
    },
    include: ['src/**/*.{test,spec}.ts'],
    exclude: ['node_modules', 'dist']
  }
})
