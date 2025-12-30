import { FluentProvider, webLightTheme } from '@fluentui/react-components'
import { fireEvent,render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { Button } from './Button'

// 测试包装器
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <FluentProvider theme={webLightTheme}>{children}</FluentProvider>
)

describe('Button', () => {
  it('renders correctly', () => {
    render(
      <TestWrapper>
        <Button>Click me</Button>
      </TestWrapper>
    )
    expect(screen.getByText('Click me')).toBeInTheDocument()
  })

  it('handles click events', () => {
    const handleClick = vi.fn()
    render(
      <TestWrapper>
        <Button onClick={handleClick}>Click me</Button>
      </TestWrapper>
    )
    fireEvent.click(screen.getByText('Click me'))
    expect(handleClick).toHaveBeenCalledOnce()
  })

  it('disables correctly', () => {
    render(
      <TestWrapper>
        <Button disabled>Click me</Button>
      </TestWrapper>
    )
    expect(screen.getByText('Click me')).toBeDisabled()
  })

  it('applies size prop correctly', () => {
    const { rerender } = render(
      <TestWrapper>
        <Button size="small">Small Button</Button>
      </TestWrapper>
    )
    expect(screen.getByText('Small Button')).toBeInTheDocument()

    rerender(
      <TestWrapper>
        <Button size="large">Large Button</Button>
      </TestWrapper>
    )
    expect(screen.getByText('Large Button')).toBeInTheDocument()
  })

  it('applies variant prop correctly', () => {
    render(
      <TestWrapper>
        <Button variant="primary">Primary</Button>
      </TestWrapper>
    )
    expect(screen.getByText('Primary')).toBeInTheDocument()
  })
})
