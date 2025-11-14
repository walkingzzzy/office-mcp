import { ReactNode } from 'react';
import './TaskPane.css';

interface TaskPaneProps {
  children: ReactNode;
  title?: string;
}

/**
 * 任务窗格布局组件
 */
function TaskPane({ children, title = 'Office AI 助手' }: TaskPaneProps) {
  return (
    <div className="taskpane">
      <div className="taskpane-header">
        <h1 className="taskpane-title">{title}</h1>
      </div>
      <div className="taskpane-content">{children}</div>
    </div>
  );
}

export default TaskPane;
