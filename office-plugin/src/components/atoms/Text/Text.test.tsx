import { FluentProvider, webLightTheme } from '@fluentui/react-components'
import { render, screen } from '@testing-library/react'
import { describe, expect,it } from 'vitest'

import { Text } from './Text'

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <FluentProvider theme={webLightTheme}>{children}</FluentProvider>
)

describe('Text', () => {
  it('renders correctly', () => {
    render(
      <TestWrapper>
        <Text>Hello World</Text>
      </TestWrapper>
    )
    expect(screen.getByText('Hello World')).toBeInTheDocument()
  })

  it('applies size prop correctly', () => {
    render(
      <TestWrapper>
        <Text size={500}>Large Text</Text>
      </TestWrapper>
    )
    expect(screen.getByText('Large Text')).toBeInTheDocument()
  })

  it('applies weight prop correctly', () => {
    render(
      <TestWrapper>
        <Text weight="bold">Bold Text</Text>
      </TestWrapper>
    )
    expect(screen.getByText('Bold Text')).toBeInTheDocument()
  })

  it('applies italic prop correctly', () => {
    render(
      <TestWrapper>
        <Text italic>Italic Text</Text>
      </TestWrapper>
    )
    expect(screen.getByText('Italic Text')).toBeInTheDocument()
  })
})
