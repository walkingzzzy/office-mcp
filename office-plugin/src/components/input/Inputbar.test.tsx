import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'

import { Inputbar, type InputbarProps, DEFAULT_WEB_SEARCH_PROVIDERS } from './Inputbar'

async function dropdownMockFactory() {
  const React = await import('react')
  return {
    DropdownMenu: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
    DropdownMenuTrigger: ({ children }: React.PropsWithChildren) => <>{children}</>,
    DropdownMenuContent: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
    DropdownMenuLabel: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
    DropdownMenuSeparator: () => <hr />,
    DropdownMenuCheckboxItem: ({
      children,
      onCheckedChange,
      checked,
      ...rest
    }: React.PropsWithChildren<{ onCheckedChange?: (next: boolean) => void; checked?: boolean }>) => (
      <button
        type="button"
        role="menuitemcheckbox"
        aria-checked={checked}
        onClick={() => onCheckedChange?.(!checked)}
        {...rest}>
        {children}
      </button>
    ),
    DropdownMenuRadioGroup: ({
      children,
      onValueChange,
    }: React.PropsWithChildren<{ onValueChange?: (value: string) => void }>) => (
      <div>
        {React.Children.map(children, (child) =>
          React.isValidElement(child)
            ? React.cloneElement(child, { __onValueChange: onValueChange })
            : child,
        )}
      </div>
    ),
    DropdownMenuRadioItem: ({
      children,
      value,
      __onValueChange,
      ...rest
    }: React.PropsWithChildren<{ value: string; __onValueChange?: (value: string) => void }>) => (
      <button
        type="button"
        role="menuitemradio"
        data-value={value}
        onClick={() => __onValueChange?.(value)}
        {...rest}>
        {children}
      </button>
    ),
  }
}

vi.mock('../ui/dropdown-menu', dropdownMockFactory)
vi.mock('../ui/dropdown-menu.tsx', dropdownMockFactory)

const baseProps: InputbarProps = {
  value: '',
  onChange: vi.fn(),
  onSubmit: vi.fn(),
  attachedFiles: [],
  knowledgeBases: [],
  selectedKnowledgeBases: [],
  onKnowledgeBasesChange: vi.fn(),
  mcpServers: [],
  selectedMCPTools: [],
  onMCPToolsChange: vi.fn(),
  onFileAttach: vi.fn(),
  onFileRemove: vi.fn(),
  onWebSearchChange: vi.fn(),
}

const renderInputbar = (props: Partial<InputbarProps> = {}) => {
  return render(<Inputbar {...baseProps} {...props} />)
}

describe('Inputbar interactive menus', () => {
  it('allows selecting knowledge bases from dropdown', async () => {
    const onKnowledgeBasesChange = vi.fn()
    renderInputbar({
      knowledgeBases: [{ id: 'kb-1', name: '专业资料', itemCount: 3 }],
      onKnowledgeBasesChange,
    })

    const user = userEvent.setup()

    await user.click(screen.getByRole('button', { name: '知识库' }))

    const option = await screen.findByTestId('knowledge-option-kb-1')
    await user.click(option)

    expect(onKnowledgeBasesChange).toHaveBeenCalledWith(['kb-1'])
  })

  it('passes provider selection to onWebSearchChange', async () => {
    const onWebSearchChange = vi.fn()
    renderInputbar({
      onWebSearchChange,
    })

    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: '联网搜索' }))

    const googleName = DEFAULT_WEB_SEARCH_PROVIDERS.find((p) => p.id === 'google')?.name ?? 'Google'
    const googleOption = await screen.findByTestId('websearch-option-google')
    await user.click(googleOption)

    expect(onWebSearchChange).toHaveBeenCalledWith(true, 'google')
  })

  it('allows selecting MCP tools from dropdown', async () => {
    const onMCPToolsChange = vi.fn()
    renderInputbar({
      mcpServers: [{ id: 'mcp-1', name: 'Excel 工具' }],
      onMCPToolsChange,
    })

    const user = userEvent.setup()
    await user.click(screen.getByTestId('inputbar-mcp-trigger'))

    const option = await screen.findByTestId('mcp-option-mcp-1')
    await user.click(option)

    expect(onMCPToolsChange).toHaveBeenCalledWith(['mcp-1'])
  })
})
