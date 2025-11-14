import { useState, useEffect, useMemo } from 'react';
import { Change, ChangeStatus } from '../types';
import ChangeItem from './ChangeItem';
import './ChangesList.css';

interface ChangesListProps {
  changes: Change[];
  onAccept?: (id: string) => void;
  onReject?: (id: string) => void;
  onView?: (id: string) => void;
  onAcceptAll?: () => void;
  onRejectAll?: () => void;
  isLoading?: boolean;
  loadingChangeId?: string;
}

type FilterType = 'all' | 'pending' | 'accepted' | 'rejected';
type SortType = 'timestamp' | 'type' | 'status';

/**
 * 修改建议列表组件
 * 显示所有修改建议并提供批量操作
 */
function ChangesList({
  changes,
  onAccept,
  onReject,
  onView,
  onAcceptAll,
  onRejectAll,
  isLoading = false,
  loadingChangeId,
}: ChangesListProps) {
  const [filter, setFilter] = useState<FilterType>('all');
  const [sortBy, setSortBy] = useState<SortType>('timestamp');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [searchText, setSearchText] = useState('');

  // 过滤和排序修改列表
  const filteredAndSortedChanges = useMemo(() => {
    let filtered = changes;

    // 按状态过滤
    if (filter !== 'all') {
      filtered = filtered.filter(change => change.status === filter);
    }

    // 按搜索文本过滤
    if (searchText.trim()) {
      const searchLower = searchText.toLowerCase();
      filtered = filtered.filter(change =>
        change.content.toLowerCase().includes(searchLower) ||
        change.description?.toLowerCase().includes(searchLower) ||
        change.originalContent?.toLowerCase().includes(searchLower)
      );
    }

    // 排序
    filtered.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'timestamp':
          comparison = a.timestamp - b.timestamp;
          break;
        case 'type':
          comparison = a.type.localeCompare(b.type);
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [changes, filter, sortBy, sortOrder, searchText]);

  // 统计信息
  const stats = useMemo(() => {
    const total = changes.length;
    const pending = changes.filter(c => c.status === 'pending').length;
    const accepted = changes.filter(c => c.status === 'accepted').length;
    const rejected = changes.filter(c => c.status === 'rejected').length;

    return { total, pending, accepted, rejected };
  }, [changes]);

  const getFilterLabel = (filterType: FilterType): string => {
    const labels = {
      all: '全部',
      pending: '待处理',
      accepted: '已接受',
      rejected: '已拒绝',
    };
    return labels[filterType];
  };

  const getSortLabel = (sortType: SortType): string => {
    const labels = {
      timestamp: '时间',
      type: '类型',
      status: '状态',
    };
    return labels[sortType];
  };

  const handleSort = (newSortBy: SortType) => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortOrder('desc');
    }
  };

  const handleAcceptAll = () => {
    if (onAcceptAll && !isLoading && stats.pending > 0) {
      onAcceptAll();
    }
  };

  const handleRejectAll = () => {
    if (onRejectAll && !isLoading && stats.pending > 0) {
      onRejectAll();
    }
  };

  return (
    <div className="changes-list">
      <div className="changes-list-header">
        <div className="header-title">
          <h3>修改建议</h3>
          <span className="changes-count">
            {filteredAndSortedChanges.length} / {changes.length}
          </span>
        </div>

        <div className="header-stats">
          <span className="stat-item stat-pending">
            待处理: {stats.pending}
          </span>
          <span className="stat-item stat-accepted">
            已接受: {stats.accepted}
          </span>
          <span className="stat-item stat-rejected">
            已拒绝: {stats.rejected}
          </span>
        </div>
      </div>

      <div className="changes-list-controls">
        <div className="controls-row">
          <div className="search-box">
            <input
              type="text"
              placeholder="搜索修改内容..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="search-input"
            />
            <span className="search-icon">🔍</span>
          </div>

          <div className="filter-controls">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as FilterType)}
              className="filter-select"
            >
              <option value="all">全部 ({changes.length})</option>
              <option value="pending">待处理 ({stats.pending})</option>
              <option value="accepted">已接受 ({stats.accepted})</option>
              <option value="rejected">已拒绝 ({stats.rejected})</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortType)}
              className="sort-select"
            >
              <option value="timestamp">按时间排序</option>
              <option value="type">按类型排序</option>
              <option value="status">按状态排序</option>
            </select>

            <button
              className={`sort-order-button ${sortOrder}`}
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              title={sortOrder === 'asc' ? '升序' : '降序'}
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </button>
          </div>
        </div>

        {stats.pending > 0 && (
          <div className="batch-actions">
            <button
              className="batch-button batch-accept"
              onClick={handleAcceptAll}
              disabled={isLoading}
              title={`接受所有 ${stats.pending} 个待处理修改`}
            >
              ✓ 全部接受 ({stats.pending})
            </button>
            <button
              className="batch-button batch-reject"
              onClick={handleRejectAll}
              disabled={isLoading}
              title={`拒绝所有 ${stats.pending} 个待处理修改`}
            >
              ✕ 全部拒绝 ({stats.pending})
            </button>
          </div>
        )}
      </div>

      <div className="changes-list-content">
        {filteredAndSortedChanges.length === 0 ? (
          <div className="empty-state">
            {searchText.trim() ? (
              <div>
                <p>未找到匹配的修改</p>
                <button
                  className="clear-search-button"
                  onClick={() => setSearchText('')}
                >
                  清除搜索
                </button>
              </div>
            ) : filter !== 'all' ? (
              <div>
                <p>没有{getFilterLabel(filter)}的修改</p>
                <button
                  className="show-all-button"
                  onClick={() => setFilter('all')}
                >
                  显示全部
                </button>
              </div>
            ) : (
              <p>暂无修改建议</p>
            )}
          </div>
        ) : (
          <div className="changes-items">
            {filteredAndSortedChanges.map((change) => (
              <ChangeItem
                key={change.id}
                change={change}
                onAccept={onAccept}
                onReject={onReject}
                onView={onView}
                isLoading={isLoading && loadingChangeId === change.id}
              />
            ))}
          </div>
        )}
      </div>

      {filteredAndSortedChanges.length > 0 && (
        <div className="changes-list-footer">
          <div className="footer-info">
            显示 {filteredAndSortedChanges.length} 个修改
            {filter !== 'all' && ` (${getFilterLabel(filter)})`}
            {searchText.trim() && ` (搜索: "${searchText}")`}
          </div>

          {stats.pending > 0 && (
            <div className="footer-actions">
              <span className="pending-reminder">
                还有 {stats.pending} 个修改待处理
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default ChangesList;