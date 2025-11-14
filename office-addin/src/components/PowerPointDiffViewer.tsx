import React, { useState } from 'react';
import { Change } from '../types';
import './PowerPointDiffViewer.css';

interface PowerPointSlide {
  id: string;
  index: number;
  thumbnail?: string;
  shapes: PowerPointShape[];
}

interface PowerPointShape {
  id: string;
  type: string;
  text?: string;
  position: { x: number; y: number; width: number; height: number };
}

interface PowerPointDiff {
  original: PowerPointSlide[];
  modified: PowerPointSlide[];
  changes: Change[];
}

interface PowerPointDiffViewerProps {
  diff: PowerPointDiff;
  onAcceptChange: (changeId: string) => void;
  onRejectChange: (changeId: string) => void;
  onAcceptAll: () => void;
  onRejectAll: () => void;
  highlightMode?: 'side-by-side' | 'unified';
}

export const PowerPointDiffViewer: React.FC<PowerPointDiffViewerProps> = ({
  diff,
  onAcceptChange,
  onRejectChange,
  onAcceptAll,
  onRejectAll,
  highlightMode = 'side-by-side'
}) => {
  const [selectedSlide, setSelectedSlide] = useState<number>(0);
  const [selectedChange, setSelectedChange] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>('all');

  const filteredChanges = diff.changes.filter(change => {
    if (filterType === 'all') return true;
    return change.type === filterType;
  });

  const getSlideChanges = (slideIndex: number): Change[] => {
    return diff.changes.filter(change => {
      if (!change.position) return false;
      return Math.floor(change.position.start / 1000) === slideIndex;
    });
  };

  const getShapeChange = (slideIndex: number, shapeId: string): Change | null => {
    return diff.changes.find(change =>
      change.controlId === shapeId &&
      Math.floor(change.position?.start || 0 / 1000) === slideIndex
    ) || null;
  };

  const renderSlide = (slide: PowerPointSlide, isOriginal: boolean) => (
    <div className="slide-container">
      <h4>{isOriginal ? '原始版本' : '修改版本'} - 幻灯片 {slide.index + 1}</h4>
      <div className="slide-preview">
        {slide.thumbnail ? (
          <img src={slide.thumbnail} alt={`幻灯片 ${slide.index + 1}`} />
        ) : (
          <div className="slide-placeholder">
            <div className="shapes-container">
              {slide.shapes.map(shape => {
                const change = getShapeChange(slide.index, shape.id);
                return (
                  <div
                    key={shape.id}
                    className={`shape ${change ? `shape-${change.type}` : ''}`}
                    style={{
                      left: shape.position.x,
                      top: shape.position.y,
                      width: shape.position.width,
                      height: shape.position.height
                    }}
                    onClick={() => change && setSelectedChange(change.id)}
                  >
                    {shape.text && <span className="shape-text">{shape.text}</span>}
                    {change && (
                      <div className="shape-actions">
                        <button
                          className="accept-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            onAcceptChange(change.id);
                          }}
                        >
                          ✓
                        </button>
                        <button
                          className="reject-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            onRejectChange(change.id);
                          }}
                        >
                          ✗
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderUnifiedSlide = (slideIndex: number) => {
    const originalSlide = diff.original[slideIndex];
    const modifiedSlide = diff.modified[slideIndex];
    const slideChanges = getSlideChanges(slideIndex);

    return (
      <div className="unified-slide">
        <h4>幻灯片 {slideIndex + 1} - 统一视图</h4>
        <div className="slide-preview unified">
          <div className="shapes-container">
            {modifiedSlide?.shapes.map(shape => {
              const change = getShapeChange(slideIndex, shape.id);
              return (
                <div
                  key={shape.id}
                  className={`shape ${change ? `shape-${change.type}` : ''}`}
                  style={{
                    left: shape.position.x,
                    top: shape.position.y,
                    width: shape.position.width,
                    height: shape.position.height
                  }}
                >
                  {change && change.type === 'delete' && (
                    <div className="deleted-content">
                      - {originalSlide?.shapes.find(s => s.id === shape.id)?.text}
                    </div>
                  )}
                  {(change?.type === 'insert' || change?.type === 'modify') && (
                    <div className="added-content">
                      + {shape.text}
                    </div>
                  )}
                  {!change && shape.text && (
                    <span className="shape-text">{shape.text}</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="ppt-diff-viewer">
      <div className="diff-header">
        <div className="diff-controls">
          <div className="view-controls">
            <label>
              <input
                type="radio"
                name="highlightMode"
                value="side-by-side"
                checked={highlightMode === 'side-by-side'}
                onChange={() => {}}
              />
              并排对比
            </label>
            <label>
              <input
                type="radio"
                name="highlightMode"
                value="unified"
                checked={highlightMode === 'unified'}
                onChange={() => {}}
              />
              统一视图
            </label>
          </div>

          <div className="filter-controls">
            <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
              <option value="all">所有更改</option>
              <option value="insert">新增</option>
              <option value="delete">删除</option>
              <option value="modify">修改</option>
            </select>
          </div>

          <div className="action-controls">
            <button className="accept-all-btn" onClick={onAcceptAll}>
              接受全部
            </button>
            <button className="reject-all-btn" onClick={onRejectAll}>
              拒绝全部
            </button>
          </div>
        </div>

        <div className="diff-stats">
          <span className="stat insert">
            新增: {diff.changes.filter(c => c.type === 'insert').length}
          </span>
          <span className="stat delete">
            删除: {diff.changes.filter(c => c.type === 'delete').length}
          </span>
          <span className="stat modify">
            修改: {diff.changes.filter(c => c.type === 'modify').length}
          </span>
        </div>
      </div>

      <div className="slide-navigation">
        {diff.original.map((_, index) => (
          <button
            key={index}
            className={`slide-nav-btn ${selectedSlide === index ? 'active' : ''}`}
            onClick={() => setSelectedSlide(index)}
          >
            {index + 1}
          </button>
        ))}
      </div>

      <div className="diff-content">
        {highlightMode === 'side-by-side' ? (
          <div className="side-by-side-view">
            {renderSlide(diff.original[selectedSlide], true)}
            {renderSlide(diff.modified[selectedSlide], false)}
          </div>
        ) : (
          renderUnifiedSlide(selectedSlide)
        )}
      </div>

      {selectedChange && (
        <div className="change-details">
          {(() => {
            const change = diff.changes.find(c => c.id === selectedChange);
            if (!change) return null;

            return (
              <div className="change-info">
                <h4>更改详情</h4>
                <div className="change-meta">
                  <span className={`change-type ${change.type}`}>
                    {change.type === 'insert' ? '新增' :
                     change.type === 'delete' ? '删除' :
                     change.type === 'modify' ? '修改' : '格式'}
                  </span>
                  <span className="change-time">
                    {new Date(change.timestamp).toLocaleString()}
                  </span>
                </div>
                {change.description && (
                  <div className="change-description">
                    {change.description}
                  </div>
                )}
                <div className="change-actions">
                  <button
                    className="accept-btn"
                    onClick={() => onAcceptChange(change.id)}
                  >
                    接受更改
                  </button>
                  <button
                    className="reject-btn"
                    onClick={() => onRejectChange(change.id)}
                  >
                    拒绝更改
                  </button>
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
};

export default PowerPointDiffViewer;