/**
 * Fluent UI React 重构演示页面
 * 展示所有新组件
 */

import { AppProviders } from '../app/providers/AppProviders'
import { ChatInterface } from '../components/features/chat/ChatInterface'

export function FluentDemo() {
  return (
    <AppProviders>
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
        <ChatInterface />
      </div>
    </AppProviders>
  )
}

export default FluentDemo
