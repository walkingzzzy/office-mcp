import React from 'react';
import './ProgressIndicator.css';

export interface ProgressStep {
  id: string;
  label: string;
  status: 'pending' | 'active' | 'completed' | 'error';
  description?: string;
}

interface ProgressIndicatorProps {
  steps?: ProgressStep[];
  currentProgress?: number;
  showPercentage?: boolean;
  size?: 'small' | 'medium' | 'large';
  type?: 'linear' | 'circular' | 'steps';
  status?: 'loading' | 'success' | 'error' | 'paused';
  message?: string;
  className?: string;
}

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  steps = [],
  currentProgress = 0,
  showPercentage = true,
  size = 'medium',
  type = 'linear',
  status = 'loading',
  message,
  className = ''
}) => {
  const getStatusIcon = (stepStatus: string) => {
    switch (stepStatus) {
      case 'completed':
        return '✓';
      case 'error':
        return '✗';
      case 'active':
        return '⏳';
      default:
        return '○';
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'success':
        return '#10b981';
      case 'error':
        return '#ef4444';
      case 'paused':
        return '#f59e0b';
      default:
        return '#3b82f6';
    }
  };

  if (type === 'steps' && steps.length > 0) {
    return (
      <div className={`progress-steps ${size} ${className}`}>
        {message && <div className="progress-message">{message}</div>}
        <div className="steps-container">
          {steps.map((step, index) => (
            <div
              key={step.id}
              className={`step ${step.status}`}
            >
              <div className="step-indicator">
                <span className="step-icon">
                  {getStatusIcon(step.status)}
                </span>
                {index < steps.length - 1 && (
                  <div className={`step-connector ${
                    steps[index + 1].status === 'completed' ? 'completed' : ''
                  }`} />
                )}
              </div>
              <div className="step-content">
                <div className="step-label">{step.label}</div>
                {step.description && (
                  <div className="step-description">{step.description}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (type === 'circular') {
    const radius = size === 'small' ? 20 : size === 'large' ? 40 : 30;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (currentProgress / 100) * circumference;

    return (
      <div className={`progress-circular ${size} ${status} ${className}`}>
        <svg width={radius * 2 + 10} height={radius * 2 + 10}>
          <circle
            cx={radius + 5}
            cy={radius + 5}
            r={radius}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="3"
          />
          <circle
            cx={radius + 5}
            cy={radius + 5}
            r={radius}
            fill="none"
            stroke={getStatusColor()}
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            transform={`rotate(-90 ${radius + 5} ${radius + 5})`}
            className="progress-circle"
          />
        </svg>
        {showPercentage && (
          <div className="progress-text">
            {Math.round(currentProgress)}%
          </div>
        )}
        {message && <div className="progress-message">{message}</div>}
      </div>
    );
  }

  // Linear progress bar (default)
  return (
    <div className={`progress-linear ${size} ${status} ${className}`}>
      {message && <div className="progress-message">{message}</div>}
      <div className="progress-bar">
        <div
          className="progress-fill"
          style={{
            width: `${Math.min(100, Math.max(0, currentProgress))}%`,
            backgroundColor: getStatusColor()
          }}
        />
      </div>
      {showPercentage && (
        <div className="progress-percentage">
          {Math.round(currentProgress)}%
        </div>
      )}
    </div>
  );
};

// 简化的加载指示器
export const LoadingSpinner: React.FC<{
  size?: 'small' | 'medium' | 'large';
  message?: string;
}> = ({ size = 'medium', message }) => (
  <div className={`loading-spinner ${size}`}>
    <div className="spinner" />
    {message && <div className="spinner-message">{message}</div>}
  </div>
);

// 脉冲加载指示器
export const PulseLoader: React.FC<{
  count?: number;
  size?: 'small' | 'medium' | 'large';
}> = ({ count = 3, size = 'medium' }) => (
  <div className={`pulse-loader ${size}`}>
    {Array.from({ length: count }, (_, i) => (
      <div
        key={i}
        className="pulse-dot"
        style={{ animationDelay: `${i * 0.2}s` }}
      />
    ))}
  </div>
);

export default ProgressIndicator;