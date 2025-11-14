import { render, screen } from '@testing-library/react';
import TaskPane from './TaskPane';

describe('TaskPane组件测试', () => {
  test('应该渲染默认标题', () => {
    render(
      <TaskPane>
        <div>Test Content</div>
      </TaskPane>
    );

    expect(screen.getByText('Office AI 助手')).toBeInTheDocument();
  });

  test('应该渲染自定义标题', () => {
    render(
      <TaskPane title="自定义标题">
        <div>Test Content</div>
      </TaskPane>
    );

    expect(screen.getByText('自定义标题')).toBeInTheDocument();
  });

  test('应该渲染子组件', () => {
    render(
      <TaskPane>
        <div data-testid="test-child">Test Content</div>
      </TaskPane>
    );

    expect(screen.getByTestId('test-child')).toBeInTheDocument();
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  test('应该包含正确的CSS类名', () => {
    const { container } = render(
      <TaskPane>
        <div>Test Content</div>
      </TaskPane>
    );

    expect(container.querySelector('.taskpane')).toBeInTheDocument();
    expect(container.querySelector('.taskpane-header')).toBeInTheDocument();
    expect(container.querySelector('.taskpane-content')).toBeInTheDocument();
    expect(container.querySelector('.taskpane-title')).toBeInTheDocument();
  });

  test('应该渲染复杂的子组件树', () => {
    render(
      <TaskPane>
        <div>
          <h2>Section 1</h2>
          <p>Paragraph 1</p>
        </div>
        <div>
          <h2>Section 2</h2>
          <p>Paragraph 2</p>
        </div>
      </TaskPane>
    );

    expect(screen.getByText('Section 1')).toBeInTheDocument();
    expect(screen.getByText('Paragraph 1')).toBeInTheDocument();
    expect(screen.getByText('Section 2')).toBeInTheDocument();
    expect(screen.getByText('Paragraph 2')).toBeInTheDocument();
  });
});
