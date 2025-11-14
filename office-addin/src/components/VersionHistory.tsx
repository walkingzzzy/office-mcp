import React, { useState } from 'react';
import './VersionHistory.css';

interface DocumentVersion {
  id: string;
  timestamp: number;
  description: string;
  stats: {
    totalChanges: number;
    acceptedChanges: number;
    rejectedChanges: number;
  };
}

interface VersionHistoryProps {
  versions: DocumentVersion[];
  currentVersionId?: string;
  onRestore?: (versionId: string) => void;
  onCompare?: (versionId1: string, versionId2: string) => void;
}

export const VersionHistory: React.FC<VersionHistoryProps> = ({
  versions,
  currentVersionId,
  onRestore,
  onCompare
}) => {
  const [selectedVersions, setSelectedVersions] = useState<Set<string>>(new Set());
  const [showConfirmDialog, setShowConfirmDialog] = useState<string | null>(null);

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return '刚刚';
    if (diffMins < 60) return `${diffMins}分钟前`;
    if (diffHours < 24) return `${diffHours}小时前`;
    if (diffDays < 7) return `${diffDays}天前`;

    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleVersionSelect = (versionId: string) => {
    const newSelected = new Set(selectedVersions);
    if (newSelected.has(versionId)) {
      newSelected.delete(versionId);
    } else {
      if (newSelected.size >= 2) {
        newSelected.clear();
      }
      newSelected.add(versionId);
    }
    setSelectedVersions(newSelected);
  };

  const handleRestore = (versionId: string) => {
    setShowConfirmDialog(versionId);
  };

  const confirmRestore = () => {
    if (showConfirmDialog && onRestore) {
      onRestore(showConfirmDialog);
      setShowConfirmDialog(null);
    }
  };

  const handleCompare = () => {
    const selectedArray = Array.from(selectedVersions);
    if (selectedArray.length === 2 && onCompare) {
      onCompare(selectedArray[0], selectedArray[1]);
    }
  };

  const getVersionIcon = (version: DocumentVersion) => {
    if (version.id === currentVersionId) return '📍';
    if (version.stats.totalChanges === 0) return '📄';
    if (version.stats.acceptedChanges > version.stats.rejectedChanges) return '✅';
    return '📝';
  };

  return (
    <div className="version-history">
      <div className="history-header">
        <h3>版本历史</h3>
        {selectedVersions.size === 2 && (
          <button className="compare-btn" onClick={handleCompare}>
            对比版本
          </button>
        )}
      </div>

      <div className="versions-list">
        {versions.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📚</div>
            <p>暂无版本历史</p>
          </div>
        ) : (
          versions.map((version) => (
            <div
              key={version.id}
              className={`version-item ${
                version.id === currentVersionId ? 'current' : ''
              } ${
                selectedVersions.has(version.id) ? 'selected' : ''
              }`}
              onClick={() => handleVersionSelect(version.id)}
            >
              <div className="version-main">
                <div className="version-icon">
                  {getVersionIcon(version)}
                </div>
                <div className="version-info">
                  <div className="version-title">
                    {version.description}
                    {version.id === currentVersionId && (
                      <span className="current-badge">当前</span>
                    )}
                  </div>
                  <div className="version-time">
                    {formatTimestamp(version.timestamp)}
                  </div>
                </div>
                {version.id !== currentVersionId && (
                  <button
                    className="restore-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRestore(version.id);
                    }}
                  >
                    恢复
                  </button>
                )}
              </div>

              <div className="version-stats">
                <div className="stat-item">
                  <span className="stat-label">总修改:</span>
                  <span className="stat-value">{version.stats.totalChanges}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">已接受:</span>
                  <span className="stat-value accepted">{version.stats.acceptedChanges}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">已拒绝:</span>
                  <span className="stat-value rejected">{version.stats.rejectedChanges}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {showConfirmDialog && (
        <div className="confirm-dialog-overlay">
          <div className="confirm-dialog">
            <div className="dialog-header">
              <h4>确认恢复版本</h4>
            </div>
            <div className="dialog-content">
              <p>确定要恢复到此版本吗？</p>
              <p className="warning">当前未保存的修改将丢失。</p>
            </div>
            <div className="dialog-actions">
              <button
                className="cancel-btn"
                onClick={() => setShowConfirmDialog(null)}
              >
                取消
              </button>
              <button
                className="confirm-btn"
                onClick={confirmRestore}
              >
                确认恢复
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};