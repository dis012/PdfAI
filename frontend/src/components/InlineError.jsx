import React from 'react';

const InlineError = ({ 
  error, 
  className = '', 
  showIcon = true, 
  onRetry = null,
  retryText = 'Try Again'
}) => {
  if (!error) {
    return null;
  }

  const errorMessage = typeof error === 'string' ? error : error.message || 'An error occurred';

  return (
    <div className={`inline-error ${className}`} role="alert">
      <div className="inline-error-content">
        {showIcon && <span className="inline-error-icon">⚠️</span>}
        <span className="inline-error-message">{errorMessage}</span>
        {onRetry && (
          <button 
            className="inline-error-retry"
            onClick={onRetry}
            type="button"
          >
            {retryText}
          </button>
        )}
      </div>
    </div>
  );
};

export default InlineError;

// Add CSS styles
const inlineErrorStyles = `
.inline-error {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  background-color: #f8d7da;
  border: 1px solid #f5c6cb;
  border-radius: 4px;
  color: #721c24;
  font-size: 14px;
  margin: 8px 0;
}

.inline-error-content {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
}

.inline-error-icon {
  flex-shrink: 0;
  font-size: 16px;
}

.inline-error-message {
  flex: 1;
  line-height: 1.4;
}

.inline-error-retry {
  background: none;
  border: 1px solid #721c24;
  color: #721c24;
  padding: 4px 8px;
  border-radius: 3px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  transition: background-color 0.2s ease;
  flex-shrink: 0;
}

.inline-error-retry:hover {
  background-color: #721c24;
  color: white;
}

.inline-error-retry:focus {
  outline: 2px solid #721c24;
  outline-offset: 1px;
}

/* Variants */
.inline-error.warning {
  background-color: #fff3cd;
  border-color: #ffeaa7;
  color: #856404;
}

.inline-error.warning .inline-error-retry {
  border-color: #856404;
  color: #856404;
}

.inline-error.warning .inline-error-retry:hover {
  background-color: #856404;
  color: white;
}

.inline-error.info {
  background-color: #d1ecf1;
  border-color: #bee5eb;
  color: #0c5460;
}

.inline-error.info .inline-error-retry {
  border-color: #0c5460;
  color: #0c5460;
}

.inline-error.info .inline-error-retry:hover {
  background-color: #0c5460;
  color: white;
}

/* Compact variant */
.inline-error.compact {
  padding: 4px 8px;
  font-size: 12px;
  margin: 4px 0;
}

.inline-error.compact .inline-error-content {
  gap: 6px;
}

.inline-error.compact .inline-error-icon {
  font-size: 14px;
}
`;

// Inject styles if not already present
if (typeof document !== 'undefined' && !document.getElementById('inline-error-styles')) {
  const styleElement = document.createElement('style');
  styleElement.id = 'inline-error-styles';
  styleElement.textContent = inlineErrorStyles;
  document.head.appendChild(styleElement);
}