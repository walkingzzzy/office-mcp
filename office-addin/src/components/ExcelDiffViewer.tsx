import React, { useState, useEffect } from 'react';
import { Change } from '../types';
import './ExcelDiffViewer.css';

interface ExcelCell {
  address: string;
  value: any;
  formula?: string;
  format?: any;
}

interface ExcelDiff {
  original: ExcelCell[][];
  modified: ExcelCell[][];
  changes: Change[];
}

interface ExcelDiffViewerProps {
  diff: ExcelDiff;
  onAcceptChange: (changeId: string) => void;
  onRejectChange: (changeId: string) => void;
  onAcceptAll: () => void;
  onRejectAll: () => void;
  showFormulas?: boolean;
  highlightMode?: 'side-by-side' | 'unified';
}

export const ExcelDiffViewer: React.FC<ExcelDiffViewerProps> = ({
  diff,
  onAcceptChange,
  onRejectChange,
  onAcceptAll,
  onRejectAll,
  showFormulas = false,
  highlightMode = 'side-by-side'
}) => {
  const [selectedChange, setSelectedChange] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>('all');

  const filteredChanges = diff.changes.filter(change => {
    if (filterType === 'all') return true;
    return change.type === filterType;
  });

  const getCellChange = (rowIndex: number, colIndex: number): Change | null => {
    return diff.changes.find(change => {
      if (!change.position) return false;
      const row = Math.floor(change.position.start / 100);
      const col = change.position.start % 100;
      return row === rowIndex && col === colIndex;
    }) || null;
  };

  const getCellValue = (cell: ExcelCell): string => {
    if (showFormulas && cell.formula) {
      return cell.formula;
    }
    return cell.value?.toString() || '';
  };

  const getCellClass = (change: Change | null): string => {
    if (!change) return '';
    return `cell-${change.type} ${selectedChange === change.id ? 'selected' : ''}`;
  };

  const renderCell = (cell: ExcelCell, rowIndex: number, colIndex: number, isOriginal: boolean) => {
    const change = getCellChange(rowIndex, colIndex);
    const cellClass = getCellClass(change);

    return (
      <td
        key={`${isOriginal ? 'orig' : 'mod'}-${rowIndex}-${colIndex}`}
        className={`excel-cell ${cellClass}`}
        onClick={() => change && setSelectedChange(change.id)}
        title={change?.description}
      >
        <div className="cell-content">
          {getCellValue(cell)}
        </div>
        {change && (
          <div className="cell-actions">
            <button
              className="accept-btn"
              onClick={(e) => {
                e.stopPropagation();
                onAcceptChange(change.id);
              }}
              title="接受更改"
            >
              ✓
            </button>
            <button
              className="reject-btn"
              onClick={(e) => {
                e.stopPropagation();
                onRejectChange(change.id);
              }}
              title="拒绝更改"
            >
              ✗
            </button>
          </div>
        )}
      </td>
    );
  };

  const renderTable = (data: ExcelCell[][], title: string, isOriginal: boolean) => (
    <div className="excel-table-container">
      <h3>{title}</h3>
      <div className="table-wrapper">
        <table className="excel-table">
          <thead>
            <tr>
              <th></th>
              {data[0]?.map((_, colIndex) => (
                <th key={colIndex}>
                  {String.fromCharCode(65 + colIndex)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, rowIndex) => (
              <tr key={rowIndex}>
                <th className="row-header">{rowIndex + 1}</th>
                {row.map((cell, colIndex) =>
                  renderCell(cell, rowIndex, colIndex, isOriginal)
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderUnifiedView = () => {
    const maxRows = Math.max(diff.original.length, diff.modified.length);
    const maxCols = Math.max(
      diff.original[0]?.length || 0,
      diff.modified[0]?.length || 0
    );

    return (
      <div className="unified-view">
        <div className="table-wrapper">
          <table className="excel-table unified">
            <thead>
              <tr>
                <th></th>
                {Array.from({ length: maxCols }, (_, colIndex) => (
                  <th key={colIndex}>
                    {String.fromCharCode(65 + colIndex)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: maxRows }, (_, rowIndex) => (
                <tr key={rowIndex}>
                  <th className="row-header">{rowIndex + 1}</th>
                  {Array.from({ length: maxCols }, (_, colIndex) => {
                    const originalCell = diff.original[rowIndex]?.[colIndex];
                    const modifiedCell = diff.modified[rowIndex]?.[colIndex];
                    const change = getCellChange(rowIndex, colIndex);

                    if (!change) {
                      return (
                        <td key={colIndex} className="excel-cell">
                          {getCellValue(modifiedCell || originalCell || { address: '', value: '' })}
                        </td>
                      );
                    }

                    return (
                      <td
                        key={colIndex}
                        className={`excel-cell ${getCellClass(change)}`}
                        onClick={() => setSelectedChange(change.id)}
                      >
                        <div className="unified-cell">
                          {change.type === 'delete' && originalCell && (
                            <div className="deleted-content">
                              - {getCellValue(originalCell)}
                            </div>
                          )}
                          {(change.type === 'insert' || change.type === 'modify') && modifiedCell && (
                            <div className="added-content">
                              + {getCellValue(modifiedCell)}
                            </div>
                          )}
                        </div>
                        <div className="cell-actions">
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
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="excel-diff-viewer">
      <div className="diff-header">
        <div className="diff-controls">
          <div className="view-controls">
            <label>
              <input
                type="radio"
                name="highlightMode"
                value="side-by-side"
                checked={highlightMode === 'side-by-side'}
                onChange={(e) => e.target.checked && (highlightMode = 'side-by-side')}
              />
              并排对比
            </label>
            <label>
              <input
                type="radio"
                name="highlightMode"
                value="unified"
                checked={highlightMode === 'unified'}
                onChange={(e) => e.target.checked && (highlightMode = 'unified')}
              />
              统一视图
            </label>
          </div>

          <div className="filter-controls">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="all">所有更改</option>
              <option value="insert">新增</option>
              <option value="delete">删除</option>
              <option value="modify">修改</option>
            </select>
          </div>

          <div className="display-controls">
            <label>
              <input
                type="checkbox"
                checked={showFormulas}
                onChange={(e) => (showFormulas = e.target.checked)}
              />
              显示公式
            </label>
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

      <div className="diff-content">
        {highlightMode === 'side-by-side' ? (
          <div className="side-by-side-view">
            {renderTable(diff.original, '原始版本', true)}
            {renderTable(diff.modified, '修改版本', false)}
          </div>
        ) : (
          renderUnifiedView()
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

export default ExcelDiffViewer;