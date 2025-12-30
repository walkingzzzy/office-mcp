import { FluentProvider, webLightTheme } from '@fluentui/react-components'
import { fireEvent,render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { MessageInput } from './MessageInput'

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <FluentProvider theme={webLightTheme}>{children}</FluentProvider>
)

describe('MessageInput', () => {
  it('renders correctly', () => {
    render(
      <TestWrapper>
        <MessageInput value="" onChange={vi.fn()} onSubmit={vi.fn()} />
      </TestWrapper>
    )
    expect(screen.getByPlaceholderText('输入消息...')).toBeInTheDocument()
  })

  it('handles input change', () => {
    const handleChange = vi.fn()
    render(
      <TestWrapper>
        <MessageInput value="" onChange={handleChange} onSubmit={vi.fn()} />
      </TestWrapper>
    )

    const textarea = screen.getByPlaceholderText('输入消息...')
    fireEvent.change(textarea, { target: { value: 'Hello' } })
    expect(handleChange).toHaveBeenCalledWith('Hello')
  })

  it('handles Enter key to submit', () => {
    const handleSubmit = vi.fn()
    render(
      <TestWrapper>
        <MessageInput value="Test message" onChange={vi.fn()} onSubmit={handleSubmit} />
      </TestWrapper>
    )

    const textarea = screen.getByPlaceholderText('输入消息...')
    fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: false })
    expect(handleSubmit).toHaveBeenCalled()
  })

  it('does not submit on Shift+Enter', () => {
    const handleSubmit = vi.fn()
    render(
      <TestWrapper>
        <MessageInput value="Test message" onChange={vi.fn()} onSubmit={handleSubmit} />
      </TestWrapper>
    )

    const textarea = screen.getByPlaceholderText('输入消息...')
    fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: true })
    expect(handleSubmit).not.toHaveBeenCalled()
  })

  it('disables correctly', () => {
    render(
      <TestWrapper>
        <MessageInput value="" onChange={vi.fn()} onSubmit={vi.fn()} disabled />
      </TestWrapper>
    )
    expect(screen.getByPlaceholderText('输入消息...')).toBeDisabled()
  })

  it('uses custom placeholder', () => {
    render(
      <TestWrapper>
        <MessageInput
          value=""
          onChange={vi.fn()}
          onSubmit={vi.fn()}
          placeholder="Type here..."
        />
      </TestWrapper>
    )
    expect(screen.getByPlaceholderText('Type here...')).toBeInTheDocument()
  })
})
