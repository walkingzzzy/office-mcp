import { useState, useEffect, useRef } from 'react';
import { DocumentDiff, Change } from '../types';
import './WordDiffViewer.css';

interface WordDiffViewerProps {
  diff: DocumentDiff | null;
  onClose?: () => void;
}

/**
 * Word文档差异对比视图组件
 * 显示修改前后的对比
 */
function WordDiffViewer({ diff, onClose }: WordDiffViewerProps) {
  const [syncScroll, setSyncScroll] = useState(true);
  const originalRef = useRef<HTMLDivElement>(null);
  const modifiedRef = useRef<HTMLDivElement>(null);

  // 同步滚动
  useEffect(() => {
    if (!syncScroll) return;

    const handleScroll = (source: 'original' | 'modified') => (e: Event) => {
      const target = e.target as HTMLDivElement;
      const scrollPercentage = target.scrollTop / (target.scrollHeight - target.clientHeight);

      if (source === 'original' && modifiedRef.current) {
        const newScrollTop = scrollPercentage * (modifiedRef.current.scrollHeight - modifiedRef.current.clientHeight);
        modifiedRef.current.scrollTop = newScrollTop;
      } else if (source === 'modified' && originalRef.current) {
        const newScrollTop = scrollPercentage * (originalRef.current.scrollHeight - originalRef.current.clientHeight);
        originalRef.current.scrollTop = newScrollTop;
      }
    };

    const originalEl = originalRef.current;
    const modifiedEl = modifiedRef.current;

    if (originalEl && modifiedEl) {
      const originalHandler = handleScroll('original');
      const modifiedHandler = handleScroll('modified');

      originalEl.addEventListener('scroll', originalHandler);
      modifiedEl.addEventListener('scroll', modifiedHandler);

      return () => {
        originalEl.removeEventListener('scroll', originalHandler);
        modifiedEl.removeEventListener('scroll', modifiedHandler);
      };
    }
  }, [syncScroll]);

  if (!diff) {
    return (
      <div className="word-diff-viewer-empty">
        <p>暂无文档对比信息</p>
      </div>
    );
  }

  const renderWithHighlights = (text: string, changes: Change[], isOriginal: boolean) => {
    if (changes.length === 0) {
      return <div className="diff-text">{text}</div>;
    }

    // 简化实现:按行分割并高亮整行
    const lines = text.split('\n');

    return (
      <div className="diff-text">
        {lines.map((line, index) => {
          // 检查该行是否包含修改
          const hasChange = changes.some(change => {
            if (isOriginal) {
              return change.originalContent?.includes(line);
            } else {
              return change.content.includes(line);
            }
          });

          const changeType = hasChange
            ? changes.find(c => (isOriginal ? c.originalContent : c.content)?.includes(line))?.type
            : null;

          return (
            <div
              key={index}
              className={`diff-line ${changeType ? `diff-${changeType}` : ''}`}
            >
              <span className="line-number">{index + 1}</span>
              <span className="line-content">{line || '\u00A0'}</span>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="word-diff-viewer">
      <div className="diff-viewer-header">
        <h3>文档对比</h3>
        <div className="header-controls">
          <label className="sync-scroll-toggle">
            <input
              type="checkbox"
              checked={syncScroll}
              onChange={(e) => setSyncScroll(e.target.checked)}
            />
            <span>同步滚动</span>
          </label>
          {onClose && (
            <button className="close-button" onClick={onClose} aria-label="关闭">
              ✕
            </button>
          )}
        </div>
      </div>

      <div className="diff-viewer-content">
        <div className="diff-pane original-pane">
          <div className="pane-header">
            <h4>原始文档</h4>
            <span className="change-count">
              {diff.changes.filter(c => c.type === 'delete').length} 处删除
            </span>
          </div>
          <div className="pane-content" ref={originalRef}>
            {renderWithHighlights(diff.original, diff.changes, true)}
          </div>
        </div>

        <div className="diff-separator" />

        <div className="diff-pane modified-pane">
          <div className="pane-header">
            <h4>修改后</h4>
            <span className="change-count">
              {diff.changes.filter(c => c.type === 'insert').length} 处新增,{' '}
              {diff.changes.filter(c => c.type === 'modify').length} 处修改
            </span>
          </div>
          <div className="pane-content" ref={modifiedRef}>
            {renderWithHighlights(diff.modified, diff.changes, false)}
          </div>
        </div>
      </div>

      <div className="diff-viewer-legend">
        <span className="legend-item">
          <span className="legend-color legend-insert"></span>
          新增
        </span>
        <span className="legend-item">
          <span className="legend-color legend-delete"></span>
          删除
        </span>
        <span className="legend-item">
          <span className="legend-color legend-modify"></span>
          修改
        </span>
      </div>
    </div>
  );
}

export default WordDiffViewer;
