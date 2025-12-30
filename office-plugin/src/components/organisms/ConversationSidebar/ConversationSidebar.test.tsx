import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'

import type { Conversation } from '../../../services/conversation'
import { ConversationSidebar, type ConversationSidebarProps } from './ConversationSidebar'

const baseConversation: Conversation = {
  id: 'conv-1',
  title: '霞編斤三',
  messages: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  favorite: false,
}

const renderSidebar = (props: Partial<ConversationSidebarProps> = {}) => {
  const defaultProps: ConversationSidebarProps = {
    open: true,
    onOpenChange: vi.fn(),
    conversations: [baseConversation],
    currentConversationId: baseConversation.id,
    onSelectConversation: vi.fn(),
    onCreateConversation: vi.fn(),
    onDeleteConversation: vi.fn(),
    onToggleFavorite: vi.fn(),
  }

  return render(<ConversationSidebar {...defaultProps} {...props} />)
}

describe('ConversationSidebar', () => {
  it('calls onToggleFavorite when star button clicked', async () => {
    const onToggleFavorite = vi.fn()
    renderSidebar({ onToggleFavorite })
    const user = userEvent.setup()

    const toggleButton = await screen.findByTestId('conversation-star-conv-1')
    await user.click(toggleButton)

    expect(onToggleFavorite).toHaveBeenCalledWith('conv-1', true)
  })

  it('renders inline variant even when closed', () => {
    renderSidebar({ inline: true, open: false })
    expect(screen.getByTestId('conversation-sidebar-inline')).toBeInTheDocument()
  })
})
