import { FluentProvider, webLightTheme } from '@fluentui/react-components'
import { render, screen } from '@testing-library/react'
import { describe, expect,it } from 'vitest'

import { Spinner } from './Spinner'

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <FluentProvider theme={webLightTheme}>{children}</FluentProvider>
)

describe('Spinner', () => {
  it('renders correctly', () => {
    render(
      <TestWrapper>
        <Spinner />
      </TestWrapper>
    )
    expect(screen.getByRole('progressbar')).toBeInTheDocument()
  })

  it('displays label when provided', () => {
    render(
      <TestWrapper>
        <Spinner label="Loading..." />
      </TestWrapper>
    )
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('applies size prop correctly', () => {
    const { rerender } = render(
      <TestWrapper>
        <Spinner size="tiny" />
      </TestWrapper>
    )
    expect(screen.getByRole('progressbar')).toBeInTheDocument()

    rerender(
      <TestWrapper>
        <Spinner size="extra-large" />
      </TestWrapper>
    )
    expect(screen.getByRole('progressbar')).toBeInTheDocument()
  })
})
