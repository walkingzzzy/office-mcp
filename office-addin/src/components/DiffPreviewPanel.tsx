import React, { useState } from 'react';
import { Change } from '../types';
import './DiffPreviewPanel.css';

interface DiffPreviewPanelProps {
  changes: Change[];
  selectedChangeId?: string;
  onChangeSelect?: (changeId: string) => void;
}

type ViewMode = 'side-by-side' | 'inline';

export const DiffPreviewPanel: React.FC<DiffPreviewPanelProps> = ({
  changes,
  selectedChangeId,
  onChangeSelect
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('side-by-side');

  const selectedChange = changes.find(c => c.id === selectedChangeId);

  const renderSideBySideView = (change: Change) => (
    <div className="diff-side-by-side">
      <div className="diff-column">
        <div className="diff-header before">修改前</div>
        <div className="diff-content before">
          {change.content?.before || '(空)'}
        </div>
      </div>
      <div className="diff-column">
        <div className="diff-header after">修改后</div>
        <div className="diff-content after">
          {change.content?.after || '(空)'}
        </div>
      </div>
    </div>
  );

  const renderInlineView = (change: Change) => (
    <div className="diff-inline">
      {change.type === 'delete' && (
        <div className="diff-line deleted">
          <span className="line-marker">-</span>
          <span className="line-content">{change.content?.before}</span>
        </div>
      )}
      {change.type === 'add' && (
        <div className="diff-line added">
          <span className="line-marker">+</span>
          <span className="line-content">{change.content?.after}</span>
        </div>
      )}
      {change.type === 'modify' && (
        <>
          <div className="diff-line deleted">
            <span className="line-marker">-</span>
            <span className="line-content">{change.content?.before}</span>
          </div>
          <div className="diff-line added">
            <span className="line-marker">+</span>
            <span className="line-content">{change.content?.after}</span>
          </div>
        </>
      )}
    </div>
  );

  const getChangeIcon = (type: Change['type']) => {
    const icons = {
      add: '➕',
      delete: '➖',
      modify: '✏️',
      format: '🎨'
    };
    return icons[type];
  };

  return (
    <div className="diff-preview-panel">
      <div className="panel-header">
        <h3>修改预览</h3>
        <div className="view-mode-toggle">
          <button
            className={viewMode === 'side-by-side' ? 'active' : ''}
            onClick={() => setViewMode('side-by-side')}
          >
            并排视图
          </button>
          <button
            className={viewMode === 'inline' ? 'active' : ''}
            onClick={() => setViewMode('inline')}
          >
            内联视图
          </button>
        </div>
      </div>

      {changes.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📄</div>
          <p>暂无修改预览</p>
        </div>
      ) : (
        <div className="changes-list">
          {changes.map((change) => (
            <div
              key={change.id}
              className={`change-item ${change.id === selectedChangeId ? 'selected' : ''}`}
              onClick={() => onChangeSelect?.(change.id)}
            >
              <div className="change-header">
                <span className="change-icon">{getChangeIcon(change.type)}</span>
                <span className="change-title">
                  {change.metadata?.description || `${change.type}修改`}
                </span>
                <span className={`change-type ${change.type}`}>
                  {change.type}
                </span>
              </div>

              {change.id === selectedChangeId && (
                <div className="change-preview">
                  {viewMode === 'side-by-side'
                    ? renderSideBySideView(change)
                    : renderInlineView(change)
                  }

                  {change.metadata?.reason && (
                    <div className="change-reason">
                      <strong>修改原因：</strong>
                      {change.metadata.reason}
                    </div>
                  )}

                  {change.metadata?.confidence && (
                    <div className="confidence-indicator">
                      <span>AI置信度：</span>
                      <div className="confidence-bar">
                        <div
                          className="confidence-fill"
                          style={{ width: `${change.metadata.confidence * 100}%` }}
                        />
                      </div>
                      <span>{Math.round(change.metadata.confidence * 100)}%</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};