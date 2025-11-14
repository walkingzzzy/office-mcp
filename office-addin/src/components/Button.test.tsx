import { render, screen, fireEvent } from '@testing-library/react';
import Button from './Button';

describe('Button组件测试', () => {
  test('应该渲染按钮文本', () => {
    render(<Button>点击我</Button>);
    expect(screen.getByText('点击我')).toBeInTheDocument();
  });

  test('应该处理点击事件', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>点击我</Button>);

    const button = screen.getByText('点击我');
    fireEvent.click(button);

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  test('应该支持禁用状态', () => {
    const handleClick = jest.fn();
    render(
      <Button onClick={handleClick} disabled>
        禁用按钮
      </Button>
    );

    const button = screen.getByText('禁用按钮');
    expect(button).toBeDisabled();

    fireEvent.click(button);
    expect(handleClick).not.toHaveBeenCalled();
  });

  test('应该支持不同的按钮类型', () => {
    const { rerender } = render(<Button variant="primary">主要按钮</Button>);
    let button = screen.getByText('主要按钮');
    expect(button).toHaveClass('btn-primary');

    rerender(<Button variant="secondary">次要按钮</Button>);
    button = screen.getByText('次要按钮');
    expect(button).toHaveClass('btn-secondary');

    rerender(<Button variant="danger">危险按钮</Button>);
    button = screen.getByText('危险按钮');
    expect(button).toHaveClass('btn-danger');
  });

  test('应该支持全宽样式', () => {
    render(<Button fullWidth>全宽按钮</Button>);
    const button = screen.getByText('全宽按钮');
    expect(button).toHaveClass('btn-fullwidth');
  });

  test('应该应用默认的primary样式', () => {
    render(<Button>默认按钮</Button>);
    const button = screen.getByText('默认按钮');
    expect(button).toHaveClass('btn');
    expect(button).toHaveClass('btn-primary');
  });

  test('应该支持组合样式', () => {
    render(
      <Button variant="secondary" fullWidth>
        组合样式
      </Button>
    );
    const button = screen.getByText('组合样式');
    expect(button).toHaveClass('btn');
    expect(button).toHaveClass('btn-secondary');
    expect(button).toHaveClass('btn-fullwidth');
  });
});
