import { Change } from '../types';
import './ChangeItem.css';

interface ChangeItemProps {
  change: Change;
  onAccept?: (id: string) => void;
  onReject?: (id: string) => void;
  onView?: (id: string) => void;
  isLoading?: boolean;
}

/**
 * 单个修改项组件
 * 显示修改详情和操作按钮
 */
function ChangeItem({ change, onAccept, onReject, onView, isLoading = false }: ChangeItemProps) {
  const getTypeLabel = (type: Change['type']): string => {
    const labels = {
      insert: '新增',
      delete: '删除',
      modify: '修改',
      format: '格式',
    };
    return labels[type];
  };

  const getTypeIcon = (type: Change['type']): string => {
    const icons = {
      insert: '➕',
      delete: '➖',
      modify: '✏️',
      format: '🎨',
    };
    return icons[type];
  };

  const getStatusLabel = (status: Change['status']): string => {
    const labels = {
      pending: '待处理',
      accepted: '已接受',
      rejected: '已拒绝',
    };
    return labels[status];
  };

  const formatTimestamp = (timestamp: number): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return '刚刚';
    if (diffMins < 60) return `${diffMins}分钟前`;
    if (diffHours < 24) return `${diffHours}小时前`;
    if (diffDays < 7) return `${diffDays}天前`;
    return date.toLocaleDateString('zh-CN');
  };

  const truncateContent = (content: string, maxLength: number = 100): string => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  const handleAccept = () => {
    if (onAccept && !isLoading && change.status === 'pending') {
      onAccept(change.id);
    }
  };

  const handleReject = () => {
    if (onReject && !isLoading && change.status === 'pending') {
      onReject(change.id);
    }
  };

  const handleView = () => {
    if (onView) {
      onView(change.id);
    }
  };

  const isPending = change.status === 'pending';

  return (
    <div className={`change-item change-item-${change.type} change-item-${change.status}`}>
      <div className="change-item-header">
        <div className="change-type">
          <span className="type-icon">{getTypeIcon(change.type)}</span>
          <span className="type-label">{getTypeLabel(change.type)}</span>
        </div>
        <div className="change-status">
          <span className={`status-badge status-${change.status}`}>
            {getStatusLabel(change.status)}
          </span>
        </div>
      </div>

      <div className="change-item-content">
        {change.description && (
          <div className="change-description">{change.description}</div>
        )}

        <div className="change-text">
          {change.type === 'delete' && change.originalContent && (
            <div className="text-block text-original">
              <span className="text-label">原内容:</span>
              <span className="text-content strikethrough">
                {truncateContent(change.originalContent)}
              </span>
            </div>
          )}

          {change.type === 'modify' && change.originalContent && (
            <div className="text-block text-original">
              <span className="text-label">原内容:</span>
              <span className="text-content">
                {truncateContent(change.originalContent)}
              </span>
            </div>
          )}

          {(change.type === 'insert' || change.type === 'modify') && (
            <div className="text-block text-new">
              <span className="text-label">
                {change.type === 'insert' ? '新增内容:' : '修改为:'}
              </span>
              <span className="text-content">{truncateContent(change.content)}</span>
            </div>
          )}

          {change.type === 'format' && (
            <div className="text-block text-format">
              <span className="text-label">格式调整:</span>
              <span className="text-content">{change.content}</span>
            </div>
          )}
        </div>

        {change.position && (
          <div className="change-position">
            位置: {change.position.start} - {change.position.end}
          </div>
        )}
      </div>

      <div className="change-item-footer">
        <div className="change-timestamp">
          <span className="timestamp-icon">🕒</span>
          <span>{formatTimestamp(change.timestamp)}</span>
        </div>

        <div className="change-actions">
          {onView && (
            <button
              className="action-button action-view"
              onClick={handleView}
              disabled={isLoading}
              title="查看详情"
            >
              👁️ 查看
            </button>
          )}

          {isPending && onReject && (
            <button
              className="action-button action-reject"
              onClick={handleReject}
              disabled={isLoading}
              title="拒绝修改"
            >
              {isLoading ? '处理中...' : '✕ 拒绝'}
            </button>
          )}

          {isPending && onAccept && (
            <button
              className="action-button action-accept"
              onClick={handleAccept}
              disabled={isLoading}
              title="接受修改"
            >
              {isLoading ? '处理中...' : '✓ 接受'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default ChangeItem;
